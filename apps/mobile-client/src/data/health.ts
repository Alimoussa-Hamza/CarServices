import { api } from '@carservice/api-client';
import { env } from '../config/env';
import { bootstrapApiClient } from './api-bootstrap';

export type HealthStatus = {
  label: string;
  source: 'mock' | 'api';
};

export async function getHealthStatus(): Promise<HealthStatus> {
  if (env.useMocks) {
    return { label: 'mock prêt', source: 'mock' };
  }

  bootstrapApiClient();
  try {
    const res = await api.health.check();
    return { label: res.status, source: 'api' };
  } catch {
    return { label: 'hors ligne', source: 'api' };
  }
}
