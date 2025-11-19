// ---------------------------
// DASHBOARD AUTH CONTROLLER
// ---------------------------

// 1. CHECK LOGIN STATUS
const token = localStorage.getItem("access_token");
const username = localStorage.getItem("username"); // FIXED

// If no token → redirect to login
if (!token) {
    Swal.fire({
        icon: "warning",
        title: "Unauthorized 🚫",
        text: "Please login to access your dashboard.",
        confirmButtonColor: "#2563eb"
    }).then(() => {
        window.location.href = "login.html";
    });
}

// 2. UPDATE USER INFO IN HEADER
if (username) {
    // Welcome banner
    document.getElementById("welcomeName").textContent = username;

    // Top user menu
    document.getElementById("userName").textContent = username;

    // Avatar initials
    const initials = username.slice(0, 2).toUpperCase();
    document.getElementById("userAvatar").textContent = initials;
}

// 3. LOGOUT BUTTON
document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();

    Swal.fire({
        icon: "question",
        title: "Logout?",
        text: "Are you sure you want to logout?",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#7c3aed",
        confirmButtonText: "Yes, Logout"
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            Swal.fire({
                icon: "success",
                title: "Logged out successfully ✨",
                showConfirmButton: false,
                timer: 1500
            });

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        }
    });
});

// 4. TEMP STATIC STATS
document.getElementById("snippetCount").textContent = "0";
document.getElementById("favoriteCount").textContent = "0";
document.getElementById("languageCount").textContent = "0";



// ===============================
// ADD SNIPPET MODAL OPEN/CLOSE
// ===============================

// Get elements
const addSnippetBtn = document.getElementById("addSnippetBtn");
const addSnippetModal = document.getElementById("addSnippetModal");
const closeModalBtn = document.getElementById("closeModalBtn");

// Open modal
addSnippetBtn.addEventListener("click", () => {
    addSnippetModal.style.display = "flex";
});

// Close modal
closeModalBtn.addEventListener("click", () => {
    addSnippetModal.style.display = "none";
});

// Close modal when clicking outside the modal content
window.addEventListener("click", (e) => {
    if (e.target === addSnippetModal) {
        addSnippetModal.style.display = "none";
    }
});



// ============================================================
//                SAVE SNIPPET → BACKEND
// ============================================================

const saveSnippetBtn = document.getElementById("saveSnippetBtn");

