// // ===== Fake Existing Email =====
// const EXISTING_EMAIL = "test@gmail.com";

// // ===== Elements =====
// const form = document.getElementById("registerForm");
// const nameInput = document.getElementById("name");
// const emailInput = document.getElementById("email");
// const passwordInput = document.getElementById("password");
// const message = document.getElementById("message");
// const registerBtn = document.getElementById("registerBtn");

// // ===== Submit =====
// form.addEventListener("submit", function (e) {
//   e.preventDefault();

//   const name = nameInput.value.trim();
//   const email = emailInput.value.trim();
//   const password = passwordInput.value.trim();
//   const userType = document.querySelector('input[name="user"]:checked');

//   console.log({ name, email, password, userType });

//   if (!name || !email || !password) {
//     alert("املأ كل البيانات");
//     return;
//   }

//   if (!userType) {
//     alert("اختار نوع المستخدم");
//     return;
//   }

//   alert("تمام ✅ نوع المستخدم: " + userType.value);
// });


//   fakeRegisterAPI({
//     name,
//     email,
//     password,
//     userType: userType.value,
//   })
//     .then(() => {
//       showMessage("تم إنشاء الحساب بنجاح 🎉", "success");

//       setTimeout(() => {
//         window.location.href ="../login.html";
//       }, 100);
//     })
//     .catch((err) => {
//       showMessage(err, "error");
//       setLoading(false);
//     });
// ;

// // ===== Fake API =====
// function fakeRegisterAPI(data) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (data.email === EXISTING_EMAIL) {
//         reject("هذا البريد الإلكتروني مسجل بالفعل ❌");
//       } else {
//         console.log("User Data:", data); // للتجربة
//         resolve();
//       }
//     }, 1200);
//   });
// }

// // ===== UI Helpers =====
// function showMessage(text, type) {
//   message.textContent = text;
//   message.style.display = "block";
//   message.style.color = type === "success" ? "green" : "red";
// }

// function hideMessage() {
//   message.style.display = "none";
// }

// function setLoading(isLoading) {
//   if (isLoading) {
//     registerBtn.disabled = true;
//     registerBtn.textContent = "جاري إنشاء الحساب...";
//   } else {
//     registerBtn.disabled = false;
//     registerBtn.textContent = "إنشاء حساب";
//   }
// }


// document.querySelectorAll('input[name="user"]').forEach(radio => {
//   radio.addEventListener("change", () => {
//     console.log("Selected:", radio.value);
//   });
// });



// const form = document.getElementById("registerForm");

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   // جلب القيم
//   const name = document.getElementById("name").value.trim();
//   const email = document.getElementById("email").value.trim();
//   const password = document.getElementById("password").value;
//   const confirmPassword = document.getElementById("repassword").value;

//   // Validation أساسي
//   if (!name || !email || !password || !confirmPassword) {
//     alert("كل الحقول مطلوبة");
//     return;
//   }

//   if (password !== confirmPassword) {
//     alert("كلمة السر غير متطابقة");
//     return;
//   }

//   if (password.length < 6) {
//     alert("كلمة السر يجب أن تكون 6 أحرف على الأقل");
//     return;
//   }

//   // تحسين تقسيم الاسم الكامل
//   const nameParts = name.split(/\s+/).filter(part => part.length > 0);

//   if (nameParts.length < 2) {
//     alert("الرجاء إدخال الاسم الأول واسم العائلة على الأقل (مثل: أحمد محمد)");
//     return;
//   }

//   const firstName = nameParts[0];
//   const lastName = nameParts.slice(1).join(" ");

//   // نوع المستخدم ثابت مؤقتًا للتجربة
//   const userType = "normal";  // أو "deaf" لو عايز تجرب التاني

//   try {
//     // طباعة البيانات للتشخيص
//     console.log("البيانات اللي هتتبعت:", {
//       email,
//       password,
//       firstName,
//       lastName,
//       type: userType
//     });

