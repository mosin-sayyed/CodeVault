/* UserDashboard.js - updated: adds horizontal filter bar (search, language, tag, sort)
   Keep your existing functions; this file is a full replacement that preserves
   previous behavior and adds the new My Snippets filtering workspace.
*/

/* ---------------------------
   AUTH / INIT
   --------------------------- */
const token = localStorage.getItem("access_token");
const username = localStorage.getItem("username");

if (!token) {
  alert("Not logged in. Redirecting to login.");
  window.location.href = "login.html";
}

if (username) {
  const welcomeEl = document.getElementById("welcomeName");
  const userNameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("userAvatar");
  if (welcomeEl) welcomeEl.textContent = username;
  if (userNameEl) userNameEl.textContent = username;
  if (avatarEl) avatarEl.textContent = username.slice(0,2).toUpperCase();
}

function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  opts.headers["Authorization"] = "Bearer " + token;
  return fetch(url, opts);
}

/* ---------------------------
   UPDATE ACTIVE NAV STATES
   --------------------------- */
function updateActiveNav(activeSection) {
    // Update main nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Update sidebar links
    document.querySelectorAll('.side-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to corresponding links based on section
    switch(activeSection) {
        case 'recentSection':
            document.querySelectorAll('a[href="#dashboard"]').forEach(link => {
                link.classList.add('active');
            });
            document.querySelectorAll('a[href="#dashboard"].side-link').forEach(link => {
                link.classList.add('active');
            });
            break;
        case 'mySnippetsSection':
            document.querySelectorAll('a[href="#snippets"]').forEach(link => {
                link.classList.add('active');
            });
            document.querySelectorAll('a[href="#snippets"].side-link').forEach(link => {
                link.classList.add('active');
            });
            break;
        case 'favoritesSection':
            document.querySelectorAll('a[href="#favorites"]').forEach(link => {
                link.classList.add('active');
            });
            document.querySelectorAll('a[href="#favorites"].side-link').forEach(link => {
                link.classList.add('active');
            });
            break;
        case 'tagsSection':
            document.querySelectorAll('a[href="#tags"]').forEach(link => {
                link.classList.add('active');
            });
            document.querySelectorAll('a[href="#tags"].side-link').forEach(link => {
                link.classList.add('active');
            });
            break;
    }
}

/* ---------------------------
   SECTION SHOW/HIDE
   --------------------------- */
function hideAllSections() {
  const sections = ["recentSection","mySnippetsSection","favoritesSection","tagsSection"];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}
function showSection(id) {
  hideAllSections();
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
  else console.warn("showSection: element not found for id:", id);
  
  // Update active navigation states
  updateActiveNav(id);
}

/* ---------------------------
   NAV LISTENERS
   --------------------------- */
document.querySelectorAll('a[href="#snippets"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showSection("mySnippetsSection");
    // load & show the my snippets workspace
    loadMySnippetsPage();
  });
});
document.querySelectorAll('a[href="#favorites"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showSection("favoritesSection");
    loadFavoritesPage();
  });
});
document.querySelectorAll('a[href="#dashboard"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showSection("recentSection");
    loadRecentSnippets();
  });
});

// Add tags navigation
document.querySelectorAll('a[href="#tags"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showSection("tagsSection");
    // Add your tags loading function here if needed
  });
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.href = "login.html";
});

/* ---------------------------
   COPY TO CLIPBOARD & TOAST
   --------------------------- */
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    Swal.fire({ icon: "success", title: "Copied!", toast: true, position: "top-end", timer: 1200, showConfirmButton: false });
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({ icon: "success", title: "Copied!", toast: true, position: "top-end", timer: 1200, showConfirmButton: false });
  }).catch(err => {
    console.error("copy failed", err);
  });
}

/* ---------------------------
   RENDER HELPERS (card design retained)
   --------------------------- */
