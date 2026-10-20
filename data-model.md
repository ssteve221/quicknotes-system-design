# QuickNotes Data Model

## Entities

### users
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT | **Primary key** |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| display_name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now |

### notes
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT | **Primary key** |
| user_id | BIGINT | **Foreign key** → users(id), NOT NULL |
| title | VARCHAR(100) | NOT NULL |
| body | TEXT | NOT NULL, default empty |
| created_at | TIMESTAMPTZ | NOT NULL, default now |
| updated_at | TIMESTAMPTZ | NOT NULL, default now |

### tags
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT | **Primary key** |
| user_id | BIGINT | **Foreign key** → users(id), NOT NULL |
| name | VARCHAR(50) | NOT NULL, UNIQUE per user |

### note_tags (join table)
| Column | Type | Key / constraint |
|--------|------|------------------|
| note_id | BIGINT | **Primary key (part 1)**, **Foreign key** → notes(id) |
| tag_id | BIGINT | **Primary key (part 2)**, **Foreign key** → tags(id) |

## Relationships

- **One-to-many: users → notes.** One user owns many notes; each note belongs to exactly one user (`notes.user_id`).
- **One-to-many: users → tags.** One user owns many tags; each tag belongs to one user (`tags.user_id`).
- **Many-to-many: notes ↔ tags.** A note can have many tags and a tag can be on many notes. The join table `note_tags` stores one row per pairing, and its composite primary key stops the same tag being added twice to one note.

## CREATE TABLE statements (PostgreSQL)

```sql
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(100) NOT NULL,
  body       TEXT         NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  BIGINT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
```

## Example queries

**1. The 10 newest notes for a user (powers `GET /notes`):**

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 12
ORDER BY created_at DESC
LIMIT 10;
```

**2. Notes with a given tag (JOIN across three tables):**

```sql
SELECT n.id, n.title, t.name AS tag
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t       ON t.id = nt.tag_id
WHERE n.user_id = 12
  AND t.name = 'shopping'
ORDER BY n.created_at DESC;
```

**3. How many notes each tag has (powers `GET /tags`):**

```sql
SELECT t.id, t.name, COUNT(nt.note_id) AS note_count
FROM tags t
LEFT JOIN note_tags nt ON nt.tag_id = t.id
WHERE t.user_id = 12
GROUP BY t.id, t.name
ORDER BY note_count DESC;
```

**4. Create a note (powers `POST /notes`):**

```sql
INSERT INTO notes (user_id, title, body)
VALUES (12, 'Buy milk', '2 litres, semi-skimmed')
RETURNING id, created_at;
```

## Indexes

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);
CREATE INDEX idx_note_tags_tag ON note_tags (tag_id);
```

- `idx_notes_user_created`: almost every request lists one user's newest notes. This index lets the database jump straight to that user's rows already in order, instead of scanning all notes (hundreds of millions) and sorting them.
- `idx_note_tags_tag`: the composite primary key already covers lookups by note; this one makes "all notes with tag X" fast.

## SQL or NoSQL?

I chose **SQL (PostgreSQL)**. The data is clearly relational (users own notes, notes and tags are many-to-many), and we need foreign keys and transactions so that deleting a note also removes its tag links and never leaves orphans. Our queries are simple and predictable, and at about 330 GB of new data per year plus a read replica and cache, a single PostgreSQL primary handles the load. If one database ever becomes too small, we can shard by `user_id`, because every query is scoped to one user. A document database like MongoDB would suit notes alone, but handling tags and ownership rules would move integrity checks into application code.

