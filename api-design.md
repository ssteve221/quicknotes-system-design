# QuickNotes API Design

This is the REST API the backend team should build (not JSONPlaceholder). All paths are under `/api/v1`, all bodies are JSON, and every request except login and sign-up needs the header `Authorization: Bearer <token>`.

## Endpoints

| # | Method | Path | Description | Success status |
|---|--------|------|-------------|----------------|
| 1 | POST | `/auth/login` | Log in with email and password, returns a token | 200 OK |
| 2 | GET | `/notes?limit=10&cursor=...&tag=...` | List the current user's notes, newest first (paginated) | 200 OK |
| 3 | POST | `/notes` | Create a note | 201 Created |
| 4 | GET | `/notes/{id}` | Get one note | 200 OK |
| 5 | PATCH | `/notes/{id}` | Update the title, body or both | 200 OK |
| 6 | DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| 7 | GET | `/tags` | List the current user's tags | 200 OK |
| 8 | POST | `/notes/{id}/tags` | Attach a tag to a note (creates the tag if new) | 201 Created |
| 9 | DELETE | `/notes/{id}/tags/{tagId}` | Remove a tag from a note | 204 No Content |

Design choices: nouns in paths (`/notes`, not `/getNotes`), HTTP methods carry the action, plural collection names, versioning in the URL, and cursor pagination (stable when new notes arrive, faster than large `OFFSET` values).

## Example: create a note

`POST /api/v1/notes`

Request:

```json
{
  "title": "Buy milk",
  "body": "2 litres, semi-skimmed",
  "tags": ["shopping"]
}
```

Response: `201 Created` with header `Location: /api/v1/notes/4021`

```json
{
  "id": 4021,
  "title": "Buy milk",
  "body": "2 litres, semi-skimmed",
  "tags": [{ "id": 7, "name": "shopping" }],
  "userId": 12,
  "createdAt": "2026-10-20T09:15:00Z",
  "updatedAt": "2026-10-20T09:15:00Z"
}
```

## Example: list notes

`GET /api/v1/notes?limit=2`

Response: `200 OK`

```json
{
  "data": [
    {
      "id": 4021,
      "title": "Buy milk",
      "body": "2 litres, semi-skimmed",
      "tags": [{ "id": 7, "name": "shopping" }],
      "createdAt": "2026-10-20T09:15:00Z"
    },
    {
      "id": 4019,
      "title": "Call dentist",
      "body": "",
      "tags": [],
      "createdAt": "2026-10-19T17:02:00Z"
    }
  ],
  "nextCursor": "eyJpZCI6NDAxOX0=",
  "limit": 2
}
```

`nextCursor` is `null` on the last page. Send it back as `?cursor=...` to get the next page.

## Error responses

| Status | Meaning | When it happens |
|--------|---------|-----------------|
| 400 Bad Request | Invalid input | Missing title, title over 100 characters, malformed JSON |
| 401 Unauthorized | Not logged in | Missing, expired or invalid token |
| 403 Forbidden | Logged in but not allowed | Trying to read or delete another user's note |
| 404 Not Found | Resource does not exist | Unknown note or tag id |
| 409 Conflict | State conflict | Tag already attached to the note |
| 429 Too Many Requests | Rate limit hit | More than the allowed requests per minute |
| 500 Internal Server Error | Server bug | Unexpected failure (details never exposed) |
| 503 Service Unavailable | Temporarily down | Database or queue unreachable, maintenance |

All errors use the same body so the client can handle them in one place:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be between 1 and 100 characters.",
    "details": [{ "field": "title", "issue": "too_long", "max": 100 }],
    "requestId": "req_8f3a2c"
  }
}
```
