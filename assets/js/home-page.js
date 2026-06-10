async function loadUserData() {
  try {
    const response = await fetch("http://localhost:5000/api/user/profile", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await response.json();

    document.getElementById("userName").textContent = data.name;
    document.getElementById("userAvatar").src = data.image;

  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

loadUserData();






