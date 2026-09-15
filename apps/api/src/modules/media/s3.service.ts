import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const DEFAULT_S3_REGION = 'fr-par';

export type ObjectStorageConfig = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

@Injectable()
export class S3Service {
  constructor(private readonly config: ConfigService) {}

  storageConfig(): ObjectStorageConfig | null {
    const endpoint = this.config.get<string>('S3_ENDPOINT')?.trim();
    const bucket = this.config.get<string>('S3_BUCKET')?.trim();
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY')?.trim();
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY')?.trim();
    const region =
      this.config.get<string>('S3_REGION')?.trim() || DEFAULT_S3_REGION;
    const forcePathStyle =
      this.config.get<string>('S3_FORCE_PATH_STYLE')?.trim() !== 'false';

    if (
      !endpoint ||
      !bucket ||
      !accessKeyId ||
      !secretAccessKey ||
      !/^https?:\/\//i.test(endpoint) ||
      accessKeyId.length < 8 ||
      secretAccessKey.length < 8
    ) {
      return null;
    }

    return {
      endpoint,
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      forcePathStyle,
    };
  }

  isConfigured(): boolean {
    return this.storageConfig() !== null;
  }

  createClient(): S3Client | null {
    const storage = this.storageConfig();
    if (!storage) {
      return null;
    }

    return new S3Client({
      region: storage.region,
      endpoint: storage.endpoint,
      credentials: {
        accessKeyId: storage.accessKeyId,
        secretAccessKey: storage.secretAccessKey,
      },
      forcePathStyle: storage.forcePathStyle,
    });
  }
}
