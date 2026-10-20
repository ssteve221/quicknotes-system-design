// QuickNotes API client (talks to the JSONPlaceholder practice API).

const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE_LENGTH = 100;

const loadBtn = document.getElementById("load-btn");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const form = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const notesList = document.getElementById("notes-list");

// ---------- Helpers ----------

// kind is "loading", "success" or "error" (matches the CSS classes).
function showStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || "";
}

// Disable every button while a request is running.
function setBusy(isBusy) {
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  notesList.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.disabled = isBusy;
  });
}

// Reusable request helper: calls fetch, checks response.ok, throws on errors.
async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data };
}

// ---------- Rendering (user text is inserted with textContent only) ----------

function showEmptyStateIfNeeded() {
  if (notesList.children.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No notes yet. Add one above or load notes from the server.";
    notesList.appendChild(li);
  }
}

function clearEmptyState() {
  const empty = notesList.querySelector(".empty");
  if (empty) empty.remove();
}

function createNoteItem(note, isLocal) {
  const li = document.createElement("li");
  li.dataset.id = note.id;
  li.dataset.local = isLocal ? "true" : "false";

  const title = document.createElement("h3");
  title.className = "note-title";
  title.textContent = note.title;

  const body = document.createElement("p");
  body.className = "note-body";
  body.textContent = note.body || "";

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete-btn";
  del.textContent = "Delete";
  del.setAttribute("aria-label", `Delete note: ${note.title}`);
  del.addEventListener("click", () => deleteNote(note.id, li));

  li.append(title, body, del);
  return li;
}

function renderNotes(notes) {
  notesList.replaceChildren();
  if (notes.length === 0) {
    showEmptyStateIfNeeded();
    return;
  }
  notes.forEach((note) => notesList.appendChild(createNoteItem(note, false)));
}

// ---------- GET: load 10 notes ----------

async function loadNotes() {
  showStatus("Loading notes...", "loading");
  setBusy(true);
  try {
    const { data } = await request(`${API_URL}?_limit=10`);
    renderNotes(data);
    showStatus(`Loaded ${data.length} notes from the server.`, "success");
  } catch (error) {
    console.error(error);
    showStatus("Sorry, we couldn't load your notes. Check your connection and try again.", "error");
  } finally {
    setBusy(false);
  }
}

// ---------- POST: create a note ----------

function validateTitle(title) {
  if (title.length === 0) return "Please enter a title.";
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title is too long (${title.length}/${MAX_TITLE_LENGTH} characters).`;
  }
  return null;
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim(); // body is optional

  const problem = validateTitle(title);
  if (problem) {
    showStatus(problem, "error");
    titleInput.focus();
    return;
  }

  showStatus("Saving note...", "loading");
  setBusy(true);
  try {
    const { status, data } = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    clearEmptyState();
    // Show the title/body we sent plus the id the server returned.
    notesList.prepend(createNoteItem({ id: data.id, title, body }, true));
    form.reset();
    showStatus(`Note created (status ${status}, id ${data.id}).`, "success");
  } catch (error) {
    console.error(error);
    showStatus("Sorry, we couldn't save your note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

// ---------- DELETE: remove a note ----------

// JSONPlaceholder is a fake API: it ACCEPTS a POST but never stores the note,
// so DELETE /posts/101 (a note we just created) would fail with 404.
// Sensible handling: notes loaded from the server (ids 1-100) are really
// deleted with a DELETE request. Notes created in this session ("local" notes)
// only exist in the page, so we remove them from the list without a network
// call. A real QuickNotes backend would DELETE both kinds the same way.
async function deleteNote(id, li) {
  if (li.dataset.local === "true") {
    li.remove();
    showEmptyStateIfNeeded();
    showStatus(`Note ${id} removed (it was only created in this page).`, "success");
    return;
  }

  showStatus("Deleting note...", "loading");
  setBusy(true);
  try {
    const { status } = await request(`${API_URL}/${id}`, { method: "DELETE" });
    li.remove();
    showEmptyStateIfNeeded();
    showStatus(`Note ${id} deleted (status ${status}).`, "success");
  } catch (error) {
    console.error(error);
    showStatus("Sorry, we couldn't delete that note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

// ---------- Start ----------

loadBtn.addEventListener("click", loadNotes);
form.addEventListener("submit", createNote);
showEmptyStateIfNeeded();
