jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

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
      providers: {
        me: jest.fn(),
        kycStatus: jest.fn(),
        updateMe: jest.fn(),
        submitKyc: jest.fn(),
        updateCapabilities: jest.fn(),
        updateAvailability: jest.fn(),
        updateZones: jest.fn(),
      },
      catalog: {
        offers: jest.fn(),
      },
      zones: {
        check: jest.fn(),
      },
    },
  };
});
