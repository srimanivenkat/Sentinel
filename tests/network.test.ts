import { NetworkService } from '../src/services/network';

describe('NetworkService Posture Calculation', () => {
  test('should compute high score for secured device', () => {
    const posture = NetworkService.calculatePostureScore({
      biometricsEnabled: true,
      masterPinSet: true,
      emergencyContactsCount: 3,
      vaultItemsCount: 5,
      motionArmed: true,
      network: {
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'WIFI',
        localIp: '192.168.1.10',
        isVpnDetected: true,
        wifiSecurityType: 'WPA3',
        dnsStatus: 'SECURE',
      },
    });

    expect(posture.overallScore).toBeGreaterThanOrEqual(80);
    expect(posture.threatLevel).toBe('SECURE');
    expect(posture.vpnActive).toBe(true);
  });

  test('should reflect critical or elevated exposure when essential protections are missing', () => {
    const posture = NetworkService.calculatePostureScore({
      biometricsEnabled: false,
      masterPinSet: false,
      emergencyContactsCount: 0,
      vaultItemsCount: 0,
      motionArmed: false,
      network: {
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'WIFI',
        localIp: '10.0.0.1',
        isVpnDetected: false,
        wifiSecurityType: 'OPEN',
        dnsStatus: 'STANDARD',
      },
    });

    expect(posture.overallScore).toBeLessThan(40);
    expect(posture.threatLevel).toBe('CRITICAL');
  });
});
