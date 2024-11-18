// 금액 버튼 클릭 시 투자 금액 업데이트
document.querySelectorAll(".amount-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const amount = parseInt(e.target.dataset.amount);
    const entryInput = document.getElementById("entryPrice");
    const currentAmount = parseInt(entryInput.value) || 0;
    entryInput.value = currentAmount + amount; // 투자 금액에 버튼 값 추가
    const winmoney = document.getElementById("profitAmount");
    winmoney.textContent =
      "+" + ((currentAmount + amount) * 1.88).toLocaleString() + "원";
  });
});

let tradeFlag = 0;

// 한국 시간으로 회차 및 남은 시간 업데이트
function updateRoundInfo() {
  const now = new Date(); // 현재 로컬 시간
  // 한국 시간 계산
  const koreaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );

  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const seconds = koreaTime.getSeconds();

  const roundNumber = hours * 60 + minutes + 1; // 회차 (1부터 시작)
  const remainingSeconds = 50 - seconds; // 남은 초
  document.getElementById("roundNumber").textContent = `${roundNumber}회차`;
  document.getElementById("countdown").textContent = `${
    remainingSeconds > 0 ? remainingSeconds : "--"
  }초`;
  const overlay = document.getElementById("overlay");
  const nextCountdown = document.getElementById("nextCountdown");
  const progressBar = document.getElementById("progress-bar");
  if (remainingSeconds <= 10 && remainingSeconds > 0) {
    progressBar.style.background = "linear-gradient(45deg, #FF6347, #FF4500)"; // 빨간색
    document.getElementById("countdown").style.color = "red";
  } else if (remainingSeconds > 10) {
    progressBar.style.background = "linear-gradient(45deg, #00BFFF, #1E90FF)"; // 파란색
    document.getElementById("countdown").style.color = "blue";
    overlay.style.display = "none";
    if (remainingSeconds == 50) {
      loadBTCData2();
      if (tradeFlag == 1) {
        const currentPrice = parseFloat(
          document.getElementById("right-text").innerText
        );
        const time = `${roundNumber - 1}회차`;
        resultTrade(currentPrice, time);
        document.getElementById("entryPrice").value = 0;
        document.getElementById("profitAmount").textContent = "+0원";
      }
      tradeFlag = 0;
    }
  } else {
    overlay.style.display = "flex"; // 오버레이 표시
    nextCountdown.textContent = 10 + remainingSeconds;
  }

  if (tradeFlag == 1) {
    overlay.style.display = "flex"; // 오버레이 표시
    nextCountdown.textContent = 60 - seconds;
  }
  progressBar.style.width = `${(remainingSeconds / 50) * 100}%`; // 남은 초를 비율로 계산
}

// 페이지 로드 시 회차 및 남은 시간 초기화
updateRoundInfo();

// 1초마다 회차 및 남은 시간 업데이트
setInterval(updateRoundInfo, 1000);

