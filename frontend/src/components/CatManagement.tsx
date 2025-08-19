import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Plus, Heart, Calendar, Weight, Stethoscope, Edit, Trash2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { UserData } from "../types";
import axios from "axios";
import { toast } from "sonner"; // 추가-jks : toast 이벤트 발생

export interface Cat {
  id: number;
  name: string;
  breed: string;
  age: string;
  weight: string;
  gender: 'male' | 'female';
  healthStatus: 'healthy' | 'caution' | 'sick';
  lastCheckup: string;
  image?: string;
  notes?: string;
  memo?: string;
  // 새로 추가된 필드들
  dailyWaterIntake?: number; // ml 단위
  dailyFoodIntake?: number; // g 단위
  targetWaterIntake?: number; // ml 단위
  targetFoodIntake?: number; // g 단위
}

interface CatManagementProps {
  cats: Cat[];
  onAddCat: () => void;
  onEditCat: (cat: Cat) => void;
  onDeleteCat: (catId: number) => void;
  currentUser: UserData;
}

// 추가-jks : 고양이 프로필 사진 유틸 함수(경로 필터링)
// const toPublicUrl = (p?: string) => {
//   if (!p) return "";
//   // 이미 웹 경로/절대 URL이면 그대로 사용
//   if (p.startsWith("/public/") || p.startsWith("http://") || p.startsWith("https://")) return p;
//   // /app/public/... → /public/...
//   return p.startsWith("/app/") ? p.replace("/app", "") : p;
// };

// 추가-jks : 고양이 프로필 사진 유틸 함수(경로 필터링)
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const toPublicUrl = (p?: string) => {
  if (!p) return "";
  // 이미 절대 URL이면 그대로
  if (/^https?:\/\//i.test(p)) return p;
  // '/app/public/... → /public/...'
  const path = p.startsWith("/app/") ? p.replace("/app", "") : p;
  // API_BASE가 비어있으면 그대로 '/public/..'로 반환 → Vite가 가로채므로 반드시 API_BASE 세팅 필요
  console.log("CatImagePath",`${API_BASE}${path}`)
  return `${API_BASE}${path}`;
};

// 추가-jks : x-api-key
const API_KEY_HEADER = import.meta.env.VITE_X_API_KEY;

export function CatManagement({ cats, onAddCat, onEditCat, onDeleteCat, currentUser }: CatManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCats = cats.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const healthyCats = cats.filter(cat => cat.healthStatus === 'healthy').length;
  const totalCats = cats.length;

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'caution': return 'bg-yellow-500';
      case 'sick': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return '건강';
      case 'caution': return '주의';
      case 'sick': return '치료중';
      default: return '알 수 없음';
    }
  };

  // 추가-jks : YOLO모델(2번) 생성을 위한 핸들러 함수 (제출용)
  async function postAiServerForMakeYolo_submit() {
    // alert(`사용자ID: ${currentUser.id}`);
    // ai서버와 통신되서 YOLO모델2번 생성 파이프라인 동작되는거 확인
    // 즉, 제출용 코드이고, 시연용은 주석해제되있는 부분임
    try {
      const res = await axios.post(
          "/collection/api/model",
          { user_id: String(currentUser.id) },
          { headers: {"X-API-Key": API_KEY_HEADER, "Content-Type": "application/json" } }
        );
      const { message } = res.data as { status_code: string; message: string };
      console.log("aiserver 사용자 업로드 사진 준비 완료:",message);
    } catch (err: any) {
      console.log("aiserver 사용자 업로드 준비 요청 실패: ", String(err));
    }
  }
  // 추가-jks : YOLO모델(2번) 생성을 위한 핸들러 함수 (시연용)
  function postAiServerForMakeYolo_protype() {
    //alert(`사용자ID: ${currentUser.id}`);
    // toast.success(`${currentUser?.id ?? "알 수 없음"}님을 위한 맞춤형 AI가 준비되고 있습니다. 고양이 식사 및 음수 자동 기록 서비스 제공 시작까지 2~3시간 정도 기다려주시길 양해부탁드립니다. 똑똑하고 멋진 AI로 거듭나 고객님을 만족시켜드리겠습니다.`);
    toast.success("맞춤형 AI 준비 중", {
      description: (
        <div style={{padding:'5px'}} className="space-y-1">
          <p style={{marginBottom:"15px"}}><span className="font-semibold">{currentUser?.username ?? "고객"}</span> 님을 위한 맞춤형 AI가 준비되고 있습니다.</p>
          <p style={{marginBottom:"15px"}}>고양이 식사 및 음수 자동 기록 서비스 제공 시작까지 <span className="font-semibold">2~3시간</span> 정도 기다려주시길 양해 부탁드립니다.</p>
          <p className="font-medium">똑똑하고 멋진 AI로 거듭나 고객님을 만족시켜드리겠습니다.</p>
        </div>
      ),
      duration: 4000,
      className: "border border-green-200 shadow-lg", // 테두리/그림자 등 커스텀
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2">고양이 관리</h1>
          <p className="text-muted-foreground">등록된 고양이들을 관리하고 건강 상태를 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={postAiServerForMakeYolo_protype} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            AI 훈련 시작
          </Button>
          <Button onClick={onAddCat} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            고양이 등록
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">총 고양이</div>
                <div className="text-xl font-medium">{totalCats}마리</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">건강한 고양이</div>
                <div className="text-xl font-medium">{healthyCats}마리</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">관리 필요</div>
                <div className="text-xl font-medium">{totalCats - healthyCats}마리</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Weight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">평균 체중</div>
                <div className="text-xl font-medium">
                  {cats.length > 0 
                    ? (cats.reduce((sum, cat) => sum + parseFloat(cat.weight), 0) / cats.length).toFixed(1)
                    : '0.0'
                  }kg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="고양이 이름이나 품종으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredCats.length}마리 표시 중
        </div>
      </div>

      {/* Cat Cards Grid */}
      {filteredCats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm ? "검색 결과가 없습니다." : "등록된 고양이가 없습니다."}
          </div>
          <Button onClick={onAddCat} variant="outline">
            첫 번째 고양이를 등록해보세요
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCats.map((cat) => (
            <Card key={cat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Cat Image : 추가-jks : toPublicUrl 추가*/}
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  <ImageWithFallback
                    src={
                      toPublicUrl(cat.image) ||
                      `https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop&crop=face`
                    }
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Cat Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{cat.name}</h3>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getHealthStatusColor(cat.healthStatus)}`}></div>
                      <span className="text-xs text-muted-foreground">
                        {getHealthStatusText(cat.healthStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">품종</span>
                      <span>{cat.breed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">나이</span>
                      <span>{cat.age}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">성별</span>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${cat.gender === 'male' ? 'text-blue-600 border-blue-200' : 'text-pink-600 border-pink-200'}`}
                      >
                        {cat.gender === 'male' ? '수컷' : '암컷'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">체중</span>
                      <span>{cat.weight}</span>
                    </div>
                  </div>

                  {cat.memo && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {cat.memo}
                    </div>
                  )}



                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onEditCat(cat)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      수정
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:border-red-200"
                      onClick={() => onDeleteCat(cat.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}