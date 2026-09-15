import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('HTTP hardening (CS-M15-S05)', () => {
  it('applique helmet et un throttle global configurable', () => {
    const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');
    const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');
    const envExample = readFileSync(
      join(__dirname, '../../../.env.example'),
      'utf8',
    );

    expect(main).toContain("import helmet from 'helmet'");
    expect(main).toContain('app.use(helmet())');
    expect(appModule).toContain('ThrottlerModule.forRoot');
    expect(appModule).toContain('ThrottlerGuard');
    expect(envExample).toContain('THROTTLE_LIMIT=100');
    expect(existsSync(join(__dirname, '../../modules/health/health.controller.ts'))).toBe(
      true,
    );
    const health = readFileSync(
      join(__dirname, '../../modules/health/health.controller.ts'),
      'utf8',
    );
    expect(health).toContain('@SkipThrottle()');
  });
});
