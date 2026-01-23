-- Migration: Set zarg.business@gmail.com as super_admin
-- Run this after migration 008_user_invitations.sql

UPDATE admin_users 
SET role = 'super_admin' 
WHERE username = 'zarg.business@gmail.com' OR email = 'zarg.business@gmail.com';
