function showTabContent(tabId) {
  const contents = document.querySelectorAll(".content");
  const buttons = document.querySelectorAll(".tab-button");

  // 모든 콘텐츠와 버튼의 활성화 상태 제거
  contents.forEach((content) => content.classList.remove("active"));
  buttons.forEach((button) => button.classList.remove("active"));

  // 선택한 탭 콘텐츠와 버튼에 활성화 상태 추가
  document.getElementById(tabId).classList.add("active");
  event.target.classList.add("active");
}

const steps = document.querySelectorAll(".circle");
let currentStep = 0;

