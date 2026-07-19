SET @dbname = 'getkeja';
SET @tablename = 'users';

SET @col = 'phone';
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @col) = 0,
  'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER email',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = 'bio';
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @col) = 0,
  'ALTER TABLE users ADD COLUMN bio TEXT NULL AFTER phone',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = 'avatar_url';
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @col) = 0,
  'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER bio',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Landlord replies to reviews (reviews table currently has no place to store these)
SET @tablename = 'reviews';

SET @col = 'landlord_reply';
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @col) = 0,
  'ALTER TABLE reviews ADD COLUMN landlord_reply TEXT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = 'replied_at';
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @col) = 0,
  'ALTER TABLE reviews ADD COLUMN replied_at DATETIME NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;