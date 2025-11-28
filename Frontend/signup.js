const codeVaultAlert = Swal.mixin({
  customClass: {
    popup: "codevault-popup",
    title: "codevault-title",
    confirmButton: "codevault-btn",
  },
  buttonsStyling: false,
});

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const terms = document.getElementById("terms").checked;

  if (!username || !email || !password || !confirmPassword) {
    return codeVaultAlert.fire({
      icon: "warning",
      title: "Missing Fields ⚠️ ",
      text: "Please fill out all required fields.",
    });
  }

  if (password !== confirmPassword) {
    return codeVaultAlert.fire({
      icon: "error",
      title: "Passwords Do Not Match ❌",
      text: "Please make sure both passwords are the same.",
    });
  }

  if (!terms) {
    return codeVaultAlert.fire({
      icon: "warning",
      title: "Terms Not Accepted ⚠️",
      text: "You must accept the Terms & Privacy Policy.",
    });
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // SUCCESS POPUP
      codeVaultAlert
        .fire({
          icon: "success",
          title: "Account Created 🎉",
          text: "Your CodeVault account has been created successfully!",
          timer: 2500,
          showConfirmButton: false,
        })
        .then(() => {
          window.location.href = "login.html";
        });
    } else {
      // ERROR FROM BACKEND (like duplicate email/username)
      codeVaultAlert.fire({
        icon: "error",
        title: "Signup Failed ❌",
        text: data.detail || "Unable to create your account.",
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
