import { getApiBaseUrl } from '../services/api';

/**
 * Clerk Authentication Service & Mobile SMS OTP Helper
 * Manages phone number normalization (E.164), Clerk custom flows, and PostgreSQL synchronization
 */

// Format Indian Phone Number to standard E.164 (+91XXXXXXXXXX)
export function formatToE164(input) {
  if (!input) return '';
  const digits = input.replace(/[^0-9]/g, '');

  // If already prefixed with 91 and 12 digits total
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // If standard 10 digit Indian number
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // If 11 digits starting with 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }

  return input.startsWith('+') ? input : `+${digits}`;
}

export function isValidIndianMobile(e164Number) {
  // Must match +91 followed by 10 digits starting with 6, 7, 8, or 9
  return /^\+91[6-9]\d{9}$/.test(e164Number);
}

/**
 * Synchronize authenticated Clerk session with internal PostgreSQL database
 */
export async function syncUserWithPostgres({
  clerkId,
  phone,
  email,
  fullName,
  intendedRole, // 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  businessName,
  roles,
}) {
  try {
    const baseUrl = getApiBaseUrl();
    const token = typeof window !== 'undefined' ? (localStorage.getItem('bmc_clerk_token') || localStorage.getItem('token')) : null;
    const headers = {
      'Content-Type': 'application/json',
      'X-Mock-User-Id': clerkId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/auth/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clerkId,
        phone: formatToE164(phone),
        email: email || '',
        fullName: fullName || 'User',
        intendedRole: intendedRole || 'CUSTOMER',
        businessName: businessName || '',
        roles: roles || [],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data?.data || data;
    }
  } catch (err) {
    console.warn('PostgreSQL backend sync failed, fallback to local store:', err);
  }

  return {
    userId: `usr_${Date.now()}`,
    clerkId,
    phone,
    email,
    userType: intendedRole,
  };
}
