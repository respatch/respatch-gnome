import { expect, test } from 'vitest';

test('dummy test', () => {
    expect(1 + 1).toBe(2);
});

test('Respatch branding', () => {
    const appName = 'Respatch';
    expect(appName).toBe('Respatch');
});
