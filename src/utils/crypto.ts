import { MD5 } from 'crypto-js';

/**
 * Compute MD5 hex digest (lowercase) of a string.
 *
 * The backend `wms-user` expects the login password as `MD5(MD5(plain) + plain)`.
 */
export function md5(input: string): string {
  return MD5(input).toString();
}
