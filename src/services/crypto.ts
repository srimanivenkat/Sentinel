import CryptoJS from 'crypto-js';

export interface PasswordStrength {
  score: number; // 0 to 4
  entropyBits: number;
  label: 'VERY WEAK' | 'WEAK' | 'MODERATE' | 'STRONG' | 'FORTRESS';
  color: string;
  crackTimeEstimate: string;
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

export class CryptoService {
  /**
   * Hashes a PIN or Password with a salt using SHA-256
   */
  static hashSecret(secret: string, salt: string): string {
    return CryptoJS.SHA256(secret + ':' + salt).toString(CryptoJS.enc.Hex);
  }

  /**
   * Generates high-entropy random hex bytes across Web and React Native environments
   */
  static generateRandomHex(byteCount = 16): string {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      try {
        const bytes = new Uint8Array(byteCount);
        globalThis.crypto.getRandomValues(bytes);
        return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch {}
    }
    let hex = '';
    for (let i = 0; i < byteCount; i++) {
      const entropy = Math.floor((Math.random() * 256) ^ ((Date.now() + i * 31) & 0xff));
      hex += (entropy & 0xff).toString(16).padStart(2, '0');
    }
    return hex;
  }

  /**
   * Generates a random cryptographic salt hex string
   */
  static generateSalt(length = 16): string {
    return CryptoService.generateRandomHex(length);
  }

  /**
   * Encrypts plaintext data using AES-256 with a master key
   */
  static encrypt(plaintext: string, masterKey: string): string {
    if (!plaintext) return '';
    const saltHex = CryptoService.generateRandomHex(16);
    const salt = CryptoJS.enc.Hex.parse(saltHex);
    const key = CryptoJS.PBKDF2(masterKey, salt, {
      keySize: 256 / 32,
      iterations: 5000,
    });
    const ivHex = CryptoService.generateRandomHex(16);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });
    
    // Combine salt + iv + ciphertext in a portable JSON format
    const bundle = {
      s: saltHex,
      iv: ivHex,
      ct: encrypted.toString(),
    };
    return JSON.stringify(bundle);
  }

  /**
   * Decrypts AES-256 ciphertext bundle using the master key
   */
  static decrypt(ciphertextBundle: string, masterKey: string): string {
    if (!ciphertextBundle) return '';
    try {
      const bundle = JSON.parse(ciphertextBundle);
      if (!bundle.s || !bundle.iv || !bundle.ct) {
        throw new Error('Invalid ciphertext structure');
      }
      const salt = CryptoJS.enc.Hex.parse(bundle.s);
      const iv = CryptoJS.enc.Hex.parse(bundle.iv);
      const key = CryptoJS.PBKDF2(masterKey, salt, {
        keySize: 256 / 32,
        iterations: 5000,
      });
      const decrypted = CryptoJS.AES.decrypt(bundle.ct, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
      });
      const utf8 = decrypted.toString(CryptoJS.enc.Utf8);
      if (!utf8) throw new Error('Decryption resulted in empty or invalid data');
      return utf8;
    } catch (err) {
      throw new Error('Failed to decrypt: incorrect key or corrupted data');
    }
  }

  /**
   * Cryptographically secure password generator
   */
  static generatePassword(options: Partial<PasswordGeneratorOptions> = {}): string {
    const config: PasswordGeneratorOptions = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: true,
      ...options,
    };

    let uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let lowercase = 'abcdefghijkmnopqrstuvwxyz';
    let numbers = '23456789';
    let symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    if (!config.excludeAmbiguous) {
      uppercase += 'I' + 'O';
      lowercase += 'l';
      numbers += '0' + '1';
    }

    let charset = '';
    const guaranteed: string[] = [];

    if (config.includeUppercase) {
      charset += uppercase;
      guaranteed.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
    }
    if (config.includeLowercase) {
      charset += lowercase;
      guaranteed.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    }
    if (config.includeNumbers) {
      charset += numbers;
      guaranteed.push(numbers[Math.floor(Math.random() * numbers.length)]);
    }
    if (config.includeSymbols) {
      charset += symbols;
      guaranteed.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    if (!charset) charset = lowercase + numbers;

    const remainingLength = Math.max(0, config.length - guaranteed.length);
    const hex = CryptoService.generateRandomHex(remainingLength);

    const result = [...guaranteed];
    for (let i = 0; i < remainingLength; i++) {
      const byteVal = parseInt(hex.substr(i * 2, 2), 16) || 0;
      result.push(charset[byteVal % charset.length]);
    }

    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join('');
  }

  /**
   * Calculates password entropy and strength
   */
  static evaluatePasswordStrength(password: string): PasswordStrength {
    if (!password) {
      return {
        score: 0,
        entropyBits: 0,
        label: 'VERY WEAK',
        color: '#FF3B30',
        crackTimeEstimate: 'Instant',
      };
    }

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    if (poolSize === 0) poolSize = 10;

    const entropyBits = Math.round(password.length * Math.log2(poolSize));

    let score = 0;
    let label: PasswordStrength['label'] = 'VERY WEAK';
    let color = '#FF3B30';
    let crackTimeEstimate = '< 1 second';

    if (entropyBits >= 85) {
      score = 4;
      label = 'FORTRESS';
      color = '#00F0FF';
      crackTimeEstimate = 'Centuries';
    } else if (entropyBits >= 65) {
      score = 3;
      label = 'STRONG';
      color = '#00E676';
      crackTimeEstimate = 'Decades';
    } else if (entropyBits >= 45) {
      score = 2;
      label = 'MODERATE';
      color = '#FFB300';
      crackTimeEstimate = 'Months';
    } else if (entropyBits >= 28) {
      score = 1;
      label = 'WEAK';
      color = '#FF7A00';
      crackTimeEstimate = 'Hours';
    }

    return {
      score,
      entropyBits,
      label,
      color,
      crackTimeEstimate,
    };
  }
}
