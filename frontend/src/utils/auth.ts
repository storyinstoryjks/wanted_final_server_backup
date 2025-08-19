import type { UserData } from '../types';

const API_BASE_URL = 'https://8080-storyinstoryj-wantedcat-1h9np3sscvm.ws-us121.gitpod.io';


export const handleLogin = async (email: string, password: string): Promise<UserData | null> => {
  try {
    // 1. 백엔드의 /api/user/login 엔드포인트로 POST 요청을 보냅니다.
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 2. 요청 본문에 이메일과 비밀번호를 JSON 형태로 담아 보냅니다.
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // 3. 서버가 200 OK 응답을 보내면, 로그인 성공으로 간주합니다.
    if (response.ok) {
      // 서버가 보내준 사용자 데이터를 JSON 형태로 파싱하여 반환합니다.
      const userData: UserData = await response.json();
      return userData;
    } else {
      // 401 (Unauthorized) 등 다른 상태 코드를 받으면 로그인 실패로 간주합니다.
      console.error('Login failed: Invalid email or password.');
      return null;
    }
  } catch (error) {
    // 네트워크 오류 등 요청 중 에러가 발생한 경우
    console.error('An error occurred during login:', error);
    return null;
  }
};

export const handleSignup = async (userData: {
  email: string;
  username: string; 
  password: string;
}): Promise<boolean> => {
  try {
    const response = await fetch(`/api/user/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username, 
        email: userData.email,
        password: userData.password,
      }),
    });

    if (response.ok) {
      return true;
    } else {
      const errorData = await response.json();
      console.error('Signup failed:', errorData.message);
      return false;
    }
  } catch (error) {
    console.error('An error occurred during signup:', error);
    return false;
  }
};
