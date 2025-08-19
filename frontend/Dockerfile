# 베이스 이미지를 표준 버전으로 사용
FROM node:20

# 작업 디렉토리 설정
WORKDIR /app

# package.json 파일들 복사
COPY package*.json ./

# --- [핵심 수정] npm install 전에 JDK 설치 ---
# apt-get 패키지 목록을 업데이트하고, openjdk-17-jdk를 설치합니다.
RUN apt-get update && apt-get install -y openjdk-17-jdk && rm -rf /var/lib/apt/lists/*

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 컨테이너 실행 명령어
CMD ["npm", "run", "dev", "--", "--host"]