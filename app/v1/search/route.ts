import { NextRequest, NextResponse } from 'next/server';
import { getSearchParamsAsObject } from '@/lib/utils';
import {
    SearchQuestionsQuerySchema,
    SearchQuestionsResponseSchema,
} from '@/lib/zod/schemas/questions';
import { EnemApiError, handleAndReturnErrorResponse } from '@/lib/api/errors';
import { searchQuestions } from '@/lib/api/search/search-questions';
import { RateLimiter } from '@/lib/api/rate-limit';
import { logger } from '@/lib/api/logger';

export const dynamic = 'force-dynamic';

const rateLimiter = new RateLimiter();

export async function GET(request: NextRequest) {
    try {
        const { rateLimitHeaders } = rateLimiter.check(request);

        await logger(request);

        const searchParams = request.nextUrl.searchParams;

        const { q, year, limit, offset } = SearchQuestionsQuerySchema.parse(
            getSearchParamsAsObject(searchParams),
        );

        if (!q || q.trim().length === 0) {
            throw new EnemApiError({
                code: 'bad_request',
                message: 'Search keyword (q) is required',
            });
        }

        if (Number(limit) > 50) {
            throw new EnemApiError({
                code: 'bad_request',
                message: 'Limit cannot be greater than 50',
            });
        }

        const { results, total } = await searchQuestions(q, {
            year,
            limit: Number(limit),
            offset: Number(offset),
        });

        return NextResponse.json(
            SearchQuestionsResponseSchema.parse({
                metadata: {
                    keyword: q,
                    limit: Number(limit),
                    offset: Number(offset),
                    total,
                    hasMore: Number(offset) + Number(limit) < total,
                },
                results,
            }),
            { headers: rateLimitHeaders },
        );
    } catch (error) {
        return handleAndReturnErrorResponse(error);
    }
}
