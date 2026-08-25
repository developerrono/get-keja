-- 002_verification_and_deactivation.sql
-- Run this against the `getkeja` database (phpMyAdmin / mysql CLI).
--
-- Adds:
--   1. Phone/email verification timestamps on `users`
--   2. Deactivation fields on `users` (replaces hard delete for landlords)
--   3. `otp_codes` table for phone/email OTP verification
--   4. `landlord_verifications` table (ID + selfie submission for KYC),
--      if it doesn't already exist in this environment.

-- ---------------------------------------------------------------
-- 1 & 2. Extend `users`
-- ---------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_verified_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS deactivated_at DATETIME NULL;

-- `status` is a free-text/enum column already holding values like
-- 'active' / 'suspended'. If it's a strict ENUM in your environment,
-- widen it to also allow 'deactivated':
-- ALTER TABLE users MODIFY status ENUM('active','suspended','deactivated','deleted') NOT NULL DEFAULT 'active';

-- ---------------------------------------------------------------
-- 3. OTP codes (phone + email verification)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  channel ENUM('phone','email') NOT NULL,
  destination VARCHAR(255) NOT NULL,      -- the phone number or email the code was sent to
  code_hash VARCHAR(255) NOT NULL,        -- store a hash, never the raw code
  purpose ENUM('verify','reset') NOT NULL DEFAULT 'verify',
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX otp_user_channel_idx (user_id, channel)
);

-- ---------------------------------------------------------------
-- 4. Landlord ID + face verification submissions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landlord_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  national_id VARCHAR(50) NOT NULL,
  id_photo_url VARCHAR(500) NULL,
  selfie_url VARCHAR(500) NULL,
  business_name VARCHAR(255) NULL,
  status ENUM('pending','approved','rejected','info_requested') NOT NULL DEFAULT 'pending',
  admin_notes TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
