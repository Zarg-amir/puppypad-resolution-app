-- Migration: Role Hierarchy Support
-- Adds support for super_admin role
-- Note: role can be 'super_admin', 'admin', or 'user'
-- Super admins can create admin accounts
-- Admins can create user accounts
-- Users can only manage their own profile

-- No schema changes needed - admin_users.role already supports these values
-- This migration is just for documentation
