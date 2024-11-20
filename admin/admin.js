//변수

let noticeData = [];
let editIndex = null;
let editAccount = null;
function convertToKST(utcTime) {
  const utcDate = new Date(utcTime); // UTC 시간 생성
  const options = {
    timeZone: "Asia/Seoul", // 한국 시간대
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Intl.DateTimeFormat("ko-KR", options).format(utcDate); // 한국 시간 포맷
}

// 카테고리 전환
function showSection(sectionId) {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => section.classList.remove("active"));

  const targetSection = document.getElementById(sectionId);
  targetSection.classList.add("active");

  // 각 섹션에 맞는 데이터 로드
  if (sectionId === "user-management") loadUsers();
  if (sectionId === "notice-management") loadNotices();
  if (sectionId === "ranking-management") loadRanks();
  if (sectionId === "account-management") loadAccounts();
  if (sectionId === "game-management") loadGameData("btc");
  if (sectionId === "usergame-management") fetchTrades();
}

// 사용자 데이터 로드
async function loadUsers() {
  try {
    const response = await fetch("/api/users");
    const users = await response.json();

    const tbody = document.querySelector("#user-table tbody");
    tbody.innerHTML = ""; // 기존 데이터 초기화

    users.forEach((user) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.password}</td>
        <td>${user.name}</td>
        <td>${user.phone}</td>
        <td>${user.email}</td>
        <td>${user.account}</td>
        <td>${user.residentNumber}</td>
        <td>${user.partner}</td>
        <td>${(user.balance || 0).toLocaleString()}원</td>
        <td>${(user.win || 0).toLocaleString()}원</td>
        <td>${(user.inmoney || 0).toLocaleString()}원</td>
        <td>${(user.outmoney || 0).toLocaleString()}원</td>
        <td>${(user.total || 0).toLocaleString()}원</td>
        <td>${
          user.lastLogin ? convertToKST(user.lastLogin) : "로그인 기록 없음"
        }</td>
        <td>${user.lastIp}</td>
        <td><button onclick="editUser(this)">수정</button></td>
        
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

function editUser(button) {
  const row = button.closest("tr"); // 클릭된 버튼의 행
  const cells = row.querySelectorAll("td"); // 행의 모든 셀

  // ID는 수정하지 않도록 설정
  const editableCells = Array.from(cells).slice(1, -7); // 마지막 셀(버튼)은 제외

  // 기존 텍스트를 input 필드로 변환
  editableCells.forEach((cell) => {
    const value = cell.innerText;
    cell.innerHTML = `<input type="text" value="${value}" />`;
  });

  // 버튼을 "완료"로 변경
  button.textContent = "완료";
  button.className = "complete-btn";
  button.onclick = () => saveEdit(button); // 완료 시 saveEdit 호출
}

function extractNumber(value) {
  return value.replace(/[^0-9]/g, ""); // 숫자가 아닌 문자를 제거
}

// 수정 데이터 서버로 전송
async function saveEdit(button) {
  const row = button.closest("tr");
  const cells = row.querySelectorAll("td");

  const updatedUser = {
    id: cells[0].innerText, // ID는 수정 불가
    password: cells[1].querySelector("input").value,
    name: cells[2].querySelector("input").value,
    phone: cells[3].querySelector("input").value,
    email: cells[4].querySelector("input").value,
    account: cells[5].querySelector("input").value,
    residentNumber: cells[6].querySelector("input").value,
    partner: cells[7].querySelector("input").value,
    balance: extractNumber(cells[8].querySelector("input").value),
  };

  try {
    const response = await fetch("/api/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    });

    if (!response.ok) {
      throw new Error("회원 정보 수정 실패");
    }

    const result = await response.json();
    alert(result.message);

    // 버튼을 다시 "수정"으로 변경
    button.textContent = "수정";
    button.className = "edit-btn";
    button.onclick = () => startEdit(button);
  } catch (err) {
    console.error(err);
    alert("수정 중 오류가 발생했습니다.");
  }
}

// 랭킹 데이터 로드
async function loadRanks() {
  const response = await fetch("/api/ranks");
  const ranks = await response.json();

  const tbody = document.querySelector("#rank-table tbody");
  tbody.innerHTML = "";

  ranks.forEach((rank) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rank.rank}</td>
      <td>${rank.name}</td>
      <td>${rank.profit}</td>
      <td>${rank.game}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.editNotice = function (index) {
  console.log("Edit Notice Called with Index:", index);
  // 수정 로직 구현
  editIndex = index + 1; // 수정 중인 공지사항의 인덱스를 저장
  const notice = noticeData[index];

  // 팝업 열기 및 기존 데이터 채우기
  document.getElementById("popup-title").innerText = "공지사항 수정";
  document.getElementById("notice-title").value = notice.title;
  document.getElementById("notice-content").value = notice.content;
  // 완료 버튼에 수정 기능 연결
  const completeButton = document.getElementById("popup-complete-btn");
  completeButton.onclick = () => updateNotice(index + 1);

  document.getElementById("notice-popup").style.display = "flex";
};

async function loadNotices() {
  try {
    const response = await fetch("/api/notices");
    noticeData = await response.json();

    const tbody = document.querySelector("#notice-table tbody");
    tbody.innerHTML = ""; // 기존 데이터 초기화

    noticeData.forEach((notice, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${notice.title}</td>
        <td>${notice.content}</td>
        <td>${new Date(notice.date).toLocaleDateString("ko-KR")}</td>
        <td><button onclick="editNotice(${index})">수정</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading notices:", err);
  }
}
// 공지사항 팝업 열기
function openNoticePopup() {
  document.getElementById("notice-popup").style.display = "flex";
}

// 공지사항 팝업 닫기
function closeNoticePopup() {
  document.getElementById("notice-popup").style.display = "none";
}
// 공지사항 제출
async function submitNotice() {
  const title = document.getElementById("notice-title").value;
  const content = document.getElementById("notice-content").value;

  if (!title || !content) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message);
      return;
    }

    const result = await response.json();
    alert(result.message);

    // 팝업 닫기 및 입력 필드 초기화
    closeNoticePopup();
    document.getElementById("notice-form").reset();

    // 테이블 새로고침
    loadNotices();
  } catch (err) {
    console.error("Error submitting notice:", err);
  }
}

// 공지사항 업데이트
async function updateNotice() {
  const title = document.getElementById("notice-title").value;
  const content = document.getElementById("notice-content").value;

  if (!title || !content) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  try {
    // 서버로 수정된 공지사항 데이터 전송
    const response = await fetch(`/api/notices/${editIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message);
      return;
    }

    const result = await response.json();
    alert(result.message);

    closeNoticePopup(); // 팝업 닫기
    loadNotices(); // 테이블 새로고침
  } catch (err) {
    console.error("Error updating notice:", err);
  }
}

// 공지사항 삭제
function deleteNotice(index) {
  // 삭제 로직 구현
}

// 랭킹 추가
function addRank() {
  // 새 랭킹 추가 로직 구현
}
let accountData = []; // 전체 데이터를 저장하는 배열
async function loadAccounts() {
  try {
    const response = await fetch("/api/all-transactions");
    accountData = await response.json();

    const tbody = document.querySelector("#account-table tbody");
    tbody.innerHTML = ""; // 기존 데이터 초기화

    accountData.reverse().forEach((account, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${account.index}</td>
        <td>${
          account.transactionType == "deposit"
            ? "입금"
            : account.transactionType == "withdrawal"
            ? "출금"
            : "계좌문의"
        }</td>
        <td>${
          account.isAnswered == null ? "답변 대기" : account.isAnswered
        }</td>
        <td>${convertToKST(account.timestamp)}</td>
        <td>${account.name}</td>
        <td>${account.amount}</td>
        <td>${account.accountNumber} (${
        account.bank == "kookmin"
          ? "국민은행"
          : account.bank == "woori"
          ? "우리은행"
          : account.bank == "hana"
          ? "하나은행"
          : account.bank == "shinhan"
          ? "신한은행"
          : account.bank
      } / ${account.accountHolder})</td>
        <td>${
          account.isAnswered == null
            ? "<button onclick=\"openAndswerPopup('" +
              account.index +
              "')\">답변</button>"
            : ""
        }</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading notices:", err);
  }
}

// 입출금 신청 답변 팝업 열기
function openAndswerPopup(target) {
  editAccount = target;
  document.getElementById("account-popup").style.display = "flex";
}

// 입출금 신청 답변 팝업 닫기
function closeAndswerPopup() {
  document.getElementById("account-popup").style.display = "none";
}

function submitAnswer() {
  const transactionId = editAccount;
  const title = document.getElementById("account-title").value; // 답변 제목
  const content = document.getElementById("account-content").value; // 답변 내용

  if (!transactionId || !title || !content) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  // API 요청 본문 생성
  const requestBody = {
    answerTitle: title, // 답변 완료 상태로 설정
    answerContent: content,
  };

  // API 호출
  fetch(`/api/all-transactions/${transactionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("거래 정보를 업데이트할 수 없습니다.");
      }
      return response.json();
    })
    .then((data) => {
      alert("거래 답변이 성공적으로 저장되었습니다.");
      closeAndswerPopup(); // 팝업 닫기 함수 호출
    })
    .catch((error) => {
      alert(error.message);
    });
}

// 필터링된 데이터로 테이블 업데이트
function filterAndRenderTable() {
  const typeFilters = Array.from(
    document.querySelectorAll(".transaction-type-filter:checked")
  ).map((checkbox) => checkbox.value);

  const statusFilters = Array.from(
    document.querySelectorAll(".status-filter:checked")
  ).map((checkbox) => checkbox.value);

  const nameFilter = document.getElementById("name-search").value.toLowerCase();
  const timeRange = document.getElementById("time-range-filter").value;

  let startDate = null;
  let endDate = new Date(); // 현재 시간 기준 종료일

  // 접수 시간 범위 처리
  if (timeRange === "1d") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - 1); // 최근 1일
  } else if (timeRange === "1w") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - 7); // 최근 1주일
  } else if (timeRange === "1m") {
    startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1); // 최근 1개월
  } else if (timeRange === "custom") {
    // 사용자 입력 값에서 직접 범위 가져오기
    startDate = new Date(document.getElementById("start-date").value);
    endDate = new Date(document.getElementById("end-date").value);
  }

  // 필터링 로직
  const filteredData = accountData.filter((account) => {
    const accountDate = new Date(account.timestamp);
    const matchesType =
      typeFilters.length === 0 || typeFilters.includes(account.transactionType);
    const matchesStatus =
      statusFilters.length === 0 ||
      (account.isAnswered === null && statusFilters.includes("waiting")) ||
      (account.isAnswered && statusFilters.includes("answered"));
    const matchesName =
      nameFilter === "" || account.name.toLowerCase().includes(nameFilter);
    const matchesDate =
      timeRange === "all" ||
      (accountDate >= startDate && accountDate <= endDate);

    return matchesType && matchesStatus && matchesName && matchesDate;
  });

  renderTable(filteredData); // 필터링된 데이터를 테이블에 렌더링
}

