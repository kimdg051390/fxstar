const fs = require("fs");
const path = require("path");
const axios = require("axios");

const { investing } = require("investing-com-api");

const NAQ_FILE = path.join(__dirname, "../data/game/naq.json");

// NAQ_FILE.json 파일이 없으면 초기화
if (!fs.existsSync(NAQ_FILE)) {
  fs.writeFileSync(NAQ_FILE, JSON.stringify([]));
}

// Binance 데이터 가져오기 및 기록 함수
async function fetchNaqData() {
  try {
    // 기존 데이터 읽기
    const existingData = readNaqData();

    // Binance API 요청
    const response = await investing("indices/nq-100", "P1M", "PT1M", 120); // With optional params

    const data1 = response;

    const data = data1;

    // 데이터 가공 및 저장
    const formattedData = data.map((item, index) => {
      const [timestamp, open, high, low, close] = [
        item.date,
        parseFloat(item.price_open),
        parseFloat(item.price_high),
        parseFloat(item.price_low),
        parseFloat(item.price_close),
      ];

      const koreaTime = new Date(timestamp).toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
      });

      const timeObj = new Date(koreaTime);
      const hours = timeObj.getHours();
      const minutes = timeObj.getMinutes();
      const session = hours * 60 + minutes + 1; // 회차 계산

      return {
        time: `${session}회`,
        open,
        high,
        low,
        close,
        result: close > open ? "매수" : "매도", // 결과 계산
      };
    });

    // 기존 데이터와 새로운 데이터를 병합
    const mergedData = [...existingData, ...formattedData];

    // 중복 제거 (timestamp 기준)
    const uniqueData = Array.from(
      new Map(mergedData.map((item) => [item.time, item])).values()
    );

    // NAQ_FILE.json에 저장
    fs.writeFileSync(NAQ_FILE, JSON.stringify(formattedData, null, 2), "utf8");
  } catch (error) {
    console.error("gold 데이터 가져오기 오류:", error.message);
  }
}

// NAQ_FILE.json 읽기 함수
function readNaqData() {
  try {
    return JSON.parse(fs.readFileSync(NAQ_FILE, "utf8"));
  } catch (error) {
    console.error("NAQ_FILE.json 읽기 오류:", error.message);
    return [];
  }
}

module.exports = {
  fetchNaqData,
  readNaqData,
};