// 좌측 테이블 채우기
async function loadBTCData2() {
  try {
    const response = await fetch("/api/naq");
    const btcData = await response.json();

    const tableBody = document.querySelector("#dataTable tbody");
    tableBody.innerHTML = ""; // 기존 테이블 내용 초기화

    btcData.reverse(); // 데이터 역순 정렬
    //btcData.shift(); // 첫 번째 데이터 제거
    btcData.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.time}</td>
        <td>${entry.open.toFixed(2)}</td>
        <td>${entry.high.toFixed(2)}</td>
        <td>${entry.low.toFixed(2)}</td>
        <td>${entry.close.toFixed(2)}</td>
        <td class="${entry.result === "매도" ? "result sell" : "result buy"}">${
        entry.result
      }</td>
      `;
      tableBody.appendChild(tr);
    });

    // 우측 슈 데이터 업데이트
    const superDataGrid = document.getElementById("superDataGrid");
    superDataGrid.innerHTML = ""; // 기존 데이터 초기화

    let prevType = null;
    let switchCount = 0;
    let buyCount = 0;
    let sellCount = 0;

    btcData.reverse().forEach((entry) => {
      const type = entry.result === "매도" ? "sell" : "buy";

      // 전환 시 새로운 열(column) 생성
      if (!prevType || prevType !== type) {
        const column = document.createElement("div");
        column.classList.add("column");
        superDataGrid.appendChild(column);
        currentColumn = column; // 현재 작업할 열 업데이트
        switchCount++; // 전환 횟수 증가
      }

      // 점(dot) 생성
      const dot = document.createElement("div");
      dot.classList.add("dot", type);
      currentColumn.appendChild(dot); // 현재 열에 점 추가

      // 매수/매도 카운트
      if (type === "buy") buyCount++;
      else sellCount++;

      // 전환 횟수 계산
      if (prevType && prevType !== type) switchCount++;
      prevType = type;

      // 스크롤을 항상 우측 끝으로 이동
      setTimeout(() => {
        superDataGrid.scrollLeft = superDataGrid.scrollWidth;
      }, 0); // DOM 업데이트 후 실행
    });

    // 매수/매도 비율 및 전환 횟수 업데이트
    const totalCount = buyCount + sellCount;
    document.getElementById("buyCount").textContent = `매수: ${buyCount}회 (${(
      (buyCount / totalCount) *
      100
    ).toFixed(1)}%)`;
    document.getElementById(
      "sellCount"
    ).textContent = `매도: ${sellCount}회 (${(
      (sellCount / totalCount) *
      100
    ).toFixed(1)}%)`;
    document.getElementById(
      "switchCount"
    ).textContent = `전환: ${switchCount}회`;
  } catch (error) {
    console.error("BTC 데이터 로드 오류:", error.message);
  }
}
// 좌측 테이블 채우기
async function loadBTCData() {
  try {
    const response = await fetch("/api/naq");
    const btcData = await response.json();

    const tableBody = document.querySelector("#dataTable tbody");
    tableBody.innerHTML = ""; // 기존 테이블 내용 초기화

    btcData.reverse(); // 데이터 역순 정렬
    btcData.shift(); // 첫 번째 데이터 제거
    for (const entry of btcData) {
      if (entry.time === "1440회") break; // "1회"가 나오면 반복 종료

      const tr = document.createElement("tr");
      tr.innerHTML = `
    <td>${entry.time}</td>
    <td>${entry.open.toFixed(2)}</td>
    <td>${entry.high.toFixed(2)}</td>
    <td>${entry.low.toFixed(2)}</td>
    <td>${entry.close.toFixed(2)}</td>
    <td class="${entry.result === "매도" ? "result sell" : "result buy"}">${
        entry.result
      }</td>
  `;
      tableBody.appendChild(tr);
    }

    // 우측 슈 데이터 업데이트
    const superDataGrid = document.getElementById("superDataGrid");
    superDataGrid.innerHTML = ""; // 기존 데이터 초기화

    let prevType = null;
    let switchCount = 0;
    let buyCount = 0;
    let sellCount = 0;

    btcData.reverse().forEach((entry) => {
      const type = entry.result === "매도" ? "sell" : "buy";

      // 전환 시 새로운 열(column) 생성
      if (!prevType || prevType !== type) {
        const column = document.createElement("div");
        column.classList.add("column");
        superDataGrid.appendChild(column);
        currentColumn = column; // 현재 작업할 열 업데이트
        switchCount++; // 전환 횟수 증가
      }

      // 점(dot) 생성
      const dot = document.createElement("div");
      dot.classList.add("dot", type);
      currentColumn.appendChild(dot); // 현재 열에 점 추가

      // 매수/매도 카운트
      if (type === "buy") buyCount++;
      else sellCount++;

      // 전환 횟수 계산
      if (prevType && prevType !== type) switchCount++;
      prevType = type;

      // 스크롤을 항상 우측 끝으로 이동
      setTimeout(() => {
        superDataGrid.scrollLeft = superDataGrid.scrollWidth;
      }, 0); // DOM 업데이트 후 실행
    });

    // 매수/매도 비율 및 전환 횟수 업데이트
    const totalCount = buyCount + sellCount;
    document.getElementById("buyCount").textContent = `매수: ${buyCount}회 (${(
      (buyCount / totalCount) *
      100
    ).toFixed(1)}%)`;
    document.getElementById(
      "sellCount"
    ).textContent = `매도: ${sellCount}회 (${(
      (sellCount / totalCount) *
      100
    ).toFixed(1)}%)`;
    document.getElementById(
      "switchCount"
    ).textContent = `전환: ${switchCount}회`;
  } catch (error) {
    console.error("BTC 데이터 로드 오류:", error.message);
  }
}
loadBTCData(); // 초기 실행

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

//매도 매수
document.getElementById("buyBtn").addEventListener("click", () => {
  handleTrade("매수");
});

document.getElementById("sellBtn").addEventListener("click", () => {
  handleTrade("매도");
});
// 잔고 같이 차감
async function handleTrade(type) {
  const entryPrice = parseFloat(document.getElementById("entryPrice").value);
  const currentPrice = parseFloat(
    document.getElementById("right-text").innerText
  );
  const time = document.getElementById("roundNumber").textContent;

  if (isNaN(entryPrice) || entryPrice <= 0) {
    alert("투자 금액을 입력하세요.");
    return;
  }

  try {
    const response = await fetch("/api/naq/trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
      body: JSON.stringify({
        tradeType: type,
        entryPrice,
        currentPrice,
        time,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`거래 실패: ${error.message}`);
      return;
    }

    const result = await response.json();
    tradeFlag = 1;
  } catch (error) {
    console.error("거래 요청 중 오류:", error);
    alert("거래 요청 중 오류가 발생했습니다.");
  }

  const requestData = {};
  const moneyText = document.getElementById("mymoney").innerText;

  // 쉼표 제거
  const moneyWithoutCommas = moneyText.replace(/,/g, "");
  requestData.balance = parseInt(moneyWithoutCommas - entryPrice, 10);
  try {
    const response = await fetch("/api/user-info/balance", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`정보 수정 실패: ${error.message}`);
      return;
    }

    const result = await response.json();
    // 수정 후 필요한 작업 수행
  } catch (error) {
    console.error("정보 수정 중 오류:", error.message);
    alert("정보 수정 중 오류가 발생했습니다.");
  }

  loadUserInfo();
}

// 시간종료 후 결과 저장 및 잔고 반영
async function resultTrade(resultPrice, time) {
  entry = 0;
  winlose = "";
  try {
    const response = await fetch("/api/game/add-result-naq", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ time, resultPrice }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`결과 저장 실패: ${error.message}`);
      return;
    }

    const result = await response.json();
    console.log("저장된 데이터:", result.updatedTrade);

    entry = result.updatedTrade.entryPrice;
    winlose = result.updatedTrade.result;
  } catch (error) {
    console.error("결과 저장 중 오류:", error);
    alert("결과 저장 중 오류가 발생했습니다.");
  }

  const requestData = {};
  const moneyText = document.getElementById("mymoney").innerText;

  // 쉼표 제거
  const moneyWithoutCommas = moneyText.replace(/,/g, "");

  amount = entry * 1.88;
  requestData.balance = parseInt(
    winlose == "win"
      ? parseInt(moneyWithoutCommas) + amount
      : moneyWithoutCommas,
    10
  );

  try {
    const response = await fetch("/api/user-info/balance", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`정보 수정 실패: ${error.message}`);
      return;
    }

    const result = await response.json();
    console.log("성공");
    // 수정 후 필요한 작업 수행
  } catch (error) {
    console.error("정보 수정 중 오류:", error.message);
    alert("정보 수정 중 오류가 발생했습니다.");
  }
  loadUserInfo();
}

async function loadUserInfo() {
  try {
    // API 호출
    const response = await fetch("/api/user-info", {
      method: "GET",
      credentials: "include", // 쿠키 포함
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/index.html"; // 로그인 페이지로 이동
        return;
      }
      const error = await response.json();
      throw new Error(error.message);
    }

    const userInfo = await response.json();
    document.getElementById("mymoney").innerText = formatNumberWithCommas(
      userInfo.balance
    );
  } catch (error) {
    console.error("사용자 정보 가져오기 중 오류:", error.message);
    alert("사용자 정보를 불러오는 데 실패했습니다.");
  }
}
loadUserInfo();

function formatNumberWithCommas(number) {
  let [integer, decimal] = number.toString().split("."); // 정수부와 소수부 분리
  let formatted = "";
  while (integer.length > 3) {
    formatted = "," + integer.slice(-3) + formatted;
    integer = integer.slice(0, -3);
  }
  formatted = integer + formatted; // 남은 정수 붙이기
  return decimal ? `${formatted}.${decimal}` : formatted; // 소수부 붙이기
}