// 시간 범위 선택 이벤트 처리
document.getElementById("time-range-filter").addEventListener("change", (e) => {
  const value = e.target.value;
  const customInputs = document.getElementById("custom-time-inputs");
  customInputs.style.display = value === "custom" ? "block" : "none";
});

// 테이블 데이터 렌더링
function renderTable(data) {
  const tbody = document.querySelector("#account-table tbody");
  tbody.innerHTML = ""; // 기존 데이터 초기화

  data.reverse().forEach((account, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${account.index}</td>
      <td>${
        account.transactionType === "deposit"
          ? "입금"
          : account.transactionType === "withdrawal"
          ? "출금"
          : "계좌문의"
      }</td>
      <td>${account.isAnswered == null ? "답변 대기" : "답변 완료"}</td>
      <td>${convertToKST(account.timestamp)}</td>
      <td>${account.name}</td>
      <td>${account.amount || "-"}</td>
      <td>${account.accountNumber || "-"}</td>
      <td>
        ${
          account.isAnswered == null
            ? "<button onclick=\"openAndswerPopup('" +
              account.index +
              "')\">답변</button>"
            : ""
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 검색 버튼 클릭 이벤트 등록
document
  .getElementById("filter-search-btn")
  .addEventListener("click", filterAndRenderTable);

// 검색 버튼 클릭 이벤트 등록
document
  .getElementById("usergame-filter-search-btn")
  .addEventListener("click", usergamefilterAndRenderTable);
// API 호출로 데이터를 로드하는 함수
async function loadGameData(type) {
  try {
    const response = await fetch(`/api/${type}`);
    if (!response.ok) {
      throw new Error(`${type.toUpperCase()} 데이터 가져오기 실패`);
    }
    const buttons = document.querySelectorAll(".data-selector button");
    buttons.forEach((button) => button.classList.remove("active")); // 모든 버튼에서 active 제거

    // 현재 클릭한 버튼에 active 추가
    const activeButton = document.querySelector(
      `button[onclick="loadData('${type}')"]`
    );
    if (activeButton) activeButton.classList.add("active");

    const data = await response.json();

    renderGameTable(data);
  } catch (error) {
    console.error(error.message);
    alert(`데이터를 가져오는 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 테이블 데이터를 렌더링하는 함수
function renderGameTable(data) {
  const tbody = document.querySelector("#game-table tbody");
  tbody.innerHTML = ""; // 기존 데이터 초기화

  data.reverse(); // 데이터 역순 정렬
  data.shift(); // 첫 번째 데이터 제거

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.time}</td>
      <td>${item.open.toLocaleString()}</td>
      <td>${item.high}</td>
      <td>${item.low}</td>
      <td>${item.close}</td>
      <td>${item.result}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 서버에서 데이터를 가져온 후 테이블에 필터 적용 및 렌더링
let globalUserGameData = []; // 데이터를 전역적으로 저장
async function fetchTrades(type = "btc", startDate, endDate) {
  try {
    // 오늘 날짜 기본값
    const today = getKoreanISOString().split("T")[0];
    const start = startDate || today;
    const end = endDate || today;

    const response = await fetch(
      `/api/alltrades?startDate=${start}&endDate=${end}&type=${type}`
    );
    if (!response.ok) {
      throw new Error("데이터를 가져오는데 실패했습니다.");
    }

    const trades = await response.json();
    globalUserGameData = trades;
    renderUserGameTable(trades);
  } catch (error) {
    console.error("거래 내역을 가져오는 중 오류 발생:", error);
  }
}

function renderUserGameTable(trades) {
  const tbody = document.querySelector("#usergame-table tbody");
  tbody.innerHTML = ""; // 기존 데이터 제거

  trades.forEach((trade) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${trade.name}</td>
        <td>${trade.time || "-"}</td>
        <td>${trade.game || "-"}</td>
        <td>${
          trade.tradeType == "매수"
            ? formatNumberWithCommas(trade.entryPrice)
            : "-"
        }</td>
        <td>${
          trade.tradeType == "매수"
            ? "-"
            : formatNumberWithCommas(trade.entryPrice)
        }</td>
        <td>${formatNumberWithCommas(trade.entryPrice) || "-"}</td>
        <td>${formatNumberWithCommas(trade.profit)}</td>
        <td style="color: ${
          trade.profit > 0 ? "green" : "red"
        }; font-weight: bold;">
          ${trade.profit > 0 ? "당첨" : "낙첨"}
        </td>
      `;
    tbody.appendChild(row);
  });
}

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
// 필터링된 데이터로 테이블 업데이트
function usergamefilterAndRenderTable() {
  const typeFilters = Array.from(
    document.querySelectorAll(".transaction-type-filter:checked")
  ).map((checkbox) => checkbox.value);

  const statusFilters = Array.from(
    document.querySelectorAll(".status-filter:checked")
  ).map((checkbox) => checkbox.value);

  const nameFilter = document
    .getElementById("usergame-name-search")
    .value.toLowerCase();
  const timeRange = document.getElementById("usergame-time-range-filter").value;

  // 필터링 로직
  const filteredData = globalUserGameData.filter((record) => {
    const matchesType =
      typeFilters.length === 0 || typeFilters.includes(record.transactionType);
    const matchesStatus =
      statusFilters.length === 0 || statusFilters.includes(record.status);
    const matchesName =
      nameFilter === "" || record.name.toLowerCase().includes(nameFilter);

    return matchesType && matchesStatus && matchesName;
  });

  renderUserGameTable(filteredData); // 필터링된 데이터를 테이블에 렌더링
}
