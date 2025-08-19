import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X, Upload, FileArchive, AlertCircle } from "lucide-react";
import type { Cat } from "./CatManagement";
import axios from "axios";

interface AddCatFormProps {
  onClose: () => void;
  onSubmit: (catData: Omit<Cat, 'id' | 'lastCheckup'>) => void;
  editingCat?: Cat | null;
  userId?: string | number; // 추가-jks : 고양이 프로필 이미지 경로 저장을 위해 사용자 식별자 전달 받기
}

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imagePathForDb = editingCat?.image || ""; // 추가-jks : 고양이 프로필 사진 (DB에 저장할 이미지 경로:절대경로)
                                                  // 기본은 편집 중 이미지가 있으면 그걸 사용

    // 추가-jks : try-catch 추가
    try{
      // 새 이미지가 선택되었다면, 먼저 업로드 API로 저장
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
        alert('ZIP 또는 7ZIP 파일만 업로드 가능합니다.');
        e.target.value = '';
        return;
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
                  <p>ZIP 또는 7ZIP 형식의 압축 파일만 지원됩니다.</p>
                </div>
              </div>
              
              {trainingDataFile ? (
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
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".zip,.7z"
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
                    최대 100MB까지 업로드 가능 (ZIP, 7ZIP)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" >
              {editingCat ? '수정하기' : '등록하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}