function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderSnippetCard(snippet) {
  const card = document.createElement("div");
  card.className = "snippet-card";
  // Use the same structure as your existing cards; include data-code for safe copy
  const safeCodeAttr = escapeHtml(snippet.code || "");
  card.innerHTML = `
    <div class="snippet-header">
      <div>
        <h3 class="snippet-title">${escapeHtml(snippet.title)}</h3>
        <span class="snippet-language">${escapeHtml(snippet.language || "")}</span>
      </div>
    </div>
    <p class="snippet-description">${escapeHtml(snippet.description || "")}</p>
    <div class="snippet-tags">
      ${snippet.tags ? snippet.tags.split(",").map(t => `<span class="tag">#${escapeHtml(t.trim())}</span>`).join("") : ""}
    </div>
    <div class="snippet-actions">
      <button class="btn copy-btn" data-code="${safeCodeAttr}"><i class="fas fa-copy"></i> Copy</button>
      <button class="btn btn-secondary" onclick="viewSnippet(${snippet.id})"><i class="fas fa-eye"></i> View</button>
      <button class="btn btn-warning" onclick="openEditModal(${snippet.id})"><i class="fas fa-edit"></i> Edit</button>
      <button class="btn btn-danger" onclick="deleteSnippet(${snippet.id})"><i class="fas fa-trash"></i> Delete</button>
      <button class="fav-btn" onclick="toggleFavorite(${snippet.id}, this)">${snippet.is_favorite ? "★" : "☆"}</button>
    </div>
  `;
  return card;
}

/* global click listener for copy button (safe) */
document.addEventListener("click", function(e) {
  const copyBtn = e.target.closest(".copy-btn");
  if (copyBtn) {
    const code = copyBtn.getAttribute("data-code") || "";
    copyToClipboard(code);
  }
});

/* ---------------------------
   SNIPPETS CACHE FOR FILTERING
   --------------------------- */
let snippetsCache = []; // full list from backend (current user)
let lastFetchTimestamp = 0;

/* ---------------------------
   FILTER + SEARCH LOGIC
   --------------------------- */

function initFilters() {
  // populate language and tag selects from cache
  const langSelect = document.getElementById("languageFilter");
  const tagSelect = document.getElementById("tagFilter");
  if (!langSelect || !tagSelect) return;

  const langs = new Set();
  const tags = new Set();

  snippetsCache.forEach(s => {
    if (s.language) langs.add(s.language.trim());
    if (s.tags) {
      s.tags.split(",").map(t=>t.trim()).forEach(t => { if (t) tags.add(t); });
    }
  });

  // clear existing options (keep first "All" option)
  while (langSelect.options.length > 1) langSelect.remove(1);
  while (tagSelect.options.length > 1) tagSelect.remove(1);

  Array.from(langs).sort((a,b)=>a.localeCompare(b)).forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    langSelect.appendChild(opt);
  });
  Array.from(tags).sort((a,b)=>a.localeCompare(b)).forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagSelect.appendChild(opt);
  });
}

function applyFiltersAndRender({searchText="", lang="", tag="", sort="newest"} = {}) {
  // apply to snippetsCache
  let list = Array.isArray(snippetsCache) ? snippetsCache.slice() : [];

  // search: look in title, description, tags, language
  const q = (searchText || "").trim().toLowerCase();
  if (q) {
    list = list.filter(s => {
      const title = (s.title || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      const language = (s.language || "").toLowerCase();
      const tags = (s.tags || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || language.includes(q) || tags.includes(q);
    });
  }

  // language filter
  if (lang) {
    list = list.filter(s => (s.language || "").toLowerCase() === lang.toLowerCase());
  }

  // tag filter
  if (tag) {
    list = list.filter(s => {
      if (!s.tags) return false;
      return s.tags.split(",").map(t=>t.trim().toLowerCase()).includes(tag.toLowerCase());
    });
  }

  // sort
  switch (sort) {
    case "newest":
      list.sort((a,b)=> (new Date(b.created_at || b.createdAt || 0)) - (new Date(a.created_at || a.createdAt || 0)));
      break;
    case "oldest":
      list.sort((a,b)=> (new Date(a.created_at || a.createdAt || 0)) - (new Date(b.created_at || b.createdAt || 0)));
      break;
    case "lang-az":
      list.sort((a,b)=> (a.language||"").localeCompare(b.language||""));
      break;
    case "lang-za":
      list.sort((a,b)=> (b.language||"").localeCompare(a.language||""));
      break;
    case "fav-first":
      list.sort((a,b)=> (b.is_favorite === true) - (a.is_favorite === true));
      break;
    default:
      break;
  }

  // render into mySnippetsGrid
  const grid = document.getElementById("mySnippetsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = `<p class="empty-state">No snippets found.</p>`;
    updateStatsFromList(snippetsCache);
    return;
  }
  list.forEach(s => grid.appendChild(renderSnippetCard(s)));
  updateStatsFromList(snippetsCache);
}

/* ---------------------------
   DEBOUNCE HELPER
   --------------------------- */
function debounce(fn, wait=300) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(this,args), wait);
  };
}

/* ---------------------------
   LOAD FUNCTIONS (use cache then fetch)
   --------------------------- */
async function fetchAndCacheSnippets(force=false) {
  try {
    const now = Date.now();
    if (!force && snippetsCache.length > 0 && (now - lastFetchTimestamp) < 10_000) {
      return snippetsCache;
    }
    const res = await authFetch("http://127.0.0.1:8000/snippets/my");
    if (!res.ok) {
      console.warn("fetch snippets failed", res.status);
      return snippetsCache;
    }
    const data = await res.json();
    // assume API returns an array
    snippetsCache = Array.isArray(data) ? data : (data.snippets || []);
    lastFetchTimestamp = Date.now();
    return snippetsCache;
  } catch (err) {
    console.error(err);
    return snippetsCache;
  }
}

async function loadMySnippetsPage() {
  try {
    await fetchAndCacheSnippets(true);
    initFilters();
    // get current filter values
    const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
    const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
    const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
    const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
    applyFiltersAndRender({searchText, lang, tag, sort});
  } catch (err) {
    console.error(err);
  }
}

/* Keep your existing loadRecentSnippets / loadFavoritesPage implementations (they fetch fresh from backend) */
async function loadRecentSnippets() {
  try {
    const res = await authFetch("http://127.0.0.1:8000/snippets/my");
    if (!res.ok) {
      console.log("recent fetch failed", res.status);
      return;
    }
    const snippets = await res.json();
    const grid = document.getElementById("snippetsGrid");
    if (!grid) { console.warn("#snippetsGrid not found"); return; }
    grid.innerHTML = "";
    (Array.isArray(snippets) ? snippets : []).slice(0,3).forEach(s => grid.appendChild(renderSnippetCard(s)));
    updateStatsFromList(Array.isArray(snippets) ? snippets : []);
  } catch (err) {
    console.error(err);
  }
}
async function loadFavoritesPage() {
  try {
    const res = await authFetch("http://127.0.0.1:8000/snippets/my");
    if (!res.ok) {
      console.log("favorites fetch failed", res.status);
      return;
    }
    const snippets = await res.json();
    const favs = (Array.isArray(snippets) ? snippets : []).filter(s => s.is_favorite);
    const grid = document.getElementById("favoritesGrid");
    if (!grid) { console.warn("#favoritesGrid not found"); return; }
    grid.innerHTML = "";
    if (favs.length === 0) {
      grid.innerHTML = "<p>No favorites yet.</p>";
      updateStatsFromList(Array.isArray(snippets) ? snippets : []);
      return;
    }
    favs.forEach(s => grid.appendChild(renderSnippetCard(s)));
    updateStatsFromList(Array.isArray(snippets) ? snippets : []);
  } catch (err) {
    console.error(err);
  }
}

/* ---------------------------
   UPDATE STATS
   --------------------------- */
function updateStatsFromList(snippets) {
  const list = Array.isArray(snippets) ? snippets : [];
  const total = list.length;
  const favs = list.filter(s => s.is_favorite).length;
  const langs = new Set(list.map(s => s.language));
  const elTotal = document.getElementById("snippetCount");
  const elFav = document.getElementById("favoriteCount");
  const elLang = document.getElementById("languageCount");
  if (elTotal) elTotal.textContent = total;
  if (elFav) elFav.textContent = favs;
  if (elLang) elLang.textContent = langs.size;
}

/* ---------------------------
   VIEW / EDIT / DELETE / FAVORITE
   (keeps original behavior)
   --------------------------- */
async function viewSnippet(id) {
  try {
    const res = await authFetch(`http://127.0.0.1:8000/snippets/${id}`);
    if (!res.ok) { Swal.fire("Error", "Unable to load snippet", "error"); return; }
    const s = await res.json();
    document.getElementById("viewTitle").textContent = s.title || "";
    document.getElementById("viewLanguage").textContent = s.language || "";
    document.getElementById("viewDescription").textContent = s.description || "";
    document.getElementById("viewTags").innerHTML = s.tags ? s.tags.split(",").map(t=>`<span class="tag">#${t.trim()}</span>`).join("") : "";
    document.getElementById("viewCode").textContent = s.code || "";
    const modal = document.getElementById("viewSnippetModal");
    if (modal) modal.style.display = "flex";
    const delBtn = document.getElementById("deleteSnippetBtn");
    if (delBtn) {
      delBtn.onclick = async () => {
        modal.style.display = "none";
        await deleteSnippet(id);
      };
    }
    const editBtn = document.getElementById("editSnippetBtn");
    if (editBtn) {
      editBtn.onclick = () => {
        modal.style.display = "none";
        openEditModalWithData(s);
      };
    }
  } catch (err) {
    console.error(err);
  }
}
function closeViewModal() {
  const m = document.getElementById("viewSnippetModal");
  if (m) m.style.display = "none";
}
async function deleteSnippet(id) {
  const confirmed = await Swal.fire({
    icon: "warning", title: "Delete snippet?", showCancelButton: true, confirmButtonText: "Delete"
  });
  if (!confirmed.isConfirmed) return;
  try {
    const res = await authFetch(`http://127.0.0.1:8000/snippets/delete/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(()=>({detail:"Delete failed"}));
      Swal.fire("Error", err.detail || "Delete failed", "error");
      return;
    }
    Swal.fire("Deleted", "Snippet deleted", "success");
    await Promise.all([fetchAndCacheSnippets(true), loadRecentSnippets(), loadFavoritesPage()]);
    // reapply filters after deletion (keep current filter state)
    const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
    const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
    const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
    const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
    applyFiltersAndRender({searchText, lang, tag, sort});
  } catch (err) {
    console.error(err);
  }
}
async function toggleFavorite(id, btnEl) {
  try {
    const res = await authFetch(`http://127.0.0.1:8000/snippets/favorite/${id}`, { method: "POST" });
    const data = await res.json().catch(()=>({}));
    if (res.ok) {
      const isFav = !!data.is_favorite;
      if (btnEl) btnEl.textContent = isFav ? "★" : "☆";
      await Promise.all([fetchAndCacheSnippets(true), loadRecentSnippets(), loadFavoritesPage()]);
      // reapply current filters
      const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
      const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
      const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
      const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
      applyFiltersAndRender({searchText, lang, tag, sort});
    } else {
      Swal.fire("Error", data.detail || "Toggle failed", "error");
    }
  } catch (err) {
    console.error(err);
  }
}

/* ---------------------------
   EDIT MODAL
   --------------------------- */
function openEditModalWithData(snippet) {
  const modal = document.getElementById("editSnippetModal");
  if (!modal) return;
  document.getElementById("editSnippetId").value = snippet.id;
  document.getElementById("editTitle").value = snippet.title || "";
  document.getElementById("editLanguage").value = snippet.language || "";
  document.getElementById("editDescription").value = snippet.description || "";
  document.getElementById("editTags").value = snippet.tags || "";
  document.getElementById("editCode").value = snippet.code || "";
  modal.style.display = "flex";
}
function openEditModal(id) {
  authFetch(`http://127.0.0.1:8000/snippets/${id}`).then(r => r.json()).then(openEditModalWithData).catch(e=>console.error(e));
}
function closeEditModal() {
  const m = document.getElementById("editSnippetModal");
  if (m) m.style.display = "none";
}
async function saveEditedSnippet() {
  const id = document.getElementById("editSnippetId").value;
  const payload = {
    title: document.getElementById("editTitle").value,
    language: document.getElementById("editLanguage").value,
    description: document.getElementById("editDescription").value,
    tags: document.getElementById("editTags").value,
    code: document.getElementById("editCode").value
  };
  try {
    const res = await authFetch(`http://127.0.0.1:8000/snippets/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({detail:"Update failed"}));
      Swal.fire("Error", err.detail || "Update failed", "error");
      return;
    }
    Swal.fire("Saved", "Snippet updated", "success");
    closeEditModal();
    await Promise.all([fetchAndCacheSnippets(true), loadRecentSnippets(), loadFavoritesPage()]);
    // reapply filters
    const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
    const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
    const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
    const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
    applyFiltersAndRender({searchText, lang, tag, sort});
  } catch (err) {
    console.error(err);
  }
}

/* expose globals */
window.saveEditedSnippet = saveEditedSnippet;
window.openEditModal = openEditModal;
window.copyToClipboard = copyToClipboard;
window.viewSnippet = viewSnippet;
window.deleteSnippet = deleteSnippet;
window.toggleFavorite = toggleFavorite;
window.closeViewModal = closeViewModal;
window.openEditModalWithData = openEditModalWithData;
window.closeEditModal = closeEditModal;

/* ---------------------------
   ADD SNIPPET HANDLING
   --------------------------- */
const addSnippetBtn = document.getElementById("addSnippetBtn");
const addModal = document.getElementById("addSnippetModal");
const closeModalBtn = document.getElementById("closeModalBtn");
if (addSnippetBtn) addSnippetBtn.addEventListener("click", () => addModal.style.display = "flex");
if (closeModalBtn) closeModalBtn.addEventListener("click", () => addModal.style.display = "none");
window.addEventListener("click", e => { if (e.target === addModal) addModal.style.display = "none"; });

const saveSnippetBtn = document.getElementById("saveSnippetBtn");
if (saveSnippetBtn) saveSnippetBtn.addEventListener("click", async () => {
  const title = document.getElementById("snippetTitle").value.trim();
  const language = document.getElementById("snippetLanguage").value.trim();
  const description = document.getElementById("snippetDescription").value.trim();
  const tags = document.getElementById("snippetTags").value.trim();
  const code = document.getElementById("snippetCode").value.trim();
  if (!title || !language || !code) { Swal.fire("Missing", "Please fill required fields", "warning"); return; }
  try {
    const res = await authFetch("http://127.0.0.1:8000/snippets/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, language, description, tags, code })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({detail:"Create failed"}));
      Swal.fire("Error", err.detail || "Create failed", "error");
      return;
    }
    Swal.fire("Saved", "Snippet created", "success");
    addModal.style.display = "none";
    // clear
    document.getElementById("snippetTitle").value = "";
    document.getElementById("snippetLanguage").value = "";
    document.getElementById("snippetDescription").value = "";
    document.getElementById("snippetTags").value = "";
    document.getElementById("snippetCode").value = "";
    // refresh
    await Promise.all([fetchAndCacheSnippets(true), loadRecentSnippets(), loadFavoritesPage()]);
    // reapply filters after create
    const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
    const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
    const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
    const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
    applyFiltersAndRender({searchText, lang, tag, sort});
  } catch (err) { console.error(err); }
});

/* ---------------------------
   FILTER EVENT HOOKS (horizontal bar)
   --------------------------- */
(function attachFilterHandlers() {
  // Debounced search
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) {
    const doSearch = debounce(()=> {
      const searchText = searchInput.value;
      const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
      const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
      const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
      applyFiltersAndRender({searchText, lang, tag, sort});
    }, 250);
    searchInput.addEventListener("input", doSearch);
  }

  const langSel = document.getElementById("languageFilter");
  if (langSel) {
    langSel.addEventListener("change", () => {
      const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
      const lang = langSel.value;
      const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
      const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
      applyFiltersAndRender({searchText, lang, tag, sort});
    });
  }

  const tagSel = document.getElementById("tagFilter");
  if (tagSel) {
    tagSel.addEventListener("change", () => {
      const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
      const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
      const tag = tagSel.value;
      const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "newest";
      applyFiltersAndRender({searchText, lang, tag, sort});
    });
  }

  const sortSel = document.getElementById("sortSelect");
  if (sortSel) {
    sortSel.addEventListener("change", () => {
      const searchText = document.getElementById("globalSearchInput") ? document.getElementById("globalSearchInput").value : "";
      const lang = document.getElementById("languageFilter") ? document.getElementById("languageFilter").value : "";
      const tag = document.getElementById("tagFilter") ? document.getElementById("tagFilter").value : "";
      const sort = sortSel.value;
      applyFiltersAndRender({searchText, lang, tag, sort});
    });
  }

  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (document.getElementById("globalSearchInput")) document.getElementById("globalSearchInput").value = "";
      if (document.getElementById("languageFilter")) document.getElementById("languageFilter").value = "";
      if (document.getElementById("tagFilter")) document.getElementById("tagFilter").value = "";
      if (document.getElementById("sortSelect")) document.getElementById("sortSelect").value = "newest";
      applyFiltersAndRender({searchText:"", lang:"", tag:"", sort:"newest"});
    });
  }
})();

/* ---------------------------
   FILTER DROPDOWN ENHANCEMENTS
   --------------------------- */

function initFilterInteractivity() {
    const languageFilter = document.getElementById('languageFilter');
    const tagFilter = document.getElementById('tagFilter');
    const sortSelect = document.getElementById('sortSelect');
    const clearBtn = document.getElementById('clearFiltersBtn');

    // Add active class when filters have values
    function updateFilterStates() {
        if (languageFilter && languageFilter.value) {
            languageFilter.classList.add('active');
        } else {
            languageFilter.classList.remove('active');
        }

        if (tagFilter && tagFilter.value) {
            tagFilter.classList.add('active');
        } else {
            tagFilter.classList.remove('active');
        }

        // Sort is always active since it has a default value
        if (sortSelect) {
            sortSelect.classList.add('active');
        }
    }

    // Add event listeners to all filters
    [languageFilter, tagFilter, sortSelect].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                updateFilterStates();
                // Add pulse animation when filter changes
                this.classList.add('filter-applied');
                setTimeout(() => {
                    this.classList.remove('filter-applied');
                }, 1000);
            });
        }
    });

    // Clear filters button
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            // Remove active classes when clearing
            [languageFilter, tagFilter].forEach(filter => {
                if (filter) {
                    filter.classList.remove('active');
                    filter.classList.add('filter-applied');
                    setTimeout(() => {
                        filter.classList.remove('filter-applied');
                    }, 1000);
                }
            });
            
            // Reset states after a short delay
            setTimeout(updateFilterStates, 100);
        });
    }

    // Initial state update
    updateFilterStates();
}


/* ---------------------------
   THEME TOGGLE FUNCTIONALITY
   --------------------------- */

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('codevault-theme') || 'dark';
    
    // Apply saved theme
    html.setAttribute('data-theme', savedTheme);
    themeToggle.classList.toggle('dark', savedTheme === 'dark');
    
    // Toggle theme function
    function toggleTheme() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update theme
        html.setAttribute('data-theme', newTheme);
        themeToggle.classList.toggle('dark', newTheme === 'dark');
        
        // Save preference
        localStorage.setItem('codevault-theme', newTheme);
        
        // Show theme change notification
        showThemeNotification(newTheme);
    }
    
    // Add click event
    themeToggle.addEventListener('click', toggleTheme);
    
    // Add keyboard support
    themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

function showThemeNotification(theme) {
    // Optional: Show a subtle notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--dark);
        color: var(--light);
        padding: 0.75rem 1rem;
        border-radius: var(--border-radius);
        border: 1px solid var(--primary);
        box-shadow: var(--shadow);
        z-index: 10000;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    `;
    notification.textContent = `Theme changed to ${theme} mode`;
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Initialize theme toggle when page loads
document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
});

// Also add to your existing initialization
window.initThemeToggle = initThemeToggle;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initFilterInteractivity, 500);
});


