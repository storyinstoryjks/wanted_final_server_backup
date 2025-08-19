CREATE DATABASE IF NOT EXISTS my_app_db;
USE my_app_db;

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    event_time DATETIME,
    duration_seconds FLOAT,
    weight_info VARCHAR(255),
    origin_video_url VARCHAR(255),
    bbox_video_url VARCHAR(255),
    event_type VARCHAR(255),
    cat_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS aimodel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    model_status VARCHAR(255),
    model_name VARCHAR(255),
    val_precision FLOAT,
    val_recall FLOAT,
    val_map50 FLOAT
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    join_date VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    stream_key VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    devicename VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    wifi_name VARCHAR(255),
    location VARCHAR(255),
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100) NOT NULL,
    views INT NOT NULL DEFAULT 0,
    likes INT NOT NULL DEFAULT 0,
    comments INT NOT NULL DEFAULT 0,
    CHECK (views >= 0),
    CHECK (likes >= 0),
    CHECK (comments >= 0),
    INDEX idx_posts_created_at (created_at),
    INDEX idx_posts_category_created (category, created_at)
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100) NOT NULL,
    status ENUM('문의중','답변대기','답변완료') NOT NULL DEFAULT '문의중',
    views INT NOT NULL DEFAULT 0,
    answers_count INT NOT NULL DEFAULT 0,
    CHECK (views >= 0),
    CHECK (answers_count >= 0),
    INDEX idx_questions_created_at (created_at),
    INDEX idx_questions_status_created (status, created_at)
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    content LONGTEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON DELETE CASCADE
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100) NOT NULL,
    views INT NOT NULL DEFAULT 0,
    priority ENUM('일반','중요','긴급') NOT NULL DEFAULT '일반',
    is_pinned TINYINT(1) NOT NULL DEFAULT 0,
    CHECK (views >= 0),
    CHECK (is_pinned IN (0, 1)),
    INDEX idx_notices_pinned_created (is_pinned, created_at),
    INDEX idx_notices_priority_created (priority, created_at)
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255) NOT NULL,
    gender VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    image VARCHAR(500), -- 사진 URL
    memo TEXT, -- 특이사항
    weight FLOAT,
    health_status VARCHAR(255) NOT NULL, -- Enum 값 (예: HEALTHY, SICK 등)
    ai_data_file VARCHAR(255), -- AI 학습용 데이터 파일 경로
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