// const response = await fetch("https://ciliary-pasquale-overhead.ngrok-free.dev/api/Auth/register", {
//         method: "POST",
//       // headers: {
//       //   "Content-Type": "application/json",
//       //   "ngrok-skip-browser-warning": "true"
//       // },
//       headers: {
//   "Content-Type": "application/json"  // بس كده، بدون أي إضافات
// },
//       body: JSON.stringify({
//         email,
//         password,
//         firstName,
//         lastName,
//         type: userType  // هنا صحيح: string
//       })
//     });

//     // حالة النجاح (204 أو 200)
//     if (response.status === 204 || response.ok) {
//       alert("تم إنشاء الحساب بنجاح! افحص بريدك الإلكتروني لتأكيد الحساب");
//       window.location.href = "login.html";
//       return;
//     }

//     // لو فيه رد خطأ
//     let data;
//     try {
//       data = await response.json();
//     } catch {
//       data = null;
//     }

//     if (!response.ok) {
//       const errorMsg = data?.message || data?.title || data?.errors?.join(", ") || "فشل إنشاء الحساب";
//       throw new Error(errorMsg);
//     }

//     // نجاح غير متوقع (لو رجع JSON)
//     alert("تم إنشاء الحساب بنجاح!");
//     window.location.href = "login.html";

//   } catch (error) {
//     console.error("خطأ:", error);
//     alert(error.message || "حدث خطأ أثناء إنشاء الحساب. جرب بيانات مختلفة.");
//   }
// });









// ghareb edit
console.log("JS WORKING");
document.getElementById("registerBtn").onclick = () => alert("working");

const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // جلب القيم
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // جلب نوع المستخدم من الراديو (ديناميكي)
  const userTypeElement = document.querySelector('input[name="user"]:checked');
const userType = userTypeElement?.value === "deaf" ? 1 : 0;

  // Validation أساسي
  if (!name || !email || !password) {
    alert("كل الحقول مطلوبة");
    return;
  }


  if (password.length < 8) {
    alert("كلمة السر يجب أن تكون 8 أحرف على الأقل");
    return;
  }

  // تحقق من قوة الباسورد (مطابق لمتطلبات ASP.NET Identity الافتراضية)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    alert("كلمة السر يجب أن تحتوي على: حرف كبير، حرف صغير، رقم، ورمز خاص");
    return;
  }

  // تحسين تقسيم الاسم الكامل
  const nameParts = name.split(/\s+/).filter(part => part.length > 0);

  if (nameParts.length < 2) {
    alert("الرجاء إدخال الاسم الأول واسم العائلة على الأقل (مثل: محمد أحمد)");
    return;
  }

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  try {
    // طباعة البيانات للتشخيص (اختياري، ممكن تشيلها بعدين)
    console.log("البيانات اللي هتتبعت:", {
      email,
      password,
      First_Name: firstName,
Last_Name: lastName,
      type: userType
    });

    const response = await fetch("http://localhost:5000/api/Auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"  // بس كده، بدون أي headers زيادة
      },
      body: JSON.stringify({
        email,
        password,
        First_Name: firstName,
Last_Name: lastName,
        type: userType  // هنا هياخد "normal" أو "deaf" حسب اختيارك
      })
    });

    // حالة النجاح (200 أو 204)
    if (response.ok || response.status === 204) {
      alert("تم إنشاء الحساب بنجاح! افحص بريدك الإلكتروني لتأكيد الحساب");
      window.location.href = "login.html";
      return;
    }

    // لو فيه خطأ، نحاول نقرا الرسالة
    let data;
    try {
      data = await response.text(); // text() أحسن من json() لو الرد مش JSON
    } catch {
      data = null;
    }

    const errorMsg = data || "فشل إنشاء الحساب. تأكد من البيانات أو حاول مرة أخرى.";
    throw new Error(errorMsg);

  } catch (error) {
    console.error("خطأ أثناء التسجيل:", error);
    alert(error.message || "حدث خطأ أثناء إنشاء الحساب");
  }
});