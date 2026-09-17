import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type EasFile = {
  cli: { appVersionSource: string };
  build: {
    development: { developmentClient?: boolean };
    preview: {
      android?: { buildType?: string; distribution?: string };
      ios?: { distribution?: string };
      env?: { EXPO_PUBLIC_USE_MOCKS?: string };
    };
    production: Record<string, unknown>;
  };
  submit: { preview?: object; production?: object };
};

function loadEas(): EasFile {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'eas.json'), 'utf8'),
  ) as EasFile;
}

describe('eas.json CS-M14-S03', () => {
  const eas = loadEas();

  it('expose development, preview et production', () => {
    expect(Object.keys(eas.build).sort()).toEqual([
      'development',
      'preview',
      'production',
    ]);
  });

  it('preview Android = APK interne', () => {
    expect(eas.build.preview.android?.buildType).toBe('apk');
    expect(eas.build.preview.android?.distribution).toBe('internal');
  });

  it('preview iOS = store (TestFlight via eas submit)', () => {
    expect(eas.build.preview.ios?.distribution).toBe('store');
  });

  it('preview sans mocks', () => {
    expect(eas.build.preview.env?.EXPO_PUBLIC_USE_MOCKS).toBe('false');
  });

  it('versions locales (pas de bump remote obligatoire)', () => {
    expect(eas.cli.appVersionSource).toBe('local');
  });
});
