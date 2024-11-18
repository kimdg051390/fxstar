let noticeData = [];

async function loadNotices() {
  try {
    const response = await fetch("/api/notices");
    noticeData = await response.json();

    const tbody = document.querySelector("#notice-table tbody");
    tbody.innerHTML = ""; // 기존 데이터 초기화

    noticeData.forEach((notice, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("onclick", `showNoticePopup(${index})`);
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${notice.title}</td>
        <td>${new Date(notice.date).toLocaleDateString("ko-KR")}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading notices:", err);
  }
}

// 팝업 열기
function showNoticePopup(index) {
  const notice = noticeData[index];
  if (!notice) {
    alert("공지사항 데이터를 찾을 수 없습니다.");
    return;
  }

  // 팝업에 제목과 내용 표시
  document.getElementById("popup-title").innerText = notice.title;
  document.getElementById("popup-description").innerText = notice.content;
  document.getElementById("notice-popup").style.display = "flex";
}

// 팝업 닫기
function closeNoticePopup() {
  document.getElementById("notice-popup").style.display = "none";
}

// 페이지 로드 시 공지사항 데이터 로드
loadNotices();
