import { SensorService } from '../src/services/sensors';

describe('SensorService', () => {
  beforeEach(() => {
    SensorService.disarmTripwire();
    SensorService.setShakeSosHandler(null);
  });

  test('should arm and disarm tripwire state correctly', () => {
    expect(SensorService.isArmed()).toBe(false);

    let alarmFired = false;
    SensorService.armTripwire(() => {
      alarmFired = true;
    }, { sensitivityG: 0.3 });

    expect(SensorService.isArmed()).toBe(true);

    // Initial baseline calibration frame
    SensorService.simulateSensorEvent(0.0);
    expect(alarmFired).toBe(false);

    // Frame with spike exceeding 0.3g threshold
    SensorService.simulateSensorEvent(0.8);
    expect(alarmFired).toBe(true);

    SensorService.disarmTripwire();
    expect(SensorService.isArmed()).toBe(false);
  });

  test('should trigger shake SOS callback on multiple high-g spikes', () => {
    let shakeFired = false;
    SensorService.setShakeSosHandler(() => {
      shakeFired = true;
    }, 2.0);

    // First spike
    SensorService.simulateSensorEvent(2.5);
    expect(shakeFired).toBe(false);

    // Second spike
    SensorService.simulateSensorEvent(2.6);
    expect(shakeFired).toBe(false);

    // Third spike
    SensorService.simulateSensorEvent(2.7);
    expect(shakeFired).toBe(true);
  });
});
