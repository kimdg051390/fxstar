// 팝업 열기
function showNoticePopup() {
  document.getElementById("notice-popup").style.display = "flex";
}

// 팝업 닫기
function closeNoticePopup() {
  document.getElementById("notice-popup").style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 로그인 상태 확인
    const isLoggedIn = await checkLoginStatus();

    if (!isLoggedIn) {
      // 로그인 상태가 아닌 경우 경고창 표시 및 메인 페이지로 이동
      alert("로그인 후 접근 가능합니다.");
      window.location.href = "/index.html"; // 메인 페이지로 리다이렉트 (경로는 필요에 따라 변경)
    }
  } catch (err) {
    console.error("로그인 상태 확인 중 오류:", err);
    alert("로그인 상태를 확인할 수 없습니다. 메인 페이지로 이동합니다.");
    window.location.href = "/index.html"; // 메인 페이지로 리다이렉트
  }
});

// 로그인 상태 확인 함수
async function checkLoginStatus() {
  try {
    const response = await fetch("/api/protected", {
      method: "GET",
      credentials: "include", // 쿠키 포함
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`${data.user.name}님이 로그인 상태입니다.`);
      return true; // 로그인 상태
    } else {
      console.log("로그인되지 않음");
      return false; // 비로그인 상태
    }
  } catch (err) {
    console.error("로그인 상태 확인 중 오류:", err);
    return false; // 비로그인 상태
  }
}

// 테이블에 데이터 채우기
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/user-info", {
      method: "GET",
      credentials: "include", // 쿠키 포함
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`사용자 정보를 불러오지 못했습니다: ${error.message}`);
      return;
    }

    const userInfo = await response.json();

    // 이름, 전화번호, 이메일, 계좌정보 표시
    const userInfoDiv = document.querySelector(".container div");
    userInfoDiv.innerHTML = `
      <p><strong>이름:</strong> ${userInfo.name}</p>
      <p><strong>전화번호:</strong> ${userInfo.phone}</p>
      <p><strong>이메일:</strong> ${userInfo.email}</p>
      <p><strong>계좌정보:</strong> ${userInfo.account}</p>
    `;

    // 테이블 데이터 추가
    const tbody = document.querySelector(".notice-table tbody");
    tbody.innerHTML = `
      <tr>
        <td>${userInfo.balance.toLocaleString()}원</td>
        <td>${userInfo.win.toLocaleString()}원</td>
        <td>${userInfo.inmoney.toLocaleString()}원</td>
        <td>${userInfo.outmoney.toLocaleString()}원</td>
        <td>${userInfo.total.toLocaleString()}원</td>
      </tr>
    `;
  } catch (err) {
    console.error("사용자 정보 가져오기 중 오류 발생:", err);
    alert("사용자 정보를 불러오는 중 문제가 발생했습니다.");
  }
});

async function loadTrades() {
  const startDate =
    document.getElementById("start-date").value ||
    getKoreanISOString().split("T")[0];
  const endDate =
    document.getElementById("end-date").value ||
    getKoreanISOString().split("T")[0];

  const type = document.getElementById("type-select").value || "btc"; // 기본 종목: BTC

  try {
    const response = await fetch(
      `/api/trades?type=${type}&startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error("데이터 조회 실패");
    }

    const trades = await response.json();
    console.log(trades);
    renderTable(trades);
  } catch (error) {
    console.error("거래 내역 로드 중 오류:", error.message);
  }
}

function renderTable(data) {
  const tableBody = document.querySelector("#trade-table tbody");
  tableBody.innerHTML = ""; // 테이블 초기화

  data.forEach((trade) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight: bold;">${trade.time}</td>
      <td>${trade.game}</td>
      <td>${
        trade.tradeType === "매수"
          ? formatNumberWithCommas(trade.entryPrice)
          : "-"
      }</td>
      <td>${
        trade.tradeType === "매도"
          ? formatNumberWithCommas(trade.entryPrice)
          : "-"
      }</td>
      <td>${formatNumberWithCommas(trade.entryPrice)}</td>
      <td class="${trade.profit < 0 ? "negative" : "positive"}">
  ${trade.profit > 0 ? "+" : ""}${formatNumberWithCommas(trade.profit)}
</td>
      <td style="font-weight: bold; color: ${
        trade.profit > 0 ? "green" : "red"
      };">${trade.profit > 0 ? "당첨" : "낙첨"}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// 필터 버튼 이벤트 등록
document.getElementById("filter-button").addEventListener("click", loadTrades);

// 초기 데이터 로드 (당일)
document.addEventListener("DOMContentLoaded", () => {
  const today = getKoreanISOString().split("T")[0];
  document.getElementById("start-date").value = today;
  document.getElementById("end-date").value = today;
  loadTrades();
});
function getKoreanISOString() {
  const now = new Date();
  const kstOffset = 9 * 60; // 한국은 UTC+9 (분 단위)
  const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstDate.toISOString().replace("Z", "+09:00"); // ISO 형식으로 변환
}
function formatNumberWithCommas(number) {
  // 음수 처리
  const isNegative = number < 0;
  let absoluteNumber = Math.abs(number).toString(); // 절대값으로 처리
  let [integer, decimal] = absoluteNumber.split("."); // 정수부와 소수부 분리

  let formatted = "";
  while (integer.length > 3) {
    formatted = "," + integer.slice(-3) + formatted;
    integer = integer.slice(0, -3);
  }
  formatted = integer + formatted; // 남은 정수 붙이기

  // 음수 부호를 다시 추가
  return (
    (isNegative ? "-" : "") + (decimal ? `${formatted}.${decimal}` : formatted)
  );
}
