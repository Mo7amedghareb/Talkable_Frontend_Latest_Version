// // ===== pdf-translation.js =====
// // في صفحة الترجمة — اقرأ الكلمات من localStorage
// const ocrWords = JSON.parse(localStorage.getItem("ocrWords") || "[]");
// if (ocrWords.length > 0) {
//     // حط الكلمات في الـ textarea
//     textInput.value = ocrWords.join(" ");
//     // أو شغّلها تلقائياً
//     translateBtn.click();
// }



// document.addEventListener('DOMContentLoaded', function () {

//     const dropZone = document.getElementById('dropZone');
//     const fileInput = document.getElementById('fileInput');
//     const filePreview = document.getElementById('filePreview');
//     const fileNameSpan = document.getElementById('fileName');
//     const removeFileBtn = document.getElementById('removeFile');
//     const translateBtn = document.getElementById('translateBtn');
//     const outputText = document.getElementById('outputText');
//     const translatedContent = document.getElementById('translatedContent');
//     const loadingSpinner = document.getElementById('loadingSpinner');
//     const shareBtn = document.getElementById('shareBtn');
//     const exportBtn = document.getElementById('exportBtn');
//     const toast = document.getElementById('toast');

//     let selectedFile = null;

//     // ===== CHECK ELEMENTS =====
//     console.log('dropZone:', dropZone);
//     console.log('fileInput:', fileInput);
//     console.log('translateBtn:', translateBtn);

//     // ===== SHOW TOAST =====
//     function showToast(message) {
//         toast.textContent = message;
//         toast.classList.add('show');
//         setTimeout(() => {
//             toast.classList.remove('show');
//         }, 3000);
//     }

//     // ===== CLICK ON DROP ZONE =====
//     dropZone.addEventListener('click', function (e) {
//         e.stopPropagation();
//         fileInput.click();
//         console.log('dropZone clicked');
//     });

//     // ===== FILE INPUT CHANGE =====
//     fileInput.addEventListener('change', function (e) {
//         console.log('file input changed', e.target.files);
//         const file = e.target.files[0];
//         if (file) {
//             handleFile(file);
//         }
//     });

//     // ===== DRAG AND DROP =====
//     dropZone.addEventListener('dragover', function (e) {
//         e.preventDefault();
//         e.stopPropagation();
//         dropZone.classList.add('dragover');
//     });

//     dropZone.addEventListener('dragleave', function (e) {
//         e.preventDefault();
//         e.stopPropagation();
//         dropZone.classList.remove('dragover');
//     });

//     dropZone.addEventListener('drop', function (e) {
//         e.preventDefault();
//         e.stopPropagation();
//         dropZone.classList.remove('dragover');
//         console.log('file dropped');
//         const file = e.dataTransfer.files[0];
//         if (file) {
//             handleFile(file);
//         }
//     });

//     // ===== HANDLE FILE =====
//     function handleFile(file) {
//         console.log('handleFile called:', file.name, file.type, file.size);

//         const allowedTypes = [
//             'application/pdf',
//             'image/jpeg',
//             'image/png',
//             'image/jpg',
//             'image/gif',
//             'image/webp'
//         ];

//         const maxSize = 10 * 1024 * 1024; // 10MB

//         if (!allowedTypes.includes(file.type)) {
//             showToast('❌ يرجى رفع ملف PDF أو صورة فقط');
//             return;
//         }

//         if (file.size > maxSize) {
//             showToast('❌ حجم الملف يتجاوز 10 ميغابايت');
//             return;
//         }

//         selectedFile = file;
//         fileNameSpan.textContent = file.name;
//         filePreview.style.display = 'flex';
//         showToast('✅ تم اختيار الملف: ' + file.name);
//         console.log('File selected:', file.name);
//     }

//     // ===== REMOVE FILE =====
//     removeFileBtn.addEventListener('click', function (e) {
//         e.stopPropagation();
//         selectedFile = null;
//         fileInput.value = '';
//         fileNameSpan.textContent = 'لم يتم اختيار ملف';
//         filePreview.style.display = 'none';
//         showToast('🗑️ تم حذف الملف');
//     });

//     // ===== TRANSLATE BUTTON =====
//     translateBtn.addEventListener("click", async function () {

//         // if (!selectedFile) {
//         //     alert("اختار ملف الأول");
//         //     return;
//         // } window.location.href = "pdf-translation.html";

