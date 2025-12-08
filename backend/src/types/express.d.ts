/**
 * Express type extensions
 * Extends Express Request to include custom properties
 */

import { User } from './database';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
