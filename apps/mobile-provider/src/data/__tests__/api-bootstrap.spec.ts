import { initApiClient } from '@carservice/api-client';
import { bootstrapApiClient, resetApiBootstrap } from '../api-bootstrap';

describe('bootstrapApiClient', () => {
  beforeEach(() => {
    resetApiBootstrap();
    jest.mocked(initApiClient).mockClear();
  });

  it('init une seule fois', () => {
    bootstrapApiClient();
    bootstrapApiClient();
    expect(initApiClient).toHaveBeenCalledTimes(1);
    expect(initApiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: expect.any(String),
        getAccessToken: expect.any(Function),
      }),
    );
  });
});
