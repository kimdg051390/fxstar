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

// 로그인
document
  .querySelector("#login-popup form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const credentials = {
      id: document.getElementById("login-username").value,
      password: document.getElementById("login-password").value,
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 쿠키를 포함하여 요청
        body: JSON.stringify(credentials),
      });

      console.log(response);

      if (!response.ok) {
        const error = await response.json();
        alert(error.message);
        return;
      }

      const result = await response.json();
      showAlert(`${result.user.name}님, 환영합니다!`);
      closePopup("login-popup");
      checkLoginStatus();
    } catch (err) {
      console.error(err);
      showAlert("로그인 중 오류가 발생했습니다.", "dfsdf");
    }
  });

// 로그인 상태 확인
async function checkLoginStatus() {
  const loginButton = document.getElementById("login-button");
  try {
    const response = await fetch("/api/protected", {
      method: "GET",
      credentials: "include", // 쿠키를 포함하여 요청
    });

    if (response.ok) {
      const data = await response.json();
      loginButton.textContent = "로그아웃";
      loginButton.setAttribute("onclick", "logout()"); // 로그아웃 함수로 변경
      return true; // 로그인 상태
    } else {
      loginButton.textContent = "로그인";
      loginButton.setAttribute("onclick", "showPopup('login-popup')");
      return false; // 비로그인 상태
    }
  } catch (err) {
    console.error(err);
    return false; // 비로그인 상태
  }
}
// 로그아웃 함수
async function logout() {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include", // 쿠키 포함
    });

    if (response.ok) {
      showAlert("로그아웃 성공!");
      const loginButton = document.getElementById("login-button");
      loginButton.textContent = "로그인";
      loginButton.setAttribute("onclick", "showPopup('login-popup')"); // 다시 로그인 팝업 열기로 변경
    } else {
      const error = await response.json();
      alert(`로그아웃 실패: ${error.message}`);
    }
  } catch (err) {
    console.error("로그아웃 중 오류:", err);
    alert("로그아웃 중 오류가 발생했습니다.");
  }
}

// 페이지 로드 시 공지사항 데이터 로드
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
});
