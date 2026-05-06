import { http, HttpResponse } from 'msw';

export const handlers = [
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
