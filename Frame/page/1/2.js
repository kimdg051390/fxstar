// 팝업 열기
function showNoticePopup() {
  document.getElementById("notice-popup").style.display = "flex";
}

// 팝업 닫기
function closeNoticePopup() {
  document.getElementById("notice-popup").style.display = "none";
}

// 입금/출금 선택에 따라 필드 표시 제어
function toggleTransactionFields() {
  const withdrawalFields = document.getElementById("withdrawal-fields");
  const depositFields = document.getElementById("deposit-fields");
  const questionFields = document.getElementById("question-fields");
  const transactionType = document.querySelector(
    'input[name="transaction-type"]:checked'
  ).value;

  if (transactionType === "withdrawal") {
    withdrawalFields.style.display = "block"; // 출금 시 추가 필드 표시
    depositFields.style.display = "block"; // 입금 시 추가 필드 ��기기
    questionFields.style.display = "none"; // 계��문의 경우 추가 필드 ��기기
  } else if (transactionType === "deposit") {
    withdrawalFields.style.display = "none"; // 입금 시 추가 필드 숨기기
    depositFields.style.display = "block"; // 입금 시 추가 필드 ��기기
    questionFields.style.display = "none"; // 계��문의 경우 추가 필드 ��기기
  } else {
    // 계좌문의
    questionFields.style.display = "flex"; // 계��문의 경우 추가 필드 ��기기
    withdrawalFields.style.display = "none"; // 입금 시 추가 필드 숨기기
    depositFields.style.display = "none"; // 입금 시 추가 필드 ��기기
  }
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

document
  .getElementById("transaction-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const transactionType = document.querySelector(
      'input[name="transaction-type"]:checked'
    ).value;
    const amount = document.getElementById("amount").value;
    const bank =
      transactionType === "withdrawal"
        ? document.getElementById("bank").value
        : "";
    const accountHolder =
      transactionType === "withdrawal"
        ? document.getElementById("account-holder").value
        : "";
    const accountNumber =
      transactionType === "withdrawal"
        ? document.getElementById("account-number").value
        : "";

    const requestBody = {
      transactionType,
      amount,
      bank,
      accountHolder,
      accountNumber,
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 쿠키 포함
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message); // 성공 메시지 표시
        closePopup("notice-popup"); // 팝업 닫기
      } else {
        alert(`신청 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("신청 중 오류 발생:", error);
      alert("신청 중 오류가 발생했습니다.");
    }
  });

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/user-transactions", {
      method: "GET",
      credentials: "include", // 쿠키 포함
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`신청 내역을 가져오지 못했습니다: ${error.message}`);
      return;
    }

    const transactions = await response.json();
    populateTable(transactions);
  } catch (err) {
    console.error("신청 내역 가져오기 중 오류 발생:", err);
    alert("신청 내역을 가져오는 중 오류가 발생했습니다.");
  }
});

// 테이블에 데이터 채우기
function populateTable(transactions) {
  const tbody = document.querySelector(".notice-table tbody");
  tbody.innerHTML = ""; // 기존 데이터 초기화

  transactions.forEach((transaction, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${
        transaction.transactionType === "deposit"
          ? "입금"
          : transaction.transactionType === "withdrawal"
          ? "출금"
          : "계좌문의"
      }</td>
      <td>${transaction.amount}</td>
      <td>${
        transaction.isAnswered === null
          ? "답변 대기"
          : transaction.isAnswered
          ? `<strong data-title="${transaction.answerTitle}" data-content="${transaction.answerContent}" onclick="showAnswer(this)">답변 완료🔽</strong>`
          : "답변 없음"
      }</td>
    `;

    tbody.appendChild(row);
  });
}

// 답변 보여주는 함수
function showAnswer(element) {
  const popup = document.getElementById("answer-popup");
  const popupTitle = document.getElementById("answer-popup-title");
  const popupDescription = document.getElementById("answer-popup-description");

  // 답변 제목과 내용을 설정
  popupTitle.textContent = element.dataset.title || "답변 제목 없음";
  popupDescription.textContent = element.dataset.content || "답변 내용 없음";

  // 팝업 표시
  popup.style.display = "flex";
}

// 팝업 닫기 함수
function closeAnswerPopup() {
  const popup = document.getElementById("answer-popup");
  popup.style.display = "none";
}
