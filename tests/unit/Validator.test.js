/**
 * Unit tests for Validator
 * Requirements: 2.4, 2.5, 3.4, 4.4, 6.3
 */

describe('Validator.requireNonEmpty', () => {
  it('returns invalid for empty string', () => {
    const result = Validator.requireNonEmpty('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Required');
  });

  it('returns invalid for whitespace-only string', () => {
    expect(Validator.requireNonEmpty('   ').valid).toBe(false);
    expect(Validator.requireNonEmpty('\t').valid).toBe(false);
    expect(Validator.requireNonEmpty('\n').valid).toBe(false);
  });

  it('returns valid for a non-empty string', () => {
    const result = Validator.requireNonEmpty('hello');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns valid for a string with surrounding whitespace but non-empty content', () => {
    expect(Validator.requireNonEmpty('  hello  ').valid).toBe(true);
  });
});

describe('Validator.validateWebAppUrl', () => {
  it('returns valid with no warning for empty string', () => {
    const result = Validator.validateWebAppUrl('');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('returns valid with no warning for correct Google Apps Script prefix', () => {
    const result = Validator.validateWebAppUrl(
      'https://script.google.com/macros/s/AKfycbz/exec'
    );
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('returns valid with warning for URL with wrong prefix', () => {
    const result = Validator.validateWebAppUrl('https://example.com/api');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it('returns valid with warning for arbitrary non-empty string', () => {
    const result = Validator.validateWebAppUrl('not-a-url');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeTruthy();
  });
});

describe('Validator.validateDiscordWebhook', () => {
  it('returns valid with no warning for empty string', () => {
    const result = Validator.validateDiscordWebhook('');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('returns valid with no warning for a correctly formatted Discord webhook URL', () => {
    const result = Validator.validateDiscordWebhook(
      'https://discord.com/api/webhooks/123456789/abcDEF-xyz_token'
    );
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('returns valid with warning for a malformed Discord webhook URL', () => {
    const result = Validator.validateDiscordWebhook('https://discord.com/api/webhooks/');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it('returns valid with warning for an unrelated URL', () => {
    const result = Validator.validateDiscordWebhook('https://example.com/webhook');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it('returns valid with warning for a non-URL string', () => {
    const result = Validator.validateDiscordWebhook('not-a-url');
    expect(result.valid).toBe(true);
    expect(result.warning).toBeTruthy();
  });
});
