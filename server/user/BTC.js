const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BTC_FILE = path.join(__dirname, "../data/game/btc.json");

// BTC.json 파일이 없으면 초기화
if (!fs.existsSync(BTC_FILE)) {
  fs.writeFileSync(BTC_FILE, JSON.stringify([]));
}

// Binance 데이터 가져오기 및 기록 함수
async function fetchBinanceData() {
  try {
    // 기존 데이터 읽기
    const existingData = readBTCData();

    // Binance API 요청
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1440`
    );

  
    const data1 = response.data;

    const data = data1;


    // 데이터 가공 및 저장
    const formattedData = data.map((item, index) => {
      const [timestamp, open, high, low, close] = [
        item[0],
        parseFloat(item[1]),
        parseFloat(item[2]),
        parseFloat(item[3]),
        parseFloat(item[4]),
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

    // BTC.json에 저장
    fs.writeFileSync(BTC_FILE, JSON.stringify(formattedData, null, 2), "utf8");
  } catch (error) {
    console.error("Binance 데이터 가져오기 오류:", error.message);
  }
}

// BTC.json 읽기 함수
function readBTCData() {
  try {
    return JSON.parse(fs.readFileSync(BTC_FILE, "utf8"));
  } catch (error) {
    console.error("BTC.json 읽기 오류:", error.message);
    return [];
  }
}

module.exports = {
  fetchBinanceData,
  readBTCData,
};
