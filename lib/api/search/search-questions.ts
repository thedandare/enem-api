import { readdirSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { QuestionDetailSchema } from '@/lib/zod/schemas/questions';
import z from '@/lib/zod';

type SearchResult = z.infer<typeof QuestionDetailSchema> & {
    matchedIn: Array<'context' | 'alternative'>;
    matchedAlternatives?: Array<string>;
};

export async function searchQuestions(
    keyword: string,
    options?: {
        year?: number;
        limit?: number;
        offset?: number;
    },
): Promise<{ results: SearchResult[]; total: number }> {
    const publicDir = path.join(process.cwd(), 'public');
    const results: SearchResult[] = [];
    const normalizedKeyword = keyword.toLowerCase();

    // Get all year directories
    const years = readdirSync(publicDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => /^\d{4}$/.test(name))
        .sort((a, b) => Number(b) - Number(a)); // Sort descending

    // Filter by year if specified
    const yearsToSearch = options?.year
        ? years.filter(y => Number(y) === options.year)
        : years;

    for (const year of yearsToSearch) {
        const questionsDir = path.join(publicDir, year, 'questions');

        if (!existsSync(questionsDir)) {
            continue;
        }

        // Get all question directories
        const questionDirs = readdirSync(questionsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const questionDir of questionDirs) {
            const detailsPath = path.join(
                questionsDir,
                questionDir,
                'details.json',
            );

            if (!existsSync(detailsPath)) {
                continue;
            }

            try {
                const questionRaw = await readFile(detailsPath, 'utf-8');
                const question = QuestionDetailSchema.parse(
                    JSON.parse(questionRaw),
                );

                const matchedIn: Array<'context' | 'alternative'> = [];
                const matchedAlternatives: string[] = [];

                // Search in context (enunciado)
                if (
                    question.context &&
                    question.context.toLowerCase().includes(normalizedKeyword)
                ) {
                    matchedIn.push('context');
                }

                // Search in alternativesIntroduction
                if (
                    question.alternativesIntroduction &&
                    question.alternativesIntroduction
                        .toLowerCase()
                        .includes(normalizedKeyword)
                ) {
                    if (!matchedIn.includes('context')) {
                        matchedIn.push('context');
                    }
                }

                // Search in alternatives
                for (const alternative of question.alternatives) {
                    if (
                        alternative.text &&
                        alternative.text
                            .toLowerCase()
                            .includes(normalizedKeyword)
                    ) {
                        if (!matchedIn.includes('alternative')) {
                            matchedIn.push('alternative');
                        }
                        matchedAlternatives.push(alternative.letter);
                    }
                }

                // If we found matches, add to results
                if (matchedIn.length > 0) {
                    results.push({
                        ...question,
                        matchedIn,
                        matchedAlternatives:
                            matchedAlternatives.length > 0
                                ? matchedAlternatives
                                : undefined,
                    });
                }
            } catch (error) {
                // Skip invalid question files
                continue;
            }
        }
    }

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 10;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
        results: paginatedResults,
        total: results.length,
    };
}
