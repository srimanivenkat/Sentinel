import { OptimizerService } from '../src/services/optimizer';

describe('OptimizerService', () => {
  test('should format bytes correctly into human-readable units', () => {
    expect(OptimizerService.formatBytes(512)).toBe('1 KB');
    expect(OptimizerService.formatBytes(1024 * 1024 * 450)).toBe('450.0 MB');
    expect(OptimizerService.formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.50 GB');
  });

  test('should calculate battery runtime adjustments per power profile', () => {
    const balanced = OptimizerService.getBatteryDiagnostics('BALANCED');
    const saver = OptimizerService.getBatteryDiagnostics('SAVER');
    const ultra = OptimizerService.getBatteryDiagnostics('ULTRA_SAVER');
    const perf = OptimizerService.getBatteryDiagnostics('PERFORMANCE');

    expect(saver.estimatedHoursRemaining).toBeGreaterThan(balanced.estimatedHoursRemaining);
    expect(ultra.estimatedHoursRemaining).toBeGreaterThan(saver.estimatedHoursRemaining);
    expect(perf.estimatedHoursRemaining).toBeLessThan(balanced.estimatedHoursRemaining);
  });

  test('should provide valid junk items and running processes', () => {
    const junk = OptimizerService.getJunkItems();
    expect(junk.length).toBeGreaterThan(0);
    const totalBytes = junk.reduce((acc, item) => acc + item.sizeBytes, 0);
    expect(totalBytes).toBeGreaterThan(1024 * 1024 * 100); // > 100 MB

    const processes = OptimizerService.getRunningProcesses();
    expect(processes.length).toBeGreaterThan(0);
    const totalMem = processes.reduce((acc, p) => acc + p.memoryMb, 0);
    expect(totalMem).toBeGreaterThan(500); // > 500 MB
  });
});
