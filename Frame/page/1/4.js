function rotateSteps() {
  // 모든 단계에서 active 클래스 제거
  steps.forEach((step) => step.classList.remove("active"));

  // 현재 단계에 active 클래스 추가
  steps[currentStep].classList.add("active");

  // 다음 단계로 이동
  currentStep = (currentStep + 1) % steps.length;
}

// 2초마다 rotateSteps 함수 실행
setInterval(rotateSteps, 2000);