async function loadUserSnippets() {
    try {
        const res = await fetch("http://127.0.0.1:8000/snippets/my", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const snippets = await res.json();
        const grid = document.getElementById("snippetsGrid");
        grid.innerHTML = "";

        snippets.forEach(s => {
            const card = document.createElement("div");
            card.classList.add("snippet-card");
card.innerHTML = `
    <div class="snippet-header">
        <div>
            <h3 class="snippet-title">${s.title}</h3>
            <span class="snippet-language">${s.language}</span>
        </div>
    </div>

    <p class="snippet-description">${s.description}</p>

    <div class="snippet-tags">
        ${s.tags ? s.tags.split(",").map(t => `<span class="tag">#${t.trim()}</span>`).join("") : ""}
    </div>

    <div class="snippet-actions">

    <button class="btn" onclick="copyToClipboard(\`${s.code.replace(/`/g, "\\`")}\`)">
        <i class="fas fa-copy"></i> Copy
    </button>

    <button class="btn btn-secondary" onclick="viewSnippet(${s.id})">
        <i class="fas fa-eye"></i> View
    </button>

    <button class="btn btn-warning" onclick="openEditModal(${s.id})">
        <i class="fas fa-edit"></i> Edit
    </button>

    <button class="btn btn-danger" onclick="deleteSnippet(${s.id})">
        <i class="fas fa-trash"></i> Delete
    </button>

    <button class="fav-btn" onclick="toggleFavorite(${s.id}, this)">
        ${s.is_favorite ? "★" : "☆"}
    </button>
</div>

`;

            grid.appendChild(card);
            // Add copy button listener
const copyBtn = card.querySelector(".copy-btn");
copyBtn.addEventListener("click", () => {
    copyToClipboard(s.code);
});

        });

    } catch (err) {
        console.log(err);
    }
}

saveSnippetBtn.addEventListener("click", async () => {
    const title = document.getElementById("snippetTitle").value.trim();
    const language = document.getElementById("snippetLanguage").value.trim();
    const description = document.getElementById("snippetDescription").value.trim();
    const tags = document.getElementById("snippetTags").value.trim();
    const code = document.getElementById("snippetCode").value.trim();

    if (!title || !language || !description || !code) {
        Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
        return;
    }

    const data = { title, language, description, tags, code };

    try {
        const res = await fetch("http://127.0.0.1:8000/snippets/add", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            Swal.fire("Success!", "Snippet added successfully!", "success");

            addSnippetModal.style.display = "none"; // close modal
            loadUserSnippets();
            updateStats();
        } else {
            Swal.fire("Error", "Unable to save snippet.", "error");
        }

    } catch (err) {
        console.log(err);
    }
});


// ============================================================
//                    FAVORITE TOGGLE
// ============================================================
async function toggleFavorite(id, btn) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/snippets/favorite/${id}`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();
        btn.textContent = data.is_favorite ? "★" : "☆";

        updateStats();

    } catch (err) {
        console.log(err);
    }
}

// ============================================================
//                       DELETE SNIPPET
// ============================================================
async function deleteSnippet(id) {

    const confirmDelete = await Swal.fire({
        title: "Delete this snippet?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e11d48",
        cancelButtonColor: "#475569",
        confirmButtonText: "Yes, Delete"
    });

    if (!confirmDelete.isConfirmed) return;

    try {
        const res = await fetch(`http://127.0.0.1:8000/snippets/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "Your snippet has been removed.",
                timer: 1500,
                showConfirmButton: false
            });

            loadUserSnippets();
            updateStats();
        } else {
            Swal.fire("Error", data.detail || "Failed to delete snippet", "error");
        }

    } catch (err) {
        console.log(err);
        Swal.fire("Error", "Something went wrong.", "error");
    }
}


// ============================================================
//                    UPDATE STATS
// ============================================================
async function updateStats() {
    try {
        const res = await fetch("http://127.0.0.1:8000/snippets/my", {
            headers: { "Authorization": "Bearer " + token }
        });

        const snippets = await res.json();

        const total = snippets.length;
        const favs = snippets.filter(s => s.is_favorite).length;

        const languages = new Set(snippets.map(s => s.language));

        document.getElementById("snippetCount").textContent = total;
        document.getElementById("favoriteCount").textContent = favs;
        document.getElementById("languageCount").textContent = languages.size;

    } catch (err) {
        console.log(err);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
            toast: true,
            icon: "success",
            title: "Copied!",
            position: "top-end",
            showConfirmButton: false,
            timer: 1000
        });
    });
}

