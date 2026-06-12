console.log("OTP page loaded");
const form = document.getElementById("otpForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const otp = document.getElementById("otp").value.trim();
  const error = document.getElementById("error");
  const email = sessionStorage.getItem("pendingEmail"); // ← جيب الـ email

  error.textContent = "";

  if (!email) {
    error.textContent = "Session expired, please register again";
    window.location.href = "create_account.html";
    return;
  }

  if (!otp || otp.length !== 6) {
    error.textContent = "Please enter a valid 6-digit code";
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5298/api/Auth/verify-email?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
      {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }
      }
    );

    if (response.ok) {
      sessionStorage.removeItem("pendingEmail"); // نضف الـ session
      alert("Account verified successfully!");
      window.location.href = "login.html";
      return;
    }

    const msg = await response.text();
    error.textContent = msg || "Invalid OTP";

  } catch (err) {
    console.error(err);
    error.textContent = "Server error, try again later";
  }
});