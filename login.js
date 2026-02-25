// Initialize CodeVault SweetAlert Theme
const codeVaultAlert = Swal.mixin({
  customClass: {
    popup: "codevault-popup",
    title: "codevault-title",
    confirmButton: "codevault-btn",
  },
  buttonsStyling: false,
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    codeVaultAlert.fire({
      icon: "warning",
      title: "Missing Fields ⚠️",
      text: "Please enter both email/username and password.",
    });
    return;
  }

  try {
    // Prepare login data (FastAPI requires x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // Store login information
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      // Role-based redirect
      let redirectPage =
        data.role === "admin"
          ? "AdminDashboard.html"
          : "UserDashboard.html";

      codeVaultAlert
        .fire({
          icon: "success",
          title: `Welcome Back, ${data.username}! 🎉`,
          text: "Login successful. Redirecting...",
          timer: 2000,
          showConfirmButton: false,
        })
        .then(() => {
          window.location.href = redirectPage;
        });
    } else {
      codeVaultAlert.fire({
        icon: "error",
        title: "Login Failed ❌",
        text: data.detail || "Invalid email or password.",
      });
    }
  } catch (error) {
    codeVaultAlert.fire({
      icon: "error",
      title: "Server Error 💥",
      text: "Unable to connect to the server.",
    });
  }
});