//         translateBtn.addEventListener("click", async function () {
//             if (!selectedFile) {
//                 showToast("❌ اختار ملف الأول");
//                 return;
//             }

//             const formData = new FormData();
//             formData.append("file", selectedFile);

//             loadingSpinner.style.display = "flex";
//             translateBtn.disabled = true;

//             try {
//                 // ← حط رابط الـ ngrok هنا
//                 const response = await fetch("https://lair-budget-sureness.ngrok-free.dev", {
//                     method: "POST",
//                     body: formData
//                 });

//                 if (!response.ok) throw new Error("Server Error");

//                 const data = await response.json();
//                 console.log("API Response:", data);

//                 // خزّن الكلمات
//                 localStorage.setItem("ocrText", data.text);
//                 localStorage.setItem("ocrWords", JSON.stringify(data.words));

//                 // اعرض النص في الصفحة
//                 translatedContent.textContent = data.text;
//                 showToast("✅ تم استخراج النص بنجاح");

//             } catch (error) {
//                 console.error(error);
//                 showToast("❌ حصل خطأ في الاتصال بالسيرفر");
//             } finally {
//                 loadingSpinner.style.display = "none";
//                 translateBtn.disabled = false;
//             }
//         });



//         const formData = new FormData();
//         formData.append("file", selectedFile);

//         loadingSpinner.style.display = "flex";
//         translateBtn.disabled = true;

//         try {

//             const response = await fetch("http://localhost:8000/ocr", {
//                 method: "POST",
//                 body: formData
//             });

//             if (!response.ok) {
//                 throw new Error("Server Error");
//             }

//             const data = await response.json();

//             console.log("API Response:", data);

//             // ✅ تخزين البيانات
//             localStorage.setItem("ocrText", data.text);
//             localStorage.setItem("ocrWords", JSON.stringify(data.words));

//             // ✅ عرض النص (اختياري)
//             translatedContent.textContent = data.text;

//             // ✅ تحويل لصفحة الأفـاتار
//             window.location.href = "sign-translation.html";

//         } catch (error) {

//             console.error(error);
//             alert("حصل خطأ في الاتصال بالسيرفر");

//         } finally {

//             loadingSpinner.style.display = "none";
//             translateBtn.disabled = false;
//         }

//     });

//     // ===== SHARE BUTTON =====
//     shareBtn.addEventListener('click', function () {
//         const text = translatedContent.textContent.trim();

//         if (!text) {
//             showToast('⚠️ لا يوجد نص للمشاركة');
//             return;
//         }

//         if (navigator.share) {
//             navigator.share({
//                 title: 'نص مترجم - Talkable',
//                 text: text
//             }).then(function () {
//                 showToast('✅ تمت المشاركة بنجاح');
//             }).catch(function () {
//                 copyToClipboard(text);
//             });
//         } else {
//             copyToClipboard(text);
//         }
//     });

//     // ===== COPY TO CLIPBOARD =====
//     function copyToClipboard(text) {
//         navigator.clipboard.writeText(text).then(function () {
//             showToast('📋 تم نسخ النص');
//         }).catch(function () {
//             showToast('❌ فشل النسخ');
//         });
//     }

//     // ===== EXPORT BUTTON =====
//     exportBtn.addEventListener('click', function () {
//         const text = translatedContent.textContent.trim();

//         if (!text) {
//             showToast('⚠️ لا يوجد نص للتصدير');
//             return;
//         }

//         const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'translated_text.txt';
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);

//         showToast('✅ تم تصدير الملف بنجاح!');
//     });

// });



// ===== pdf-translation.js =====

// const NGROK_URL = "https://lair-budget-sureness.ngrok-free.dev";

// document.addEventListener('DOMContentLoaded', function () {

//     const dropZone = document.getElementById('dropZone');
//     const fileInput = document.getElementById('fileInput');
//     const filePreview = document.getElementById('filePreview');
//     const fileNameSpan = document.getElementById('fileName');
//     const removeFileBtn = document.getElementById('removeFile');
//     const translateBtn = document.getElementById('translateBtn');
//     const translatedContent = document.getElementById('translatedContent');
//     const loadingSpinner = document.getElementById('loadingSpinner');
//     const shareBtn = document.getElementById('shareBtn');
//     const exportBtn = document.getElementById('exportBtn');
//     const toast = document.getElementById('toast');

