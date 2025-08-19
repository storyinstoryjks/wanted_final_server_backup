import { useState, useMemo, useEffect } from "react";
import axios from 'axios';
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Heart,
  MessageSquare,
  User,
  Bell,
  Shield,
  LogOut,
  Settings,
  Smartphone,
  Menu,
} from "lucide-react";
import { MainHeader } from "./components/MainHeader";
import { CategoryTabs } from "./components/CategoryTabs";
import { StatusTabs } from "./components/StatusTabs";
import { InlineSearch } from "./components/InlineSearch";
import { DashboardNotices } from "./components/DashboardNotices";
import { CatFeedingStats } from "./components/CatFeedingStats";
import type { Cat } from "./components/CatManagement";
import { CatManagement } from "./components/CatManagement";
import { AddCatForm } from "./components/AddCatForm";
import { DeviceManagement } from "./components/DeviceManagement";
import { AddDeviceForm } from "./components/AddDeviceForm";
import { Schedule } from "./components/Schedule";
import { Statistics } from "./components/Statistics";
import { MyPage } from "./components/MyPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { AdminPage } from "./components/AdminPage";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import type { Post } from "./components/PostCard";
import { PostCard } from "./components/PostCard";
import { PostTable } from "./components/PostTable";
import { CreatePostForm } from "./components/CreatePostForm";
import { PostDetail } from "./components/PostDetail";
import type { Question } from "./components/QuestionForm";
import { QuestionTable } from "./components/QuestionTable";
import { QuestionBoard  } from "./components/QuestionBoard";
import { CreateQuestionForm } from "./components/CreateQuestionForm";
import type { Notice } from "./components/NoticeCard";
import { NoticeCard } from "./components/NoticeCard";
import { NoticeTable } from "./components/NoticeTable";
import { CreateNoticeForm } from "./components/CreateNoticeForm";
import { NoticeDetail } from "./components/NoticeDetail";
import type {
  BoardType,
  MenuType,
  ManagementType,
  AuthPage,
  UserData,
  Device,
} from "./types";
import { mockUsers } from "./data/mockUsers";
import { initialPosts } from "./data/mockPosts";
import { initialQuestions } from "./data/mockQuestions";
import { initialNotices } from "./data/mockNotices";
import {
  canEditItem,
  canDeleteItem,
  canCreateNotice,
} from "./utils/permissions";
import {
  getBoardTitle,
  getCreateButtonText,
  getCurrentData,
  getCurrentCategories,
} from "./utils/boardUtils";
import {
  filterAndSortData,
  getCounts,
} from "./utils/dataFilters";
import { Toaster } from "sonner"; // 추가-jks : Toast 알림


axios.defaults.withCredentials = true;
const VITE_API_URL = import.meta.env.VITE_API_URL;

// 추가-jks : 고양이 프로필 사진 (도커 경로 -> 정적 URL 변환)
const dockerPathToPublicUrl = (p?: string) => {
  if (!p) return "";
  // "/app/public/USER/xxx.jpg" → "/public/USER/xxx.jpg"
  return p.startsWith("/app/") ? p.replace("/app", "") : p;
};

