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

    http.get('*/transport/:name', ({ request, params }) => {
        const token = request.headers.get('X-Respatch-Token');
        if (token !== 'valid-token') {
            return new HttpResponse(null, { status: 401 });
        }
        const name = params.name as string;
        return HttpResponse.json(failedMessagesFixture.map(m => ({ ...m, transport: name })));
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

    http.post('*/transport/:name/:id/remove', async ({ request, params }) => {
        const token = request.headers.get('X-Respatch-Token');
        const url = new URL(request.url);
        const csrfToken = url.searchParams.get('_token');

        if (token !== 'valid-token') {
            return new HttpResponse(null, { status: 401 });
        }

        if (csrfToken !== 'valid-csrf') {
            return HttpResponse.json({ message: 'Invalid CSRF token.' }, { status: 419 });
        }

        if (params.id === '999') {
            return HttpResponse.json({ message: 'nenajdene' }, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/transport/:name/:id/retry', async ({ request, params }) => {
        const token = request.headers.get('X-Respatch-Token');
        const url = new URL(request.url);
        const csrfToken = url.searchParams.get('_token');

        if (token !== 'valid-token') {
            return new HttpResponse(null, { status: 401 });
        }

        if (csrfToken !== 'valid-csrf') {
            return HttpResponse.json({ message: 'Invalid CSRF token.' }, { status: 419 });
        }

        if (params.id === '999') {
            return HttpResponse.json({ message: 'Original transport not found.' }, { status: 404 });
        }

        return HttpResponse.json({
            success: true,
            message: 'Message retried successfully',
        });
    }),
];
