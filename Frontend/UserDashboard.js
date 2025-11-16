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
