import { CryptoService } from '../src/services/crypto';

describe('CryptoService', () => {
  const masterKey = 'SuperSecretMasterKey123!@#';
  const testPlaintext = 'MyConfidentialPassword_99$';

  test('should encrypt and decrypt plaintext accurately', () => {
    const ciphertext = CryptoService.encrypt(testPlaintext, masterKey);
    expect(ciphertext).toBeDefined();
    expect(ciphertext).not.toBe(testPlaintext);

    const decrypted = CryptoService.decrypt(ciphertext, masterKey);
    expect(decrypted).toBe(testPlaintext);
  });

  test('should fail decryption if master key is incorrect', () => {
    const ciphertext = CryptoService.encrypt(testPlaintext, masterKey);
    expect(() => {
      CryptoService.decrypt(ciphertext, 'WrongKey456');
    }).toThrow();
  });

  test('should generate strong passwords conforming to constraints', () => {
    const pwd = CryptoService.generatePassword({
      length: 20,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });

    expect(pwd.length).toBe(20);
    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[0-9]/.test(pwd)).toBe(true);
  });

  test('should calculate entropy and classify password strength', () => {
    const weak = CryptoService.evaluatePasswordStrength('12345');
    expect(weak.score).toBeLessThanOrEqual(1);

    const strong = CryptoService.evaluatePasswordStrength('Tr0ub4dor&3#X9q!Lp@');
    expect(strong.score).toBeGreaterThanOrEqual(3);
    expect(strong.entropyBits).toBeGreaterThan(60);
  });
});
