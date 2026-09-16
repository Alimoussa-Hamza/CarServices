jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }: { children: unknown }) => children,
  initPaymentSheet: jest.fn(async () => ({ error: undefined })),
  presentPaymentSheet: jest.fn(async () => ({ error: undefined })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock(
  'expo-notifications',
  () => ({
    getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    getExpoPushTokenAsync: jest.fn(async () => ({
      data: 'ExponentPushToken[testxxxxxxxxxxxxxxxx]',
    })),
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    getLastNotificationResponseAsync: jest.fn(async () => null),
  }),
  { virtual: true },
);

jest.mock(
  'expo-device',
  () => ({
    isDevice: true,
  }),
  { virtual: true },
);

jest.mock('@carservice/api-client', () => {
  class ApiError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.status = status;
    }
  }

  return {
    ApiError,
    initApiClient: jest.fn(),
    api: {
      auth: {
        sendOtp: jest.fn(),
        verifyOtp: jest.fn(),
      },
      health: {
        check: jest.fn(),
      },
    },
  };
});
