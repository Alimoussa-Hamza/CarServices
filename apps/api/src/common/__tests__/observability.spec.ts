import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('observability wiring (CS-M15-S04)', () => {
  it('documente SENTRY_DSN dans .env.example', () => {
    const envExample = readFileSync(
      join(__dirname, '../../../.env.example'),
      'utf8',
    );
    expect(envExample).toContain('SENTRY_DSN=');
    expect(envExample).toContain('SENTRY_TRACES_SAMPLE_RATE=');
  });

  it('charge instrument.ts avant bootstrap', () => {
    const mainPath = join(__dirname, '../../main.ts');
    const instrumentPath = join(__dirname, '../../instrument.ts');
    expect(existsSync(instrumentPath)).toBe(true);
    const main = readFileSync(mainPath, 'utf8');
    expect(main).toMatch(/import ['"]\.\/instrument['"]/);
    expect(main).toContain('nestjs-pino');
  });
});
