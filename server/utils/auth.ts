import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Password validation - 8+ chars, alphanumeric + safe special chars (excluding SQL injection risk chars)
export const passwordSchema = {
  minLength: 8,
  pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`]+$/,
  requiresUpper: true,
  requiresLower: true,
  requiresNumber: true,
  requiresSpecial: true
};

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < passwordSchema.minLength) {
    errors.push(`Password must be at least ${passwordSchema.minLength} characters long`);
  }
  
  if (!passwordSchema.pattern.test(password)) {
    errors.push('Password contains invalid characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
  return expiry;
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}