/* ---------------------------
   TAGS SECTION FUNCTIONALITY
   --------------------------- */

let allTags = [];

async function loadTagsPage() {
    try {
        await fetchAndCacheSnippets(true);
        extractTagsFromSnippets();
        renderTagsGrid();
        updateTagsStats();
    } catch (error) {
        console.error('Error loading tags page:', error);
    }
}

function extractTagsFromSnippets() {
    const tagMap = new Map();

    snippetsCache.forEach(snippet => {
        if (snippet.tags) {
            const tags = snippet.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            tags.forEach(tag => {
                if (tagMap.has(tag)) {
                    tagMap.get(tag).count++;
                    tagMap.get(tag).snippets.push(snippet);
                } else {
                    tagMap.set(tag, {
                        name: tag,
                        count: 1,
                        snippets: [snippet]
                    });
                }
            });
        }
    });

    allTags = Array.from(tagMap.values());
    
    // Sort by count (most used first)
    allTags.sort((a, b) => b.count - a.count);
}

function renderTagsGrid(filterText = '') {
    const tagsContainer = document.getElementById('tagsContainer');
    if (!tagsContainer) return;

    let filteredTags = allTags;
    
    if (filterText) {
        filteredTags = allTags.filter(tag => 
            tag.name.toLowerCase().includes(filterText.toLowerCase())
        );
    }

    if (filteredTags.length === 0) {
        tagsContainer.innerHTML = `
            <div class="no-tags">
                <i class="fas fa-tags"></i>
                <h3>No tags found</h3>
                <p>${filterText ? 'No tags match your search' : 'Start by adding tags to your snippets!'}</p>
            </div>
        `;
        return;
    }

    tagsContainer.innerHTML = filteredTags.map(tag => `
        <div class="tag-card" onclick="filterByTag('${tag.name}')">
            <div class="tag-header">
                <h3 class="tag-name">#${tag.name}</h3>
                <span class="tag-count">${tag.count} snippet${tag.count !== 1 ? 's' : ''}</span>
            </div>
            <div class="tag-snippets">
                ${tag.snippets.slice(0, 3).map(snippet => `
                    <div class="snippet-preview">
                        <div class="snippet-preview-title">${escapeHtml(snippet.title)}</div>
                        <div class="snippet-preview-language">${escapeHtml(snippet.language)}</div>
                    </div>
                `).join('')}
                ${tag.count > 3 ? `<div style="text-align: center; color: var(--gray); font-size: 0.8rem; margin-top: 0.5rem;">+${tag.count - 3} more</div>` : ''}
            </div>
        </div>
    `).join('');
}