async function loadFavoriteSnippets() {
    try {
        const res = await fetch("http://127.0.0.1:8000/snippets/my", {
            headers: { "Authorization": "Bearer " + token }
        });

        const snippets = await res.json();
        const favs = snippets.filter(s => s.is_favorite);

        const grid = document.getElementById("favoritesGrid");
        grid.innerHTML = "";

        if (favs.length === 0) {
            grid.innerHTML = `<p style="color: #ccc;">No favorite snippets yet.</p>`;
            return;
        }

        favs.forEach(s => {
            const card = document.createElement("div");
            card.classList.add("snippet-card");

            card.innerHTML = `
                <div class="snippet-header">
                    <div>
                        <h3 class="snippet-title">${s.title}</h3>
                        <span class="snippet-language">${s.language}</span>
                    </div>
                </div>

                <p class="snippet-description">${s.description}</p>

                <div class="snippet-tags">
                    ${s.tags ? s.tags.split(",").map(t => `<span class="tag">#${t.trim()}</span>`).join("") : ""}
                </div>

                <div class="snippet-actions">
                    <button class="btn" onclick="copyToClipboard(\`${s.code.replace(/`/g, "\\`")}\`)">
                        <i class="fas fa-copy"></i> Copy
                    </button>

                    <button class="btn btn-secondary" onclick="viewSnippet(${s.id})">
                        <i class="fas fa-eye"></i> View
                    </button>

                    <button class="fav-btn" onclick="toggleFavorite(${s.id}, this)">
                        ★
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.log(err);
    }
}

// -----------------------------
// Robust handler for "Favorites" menu (navbar + sidebar)
// -----------------------------
(function setupFavoritesMenuHandlers(){
  // make sure elements exist
  const recentSection = document.getElementById("recentSection");
  const favoritesSection = document.getElementById("favoritesSection");

  if (!recentSection || !favoritesSection) {
    console.warn("Missing #recentSection or #favoritesSection in HTML");
    return;
  }

  // helper that shows favorites and hides recent
  function showFavorites() {
    recentSection.style.display = "none";
    favoritesSection.style.display = "block";
    loadFavoriteSnippets();
    // toggle active classes if you want (optional)
    document.querySelectorAll('.sidebar-menu a, .nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('a[href="#favorites"]').forEach(a => a.classList.add('active'));
  }

  function showRecent() {
    favoritesSection.style.display = "none";
    recentSection.style.display = "block";
    loadUserSnippets(); // ensure recent list refreshed
    updateStats();
    document.querySelectorAll('.sidebar-menu a, .nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('a[href="#dashboard"]').forEach(a => a.classList.add('active'));
  }

  // event delegation: catch clicks on any anchor that points to "#favorites" or "#dashboard"
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;

    const href = a.getAttribute("href");
    if (href === "#favorites") {
      ev.preventDefault();
      showFavorites();
    } else if (href === "#dashboard" || href === "#") {
      // treat dashboard links
      ev.preventDefault();
      showRecent();
    }
  });

  // also support direct programmatic calls (if you want a single link to open favorites)
  window.openFavorites = showFavorites;
  window.openRecent = showRecent;
})();



async function viewSnippet(id) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/snippets/${id}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const s = await res.json();

        // Fill modal data
        document.getElementById("viewTitle").textContent = s.title;
        document.getElementById("viewLanguage").textContent = s.language;
        document.getElementById("viewDescription").textContent = s.description;
        document.getElementById("viewCode").textContent = s.code;

        document.getElementById("viewTags").innerHTML =
            s.tags
                ? s.tags.split(",").map(t => `<span class="tag">#${t.trim()}</span>`).join("")
                : "";

        // Set actions
        document.getElementById("editSnippetBtn").setAttribute("onclick", `editSnippet(${id})`);
        document.getElementById("deleteSnippetBtn").setAttribute("onclick", `deleteSnippet(${id})`);

        // Open modal
        document.getElementById("viewSnippetModal").style.display = "flex";

    } catch (err) {
        console.log(err);
        Swal.fire("Error", "Could not load snippet", "error");
    }
}
async function editSnippet(id) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/snippets/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });

        const s = await res.json();

        // Fill edit form
        document.getElementById("editSnippetId").value = id;
        document.getElementById("editTitle").value = s.title;
        document.getElementById("editLanguage").value = s.language;
        document.getElementById("editDescription").value = s.description;
        document.getElementById("editTags").value = s.tags;
        document.getElementById("editCode").value = s.code;

        // Close the view modal
        closeViewModal();

        // Open edit modal
        document.getElementById("editSnippetModal").style.display = "flex";

    } catch (err) {
        console.log(err);
        Swal.fire("Error", "Could not load snippet for editing.", "error");
    }
}

async function saveEditedSnippet() {
    const id = document.getElementById("editSnippetId").value;

    const updatedData = {
        title: document.getElementById("editTitle").value.trim(),
        language: document.getElementById("editLanguage").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        tags: document.getElementById("editTags").value.trim(),
        code: document.getElementById("editCode").value.trim(),
    };

    try {
        const res = await fetch(`http://127.0.0.1:8000/snippets/update/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            Swal.fire("Updated!", "Snippet updated successfully.", "success");

            closeEditModal();
            loadUserSnippets();
            updateStats();

        } else {
            Swal.fire("Error", "Could not update snippet", "error");
        }

    } catch (err) {
        console.log(err);
        Swal.fire("Error", "Something went wrong", "error");
    }
}


function closeViewModal() {
    document.getElementById("viewSnippetModal").style.display = "none";
}
function closeEditModal() {
    const modal = document.getElementById("editSnippetModal");
    modal.style.display = "none";
}

// Load on page start
loadUserSnippets();
updateStats();
