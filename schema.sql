CREATE DATABASE IF NOT EXISTS fitness_ai_app;
USE fitness_ai_app;

-- 1. Módulo de Usuarios y Gimnasios

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    initial_weight DECIMAL(5,2),
    current_weight DECIMAL(5,2),
    height DECIMAL(5,2),
    goal ENUM('LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gyms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    google_place_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8)
);

CREATE TABLE IF NOT EXISTS user_gyms (
    user_id BIGINT,
    gym_id BIGINT,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, gym_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

-- 2. Módulo de Entrenamiento (Tracking de Máquinas)

CREATE TABLE IF NOT EXISTS machines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    target_muscle_group VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    gym_id BIGINT,
    session_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exercise_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workout_session_id BIGINT NOT NULL,
    machine_id BIGINT NOT NULL,
    weight_lifted DECIMAL(6,2) NOT NULL,
    repetitions INT NOT NULL,
    sets INT NOT NULL DEFAULT 1,
    image_url VARCHAR(500),
    ai_confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- 3. Módulo de Nutrición (Escaneo de Comidas)

CREATE TABLE IF NOT EXISTS meal_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    meal_type ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    detected_foods JSON,
    total_calories INT,
    total_protein DECIMAL(6,2),
    total_carbs DECIMAL(6,2),
    total_fats DECIMAL(6,2),
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Módulo de Evolución Física (Body Tracking)

CREATE TABLE IF NOT EXISTS body_progress_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    front_image_url VARCHAR(500),
    side_image_url VARCHAR(500),
    recorded_weight DECIMAL(5,2),
    ai_estimated_body_fat DECIMAL(5,2),
    ai_feedback_notes TEXT,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Módulo del Coach Virtual

CREATE TABLE IF NOT EXISTS ai_coach_recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recommendation_type ENUM('WORKOUT', 'NUTRITION', 'GENERAL') NOT NULL,
    content JSON,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
