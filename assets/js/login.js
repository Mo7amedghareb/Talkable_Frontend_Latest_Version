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
        const response = await fetch("http://localhost:5298/api/Auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({ email, password })
        });

        // اقرأ الـ response كـ text الأول
        const text = await response.text();

        // لو account not activated وجّهه لصفحة OTP
        if (response.status === 401 && text.includes("account not activated")) {
            sessionStorage.setItem("pendingEmail", email);
            errorMsg.textContent = "⚠️ لم يتم تفعيل حسابك، سيتم توجيهك لصفحة التحقق...";
            setTimeout(() => {
                window.location.href = "Otp_page.html";
            }, 2000);
            return;
        }

        if (!response.ok) {
            errorMsg.textContent = "بيانات الدخول غير صحيحة";
            return;
        }

        // parse JSON بس لو الـ response ok
        const data = JSON.parse(text);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        window.location.href = "home-page.html";

    } catch (err) {
        console.error("خطأ في تسجيل الدخول:", err);
        errorMsg.textContent = err.message || "حدث خطأ أثناء تسجيل الدخول";
    }
});