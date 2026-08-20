import configuration from './configuration';

describe('configuration', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // Security: these guard against silently deploying with the hardcoded
  // dev-fallback JWT secrets, which would let anyone forge a valid token for
  // any user. See dtr-generator's formula-injection fix for the other
  // security finding fixed alongside this one.
  it('throws when NODE_ENV=production and JWT_SECRET is left at its dev default', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = 'a-real-refresh-secret';

    expect(() => configuration()).toThrow(/JWT_SECRET/);
  });

  it('throws when NODE_ENV=production and JWT_REFRESH_SECRET is left at its dev default', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-real-secret';
    delete process.env.JWT_REFRESH_SECRET;

    expect(() => configuration()).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('does not throw in production once both secrets and CORS_ORIGIN are set', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-real-secret';
    process.env.JWT_REFRESH_SECRET = 'a-real-refresh-secret';
    process.env.CORS_ORIGIN = 'https://example.pages.dev';

    expect(() => configuration()).not.toThrow();
  });

  it('does not throw outside production even with the default secrets', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    expect(() => configuration()).not.toThrow();
  });

  // Security: without this, main.ts would silently fall back to a wide-open
  // CORS policy in production instead of failing loudly.
  it('throws when NODE_ENV=production and CORS_ORIGIN is unset', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-real-secret';
    process.env.JWT_REFRESH_SECRET = 'a-real-refresh-secret';
    delete process.env.CORS_ORIGIN;

    expect(() => configuration()).toThrow(/CORS_ORIGIN/);
  });

  it('does not throw outside production even with CORS_ORIGIN unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGIN;

    expect(() => configuration()).not.toThrow();
  });
});
