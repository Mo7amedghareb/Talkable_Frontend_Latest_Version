document.addEventListener("DOMContentLoaded", function () {

  const stars = document.querySelectorAll(".star");
  const ratingText = document.getElementById("rating-text");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      const currentRating = star.dataset.value;

      stars.forEach(s => {
        s.classList.toggle("active", s.dataset.value <= currentRating);
      });

      if (ratingText) {
        ratingText.innerText = `التقييم: ${currentRating} من 5`;
      }
    });
  });

});
// الزر الأول
document.getElementById("button1").addEventListener("click", function() {
    window.location.href = "home-page.html"; // رابط الصفحة الأولى
});