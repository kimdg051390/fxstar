document.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  const viewportHeight = window.innerHeight;

  if (window.scrollY >= viewportHeight * 0.3) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
