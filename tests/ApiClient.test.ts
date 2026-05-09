import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, recentMessagesFixture } from './mocks/handlers.js';
import { ApiClient } from '../src/services/ApiClient.js';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ApiClient', () => {
    const client = new ApiClient((url: any, init: any) => fetch(url as string, init as RequestInit));

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

    describe('fetchRecentMessages', () => {
        it('should fetch and parse recent messages with valid token', async () => {
            const data = await client.fetchRecentMessages('https://example.com', 'valid-token');
            expect(data).toEqual(recentMessagesFixture);
            expect(data.length).toBe(2);
            expect(data[0].id).toBe(429);
            expect(data[1].status).toBeNull();
        });

        it('should throw on invalid token', async () => {
            await expect(client.fetchRecentMessages('https://example.com', 'invalid-token'))
                .rejects.toThrow('Chyba 401');
        });

        it('should handle URL with trailing slash', async () => {
            await expect(client.fetchRecentMessages('https://example.com/', 'valid-token'))
                .resolves.toEqual(recentMessagesFixture);
        });
    });
    describe('fetchFailedMessages', () => {
        it('should fetch and parse failed messages with valid token', async () => {
            const data = await client.fetchFailedMessages('https://example.com', 'valid-token', 'async');
            expect(data.length).toBe(2);
            expect(data[0].id).toBe(3);
            expect(data[0].transport).toBe('async');
            expect(data[1].exception).toBeNull();
            expect(data[1].transport).toBe('async');
        });

        it('should inject transport name into each message', async () => {
            const data = await client.fetchFailedMessages('https://example.com', 'valid-token', 'failed');
            expect(data.every(m => m.transport === 'failed')).toBe(true);
        });

        it('should throw on invalid token', async () => {
            await expect(client.fetchFailedMessages('https://example.com', 'invalid-token', 'async'))
                .rejects.toThrow('Chyba 401');
        });
    });

    describe('removeFailedMessage', () => {
        it('should remove message with valid token and csrf', async () => {
            const res = await client.removeFailedMessage('https://example.com', 'valid-token', 'async', 1, 'valid-csrf');
            expect(res.success).toBe(true);
        });

        it('should throw on invalid csrf', async () => {
            await expect(client.removeFailedMessage('https://example.com', 'valid-token', 'async', 1, 'invalid-csrf'))
                .rejects.toThrow('Invalid CSRF token.');
        });

        it('should throw on 404', async () => {
            await expect(client.removeFailedMessage('https://example.com', 'valid-token', 'async', 999, 'valid-csrf'))
                .rejects.toThrow('nenajdene');
        });
    });

    describe('retryFailedMessage', () => {
        it('should retry message with valid token and csrf', async () => {
            const res = await client.retryFailedMessage('https://example.com', 'valid-token', 'async', 1, 'valid-csrf');
            expect(res.success).toBe(true);
            expect(res.message).toBe('Message retried successfully');
        });

        it('should throw on invalid csrf', async () => {
            await expect(client.retryFailedMessage('https://example.com', 'valid-token', 'async', 1, 'invalid-csrf'))
                .rejects.toThrow('Invalid CSRF token.');
        });

        it('should throw on 404', async () => {
            await expect(client.retryFailedMessage('https://example.com', 'valid-token', 'async', 999, 'valid-csrf'))
                .rejects.toThrow('Original transport not found.');
        });
    });
});
