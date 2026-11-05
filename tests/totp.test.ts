import { TotpService } from '../src/services/totp';

describe('TotpService', () => {
  // Standard test secret from RFC 6238: "12345678901234567890" in Base32 is "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  test('should generate standard 6-digit code', () => {
    const code = TotpService.generateCode(rfcSecret, {
      timestampMs: 1111111109000, // known epoch
      period: 30,
      digits: 6,
    });

    expect(code).toBeDefined();
    expect(code.length).toBe(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  test('should calculate remaining seconds correctly within 30-second window', () => {
    // Exactly at second 10 -> 20 seconds remaining
    const timestampMs = 10000;
    const remaining = TotpService.getRemainingSeconds(30, timestampMs);
    expect(remaining).toBe(20);
  });

  test('should parse otpauth URI correctly', () => {
    const uri = 'otpauth://totp/AcmeCorp:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AcmeCorp&digits=6&period=30';
    const parsed = TotpService.parseOtpAuthUri(uri);

    expect(parsed).not.toBeNull();
    expect(parsed?.issuer).toBe('AcmeCorp');
    expect(parsed?.account).toBe('alice@example.com');
    expect(parsed?.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(parsed?.digits).toBe(6);
    expect(parsed?.period).toBe(30);
  });
});