function updateTagsStats() {
    const totalTagsEl = document.getElementById('totalTags');
    const mostUsedTagEl = document.getElementById('mostUsedTag');
    
    if (totalTagsEl) totalTagsEl.textContent = allTags.length;
    if (mostUsedTagEl && allTags.length > 0) {
        mostUsedTagEl.textContent = allTags[0].name;
    }
}

function filterByTag(tagName) {
    // Switch to My Snippets section
    showSection('mySnippetsSection');
    
    // Set the tag filter
    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
        tagFilter.value = tagName;
    }
    
    // Apply the filter
    const searchText = document.getElementById('globalSearchInput') ? document.getElementById('globalSearchInput').value : '';
    const lang = document.getElementById('languageFilter') ? document.getElementById('languageFilter').value : '';
    const sort = document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : 'newest';
    
    applyFiltersAndRender({ searchText, lang, tag: tagName, sort });
    
    // Show success message
    Swal.fire({
        icon: 'success',
        title: `Filtering by: #${tagName}`,
        toast: true,
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false
    });
}

function initTagsSearch() {
    const tagsSearch = document.getElementById('tagsSearch');
    if (tagsSearch) {
        tagsSearch.addEventListener('input', debounce((e) => {
            renderTagsGrid(e.target.value);
        }, 300));
    }
}

