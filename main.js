const BASE_URL = 'https://your-project-id.firebaseio.com'; // Replace with your Firebase Realtime Database URL
const PER_PAGE = 5;
let currentPage = loadState('page') || 1;
let filters = loadState('filters') || {};
let sortKey = loadState('sortKey') || '';

document.getElementById("book-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    title: form.title.value,
    author: form.author.value,
    genre: form.genre.value,
    publishedYear: +form.publishedYear.value,
    available: form.available.checked,
  };
  const id = form.id.value;
  if (id) {
    await sendData(`books/${id}`, 'PUT', data);
  } else {
    await sendData('books', 'POST', data);
  }
  form.reset();
  loadBooks();
});

document.getElementById("genre-filter").addEventListener("change", (e) => {
  filters.genre = e.target.value;
  saveState('filters', filters);
  loadBooks();
});

document.getElementById("sort-by").addEventListener("change", (e) => {
  sortKey = e.target.value;
  saveState('sortKey', sortKey);
  loadBooks();
});

document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    saveState('page', currentPage);
    loadBooks();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  currentPage++;
  saveState('page', currentPage);
  loadBooks();
});

async function loadBooks() {
  let books = await fetchData("books");
  books = Object.entries(books || {}).map(([id, book]) => ({ id, ...book }));

  // Filter
  if (filters.genre) {
    books = books.filter(b => b.genre === filters.genre);
  }

  // Sort
  if (sortKey) {
    books.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
  }

  // Pagination
  const totalPages = Math.ceil(books.length / PER_PAGE);
  currentPage = Math.min(currentPage, totalPages || 1);
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = books.slice(start, start + PER_PAGE);

  // Render
  const list = document.getElementById("book-list");
  list.innerHTML = "";
  pageItems.forEach(book => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${book.title}</strong> by ${book.author} (${book.publishedYear}) - ${book.genre}
      <br/>Available: ${book.available ? "Yes" : "No"}
      <button onclick="editBook('${book.id}')">Edit</button>
      <button onclick="deleteBook('${book.id}')">Delete</button>
    `;
    list.appendChild(div);
  });

  document.getElementById("page-info").textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

async function editBook(id) {
  const book = await fetchData(`books/${id}`);
  const form = document.getElementById("book-form");
  form.id.value = id;
  form.title.value = book.title;
  form.author.value = book.author;
  form.genre.value = book.genre;
  form.publishedYear.value = book.publishedYear;
  form.available.checked = book.available;
}

async function deleteBook(id) {
  await sendData(`books/${id}`, 'DELETE');
  loadBooks();
}

// Firebase HTTP Wrappers
async function fetchData(path) {
  const res = await fetch(`${BASE_URL}/${path}.json`);
  return res.json();
}

async function sendData(path, method, data) {
  const res = await fetch(`${BASE_URL}/${path}.json`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// State Persistence
function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadState(key) {
  return JSON.parse(localStorage.getItem(key));
}

loadBooks();
