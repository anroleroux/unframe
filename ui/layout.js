const USER_STORAGE_KEY = "currentUserId";

function getCurrentUserId() {
  return localStorage.getItem(USER_STORAGE_KEY) || "";
}

function setCurrentUserId(userId) {
  if (!userId) {
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, userId);
}

// ── Local data persistence ────────────────────────────────────────────
// Built with `make uidev`, the //online-start … //online-end blocks that
// talk to a back-end are stripped out, and these helpers become the app's
// only data store. Each model persists under its own global name
// ('products', 'categories', …) so state survives a page reload. Start the
// app empty and add your own records — they are remembered in the browser.

function loadLocal(key) {
  try {
    return JSON.parse(localStorage.getItem("data-" + key)) || [];
  } catch {
    return [];
  }
}

function saveLocal(key, list) {
  localStorage.setItem("data-" + key, JSON.stringify(list));
}

function nextLocalId(list) {
  return list.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}

function showPage(name) {
    document.querySelectorAll('main > section').forEach(s => s.hidden = true);
    document.getElementById('page-' + name).hidden = false;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-btn--active'));
    document.getElementById('nav-' + name).classList.add('nav-btn--active');
}

/* {{reactivity-js}} */

/* {{products-js}} */

/* {{categories-js}} */

document.addEventListener("DOMContentLoaded", () => {
  setCurrentUserId(1);
  loadCategories();
  loadProducts();
});