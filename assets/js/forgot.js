// صفحه نسيت الباسورد
// ===== Fake Registered Email =====
const FAKE_EMAIL = "test@gmail.com";

// ===== Elements =====
const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

// ===== Submit Event =====
form.addEventListener("submit", function (e) {
  e.preventDefault();

  hideMessage();
  setLoading(true);

  const email = emailInput.value.trim();

  if (email === "") {
    showMessage("من فضلك ادخل البريد الإلكتروني", "error");
    setLoading(false);
    return;
  }

  fakeForgotPasswordAPI(email)
    .then((res) => {
      // نخزن الإيميل للصفحة اللي بعدها
      localStorage.setItem("resetEmail", email);

      showMessage(res, "success");

      // تحويل بعد ثانية
      setTimeout(() => {
        window.location.href = "proof-identity.html";
      }, 1200);
    })
    .catch((err) => {
      showMessage(err, "error");
      setLoading(false);
    });
});

// ===== Fake API =====
function fakeForgotPasswordAPI(email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === FAKE_EMAIL) {
        resolve("تم إرسال رمز التحقق إلى بريدك الإلكتروني 📩");
      } else {
        reject("هذا البريد غير مسجل لدينا ❌");
      }
    }, 1000);
  });
}

// ===== UI Helpers =====
function showMessage(text, type) {
  message.textContent = text;
  message.style.display = "block";
  message.style.color = type === "success" ? "green" : "red";
}

function hideMessage() {
  message.style.display = "none";
}

function setLoading(isLoading) {
  if (isLoading) {
    sendBtn.disabled = true;
    sendBtn.textContent = "جاري الإرسال...";
  } else {
    sendBtn.disabled = false;
    sendBtn.textContent = "ارسال الرمز";
  }
}