//     let selectedFile = null;

//     // ===== SHOW TOAST =====
//     function showToast(message) {
//         toast.textContent = message;
//         toast.classList.add('show');
//         setTimeout(() => toast.classList.remove('show'), 3000);
//     }

//     // ===== CLICK ON DROP ZONE =====
//     dropZone.addEventListener('click', function (e) {
//         e.stopPropagation();
//         fileInput.click();
//     });

//     // ===== FILE INPUT CHANGE =====
//     fileInput.addEventListener('change', function (e) {
//         const file = e.target.files[0];
//         if (file) handleFile(file);
//     });

//     // ===== DRAG AND DROP =====
//     dropZone.addEventListener('dragover', function (e) {
//         e.preventDefault();
//         e.stopPropagation();
//         dropZone.classList.add('dragover');
//     });

//     dropZone.addEventListener('dragleave', function (e) {
//         e.preventDefault();
//         e.stopPropagation();
//         dropZone.classList.remove('dragover');
//     });

//     dropZone.addEventListener('drop', function (e) {
//         e.preventDefault();
//         e.stopPropagation();
//         dropZone.classList.remove('dragover');
//         const file = e.dataTransfer.files[0];
//         if (file) handleFile(file);
//     });

//     // ===== HANDLE FILE =====
//     function handleFile(file) {
//         const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
//         const maxSize = 10 * 1024 * 1024;

//         if (!allowedTypes.includes(file.type)) {
//             showToast('❌ يرجى رفع ملف PDF أو صورة فقط');
//             return;
//         }
//         if (file.size > maxSize) {
//             showToast('❌ حجم الملف يتجاوز 10 ميغابايت');
//             return;
//         }

//         selectedFile = file;
//         fileNameSpan.textContent = file.name;
//         filePreview.style.display = 'flex';
//         showToast('✅ تم اختيار الملف: ' + file.name);
//     }

//     // ===== REMOVE FILE =====
//     removeFileBtn.addEventListener('click', function (e) {
//         e.stopPropagation();
//         selectedFile = null;
//         fileInput.value = '';
//         fileNameSpan.textContent = 'لم يتم اختيار ملف';
//         filePreview.style.display = 'none';
//         showToast('🗑️ تم حذف الملف');
//     });

//     // ===== TRANSLATE BUTTON =====
//     translateBtn.addEventListener("click", async function () {
//         if (!selectedFile) {
//             showToast("❌ اختار ملف الأول");
//             return;
//         }

//         const formData = new FormData();
//         formData.append("file", selectedFile);

//         loadingSpinner.style.display = "flex";
//         translateBtn.disabled = true;
//         translatedContent.textContent = "";

//         try {
//             const response = await fetch(`${NGROK_URL}/process`, {
//                 method: "POST",
//                 headers: {
//                     "ngrok-skip-browser-warning": "true"
//                 },
//                 body: formData
//             });

//             if (!response.ok) throw new Error(`Server Error: ${response.status}`);

//             const data = await response.json();
//             console.log("API Response:", data);

//             // خزّن الكلمات في localStorage
//             localStorage.setItem("ocrText", data.text);
//             localStorage.setItem("ocrWords", JSON.stringify(data.words));

//             // اعرض النص في الصفحة
//             translatedContent.textContent = data.text;
//             showToast("✅ تم استخراج النص بنجاح");

//         } catch (error) {
//             console.error("Error:", error);
//             showToast("❌ حصل خطأ في الاتصال بالسيرفر");
//         } finally {
//             loadingSpinner.style.display = "none";
//             translateBtn.disabled = false;
//         }
//     });

//     // ===== SHARE BUTTON =====
//     shareBtn.addEventListener('click', function () {
//         const text = translatedContent.textContent.trim();
//         if (!text) { showToast('⚠️ لا يوجد نص للمشاركة'); return; }

//         if (navigator.share) {
//             navigator.share({ title: 'نص مترجم - Talkable', text })
//                 .then(() => showToast('✅ تمت المشاركة بنجاح'))
//                 .catch(() => copyToClipboard(text));
//         } else {
//             copyToClipboard(text);
//         }
//     });

