-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yetkiler tablosu
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Yedekleme logları tablosu
CREATE TABLE IF NOT EXISTS backup_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Örnek admin kullanıcısı
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2a$10$X7J3K5L9M2N4P6Q8R0S2T4V6W8Y0Z2B4D6F8H0J2L4N6P8R0T2V4W6Y8Z0', 'admin');

-- Admin yetkileri
INSERT INTO permissions (user_id, permission) VALUES (1, 'backup:create');
INSERT INTO permissions (user_id, permission) VALUES (1, 'backup:restore');
INSERT INTO permissions (user_id, permission) VALUES (1, 'backup:cleanup');
INSERT INTO permissions (user_id, permission) VALUES (1, 'backup:auto'); 