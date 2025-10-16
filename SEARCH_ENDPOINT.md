# Search Endpoint Documentation

## Overview
A new full-text search endpoint has been added to the ENEM API that allows you to search for keywords across all question contexts (enunciados) and alternatives (alternativas).

## Endpoint

```
GET /v1/search
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | The keyword to search for in questions |
| `year` | number | No | - | Filter results by a specific exam year (e.g., 2023) |
| `limit` | number | No | 10 | Maximum number of results to return (max: 50) |
| `offset` | number | No | 0 | Number of results to skip for pagination |

## Response Schema

```json
{
  "metadata": {
    "keyword": "democracia",
    "limit": 10,
    "offset": 0,
    "total": 42,
    "hasMore": true
  },
  "results": [
    {
      "title": "Questão 10 - ENEM 2023",
      "index": 10,
      "year": 2023,
      "language": null,
      "discipline": "linguagens",
      "context": "Se a interferência de contas falsas...",
      "files": [],
      "correctAlternative": "E",
      "alternativesIntroduction": "De acordo com o texto...",
      "alternatives": [
        {
          "letter": "A",
          "text": "Controle da atuação dos profissionais de TI.",
          "file": null,
          "isCorrect": false
        }
      ],
      "matchedIn": ["context", "alternative"],
      "matchedAlternatives": ["A", "C"]
    }
  ]
}
```

## Response Fields

### Metadata
- **keyword**: The search keyword that was used
- **limit**: Maximum number of results returned
- **offset**: Starting position of results
- **total**: Total number of matching questions found
- **hasMore**: Boolean indicating if more results are available

### Results
Each result includes all standard question fields plus:
- **matchedIn**: Array indicating where the keyword was found (`"context"` and/or `"alternative"`)
- **matchedAlternatives**: Array of alternative letters (A-E) that contain the keyword (only present if alternatives matched)

## Search Behavior

The search is **case-insensitive** and searches in the following fields:
1. **Question context** (`context` field) - The main text/enunciado of the question
2. **Alternatives introduction** (`alternativesIntroduction` field) - The introductory text for alternatives
3. **Alternative texts** (`alternatives[].text` field) - The text of each alternative

## Example Requests

### Basic search
```bash
curl "https://api.enem.dev/v1/search?q=democracia"
```

### Search with year filter
```bash
curl "https://api.enem.dev/v1/search?q=democracia&year=2023"
```

### Search with pagination
```bash
curl "https://api.enem.dev/v1/search?q=democracia&limit=20&offset=20"
```

### Search with all parameters
```bash
curl "https://api.enem.dev/v1/search?q=democracia&year=2023&limit=5&offset=0"
```

## Use Cases

1. **Study Tool**: Find all questions related to a specific topic or keyword
2. **Content Analysis**: Analyze how certain themes appear across different years
3. **Question Discovery**: Discover questions containing specific terms or concepts
4. **Educational Apps**: Build quiz applications that can search for relevant questions

## Performance Notes

- The search scans through all question files in the public directory
- Results are sorted by year (descending) and then by question index
- For better performance, consider using the `year` parameter to limit the search scope
- The endpoint respects the same rate limiting as other API endpoints

## Implementation Details

### Files Created/Modified

1. **`lib/api/search/search-questions.ts`** - Core search logic
   - Scans all question directories
   - Performs case-insensitive keyword matching
   - Handles pagination

2. **`lib/zod/schemas/questions.ts`** - Schema definitions
   - `SearchQuestionsQuerySchema` - Validates query parameters
   - `SearchResultSchema` - Defines search result structure
   - `SearchQuestionsResponseSchema` - Validates API response

3. **`app/v1/search/route.ts`** - API endpoint
   - Handles GET requests
   - Validates parameters
   - Returns formatted results

## Error Responses

### Missing keyword
```json
{
  "error": {
    "code": "bad_request",
    "message": "Search keyword (q) is required"
  }
}
```

### Limit too high
```json
{
  "error": {
    "code": "bad_request",
    "message": "Limit cannot be greater than 50"
  }
}
```

## Future Enhancements

Potential improvements for future versions:
- Add support for multiple keywords (AND/OR logic)
- Add filtering by discipline or language
- Implement fuzzy search for typo tolerance
- Add highlighting of matched text in results
- Cache search results for common queries
- Add full-text search using database (if questions are migrated to DB)
