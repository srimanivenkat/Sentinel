import CryptoJS from 'crypto-js';

export class TotpService {
  private static BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * Decodes a RFC 4648 Base32 encoded string into a CryptoJS WordArray
   */
  static base32ToWordArray(base32: string): CryptoJS.lib.WordArray {
    const cleaned = base32.toUpperCase().replace(/[\s\-_=]/g, '');
    let bits = '';

    for (let i = 0; i < cleaned.length; i++) {
      const val = this.BASE32_ALPHABET.indexOf(cleaned.charAt(i));
      if (val === -1) {
        continue;
      }
      bits += val.toString(2).padStart(5, '0');
    }

    const words: number[] = [];
    let hex = '';
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      const byte = parseInt(bits.substr(i, 8), 2);
      hex += byte.toString(16).padStart(2, '0');
    }

    return CryptoJS.enc.Hex.parse(hex);
  }

  /**
   * Generates a 6- or 8-digit TOTP code according to RFC 6238
   */
  static generateCode(
    secretBase32: string,
    options: {
      timestampMs?: number;
      period?: number;
      digits?: 6 | 8;
      algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
    } = {}
  ): string {
    const {
      timestampMs = Date.now(),
      period = 30,
      digits = 6,
      algorithm = 'SHA1',
    } = options;

    if (!secretBase32) return '000000';

    const epochSeconds = Math.floor(timestampMs / 1000);
    const counter = Math.floor(epochSeconds / period);

    // Convert 64-bit integer counter to 16 hex characters (8 bytes, big-endian)
    const counterHex = counter.toString(16).padStart(16, '0');
    const counterWords = CryptoJS.enc.Hex.parse(counterHex);
    const keyWords = this.base32ToWordArray(secretBase32);

    let hmacWords: CryptoJS.lib.WordArray;
    if (algorithm === 'SHA256') {
      hmacWords = CryptoJS.HmacSHA256(counterWords, keyWords);
    } else if (algorithm === 'SHA512') {
      hmacWords = CryptoJS.HmacSHA512(counterWords, keyWords);
    } else {
      hmacWords = CryptoJS.HmacSHA1(counterWords, keyWords);
    }

    const hmacHex = hmacWords.toString(CryptoJS.enc.Hex);

    // Dynamic truncation (RFC 4226 / 6238)
    const offset = parseInt(hmacHex.substring(hmacHex.length - 1), 16) * 2;
    const part = hmacHex.substring(offset, offset + 8);
    const truncated = parseInt(part, 16) & 0x7fffffff;

    const modulo = Math.pow(10, digits);
    const code = (truncated % modulo).toString().padStart(digits, '0');
    return code;
  }

  /**
   * Returns remaining seconds in the current 30s cycle (1 to period)
   */
  static getRemainingSeconds(period = 30, timestampMs = Date.now()): number {
    const epochSeconds = Math.floor(timestampMs / 1000);
    const rem = period - (epochSeconds % period);
    return rem;
  }

  /**
   * Parses otpauth://totp/ URI string
   */
  static parseOtpAuthUri(uri: string): {
    issuer?: string;
    account?: string;
    secret?: string;
    digits?: 6 | 8;
    period?: number;
  } | null {
    try {
      if (!uri.startsWith('otpauth://totp/')) return null;

      const url = new URL(uri);
      const label = decodeURIComponent(url.pathname.replace(/^\/\/?/, ''));
      let issuer = url.searchParams.get('issuer') || '';
      let account = label;

      if (label.includes(':')) {
        const parts = label.split(':');
        if (!issuer) issuer = parts[0].trim();
        account = parts.slice(1).join(':').trim();
      }

      const secret = url.searchParams.get('secret') || '';
      const digits = (parseInt(url.searchParams.get('digits') || '6', 10) === 8 ? 8 : 6) as 6 | 8;
      const period = parseInt(url.searchParams.get('period') || '30', 10);

      return {
        issuer,
        account,
        secret,
        digits,
        period,
      };
    } catch {
      return null;
    }
  }
}
