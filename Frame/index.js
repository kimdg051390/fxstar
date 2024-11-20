const rankingBody = document.getElementById("ranking-tbody");

function rotateRanking() {
  rankingBody.classList.add("slide-up");

  setTimeout(() => {
    rankingBody.classList.remove("slide-up");

    // 첫 번째 행을 마지막으로 이동
    const firstRow = rankingBody.querySelector("tr");
    rankingBody.appendChild(firstRow.cloneNode(true)); // 첫 번째 행 복제 후 맨 아래에 추가
    rankingBody.removeChild(firstRow); // 기존 첫 번째 행 삭제
  }, 500); // 슬라이드 애니메이션 시간과 일치하게 설정
}

// 2초마다 rotateRanking 함수 실행
setInterval(rotateRanking, 2000);

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function closePopup(popupId) {
  document.getElementById(popupId).style.display = "none";
}

function showPopup(popupId) {
  document.getElementById(popupId).style.display = "flex";
}

function showAlert(title, message) {
  const alertBackground = document.getElementById("alert-background");
  const alertPopup = document.getElementById("alert-popup");

  // 제목과 메시지 설정
  document.getElementById("alert-title").textContent = title;
  document.getElementById("alert-message").textContent = message;

  // 팝업과 배경 보이기
  alertBackground.style.display = "block";
  alertPopup.style.display = "block";
}

function closeAlert() {
  const alertBackground = document.getElementById("alert-background");
  const alertPopup = document.getElementById("alert-popup");

  // 팝업과 배경 숨기기
  alertBackground.style.display = "none";
  alertPopup.style.display = "none";
}

// 서버
// 회원가입
document
  .querySelector("#signup-popup form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const newUser = {
      id: document.getElementById("signup-id").value,
      password: document.getElementById("signup-password").value,
      name: document.getElementById("signup-name").value,
      phone: document.getElementById("signup-phone").value,
      account:
        document.getElementById("signup-account").value +
        "(" +
        document.getElementById("signup-bank").value +
        "/" +
        document.getElementById("signup-owner").value +
        ")",
      residentNumber: document.getElementById("signup-resident-number").value,
      partner: document.getElementById("signup-recommendation").value,
    };

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message);
        return;
      }

      showAlert("회원가입이 완료되었습니다.");
      closePopup("signup-popup");
    } catch (err) {
      console.error(err);
      showAlert("회원가입 중 오류가 발생했습니다.", "sdfsdfsd");
    }
  });

let noticeData = [];

async function loadNotices() {
  try {
    const response = await fetch("/api/notices");
    noticeData = await response.json(); // 서버에서 공지사항 데이터 가져오기

    const noticeList = document.getElementById("notice-list");
    noticeList.innerHTML = ""; // 기존 데이터 초기화

    noticeData.forEach((notice) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="notice-icon">Q</span><a href="./page/1/1.html"> ${notice.title}</a>`;
      noticeList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading notices:", err);
  }
}

// 페이지 로드 시 공지사항 데이터 로드
document.addEventListener("DOMContentLoaded", () => {
  loadNotices();
  checkLoginStatus();
});
