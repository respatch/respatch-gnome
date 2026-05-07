import { http, HttpResponse } from 'msw';

export const recentMessagesFixture = [
    {
        id: 429,
        status: 'Handling "App\\Message\\TestMessageOne" failed: Random failure (5% chance) for TestMessageOne.',
        transport: 'scheduler_test',
        duration: 30214,
        memory: '10.49 MB',
        handledAt: '2026-05-07T15:01:46+00:00',
    },
    {
        id: 428,
        status: null,
        transport: 'scheduler_test',
        duration: 30192,
        memory: '10.49 MB',
        handledAt: '2026-05-07T15:00:46+00:00',
    },
];

export const handlers = [
    http.get('*/recent-messages', ({ request }) => {
        const token = request.headers.get('X-Respatch-Token');
        if (token === 'valid-token') {
            return HttpResponse.json(recentMessagesFixture);
        }
        return new HttpResponse(null, { status: 401 });
    }),

    http.get('*/status', ({ request }) => {
        const token = request.headers.get('X-Respatch-Token');
        
        if (token === 'valid-token') {
            return HttpResponse.json({ status: 'ok' });
        }
        
        if (token === 'invalid-token') {
            return new HttpResponse(null, { status: 401 });
        }

        if (token === 'error-token') {
            return new HttpResponse(null, { status: 500 });
        }

        return new HttpResponse(null, { status: 404 });
    }),
];
