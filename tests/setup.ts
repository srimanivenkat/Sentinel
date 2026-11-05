jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'WIFI',
  })),
  getIpAddressAsync: jest.fn(async () => '192.168.1.100'),
  NetworkStateType: { WIFI: 'WIFI' },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => {}),
  getStringAsync: jest.fn(async () => ''),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));
