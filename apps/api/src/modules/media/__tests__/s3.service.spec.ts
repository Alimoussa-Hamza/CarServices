import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { DEFAULT_S3_REGION, S3Service } from '../s3.service';

function buildService(env: Record<string, string | undefined>) {
  const config = {
    get: jest.fn((key: string) => env[key]),
  };

  return {
    service: new S3Service(config as unknown as ConfigService),
    config,
  };
}

const validEnv = {
  S3_ENDPOINT: 'https://s3.fr-par.scw.cloud',
  S3_BUCKET: 'carservice-dev-media',
  S3_ACCESS_KEY: 'scw_local_access',
  S3_SECRET_KEY: 'scw_local_secret_key',
  S3_REGION: 'fr-par',
};

describe('S3Service', () => {
  it('reste en mock local si les variables S3 sont vides', () => {
    const { service } = buildService({});

    expect(service.isConfigured()).toBe(false);
    expect(service.storageConfig()).toBeNull();
    expect(service.createClient()).toBeNull();
  });

  it('ignore un endpoint non HTTP', () => {
    const { service } = buildService({
      ...validEnv,
      S3_ENDPOINT: 's3.fr-par.scw.cloud',
    });

    expect(service.isConfigured()).toBe(false);
  });

  it('ignore des clés trop courtes', () => {
    const { service } = buildService({
      ...validEnv,
      S3_ACCESS_KEY: 'short',
    });

    expect(service.isConfigured()).toBe(false);
  });

  it('construit un client S3 compatible Scaleway/R2', () => {
    const { service } = buildService(validEnv);
    const storage = service.storageConfig();
    const client = service.createClient();

    expect(service.isConfigured()).toBe(true);
    expect(storage).toMatchObject({
      endpoint: validEnv.S3_ENDPOINT,
      bucket: validEnv.S3_BUCKET,
      region: 'fr-par',
      forcePathStyle: true,
    });
    expect(client).toBeInstanceOf(S3Client);
    client?.destroy();
  });

  it('applique la région par défaut fr-par', () => {
    const { service } = buildService({
      ...validEnv,
      S3_REGION: undefined,
    });

    expect(service.storageConfig()?.region).toBe(DEFAULT_S3_REGION);
  });

  it('désactive forcePathStyle seulement si S3_FORCE_PATH_STYLE=false', () => {
    const { service } = buildService({
      ...validEnv,
      S3_FORCE_PATH_STYLE: 'false',
    });

    expect(service.storageConfig()?.forcePathStyle).toBe(false);
  });

  it('réutilise le même client S3', () => {
    const { service } = buildService(validEnv);
    const first = service.getClient();
    const second = service.getClient();

    expect(first).toBe(second);
    first?.destroy();
  });
});
