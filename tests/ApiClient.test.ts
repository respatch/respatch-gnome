import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers.js';
import { ApiClient } from '../src/services/ApiClient.js';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ApiClient', () => {
    const client = new ApiClient();

    it('should verify project with valid token', async () => {
        await expect(client.verifyProject('https://example.com', 'valid-token')).resolves.not.toThrow();
    });

    it('should throw error with invalid token', async () => {
        await expect(client.verifyProject('https://example.com', 'invalid-token')).rejects.toThrow('Chyba 401');
    });

    it('should throw error with server error', async () => {
        await expect(client.verifyProject('https://example.com', 'error-token')).rejects.toThrow('Chyba 500');
    });

    it('should handle URL with trailing slash', async () => {
        await expect(client.verifyProject('https://example.com/', 'valid-token')).resolves.not.toThrow();
    });
});
