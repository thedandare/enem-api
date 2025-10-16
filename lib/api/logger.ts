import { NextRequest } from 'next/server';
import { ipAddress, geolocation } from '@vercel/functions';

export async function logger(request: NextRequest) {
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    try {
        const vercelGeo = geolocation(request);

        const { method, url, headers, geo } = request;

        const ip =
            ipAddress(request) ||
            headers.get('x-forwarded-for') ||
            request.headers.get('cf-connecting-ip') ||
            request.ip;
        const userAgent = headers.get('user-agent');
        const referer = headers.get('referer');

        const country = vercelGeo?.country || geo?.country;
        const region = vercelGeo?.region || geo?.region;
        const city = vercelGeo?.city || geo?.city;

        const timestamp = new Date().toISOString();

        // Console-based logging for production monitoring
        console.log(
            JSON.stringify({
                timestamp,
                method,
                url,
                ip: ip || null,
                userAgent,
                referer,
                country: country ? decodeURIComponent(country) : null,
                region: region ? decodeURIComponent(region) : null,
                city: city ? decodeURIComponent(city) : null,
            }),
        );
    } catch (error) {
        console.error('Failed to log request', error);
    }
}
