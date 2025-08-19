import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X, Upload, FileArchive, AlertCircle, Loader2  } from "lucide-react"; // 추가-jks : Loading Spinner 라이브러리
import type { Cat } from "./CatManagement";
import axios from "axios";
// 추가-jks : zip파일 + Blob 업로드 용 라이브러리
import { unzip } from "unzipit";
import { BlockBlobClient } from "@azure/storage-blob";
import mime from "mime";

interface AddCatFormProps {
  onClose: () => void;
  onSubmit: (catData: Omit<Cat, 'id' | 'lastCheckup'>) => void;
  editingCat?: Cat | null;
  userId?: string | number; // 추가-jks : 고양이 프로필 이미지 경로 저장을 위해 사용자 식별자 전달 받기
}

// 추가-jks : sas토큰 생성을 위한 x-api-key
const API_KEY_HEADER = import.meta.env.VITE_X_API_KEY;
const CONTAINER_NAME = "origin"; // Azure Blob Stroage Container Name

export function AddCatForm({ onClose, onSubmit, editingCat, userId }: AddCatFormProps) {
  const [formData, setFormData] = useState({
    name: editingCat?.name || '',
    breed: editingCat?.breed || '',
    age: editingCat?.age || '',
    weight: editingCat?.weight || '',
    gender: editingCat?.gender || 'male' as 'male' | 'female',
    healthStatus: editingCat?.healthStatus || 'healthy' as 'healthy' | 'caution' | 'sick',
    memo: editingCat?.memo || '',
    image: editingCat?.image || ''
  });

  const [imagePreview, setImagePreview] = useState<string>(editingCat?.image || '');
  const [trainingDataFile, setTrainingDataFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // 추가-jks : 고양이 프로필 사진 (실제 파일 보관)

  // 추가-jks: ZIP 업로드 진행 상태
  const [uploadingZip, setUploadingZip] = useState(false);
  const [zipLog, setZipLog] = useState<string[]>([]);
  const pushZipLog = (msg: string) => setZipLog((prev) => [...prev, msg]);

  // 추가-jks : Loading Spinner를 위한 state
  const [submitting, setSubmitting] = useState(false);
  const isBusy = submitting || uploadingZip; // 편의용: 버튼/입력 비활성화에 쓸 통합 상태

  // 추가-jks : ZIP 파일 단위로 해제 -> 각 파일에 대한 SAS 토큰 발급 -> Blob 업로드
  async function uploadTrainingZipToAzure(zipFile: File, uid: string | number, catName: string) {
    // 7z는 브라우저에서 해제가 어려워서 막습니다 (서버에서 해제 권장)
    if (zipFile.name.toLowerCase().endsWith(".7z")) {
      throw new Error("브라우저에서는 7z 해제가 지원되지 않습니다. ZIP 파일을 업로드하거나 서버에서 해제해주세요.");
    }

    setUploadingZip(true);
    setZipLog([]);
    pushZipLog(`압축 해제 시작: ${zipFile.name}`);

    // 1) ZIP 해제
    const { entries } = await unzip(zipFile);
    const allEntries = Object.entries(entries);
    if (allEntries.length === 0) {
      pushZipLog("압축 내 파일이 없습니다.");
      setUploadingZip(false);
      return;
    }

    let success = 0;
    let fail = 0;

    // 2) 각 엔트리를 순차 업로드(간단/안전)
    for (const [entryName, entry] of allEntries) {
      // 폴더는 건너뛰기
      // @ts-ignore - unzipit 버전에 따라 isDirectory가 있을 수 있음
      if (entry.isDirectory || entryName.endsWith("/")) {
        continue;
      }

      const cleanName = entryName.replace(/\\/g, "/"); // 윈도우 ZIP 호환
      const contentBlob = await entry.blob();
      const contentType = mime.getType(cleanName) || "application/octet-stream";

      // 업로드 blob 경로 규칙: userId/고양이명/<zip내부경로/파일>
      const blobPath = `${uid}/${catName}/${cleanName}`;

      try {
        pushZipLog(`SAS 발급 요청: ${blobPath}`);
        // 3) 서버(FastAPI)에 SAS 요청 (blob 단위, 10분 만료)
        const sasResp = await axios.post(
          "/collection/api/sas/generate",
          { fileName: blobPath, containerName: CONTAINER_NAME },
          { headers: { "X-API-Key": API_KEY_HEADER, "Content-Type": "application/json" } }
        );
        const { sasUrl } = sasResp.data as { sasUrl: string; blobUrl: string };

        // 4) SAS URL로 업로드
        const blockBlob = new BlockBlobClient(sasUrl);
        pushZipLog(`업로드 시작: ${cleanName}`);
        await blockBlob.uploadData(contentBlob, {
          blobHTTPHeaders: { blobContentType: contentType },
          onProgress: (ev) => {
            // 원하면 진행률 표시 (파일별 바이트)
            // console.debug(cleanName, ev.loadedBytes);
          },
        });
        success += 1;
        pushZipLog(`완료: ${cleanName}`);
      } catch (err: any) {
        fail += 1;
        pushZipLog(`실패: ${cleanName} - ${err?.message ?? String(err)}`);
      }
    }

    pushZipLog(`업로드 요약 -> 성공: ${success}, 실패: ${fail}`);
    setUploadingZip(false);

    if (fail > 0) {
      throw new Error(`일부 파일 업로드 실패 (성공: ${success}, 실패: ${fail})`);
    }
  }  


  // 추가-jks : aiserver에게 POST요청 보내는 함수
  async function postAiServer(uid: string, catName: string) {
    try {
      const res = await axios.post(
          "/ai/api/aiservice/prepare/upload",
          { cat_name: catName, user_id: uid },
          { headers: {"Content-Type": "application/json" } }
        );
      const { message } = res.data as { status_code: string; message: string };
      console.log("aiserver 사용자 업로드 사진 준비 완료:",message);
    } catch (err: any) {
      console.log("aiserver 사용자 업로드 준비 요청 실패: ", String(err));
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); // 추가-jks : 로딩 시작
    let imagePathForDb = editingCat?.image || ""; // 추가-jks : 고양이 프로필 사진 (DB에 저장할 이미지 경로:절대경로)
                                                  // 기본은 편집 중 이미지가 있으면 그걸 사용

    // 추가-jks : try-catch 추가
    try{
      // 새 이미지가 선택되었다면, 먼저 업로드 API로 저장 (고양이 프로필 사진)
      if (imageFile && userId) {
        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append("userId", String(userId));

        const res = await axios.post(`/api/upload/cat-image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        // 서버가 반환: { savedPath: "/app/public/<userId>/<filename>.jpg", publicUrl: "/public/<userId>/<filename>.jpg" }
        imagePathForDb = res.data?.savedPath || imagePathForDb;
      }

      // 학습용 zip이 있으면 -> 브라우저에서 압축 해제 및 Azure Blob 업로드
      if (trainingDataFile) {
        if (!userId) {
          throw new Error("userId가 없습니다. 학습용 데이터를 업로드하려면 사용자 식별자가 필요합니다.");
        }
        if (!formData.name) {
          throw new Error("고양이 이름이 비어 있습니다. 업로드 경로 구성을 위해 이름이 필요합니다.");
        }

        await uploadTrainingZipToAzure(trainingDataFile, userId, formData.name);
        // 필요 시: 업로드 결과를 서버 DB에 반영하거나, list API로 검증 가능
        // await axios.get(`/api/blobs/list?container=${CONTAINER_NAME}&prefix=${userId}/${formData.name}/`, { headers: { "X-API-Key": API_KEY_HEADER } });
      }

      // aiserver가 YOLO모델 학습시 사용할 데이터를 준비하기 위해, POST 전송. (aiserver는 Azure Blob에서 해당 업로드 이미지를 다운받아 보관.)
      await postAiServer(String(userId), formData.name);

      const catData: Omit<Cat, 'id' | 'lastCheckup'> = {
        name: formData.name,
        breed: formData.breed,
        age: formData.age,
        weight: formData.weight,
        gender: formData.gender,
        healthStatus: formData.healthStatus,
        memo: formData.memo,
        image: imagePathForDb // 스펙대로 DB에는 '/app/public/...jpg' 절대경로 문자열을 보냄
        // image: imagePreview
      };

      onSubmit(catData);
    } catch (err){
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false); // 추가-jks : 로딩 종료
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // 추가-jks
    setImageFile(file); // 추가-jks : 실제 파일 저장

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTrainingDataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.zip', '.7z'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        alert('ZIP 파일만 업로드 가능합니다.');
        e.target.value = '';
        return;
      }
      
      // 브라우저 해제는 zip만 가능
      if (fileExtension === '.7z') {
        alert('현재 브라우저에서는 7z 압축 해제를 지원하지 않습니다.');
      }

      setTrainingDataFile(file);
    }
  };

  const removeTrainingDataFile = () => {
    setTrainingDataFile(null);
    const fileInput = document.getElementById('training-data') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium">
            {editingCat ? '고양이 정보 수정' : '새 고양이 등록'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 사진 업로드 */}
          <div className="space-y-2">
            <Label>고양이 사진</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="고양이 사진" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="cat-image"
                />
                <Label 
                  htmlFor="cat-image"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  사진 선택
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG 파일을 업로드하세요
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="고양이 이름을 입력하세요"
                required
              />
            </div>

            {/* 품종 */}
            <div className="space-y-2">
              <Label htmlFor="breed">품종 *</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                placeholder="예: 러시안블루, 페르시안"
                required
              />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <Label>성별</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value: 'male' | 'female') => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">수컷</SelectItem>
                  <SelectItem value="female">암컷</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 나이 */}
            <div className="space-y-2">
              <Label htmlFor="age">나이 *</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="예: 2년 3개월, 6개월"
                required
              />
            </div>

            {/* 체중 */}
            <div className="space-y-2">
              <Label htmlFor="weight">체중 *</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="예: 4.2kg"
                required
              />
            </div>

            {/* 건강상태 */}
            <div className="space-y-2">
              <Label>건강 상태</Label>
              <Select 
                value={formData.healthStatus} 
                onValueChange={(value: 'healthy' | 'caution' | 'sick') => setFormData(prev => ({ ...prev, healthStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">건강</SelectItem>
                  <SelectItem value="caution">주의</SelectItem>
                  <SelectItem value="sick">치료중</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 특이사항 */}
          <div className="space-y-2">
            <Label htmlFor="notes">특이사항</Label>
            <Textarea
              id="notes"
              value={formData.memo}
              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              placeholder="알레르기, 특별한 관리사항, 성격 등을 입력하세요"
              rows={3}
            />
          </div>

          {/* 학습용 데이터 업로드 */}
          <div className="space-y-2">
            <Label>AI 학습용 데이터 (선택사항)</Label>
            <div className="border border-border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">고양이 인식 AI 모델 학습을 위한 데이터를 업로드할 수 있습니다.</p>
                  <p>ZIP 형식의 압축 파일만 지원됩니다.</p>
                </div>
              </div>
              
              {trainingDataFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border border-border rounded-md">
                    <div className="flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-primary" />
                      <span className="text-sm">{trainingDataFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(trainingDataFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeTrainingDataFile}
                      className="text-red-600 hover:text-red-700"
                      disabled={uploadingZip}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* 업로드 로그 표시 */}
                  {zipLog.length > 0 && (
                    <pre className="bg-white p-3 border rounded text-xs max-h-40 overflow-auto">
                      {zipLog.join("\n")}
                    </pre>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleTrainingDataUpload}
                    className="hidden"
                    id="training-data"
                  />
                  <Label 
                    htmlFor="training-data"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-gray-100 bg-white"
                  >
                    <Upload className="w-4 h-4" />
                    학습용 데이터 업로드
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    최대 200MB까지 업로드 가능 (ZIP)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 : 추가-jks : 로딩 중 닫기 비활성화 + 로딩스피너 삽입*/}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isBusy}>
              취소
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90"  disabled={isBusy}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}  {/* 로딩 스피너 */}
              {uploadingZip ? "ZIP 업로드 중..." : submitting ? (editingCat ? "수정 중..." : "등록 중...") : (editingCat ? '수정하기' : '등록하기')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}