// Admin Dashboard Security Check
const token = localStorage.getItem("access_token");
const role = localStorage.getItem("role");
const adminName = localStorage.getItem("username");

// Redirect if not logged in
if (!token) {
    window.location.href = "login.html";
}

// Redirect if NOT admin
if (role !== "admin") {
    window.location.href = "UserDashboard.html";
}

// Fill admin info
document.getElementById("adminName").innerText = adminName;
document.getElementById("adminAvatar").src = `https://ui-avatars.com/api/?name=${adminName}&background=6c63ff&color=fff`;


// ===============================================
// LOAD ALL USERS
// ===============================================
async function loadUsers() {
    try {
        const res = await fetch("http://127.0.0.1:8000/admin/users", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const users = await res.json();

        const tableBody = document.querySelector("#usersTable tbody");
        tableBody.innerHTML = ""; // clear old

       users.forEach(user => {
    const row = document.createElement("tr");

    // If user is admin, hide delete button
    const deleteButton = user.role === "admin"
        ? `<span class="no-action">—</span>`
        : `<button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>`;

    row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${deleteButton}</td>
    `;

    tableBody.appendChild(row);
});

    } catch (error) {
        console.log(error);
        alert("Error loading users.");
    }
}

loadUsers();


// ===============================================
// DELETE USER
// ===============================================
async function deleteUser(id) {

    const confirmDelete = await Swal.fire({
        icon: "warning",
        title: "Delete User?",
        text: "Are you sure you want to delete this user?",
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
        const res = await fetch(`http://127.0.0.1:8000/admin/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: "success",
                title: "User Deleted",
                timer: 2000,
                showConfirmButton: false
            });

            loadUsers(); // refresh table
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: data.detail
            });
        }

    } catch (error) {
        console.log(error);
    }
}


// ===============================================
// LOGOUT BUTTON
// ===============================================
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});
