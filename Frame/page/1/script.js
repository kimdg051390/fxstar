function searchPosts() {
  // 검색 기능 구현 (필요 시 JavaScript 추가)
  const input = document.getElementById("search-input").value.toLowerCase();
  const rows = document.querySelectorAll(".notice-table tbody tr");

  rows.forEach((row) => {
    const title = row
      .querySelector("td:nth-child(2) a")
      .textContent.toLowerCase();
    if (title.includes(input)) {
      row.style.display = ""; // 검색어가 포함된 행은 표시
    } else {
      row.style.display = "none"; // 검색어가 없는 행은 숨기기
    }
  });
}


