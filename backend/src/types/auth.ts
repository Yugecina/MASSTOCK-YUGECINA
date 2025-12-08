/**
 * Authentication types
 */

import { UserRole } from './index';

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  client_id?: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}
