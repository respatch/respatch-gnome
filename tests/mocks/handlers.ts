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

export const failedMessagesFixture = [
    {
        id: 3,
        title: "TestMessageOne",
        dispatched: "2026-05-08T13:05:40+00:00",
        exception: {
            class: "Exception",
            description: "Random failure (5% chance) for TestMessageOne.",
            name: "Exception"
        }
    },
    {
        id: 6,
        title: "TestMessageOne",
        dispatched: "2026-05-08T13:09:20+00:00",
        exception: null
    }
];

export const handlers = [
    http.get('*/recent-messages', ({ request }) => {
        const token = request.headers.get('X-Respatch-Token');
        if (token === 'valid-token') {
            return HttpResponse.json(recentMessagesFixture);
        }
        return new HttpResponse(null, { status: 401 });
    }),

    http.get('*/transport/async', ({ request }) => {
        const token = request.headers.get('X-Respatch-Token');
        const url = new URL(request.url);
        if (token === 'valid-token' && url.searchParams.get('limit') === '5') {
            return HttpResponse.json(failedMessagesFixture);
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
