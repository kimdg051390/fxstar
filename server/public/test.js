document.getElementById("login-form").addEventListener("submit", async (e) => {
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

    const outputDiv = document.getElementById("output");
    outputDiv.style.display = "block";

    if (!response.ok) {
      const error = await response.json();
      outputDiv.innerHTML = `<p style="color: red;">로그인 실패: ${error.message}</p>`;
      return;
    }

    const result = await response.json();
    outputDiv.innerHTML = `<p style="color: green;">${result.user.name}님, 로그인 성공!</p>`;

    // 쿠키 확인
    checkCookies();
  } catch (err) {
    console.error(err);
    document.getElementById(
      "output"
    ).innerHTML = `<p style="color: red;">오류 발생: ${err.message}</p>`;
  }
});

function checkCookies() {
  // 현재 저장된 쿠키 출력
  const cookies = document.cookie;
  const outputDiv = document.getElementById("output");

  if (cookies) {
    outputDiv.innerHTML += `<p>저장된 쿠키: <strong>${cookies}</strong></p>`;
  } else {
    outputDiv.innerHTML += `<p>쿠키가 저장되지 않았습니다.</p>`;
  }
}
