# QuickNotes System Design

QuickNotes is moving from a browser-only app to an online service for 1 million users. This project has two parts:

1. **An API client** (HTML, CSS, JavaScript) that proves the front end can load, create and delete notes through a REST API. It uses the JSONPlaceholder practice API.
2. **Design documents** for the real QuickNotes backend: API design, data model and system architecture.

## How to run the API client

No build step is needed.

1. Clone the repository: `git clone https://github.com/ssteve221/quicknotes-system-design.git`
2. Open `index.html` in your browser (or run `python3 -m http.server` in the folder and visit `http://localhost:8000`).
3. Click **Load notes** to fetch 10 notes, use the form to add a note, and click **Delete** on a note to remove it.

Note: JSONPlaceholder does not really save created notes, so notes you add are removed from the page without a server call (see the comment in `api.js`).

## Documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- How to use `fetch` with `async/await`, check `response.ok` and handle errors with `try / catch / finally`, and why a reusable `request()` function avoids repeated code.
- How a good UI shows loading, success, error and empty states, and disables buttons during requests to prevent duplicate submissions.
- How to design a RESTful API: nouns in paths, the right HTTP methods and status codes, and one consistent error format.
- How to model one-to-many and many-to-many relationships in SQL, and how an index such as `(user_id, created_at DESC)` speeds up the most common query.
- How to estimate load (reads and writes per second, storage per year) and use caching, a read replica, a queue and multiple servers to scale and avoid single points of failure.