// Add event listeners for tags buttons
function initTagsEventListeners() {
    const refreshBtn = document.getElementById('refreshTagsBtn');
    const createTagBtn = document.getElementById('createTagBtn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTagsPage);
    }
    
    if (createTagBtn) {
        createTagBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Create New Tag',
                input: 'text',
                inputPlaceholder: 'Enter tag name',
                showCancelButton: true,
                confirmButtonText: 'Create',
                preConfirm: (tagName) => {
                    if (!tagName.trim()) {
                        Swal.showValidationMessage('Please enter a tag name');
                    }
                    return tagName.trim();
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Tag Created',
                        text: `Tag "${result.value}" will be available when you add it to a snippet.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });
        });
    }
}

// Add tags navigation
document.querySelectorAll('a[href="#tags"]').forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        showSection("tagsSection");
        loadTagsPage();
    });
});
/* ---------------------------
   SETTINGS SECTION FUNCTIONALITY
   --------------------------- */

function loadSettingsPage() {
    // Load user data
    const username = localStorage.getItem('username') || 'User';
    document.getElementById('displayName').value = username;
    
    // Initialize event listeners
    initSettingsEventListeners();
}

function initSettingsEventListeners() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    // Save settings
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Export data
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportUserData);
    }
    
    // Delete account
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }
}

function saveSettings() {
    // Save display name
    const displayName = document.getElementById('displayName').value;
    if (displayName) {
        localStorage.setItem('username', displayName);
        // Update UI
        document.getElementById('userName').textContent = displayName;
        document.getElementById('welcomeName').textContent = displayName;
        document.getElementById('userAvatar').textContent = displayName.slice(0,2).toUpperCase();
    }
    
    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Settings Saved!',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
    });
}

function exportUserData() {
    const exportData = {
        user: {
            name: document.getElementById('displayName').value,
            exportDate: new Date().toISOString()
        },
        snippets: snippetsCache,
        exportDate: new Date().toISOString()
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codevault-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    Swal.fire('Success!', 'Your data has been exported successfully', 'success');
}

function deleteAccount() {
    Swal.fire({
        title: 'Delete Your Account?',
        html: `
            <div style="text-align: left; margin: 1rem 0;">
                <p style="color: var(--error); margin-bottom: 1rem;">This action is permanent and cannot be undone!</p>
                <p><strong>All of the following will be deleted:</strong></p>
                <ul style="text-align: left; margin: 1rem 0; padding-left: 1.5rem;">
                    <li>All your code snippets</li>
                    <li>Your profile information</li>
                    <li>Your favorites and tags</li>
                    <li>All account data</li>
                </ul>
                <p>Type <strong>DELETE</strong> below to confirm:</p>
                <input type="text" id="deleteConfirm" class="swal2-input" placeholder="Type DELETE here">
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete my account',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const confirmText = document.getElementById('deleteConfirm').value;
            if (confirmText !== 'DELETE') {
                Swal.showValidationMessage('Please type DELETE to confirm');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate account deletion
            Swal.fire({
                title: 'Account Deleted',
                text: 'Your account and all data have been permanently deleted.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Logout and redirect
                localStorage.removeItem("access_token");
                localStorage.removeItem("username");
                localStorage.removeItem("role");
                window.location.href = "login.html";
            });
        }
    });
}