//     // ===== COPY TO CLIPBOARD =====
//     function copyToClipboard(text) {
//         navigator.clipboard.writeText(text)
//             .then(() => showToast('📋 تم نسخ النص'))
//             .catch(() => showToast('❌ فشل النسخ'));
//     }

//     // ===== EXPORT BUTTON =====
//     exportBtn.addEventListener('click', function () {
//         const text = translatedContent.textContent.trim();
//         if (!text) { showToast('⚠️ لا يوجد نص للتصدير'); return; }

//         const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'translated_text.txt';
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//         showToast('✅ تم تصدير الملف بنجاح!');
//     });

// });





// ===== pdf-translation.js =====

const NGROK_URL = "https://lair-budget-sureness.ngrok-free.dev";

document.addEventListener('DOMContentLoaded', function () {

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileNameSpan = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFile');
    const translateBtn = document.getElementById('translateBtn');
    const translatedContent = document.getElementById('translatedContent');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const shareBtn = document.getElementById('shareBtn');
    const exportBtn = document.getElementById('exportBtn');
    const toast = document.getElementById('toast');

    let selectedFile = null;

    // ===== SHOW TOAST =====
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== CLICK ON DROP ZONE =====
    dropZone.addEventListener('click', function (e) {
        e.stopPropagation();
        fileInput.click();
    });

    // ===== FILE INPUT CHANGE =====
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // ===== DRAG AND DROP =====
    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    // ===== HANDLE FILE =====
    function handleFile(file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            showToast('❌ يرجى رفع ملف PDF أو صورة فقط');
            return;
        }
        if (file.size > maxSize) {
            showToast('❌ حجم الملف يتجاوز 10 ميغابايت');
            return;
        }

        selectedFile = file;
        fileNameSpan.textContent = file.name;
        filePreview.style.display = 'flex';
        showToast('✅ تم اختيار الملف: ' + file.name);
    }

    // ===== REMOVE FILE =====
    removeFileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        fileNameSpan.textContent = 'لم يتم اختيار ملف';
        filePreview.style.display = 'none';
        showToast('🗑️ تم حذف الملف');
    });

    // ===== TRANSLATE BUTTON =====
    translateBtn.addEventListener("click", async function () {
        if (!selectedFile) {
            showToast("❌ اختار ملف الأول");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        loadingSpinner.style.display = "flex";
        translateBtn.disabled = true;
        translatedContent.textContent = "";

        try {
            const response = await fetch(`${NGROK_URL}/process`, {
                method: "POST",
                headers: { "ngrok-skip-browser-warning": "true" },
                body: formData
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);

            const data = await response.json();
            console.log("API Response:", data);

            // خزّن النص والكلمات في localStorage
            localStorage.setItem("ocrText", data.text);
            localStorage.setItem("ocrWords", JSON.stringify(data.words));
            // ✅ علامة إن في نص جديد من PDF
            localStorage.setItem("fromPdf", "true");

            // اعرض النص في الصفحة
            translatedContent.textContent = data.text;
            showToast("✅ تم استخراج النص — جاري التحويل لصفحة الترجمة...");

            // ✅ روح لصفحة الترجمة بعد ثانية
            setTimeout(() => {
                window.location.href = "Translate_from_speech_to_sign.html";
            }, 1500);

        } catch (error) {
            console.error("Error:", error);
            showToast("❌ حصل خطأ في الاتصال بالسيرفر");
        } finally {
            loadingSpinner.style.display = "none";
            translateBtn.disabled = false;
        }
    });

    // ===== SHARE BUTTON =====
    shareBtn.addEventListener('click', function () {
        const text = translatedContent.textContent.trim();
        if (!text) { showToast('⚠️ لا يوجد نص للمشاركة'); return; }

        if (navigator.share) {
            navigator.share({ title: 'نص مترجم - Talkable', text })
                .then(() => showToast('✅ تمت المشاركة بنجاح'))
                .catch(() => copyToClipboard(text));
        } else {
            copyToClipboard(text);
        }
    });

    // ===== COPY TO CLIPBOARD =====
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('📋 تم نسخ النص'))
            .catch(() => showToast('❌ فشل النسخ'));
    }

    // ===== EXPORT BUTTON =====
    exportBtn.addEventListener('click', function () {
        const text = translatedContent.textContent.trim();
        if (!text) { showToast('⚠️ لا يوجد نص للتصدير'); return; }

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translated_text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ تم تصدير الملف بنجاح!');
    });

});