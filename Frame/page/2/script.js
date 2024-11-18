function showLogin() {
  document.getElementById("login-popup").style.display = "flex";
}

function showSignup() {
  document.getElementById("signup-popup").style.display = "flex";
}

function closePopup(popupId) {
  document.getElementById(popupId).style.display = "none";
}