// Sidebar 컴포넌트: 사이드 메뉴를 렌더링합니다.
const Sidebar = ({
  currentUser,
  handleLogout,
  currentMenu,
  handleMenuChange,
  isManagementMenuOpen,
  setIsManagementMenuOpen,
  currentManagement,
  handleManagementChange,
  isBoardMenuOpen,
  setIsBoardMenuOpen,
  currentBoard,
  handleBoardChange,
}: any) => {
  return (
    <div className="w-full bg-white border-r border-border h-screen sticky top-0 flex flex-col">
        {/* 사용자 정보 섹션 */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-primary text-xl font-bold">캣밥바라기</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8"><Bell className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="font-semibold">{currentUser?.username}</div>
              <div className="text-xs text-muted-foreground">{currentUser?.email}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">고양이 집사들의 공간</p>
        </div>
        
        {/* 네비게이션 메뉴 */}
        <div className="flex-1 p-3 overflow-y-auto">
           <nav className="space-y-1">
            {/* 대시보드 메뉴 아이템 */}
            <button onClick={() => handleMenuChange("dashboard")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${currentMenu === "dashboard" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>대시보드</span>
            </button>
            
            {/* 관리 메뉴 (하위 메뉴 포함) */}
            <div>
              <button
                onClick={() => setIsManagementMenuOpen(!isManagementMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium ${currentMenu === "management" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}
              >
                <span className="flex items-center gap-3"><Settings className="w-4 h-4" /><span>관리</span></span>
                {isManagementMenuOpen ? <ChevronDown className="w-4 h-4 text-primary-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {isManagementMenuOpen && (
                <div className="ml-7 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                  {/* 고양이 관리 하위 메뉴 */}
                  <button onClick={() => handleManagementChange("cats")} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${currentMenu === "management" && currentManagement === "cats" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>
                    <div className="flex items-center gap-3"><Heart className="w-4 h-4" /><span>고양이</span></div>
                  </button>
                  {/* 장치 관리 하위 메뉴 */}
                  <button onClick={() => handleManagementChange("devices")} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${currentMenu === "management" && currentManagement === "devices" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>
                    <div className="flex items-center gap-3"><Smartphone className="w-4 h-4" /><span>장치</span></div>
                  </button>
                </div>
              )}
            </div>

            {/* 게시판 메뉴 (하위 메뉴 포함) */}
             <div>
              <button
                onClick={() => setIsBoardMenuOpen(!isBoardMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium ${currentMenu === "board" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}
              >
                <span className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /><span>게시판</span></span>
                {isBoardMenuOpen ? <ChevronDown className="w-4 h-4 text-primary-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {isBoardMenuOpen && (
                <div className="ml-7 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                  {/* 정보게시판 하위 메뉴 */}
                  <button onClick={() => { handleMenuChange("board"); handleBoardChange("info"); }} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${currentMenu === "board" && currentBoard === "info" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>정보게시판</button>
                  {/* Q&A 하위 메뉴 */}
                  <button onClick={() => { handleMenuChange("board"); handleBoardChange("qna"); }} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${currentMenu === "board" && currentBoard === "qna" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>Q&A</button>
                  {/* 공지사항 하위 메뉴 */}
                  <button onClick={() => { handleMenuChange("board"); handleBoardChange("notice"); }} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${currentMenu === "board" && currentBoard === "notice" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>공지사항</button>
                </div>
              )}
            </div>
          
            {/* 마이페이지 메뉴 아이템 */}
            <button onClick={() => handleMenuChange("my-page")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${currentMenu === "my-page" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>
              <User className="w-4 h-4" />
              <span>마이페이지</span>
            </button>
            {/* 관리자 페이지 메뉴 아이템 (관리자만 표시) */}
            {currentUser?.role === "admin" && (
              <button onClick={() => handleMenuChange("admin")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${currentMenu === "admin" ? "bg-primary text-primary-foreground" : "hover:bg-gray-100 text-foreground"}`}>
                <Shield className="w-4 h-4" />
                <span>관리자</span>
              </button>
            )}
          </nav>
        </div>
      </div>
  )
}

// MainContent 컴포넌트: 메인 콘텐츠 영역을 렌더링합니다.
const MainContent = ({
  title,
  currentMenu,
  currentManagement,
  cats,
  handleMenuChange,
  setCurrentManagement,
  devices,
  setShowAddDeviceForm,
  setEditingDevice,
  setEditingCat,
  currentUser,
  viewMode,
  setViewMode,
  filteredData,
  currentBoard,
  selectedStatus,
  selectedCategory,
  sortBy,
  setSortBy,
  setSelectedStatus,
  counts,
  setShowCreateForm,
  currentCategories,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  handleItemClick,
  handleEditClick,
  handleDeletePost,
  handleDeleteQuestion,
  handleDeleteNotice,
  setShowAddCatForm,
  handleDeleteCat,
  handleDeleteDevice,
  selectedMonitoringCats,
  setSelectedMonitoringCats,
}: any) => {
  const renderContent = () => {
    if (currentMenu === "dashboard") {
      return (
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 대시보드 공지사항 */}
            <div>
              <DashboardNotices streamKey={currentUser?.streamKey} />
            </div>
            {/* 고양이 식사량 통계 */}
            <div>
              <CatFeedingStats
                cats={cats}
                onGoToCatManagement={() => {
                  handleMenuChange("management");
                  setCurrentManagement("cats");
                }}
                selectedCats={selectedMonitoringCats}
                onCatSelectionChange={setSelectedMonitoringCats}
              />
            </div>
          </div>
        </div>
      );
    }
    if (currentMenu === "management") {
      if (currentManagement === "cats") {
        return <CatManagement
        cats = {cats}
        onAddCat={() => setShowAddCatForm(true)}
        onEditCat={handleEditClick}
        onDeleteCat={handleDeleteCat} 
        currentUser={currentUser} />;
      }
      if (currentManagement === "devices") {
        return <DeviceManagement 
        devices={devices}
        onAddDevice={() => setShowAddDeviceForm(true)}
        onEditDevice={handleEditClick} 
        onDeleteDevice={handleDeleteDevice} />;
      }
      return null;
    }
    if (currentMenu === "schedule") return <Schedule />;
    if (currentMenu === "statistics") return <Statistics cats={cats} />;
    if (currentMenu === "my-page") return <MyPage user={currentUser!} />;
    if (currentMenu === "admin") {
      if (currentUser?.role !== "admin") {
        return <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="text-muted-foreground mb-4">관리자 권한이 필요합니다.</div></div></div>;
      }
      return <AdminPage />;
    }
    if (currentMenu !== "board") {
      return <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="text-muted-foreground mb-4">페이지 준비중입니다.</div></div></div>;
    }
    return (
      <>
        {/* 메인 헤더 */}
        <MainHeader viewMode={viewMode} onViewModeChange={setViewMode} postsCount={filteredData.length} selectedCategory={currentBoard === "qna" ? selectedStatus : selectedCategory} sortBy={sortBy} onSortChange={setSortBy} />
        {/* 카테고리/상태 탭 및 생성 버튼 */}
        {currentBoard === "qna" ? (
          <StatusTabs selectedStatus={selectedStatus} onStatusSelect={setSelectedStatus} questionCounts={counts} onCreateClick={() => setShowCreateForm(true)} createButtonText={getCreateButtonText(currentBoard)} />
        ) : currentBoard === "notice" ? (
          <CategoryTabs categories={currentCategories} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} postCounts={counts} onCreateClick={canCreateNotice(currentUser) ? () => setShowCreateForm(true) : undefined} createButtonText={getCreateButtonText(currentBoard)} />
        ) : (
          <CategoryTabs categories={currentCategories} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} postCounts={counts} onCreateClick={() => setShowCreateForm(true)} createButtonText={getCreateButtonText(currentBoard)} />
        )}
        {/* 콘텐츠 및 인라인 검색 */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white border-b border-border">
            {filteredData.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-muted-foreground mb-4">{searchTerm || selectedCategory || selectedStatus ? "검색 결과가 없습니다." : `${getBoardTitle(currentBoard)}에 게시물이 없습니다.`}</div>
                  {(currentBoard !== "notice" || (currentBoard === "notice" && canCreateNotice(currentUser))) && (<button onClick={() => setShowCreateForm(true)} className="text-primary hover:underline">첫 번째 게시물을 작성해보세요</button>)}
                </div>
              </div>
            ) : (
              <div className="p-6">
                {viewMode === "card" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* 반응형 그리드 적용 */}
                    {filteredData.map((item: any) => {
                      if (currentBoard === "info") {
                        return <PostCard key={item.id} post={item as Post} onClick={() => handleItemClick(item)} canEdit={canEditItem(currentUser, item.author)} canDelete={canDeleteItem(currentUser, item.author)} onEdit={() => handleEditClick(item)} onDelete={() => handleDeletePost(item.id)} />;
                      }
                      if (currentBoard === "qna") {
                        return <QuestionBoard key={item.id} questions={[item as Question]} currentUser={currentUser}   />;
                      }
                      if (currentBoard === "notice") {
                        return <NoticeCard key={item.id} notice={item as Notice} onClick={() => handleItemClick(item)} canEdit={canEditItem(currentUser, item.author)} canDelete={canDeleteItem(currentUser, item.author)} onEdit={() => handleEditClick(item)} onDelete={() => handleDeleteNotice(item.id)} />;
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <>
                    {currentBoard === "info" && <PostTable posts={filteredData as Post[]} onPostClick={handleItemClick} currentUser={currentUser} onEdit={handleEditClick} onDelete={handleDeletePost} />}
                    {currentBoard === "qna" && <QuestionTable questions={filteredData as Question[]} onQuestionClick={handleItemClick} currentUser={currentUser} onEdit={handleEditClick} onDelete={handleDeleteQuestion} />}
                    {currentBoard === "notice" && <NoticeTable notices={filteredData as Notice[]} onNoticeClick={handleItemClick} currentUser={currentUser} onEdit={handleEditClick} onDelete={handleDeleteNotice} />}
                  </>
                )}
              </div>
            )}
            <InlineSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} resultsCount={filteredData.length} />
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="flex h-14 items-center gap-4 border-b bg-white px-6 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {renderContent()}
      </main>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  // const [isAuthenticated, setIsAuthenticated] = useState(true);
  // const [currentUser, setCurrentUser] = useState<UserData | null>(mockUsers[1]);
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [currentMenu, setCurrentMenu] = useState<MenuType>("dashboard");
  const [currentManagement, setCurrentManagement] = useState<ManagementType>("cats");
  const [currentBoard, setCurrentBoard] = useState<BoardType>("info");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(true);
  const [isManagementMenuOpen, setIsManagementMenuOpen] = useState(true);
  const [cats, setCats] = useState<Cat[]>([]);
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedMonitoringCats, setSelectedMonitoringCats] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
        if (isAuthenticated) {
            const fetchDevices = async () => {
                try {
                    const response = await axios.get(`/api/devices`, {
                        withCredentials: true,
                    });
                    if (response.status === 200) {
                        setDevices(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch devices:", error);
                }
            };

            fetchDevices();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            const fetchCats = async () => {
                try {
                    const response = await axios.get(`/api/cats`, {
                        withCredentials: true,
                    });
                    if (response.status === 200) {
                        setCats(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch cats:", error);
                }
            };

            fetchCats();
        }
    }, [isAuthenticated]);
    
  // 추가-jks : 고양이 프로필 사진 (고양이 목록을 화면에 뿌리기 전에 URL로 치환)
  const catsForRender = useMemo(() => {
    return (cats || []).map(c => ({
      ...c,
      image: dockerPathToPublicUrl(c.image), // 화면에서 사용할 URL로 치환
    }));
  }, [cats]);

  const currentData = getCurrentData(currentBoard, posts, questions, notices);
  const currentCategories = getCurrentCategories(currentBoard, currentData);

  const counts = useMemo(() => {
    return getCounts(currentBoard, currentData, currentCategories);
  }, [currentBoard, posts, questions, notices, currentData, currentCategories]);

  const filteredData = useMemo(() => {
    return filterAndSortData(currentData, currentBoard, searchTerm, selectedCategory, selectedStatus, sortBy);
  }, [currentData, currentBoard, searchTerm, selectedCategory, selectedStatus, sortBy]);

const handleLoginAttempt = async (email: string, password: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);
        const response = await axios.post(`/api/user/login`, params);

        if (response.status === 200) {
            const userResponse = await axios.get(`/api/user/me`, {
                withCredentials: true 
            });
            setCurrentUser(userResponse.data);
            setIsAuthenticated(true);
            return true;
        }
        return false;

    } catch (error) {
      console.error("Login failed:", error);
      alert("로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.");
      return false;
    }
};

  const handleSignupAttempt = async (userData: {
    email: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post(
        `/api/user/signup`, 
        userData
      );

      if (response.status === 201) {
        return { success: true };
      }
      return { success: false, message: "알 수 없는 오류가 발생했습니다." };

    } catch (error: any) {
      console.error("Signup failed:", error);
      if (error.response && error.response.data && error.response.data.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: "서버와 통신 중 오류가 발생했습니다." };
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentMenu("dashboard");
  };

  // [수정됨] 게시판 글 생성 함수 (API 연동 예시)
  const handleCreatePost = async (postData: Omit<Post, "id" | "views" | "likes" | "comments" | "createdAt">) => {
    try {
      const payload = {
        ...postData,
        author: currentUser?.username || postData.author,
      };
      const response = await axios.post(`/api/posts`, payload, { withCredentials: true });
      
      if (response.status === 201) {
        const newPost = response.data;
        setPosts((prev) => [newPost, ...prev]);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("게시글 생성에 실패했습니다.");
    }
  };

 const handleCreateQuestion = async (questionData: Omit<Question, "id" | "views" | "status" | "answers" | "createdAt">) => {
  try {
    const payload = {
      ...questionData,
      author: currentUser?.username || questionData.author,
    };
    // 백엔드의 Q&A 생성 API 엔드포인트로 요청합니다. (엔드포인트는 실제 API에 맞게 조정해야 할 수 있습니다.)
    const response = await axios.post(`/api/questions`, payload, { withCredentials: true });

    if (response.status === 201) {
      const newQuestion = response.data; // 서버로부터 받은 데이터 사용
      setQuestions((prev) => [newQuestion, ...prev]);
      setShowCreateForm(false);
    }
  } catch (error) {
    console.error("Failed to create question:", error);
    alert("질문 생성에 실패했습니다.");
  }
};

// [수정됨] 공지사항 생성 함수 (API 연동)
const handleCreateNotice = async (noticeData: Omit<Notice, "id" | "views" | "createdAt">) => {
  try {
    const payload = {
      ...noticeData,
      author: currentUser?.username || noticeData.author,
    };
    const response = await axios.post(`/api/notices`, payload, { withCredentials: true });

    if (response.status === 201) {
      const newNotice = response.data; // 서버로부터 받은 데이터 사용
      setNotices((prev) => [newNotice, ...prev]);
      setShowCreateForm(false);
    }
  } catch (error) {
    console.error("Failed to create notice:", error);
    alert("공지사항 생성에 실패했습니다.");
  }
};

  const handleEditPost = (postData: Omit<Post, "id" | "views" | "likes" | "comments" | "createdAt">) => {
    if (editingPost) {
      setPosts((prev) => prev.map((post) => post.id === editingPost.id ? { ...post, ...postData } : post));
      setEditingPost(null);
      setShowCreateForm(false);
    }
  };

  const handleEditQuestion = (questionData: Omit<Question, "id" | "views" | "status" | "answers" | "createdAt">) => {
    if (editingQuestion) {
      setQuestions((prev) => prev.map((question) => question.id === editingQuestion.id ? { ...question, ...questionData } : question));
      setEditingQuestion(null);
      setShowCreateForm(false);
    }
  };

  const handleEditNotice = (noticeData: Omit<Notice, "id" | "views" | "createdAt">) => {
    if (editingNotice) {
      setNotices((prev) => prev.map((notice) => notice.id === editingNotice.id ? { ...notice, ...noticeData } : notice));
      setEditingNotice(null);
      setShowCreateForm(false);
    }
  };

  const handleDeletePost = (postId: number) => {
    if (window.confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setSelectedPost(null);
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (window.confirm("정말 이 질문을 삭제하시겠습니까?")) {
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
      setSelectedQuestion(null);
    }
  };

  const handleDeleteNotice = (noticeId: number) => {
    if (window.confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
      setNotices((prev) => prev.filter((notice) => notice.id !== noticeId));
      setSelectedNotice(null);
    }
  };

  // [수정됨] 고양이 추가: API 요청 후 상태 업데이트 (안전한 방식)
  const handleAddCat = async (catData: Omit<Cat, "id" | "lastCheckup">) => {
    try {
      const payload = {
        name: catData.name,
        breed: catData.breed,
        gender: catData.gender,
        age: Number(catData.age),
        weight: Number(catData.weight),
        healthStatus: catData.healthStatus,
        memo: catData.memo,
        image: catData.image,
        aiDataFile: ""
      };

      const response = await axios.post(`/api/cats`, payload, { withCredentials: true });

      if (response.status === 201) {
        const newCat = response.data;
        setCats((prev) => [newCat, ...prev]);
        setShowAddCatForm(false);
      }
    } catch (error) {
      console.error("Failed to add cat:", error);
      alert("고양이 추가에 실패했습니다.");
    }
  };

  // [수정됨] 고양이 수정: API 요청 후 상태 업데이트 (안전한 방식)
  const handleUpdateCat = async (catData: Omit<Cat, "id" | "lastCheckup">) => {
    if (editingCat) {
      try {
        const response = await axios.put(`/api/cats/${editingCat.id}`, catData, {
          withCredentials: true,
        });
        
        const updatedCat = response.data;
        setCats((prev) => 
          prev.map((cat) => 
            cat.id === editingCat.id ? updatedCat : cat
          )
        );

        setEditingCat(null);
        setShowAddCatForm(false);
      } catch (error) {
        console.error("Failed to update cat:", error);
        alert("고양이 정보 수정에 실패했습니다.");
      }
    }
  };
  
  // [수정됨] 고양이 삭제: API 요청 후 상태 업데이트 (안전한 방식)
  const handleDeleteCat = async (catId: number) => {
    if (window.confirm("정말 이 고양이를 삭제하시겠습니까?")) {
      try {
        await axios.delete(`/api/cats/${catId}`, {
          withCredentials: true,
        });

        setCats((prev) => prev.filter((cat) => cat.id !== catId));
      } catch (error) {
        console.error("Failed to delete cat:", error);
        alert("고양이 삭제에 실패했습니다.");
      }
    }
  };

  const handleAddDevice = async (deviceData: Omit<Device, "id">) => {
    try {
      const response = await axios.post(`/api/devices`, deviceData, {
        withCredentials: true,
      });

      if (response.status === 201) {
        const newDevice = response.data;
        setDevices((prev) => [newDevice, ...prev]);
        setShowAddDeviceForm(false);
      }
    } catch (error) {
      console.error("Failed to add device:", error);
      alert("장치 추가에 실패했습니다.");
    }
  };

  const handleUpdateDevice = async (deviceData: Omit<Device, "id" | "lastConnected">) => {
    if (editingDevice) {
      try {
        const response = await axios.put(`/api/devices/${editingDevice.id}`, deviceData, {
          withCredentials: true,
        });

        setDevices((prev) => 
          prev.map((device) => 
            device.id === editingDevice.id ? response.data : device
          )
        );
        
        setEditingDevice(null);
        setShowAddDeviceForm(false);
      } catch (error) {
        console.error("Failed to update device:", error);
        alert("장치 정보 수정에 실패했습니다.");
      }
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (window.confirm("정말 이 장치를 삭제하시겠습니까?")) {
      try {
        await axios.delete(`/api/devices/${deviceId}`, {
          withCredentials: true,
        });

        setDevices((prev) => prev.filter((device) => device.id !== deviceId));
      } catch (error) {
        console.error("Failed to delete device:", error);
        alert("장치 삭제에 실패했습니다.");
      }
    }
  };

  const handleItemClick = (item: Post | Question | Notice) => {
    if (currentBoard === "info") {
      const postItem = item as Post;
      setPosts((prev) => prev.map((p) => p.id === postItem.id ? { ...p, views: p.views + 1 } : p));
      setSelectedPost(postItem);
    } else if (currentBoard === "qna") {
      const questionItem = item as Question;
      setQuestions((prev) => prev.map((q) => q.id === questionItem.id ? { ...q, views: q.views + 1 } : q));
      setSelectedQuestion(questionItem);
    } else if (currentBoard === "notice") {
      const noticeItem = item as Notice;
      setNotices((prev) => prev.map((n) => n.id === noticeItem.id ? { ...n, views: n.views + 1 } : n));
      setSelectedNotice(noticeItem);
    }
  };

const handleEditClick = (item: any) => {
  if (currentMenu === "management") {
    if (currentManagement === "cats") {
      setEditingCat(item);
      setShowAddCatForm(true);
      return;
    }
    if (currentManagement === "devices") {
      setEditingDevice(item);
      setShowAddDeviceForm(true);
      return;
    }
  }

  if (currentMenu === "board") {
    if (currentBoard === "info") {
      setEditingPost(item);
      setShowCreateForm(true);
      return;
    }
    if (currentBoard === "qna") {
      setEditingQuestion(item);
      setShowCreateForm(true);
      return;
    }
    if (currentBoard === "notice") {
      setEditingNotice(item);
      setShowCreateForm(true);
      return;
    }
  }
};

  const handleBoardChange = (board: BoardType) => {
    setCurrentBoard(board);
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSearchTerm("");
    setSortBy("latest");
    setViewMode(board === "info" || board === "qna" || board === "notice" ? "table" : "card");
  };

  const handleMenuChange = (menu: MenuType) => {
    setCurrentMenu(menu);
    if (menu !== "board" && menu !== "management") {
      setSelectedCategory(null);
      setSelectedStatus(null);
      setSearchTerm("");
      setSortBy("latest");
    }
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };

  const handleManagementChange = (management: ManagementType) => {
    setCurrentManagement(management);
    setCurrentMenu("management");
     if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };
    
  const getMenuTitle = (menu: MenuType, management: ManagementType, board: BoardType): string => {
    switch (menu) {
      case "dashboard": return "대시보드";
      case "management":
        switch (management) {
          case "cats": return "고양이 관리";
          case "devices": return "장치 관리";
          default: return "관리";
        }
      case "board": return getBoardTitle(board);
      case "my-page": return "마이페이지";
      case "admin": return "관리자 페이지";
      default: return "캣밥바라기";
    }
  };

  if (!isAuthenticated) {
    if (authPage === "login") {
      return <LoginPage onLogin={handleLoginAttempt} onGoToSignup={() => setAuthPage("signup")} />;
    } else {
      return <SignupPage onSignup={handleSignupAttempt} onGoToLogin={() => setAuthPage("login")} />;
    }
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="flex">
        {/* 데스크탑 사이드바 */}
        <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
            <div className="w-64 h-full overflow-hidden">
                <Sidebar
                    currentUser={currentUser}
                    handleLogout={handleLogout}
                    currentMenu={currentMenu}
                    handleMenuChange={handleMenuChange}
                    isManagementMenuOpen={isManagementMenuOpen}
                    setIsManagementMenuOpen={setIsManagementMenuOpen}
                    currentManagement={currentManagement}
                    handleManagementChange={handleManagementChange}
                    isBoardMenuOpen={isBoardMenuOpen}
                    setIsBoardMenuOpen={setIsBoardMenuOpen}
                    currentBoard={currentBoard}
                    handleBoardChange={handleBoardChange}
                />
            </div>
        </div>

        {/* 모바일 사이드바 (오버레이) */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <Sidebar
                currentUser={currentUser}
                handleLogout={handleLogout}
                currentMenu={currentMenu}
                handleMenuChange={handleMenuChange}
                isManagementMenuOpen={isManagementMenuOpen}
                setIsManagementMenuOpen={setIsManagementMenuOpen}
                currentManagement={currentManagement}
                handleManagementChange={handleManagementChange}
                isBoardMenuOpen={isBoardMenuOpen}
                setIsBoardMenuOpen={setIsBoardMenuOpen}
                currentBoard={currentBoard}
                handleBoardChange={handleBoardChange}
            />
        </div>
        {isSidebarOpen && (
            <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />
        )}

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1">
            <MainContent
              title={getMenuTitle(currentMenu, currentManagement, currentBoard)}
              currentMenu={currentMenu}
              currentManagement={currentManagement}
              cats={catsForRender} // 추가-jks : 고양이 프로필 사진(변경 : 고양이 목록을 화면에 뿌리기 전에 URL로 치환)
              handleMenuChange={handleMenuChange}
              setCurrentManagement={setCurrentManagement}
              devices={devices}
              setShowAddDeviceForm={setShowAddDeviceForm}
              setEditingDevice={setEditingDevice}
              setEditingCat = {setEditingCat}
              currentUser={currentUser}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filteredData={filteredData}
              currentBoard={currentBoard}
              selectedStatus={selectedStatus}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              setSelectedStatus={setSelectedStatus}
              counts={counts}
              setShowCreateForm={setShowCreateForm}
              currentCategories={currentCategories}
              setSelectedCategory={setSelectedCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleItemClick={handleItemClick}
              handleEditClick={handleEditClick}
              handleDeletePost={handleDeletePost}
              handleDeleteQuestion={handleDeleteQuestion}
              handleDeleteNotice={handleDeleteNotice}
              setShowAddCatForm={setShowAddCatForm}
              handleDeleteCat={handleDeleteCat}
              handleDeleteDevice={handleDeleteDevice}
              selectedMonitoringCats={selectedMonitoringCats}
              setSelectedMonitoringCats={setSelectedMonitoringCats}
            />
        </main>
      </div>

      {/* 모바일 사이드바 토글 버튼 */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-5 left-5 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      {/* 추가-jks : Toast 알림 */}
      <Toaster position="top-center" closeButton richColors />

      {/* --- 폼 및 모달 --- */}
      
      {/* 글/질문/공지 생성 및 수정 폼 */}
      {currentMenu === "board" && showCreateForm && currentBoard === "info" && (<CreatePostForm onClose={() => { setShowCreateForm(false); setEditingPost(null); }} onSubmit={editingPost ? handleEditPost : handleCreatePost} editingPost={editingPost} />)}
      {currentMenu === "board" && showCreateForm && currentBoard === "qna" && (<CreateQuestionForm onClose={() => { setShowCreateForm(false); setEditingQuestion(null); }} onSubmit={editingQuestion ? handleEditQuestion : handleCreateQuestion} editingQuestion={editingQuestion} />)}
      {currentMenu === "board" && showCreateForm && currentBoard === "notice" && canCreateNotice(currentUser) && (<CreateNoticeForm onClose={() => { setShowCreateForm(false); setEditingNotice(null); }} onSubmit={editingNotice ? handleEditNotice : handleCreateNotice} editingNotice={editingNotice} />)}
      
      {/* 고양이/장치 추가 및 수정 폼 */}
      {showAddCatForm && (
        <AddCatForm 
          onClose={() => { setShowAddCatForm(false); setEditingCat(null); }} 
          onSubmit={editingCat ? handleUpdateCat : handleAddCat} 
          editingCat={editingCat} 
          userId={currentUser?.id ?? currentUser?.email} // 추가-jks : 백엔드에서 사용할 식별자
        />
      )}
      {showAddDeviceForm && (<AddDeviceForm onClose={() => { setShowAddDeviceForm(false); setEditingDevice(null); }} onSubmit={editingDevice ? handleUpdateDevice : handleAddDevice} editingDevice={editingDevice} streamKey={currentUser?.streamKey}/>)}
      
      {/* --- 상세 보기 모달 --- */}
      {selectedPost && (
        <PostDetail
          item={posts.find((p) => p.id === selectedPost.id) || selectedPost}
          onBack={() => setSelectedPost(null)}
          canEdit={canEditItem(currentUser, selectedPost.author)}
          canDelete={canDeleteItem(currentUser, selectedPost.author)}
          onEdit={() => handleEditClick(selectedPost)}
          onDelete={() => handleDeletePost(selectedPost.id)}
        />
      )}
      
      {selectedQuestion && (
        <PostDetail
          item={questions.find((q) => q.id === selectedQuestion.id) || selectedQuestion}
          onBack={() => setSelectedQuestion(null)}
          canEdit={canEditItem(currentUser, selectedQuestion.author)}
          canDelete={canDeleteItem(currentUser, selectedQuestion.author)}
          onEdit={() => handleEditClick(selectedQuestion)}
          onDelete={() => handleDeleteQuestion(selectedQuestion.id)}
        />
      )}

      {selectedNotice && (
        <NoticeDetail
          notice={notices.find((n) => n.id === selectedNotice.id) || selectedNotice}
          onBack={() => setSelectedNotice(null)}
          canEdit={canEditItem(currentUser, selectedNotice.author)}
          canDelete={canDeleteItem(currentUser, selectedNotice.author)}
          onEdit={() => handleEditClick(selectedNotice)}
          onDelete={() => handleDeleteNotice(selectedNotice.id)}
        />
      )}
  </div>
  );
}