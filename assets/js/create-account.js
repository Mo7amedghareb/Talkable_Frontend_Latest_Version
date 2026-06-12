console.log("JS WORKING");

// Debug button click (optional)
document.getElementById("registerBtn").onclick = () => {
  console.log("Button clicked");
};

const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // =============================
  // Get form values
  // =============================
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const repassword = document.getElementById("repassword").value;

  // Get selected user type (radio button)
  const userTypeElement = document.querySelector('input[name="user"]:checked');
  const userType = userTypeElement?.value === "deaf" ? 1 : 0;

  // =============================
  // Basic validation
  // =============================
  if (!name || !email || !password || !repassword) {
    alert("All fields are required");
    return;
  }

  // Check password length
  if (password.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  // Check password strength (ASP.NET Identity style rule)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    alert("Password must contain uppercase, lowercase, number, and special character");
    return;
  }

  // =============================
  // Repassword validation (IMPORTANT)
  // =============================
  if (password !== repassword) {
    alert("Passwords do not match");
    return;
  }

  // =============================
  // Validate full name
  // =============================
  const nameParts = name.split(/\s+/).filter(p => p.length > 0);

  if (nameParts.length < 2) {
    alert("Please enter at least first and last name");
    return;
  }

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  try {
    // Debug payload
    console.log("Sending data:", {
      email,
      password,
      First_Name: firstName,
      Last_Name: lastName,
      type: userType
    });

    // =============================
    // API request
    // =============================
    const response = await fetch("http://localhost:5298/api/Auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        First_Name: firstName,
        Last_Name: lastName,
        type: userType
      })
    });

    // =============================
    // Success handling
    // =============================
    if (response.ok || response.status === 204) {
      sessionStorage.setItem("pendingEmail", email);
      window.location.href = "Otp_page.html";
      return;
    }

    // =============================
    // Error handling
    // =============================
    let errorText;
    try {
      errorText = await response.text();
    } catch {
      errorText = "Registration failed";
    }

    throw new Error(errorText);

  } catch (error) {
    console.error("Registration error:", error);
    alert(error.message || "Something went wrong");
  }
});