
// // login page

// const FAKE_USER = {
//   email: "test@gmail.com",
//   password: "123456",
// };

// // ===== Elements =====
// const form = document.getElementById("loginForm");
// const emailInput = document.getElementById("email");
// const passwordInput = document.getElementById("password");
// const errorMsg = document.getElementById("errorMsg");
// const loginBtn = document.getElementById("loginBtn");

// // ===== Submit Event =====
// form.addEventListener("submit", function (e) {
//   e.preventDefault();

//   hideError();
//   setLoading(true);

//   const email = emailInput.value.trim();
//   const password = passwordInput.value.trim();

//   if (email === "" || password === "") {
//     showError("من فضلك املأ كل البيانات");
//     setLoading(false);
//     return;
//   }

//   fakeLoginAPI(email, password)
//     .then(() => {
//       window.location.href = "home-page.html";
//     })
//     .catch((err) => {
//       showError(err);
//     })
//     .finally(() => {
//       setLoading(false);
//     });
// });

// // ===== Fake API =====
// function fakeLoginAPI(email, password) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (
//         email === FAKE_USER.email &&
//         password === FAKE_USER.password
//       ) {
//         resolve();
//       } else {
//         reject("البريد الإلكتروني أو كلمة السر غير صحيحة");
//       }
//     }, 1200);
//   });
// }

// // ===== UI Functions =====
// function showError(message) {
//   errorMsg.textContent = message;
//   errorMsg.style.display = "block";
// }

// function hideError() {
//   errorMsg.style.display = "none";
// }

// function setLoading(isLoading) {
//   if (isLoading) {
//     loginBtn.disabled = true;
//     loginBtn.textContent = "جاري تسجيل الدخول...";
//   } else {
//     loginBtn.disabled = false;
//     loginBtn.textContent = "تسجيل الدخول";
//   }
// }


























// let confirmBtn = document.querySelector(".reset-password-part-right-buttem button");
// let modal = document.getElementById("successModal");
// let closeBtn = document.getElementById("closeModal");

// confirmBtn.onclick = function(e) {
//     e.preventDefault(); // علشان ميعملش refresh للصفحة
//     modal.style.display = "flex"; // يظهر الـ Modal
// };
// // عشان اول ما ادوس عليها اروح لصفجه تسجيل الدخول
// closeBtn.onclick = function() {
//     window.location.href = "login.html"; 
// };
// setTimeout(() => {
//     window.location.href = "login.html";
// }, 5000);

















// ghareb edit
console.log("js working");

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!email || !password) {
        errorMsg.textContent = "البريد الإلكتروني وكلمة السر مطلوبين";
        return;
    }
    try {
        const response = await fetch("http://localhost:5000/api/Auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "بيانات الدخول غير صحيحة");
        }
        // حفظ التوكنات
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        // توجيه المستخدم للصفحة الرئيسية
        window.location.href = "home-page.html";
    } catch (err) {
        console.error("خطأ في تسجيل الدخول:", err);
        errorMsg.textContent = err.message || "حدث خطأ أثناء تسجيل الدخول";
    }
});