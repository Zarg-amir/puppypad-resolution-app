/**
 * Validators - Input validation utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function isValidOrderNumber(orderNumber: string): boolean {
  const cleaned = orderNumber.replace(/^#/, '').trim();
  return cleaned.length > 0 && /^\d+$/.test(cleaned);
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function isWithinDays(date: string | Date, days: number): boolean {
  const targetDate = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - targetDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

export function daysSince(date: string | Date): number {
  const targetDate = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - targetDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCustomerIdentification(data: {
  email?: string;
  phone?: string;
  firstName?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.email && !data.phone) {
    errors.push('Please provide either email or phone number');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Please enter a valid email address');
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Please enter a valid phone number');
  }

  if (data.firstName && !isNotEmpty(data.firstName)) {
    errors.push('Please enter your first name');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateOrderSelection(selectedItems: unknown[]): ValidationResult {
  const errors: string[] = [];

  if (!selectedItems || selectedItems.length === 0) {
    errors.push('Please select at least one item');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