// Add settings navigation from sidebar
document.querySelectorAll('a[href="#settings"]').forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        showSection("settingsSection");
        loadSettingsPage();
    });
});
// Initialize tags functionality
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initTagsSearch();
        initTagsEventListeners();
    }, 1000);
});


/* ---------------------------
   HELP & SUPPORT FUNCTIONALITY
   --------------------------- */

function loadHelpPage() {
    // Initialize FAQ functionality
    initFAQ();
}

function initFAQ() {
    // FAQ items are already set up with onclick in HTML
}

function toggleFAQ(element) {
    const faqItem = element.parentElement;
    faqItem.classList.toggle('active');
}

function showHelpContent(section) {
    const helpContent = {
        'getting-started': `
            <h3>Getting Started with CodeVault</h3>
            <p>Welcome to CodeVault! Here's how to get started:</p>
            <ol>
                <li><strong>Create your first snippet</strong> - Click "Add New Snippet" on the dashboard</li>
                <li><strong>Organize with tags</strong> - Add relevant tags to make snippets easy to find</li>
                <li><strong>Use favorites</strong> - Star your most-used snippets for quick access</li>
                <li><strong>Search efficiently</strong> - Use the search bar and filters to find snippets fast</li>
            </ol>
        `,
        'snippets': `
            <h3>Managing Snippets</h3>
            <p>Efficiently manage your code snippets:</p>
            <ul>
                <li><strong>Create:</strong> Add new snippets with title, language, description, tags, and code</li>
                <li><strong>Edit:</strong> Modify existing snippets anytime</li>
                <li><strong>Delete:</strong> Remove snippets you no longer need</li>
                <li><strong>Copy:</strong> One-click copy code to clipboard</li>
                <li><strong>View:</strong> Full-screen view for better code reading</li>
            </ul>
        `,
        'filters': `
            <h3>Search & Filters</h3>
            <p>Find your snippets quickly:</p>
            <ul>
                <li><strong>Global Search:</strong> Search across titles, descriptions, tags, and languages</li>
                <li><strong>Language Filter:</strong> Filter by programming language</li>
                <li><strong>Tag Filter:</strong> Filter by specific tags</li>
                <li><strong>Sort Options:</strong> Sort by date, language, or favorites</li>
                <li><strong>Clear Filters:</strong> Reset all filters with one click</li>
            </ul>
        `,
        'keyboard': `
            <h3>Keyboard Shortcuts</h3>
            <p>Work faster with these shortcuts:</p>
            <ul>
                <li><strong>Ctrl/Cmd + N:</strong> Create new snippet (when focused)</li>
                <li><strong>Ctrl/Cmd + F:</strong> Focus search bar</li>
                <li><strong>Esc:</strong> Close modals</li>
                <li><strong>Enter:</strong> Select from search suggestions</li>
                <li><strong>Arrow Keys:</strong> Navigate search suggestions</li>
            </ul>
        `
    };

    Swal.fire({
        title: 'Help Guide',
        html: helpContent[section] || '<p>Content not available.</p>',
        confirmButtonText: 'Got it!',
        width: '600px'
    });
}

// Add help navigation from sidebar
document.querySelectorAll('a[href="#help"]').forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        showSection("helpSection");
        loadHelpPage();
    });
});

/* ---------------------------
   INITIAL LOAD
   --------------------------- */
showSection("recentSection");
loadRecentSnippets();
fetchAndCacheSnippets(true).then(()=> {
  // initialize filters if the elements exist
  try { initFilters(); } catch(e) {}
  // initial render for my snippets if user had opened it already
  const isMyVisible = document.getElementById("mySnippetsSection") && document.getElementById("mySnippetsSection").style.display !== "none";
  if (isMyVisible) loadMySnippetsPage();
  
  // Set initial active state
  updateActiveNav("recentSection");
});