const axios = require("axios");

// Binance API 요청
const response = await axios.get(
  `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1440`
);

console.log(response.data.length);
