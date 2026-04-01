/**
 * Centralized Logging (Phase 1 MVP)
 * TODO: Upgrade to full Winston implementation in Phase 2
 */

import { config } from '../config.js';

export const logger = {
  info: (message: string, data?: any) => {
    if (config.LOG_LEVEL === 'debug' || config.LOG_LEVEL === 'info') {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (['debug', 'info', 'warn'].includes(config.LOG_LEVEL)) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || '');
  },

  debug: (message: string, data?: any) => {
    if (config.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
};
