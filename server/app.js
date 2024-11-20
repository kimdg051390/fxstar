const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const {
  readUsers,
  writeUsers,
  readInfo,
  writeInfo,
  readAccounts,
  writeAccounts,
} = require("./user/helper");
const { fetchBinanceData, readBTCData } = require("./user/BTC");
const { fetchGoldData, readGoldData } = require("./user/gold");
const { fetchNaqData, readNaqData } = require("./user/naq");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
app.use(
  cors({
    origin: "http://fxstar.kr/", // 허용할 클라이언트 주소
    credentials: true, // 쿠키 허용
  })
);
// 기타 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser()); // 쿠키 파싱 미들웨어 추가
// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public"))); // public 폴더에 정적 파일 저장
app.use(express.static(path.join(__dirname, "../Frame"))); // public 폴더에 정적 파일 저장
app.use(express.static(path.join(__dirname, "../admin"))); // public 폴더에 정적 파일 저장
const SECRET_KEY = "your_secret_key"; // JWT 시크릿 키
// 회원가입 API
app.post("/api/signup", (req, res) => {
  const {
    id,
    password,
    name,
    phone,
    email,
    account,
    residentNumber,
    partner,
    win = 0, // 기본값 0
    inmoney = 0, // 기본값 0
    outmoney = 0, // 기본값 0
    total = 0, // 기본값 0
  } = req.body;
  const users = readUsers();

  // 중복 체크
  if (users.users.some((user) => user.id === id)) {
    return res.status(400).send({ message: "아이디가 이미 존재합니다." });
  }

  // 새 유저 추가
  users.users.push({
    id,
    password,
    name,
    phone,
    email: email || null, // 이메일 기본값 null
    account: account || null, // 계좌번호 기본값 null
    residentNumber: residentNumber || null, // 주민번호 기본값 null
    partner: partner || null, // 추천인 또는 파트너 기본값 null
    balance: 0, // 잔고 기본값 0
    win: 0, // 수익 기본값 0
    inmoney: 0, // 입금 기본값 0
    outmoney: 0, // 출금 기본값 0
    total: 0, // 총금액 기본값 0
    lastLogin: null, // 마지막 로그인 기본값 null
    lastIp: null, // 마지막 IP 기본값 null
  });

  writeUsers(users);
  res.send({ message: "회원가입이 완료되었습니다." });
});

// 로그인 API
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;
  const users = readUsers();

  const user = users.users.find(
    (user) => user.id === id && user.password === password
  );

  if (!user) {
    return res
      .status(401)
      .send({ message: "아이디 또는 비밀번호가 틀렸습니다." });
  }

  // 클라이언트 IP 추출
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // 마지막 로그인 시간 업데이트
  user.lastLogin = getKoreanISOString();
  user.lastIp = clientIp;
  writeUsers(users);

  // JWT 생성
  const token = jwt.sign(
    {
      id: user.id, // 사용자 ID
      name: user.name, // 사용자 이름
    },
    SECRET_KEY,
    { expiresIn: "1h" } // 토큰 만료 시간 (1시간)
  );

  console.log("Generated Token:", token); // 디버깅용

  // JWT를 쿠키에 저장
  res.cookie("auth_token", token, {
    httpOnly: false, // JavaScript로 접근 불가
    secure: false, // HTTPS 환경에서는 true로 설정
    sameSite: "strict", // CSRF 방지
    maxAge: 60 * 60 * 1000, // 1시간 (밀리초 단위)
  });

  console.log("Set-Cookie Header Sent"); // 디버깅용

  res.send({ message: "로그인 성공", user: { id: user.id, name: user.name } });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("auth_token"); // 쿠키 삭제
  res.send({ message: "로그아웃 성공" });
});

// JWT 인증 미들웨어
function authenticateJWT(req, res, next) {
  const token = req.cookies.auth_token; // 쿠키에서 JWT 추출

  if (!token) {
    return res.status(401).send({ message: "인증 토큰이 없습니다." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).send({ message: "유효하지 않은 토큰입니다." });
    }

    req.user = user; // 토큰에서 추출한 사용자 정보 저장
    next();
  });
}

app.get("/api/protected", authenticateJWT, (req, res) => {
  res.status(200).send({ user: req.user });
});

// API: 회원 리스트 가져오기
app.get("/api/users", (req, res) => {
  const data = readUsers();
  res.json(data.users);
});

// API: 회원 정보 수정
app.post("/api/users/update", (req, res) => {
  const { id, ...updatedFields } = req.body; // 수정할 유저 ID와 업데이트 데이터
  const users = readUsers();

  // ID로 해당 유저 찾기
  const userIndex = users.users.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
  }

  // 기존 데이터를 업데이트 데이터로 덮어쓰기
  users.users[userIndex] = { ...users.users[userIndex], ...updatedFields };

  // 변경된 데이터 저장
  writeUsers(users);

  res.send({
    message: "회원 정보가 성공적으로 수정되었습니다.",
    user: users.users[userIndex],
  });
});

// API: 공지사항 가져오기
app.get("/api/notices", (req, res) => {
  const data = readInfo();
  res.json(data.notices);
});

// API: 공지사항 추가
app.post("/api/notices", (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send({ message: "제목과 내용을 입력해주세요." });
  }

  const data = readInfo();

  const newNotice = {
    id: data.notices.length + 1,
    title,
    content,
    date: getKoreanISOString(),
  };

  data.notices.push(newNotice);
  writeInfo(data);

  res
    .status(201)
    .send({ message: "공지사항이 추가되었습니다.", notice: newNotice });
});

// API: 공지사항 수정
app.put("/api/notices/:id", (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send({ message: "제목과 내용을 입력해주세요." });
  }

  const data = readInfo();
  const noticeIndex = data.notices.findIndex(
    (notice) => notice.id === parseInt(id)
  );

  if (noticeIndex === -1) {
    return res.status(404).send({ message: "공지사항을 찾을 수 없습니다." });
  }

  data.notices[noticeIndex].title = title;
  data.notices[noticeIndex].content = content;
  writeInfo(data);

  res.send({
    message: "공지사항이 수정되었습니다.",
    notice: data.notices[noticeIndex],
  });
});

// 입출금 신청 API
app.post("/api/submit", (req, res) => {
  const { transactionType, amount, bank, accountHolder, accountNumber } =
    req.body;

  // 쿠키에서 사용자 정보 가져오기
  const { auth_token } = req.cookies;
  if (!auth_token) {
    return res.status(401).json({ message: "로그인 후 이용해주세요." });
  }

  // JWT에서 사용자 정보 추출 (예: id, name)
  const user = parseJWT(auth_token); // JWT 파싱 함수 (추가 구현 필요)
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }
  // 기존 데이터에 추가
  const data = readAccounts();
  // 새로운 신청 데이터 생성
  const newTransaction = {
    index: data.accounts.length + 1,
    id: user.id,
    name: user.name,
    transactionType,
    amount,
    bank: transactionType === "withdrawal" ? bank : "", // 입금의 경우 은행 정보 비우기
    accountHolder: transactionType === "withdrawal" ? accountHolder : "",
    accountNumber: transactionType === "withdrawal" ? accountNumber : "",
    timestamp: getKoreanISOString(), // 신청 시간 추가
    isAnswered: null, // 답변 여부 (초기값 null)
    answerTitle: null, // 답변 제목 (초기값 null)
    answerContent: null, // 답변 내용 (초기값 null)
  };

  data.accounts.push(newTransaction);
  writeAccounts(data);

  res
    .status(200)
    .json({ message: "신청이 완료되었습니다.", data: newTransaction });
});

// JWT 파싱 함수 (간단한 예)
function parseJWT(token) {
  const payload = token.split(".")[1];
  const decoded = Buffer.from(payload, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

// 사용자 신청 내역 조회 API
app.get("/api/user-transactions", (req, res) => {
  // 쿠키에서 auth_token 가져오기
  const { auth_token } = req.cookies;
  if (!auth_token) {
    return res.status(401).json({ message: "로그인 후 이용해주세요." });
  }

  // JWT에서 사용자 정보 추출
  const user = parseJWT(auth_token);
  if (!user || !user.id) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  // account.json 파일에서 사용자의 신청 내역 가져오기
  const data = readAccounts();
  const userTransactions = data.accounts.filter(
    (transaction) => transaction.id === user.id
  );

  res.status(200).json(userTransactions);
});

app.get("/api/all-transactions", (req, res) => {
  const data = readAccounts();
  res.status(200).json(data.accounts);
});

// 거래 정보 수정 API - 어드민이랑 마스터가 사용
app.put("/api/all-transactions/:index", (req, res) => {
  const { index } = req.params;
  const { answerTitle, answerContent } = req.body;

  // 데이터 읽기
  const data = readAccounts();
  const transactionIndex = data.accounts.findIndex(
    (account) => account.index === parseInt(index)
  );

  if (transactionIndex === -1) {
    return res.status(404).json({ message: "해당 거래를 찾을 수 없습니다." });
  }

  // 거래 정보 업데이트
  data.accounts[transactionIndex].answerTitle = answerTitle;
  data.accounts[transactionIndex].answerContent = answerContent;
  data.accounts[transactionIndex].isAnswered = "답변 완료";
  writeAccounts(data);

  res.status(200).json({
    message: "거래 정보가 수정되었습니다.",
    transaction: data.accounts[transactionIndex],
  });
});

//마이페이지 회원정보 용
app.get("/api/user-info", (req, res) => {
  const { auth_token } = req.cookies; // 쿠키에서 JWT 추출
  if (!auth_token) {
    return res.status(401).json({ message: "로그인 후 이용해주세요." });
  }

  const user = parseJWT(auth_token); // JWT 파싱
  if (!user || !user.id) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  const users = readUsers(); // user-list.json 파일 읽기 함수
  const currentUser = users.users.find((u) => u.id === user.id);

  if (!currentUser) {
    return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
  }

  res.status(200).json(currentUser);
});

// 잔고 수정용
app.put("/api/user-info/balance", (req, res) => {
  const { auth_token } = req.cookies; // 쿠키에서 JWT 추출
  if (!auth_token) {
    return res.status(401).json({ message: "로그인 후 이용해주세요." });
  }

  const user = parseJWT(auth_token); // JWT 파싱
  if (!user || !user.id) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  const { balance, win, total } = req.body;

  // balance, win, total 중 하나 이상 있어야 수정 가능
  if (balance === undefined && win === undefined && total === undefined) {
    return res.status(400).json({ message: "수정할 데이터를 제공해주세요." });
  }

  // 사용자 데이터 파일 읽기
  const users = readUsers(); // user-list.json 파일 읽기 함수
  const userIndex = users.users.findIndex((u) => u.id === user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
  }

  // 수정할 필드 업데이트
  if (balance !== undefined) users.users[userIndex].balance = balance;
  if (win !== undefined) users.users[userIndex].win = win;
  if (total !== undefined) users.users[userIndex].total = total;

  // 파일 저장
  saveUsers(users);

  res.status(200).json({
    message: "회원 정보가 수정되었습니다.",
    updatedFields: { balance, win, total },
  });
});

// 유틸리티 함수: 사용자 데이터 저장
function saveUsers(data) {
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(__dirname, "./data/user/user-list.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// 1분마다 Binance 데이터 갱신
//setInterval(fetchBinanceData, 60 * 1000);
//fetchBinanceData(); // 서버 시작 시 초기 데이터 기록

// 1분마다 gold 데이터 갱신
//setInterval(fetchGoldData, 60 * 1000);
//fetchGoldData(); // 서버 시작 시 초기 데이터 기록

// 1분마다 gold 데이터 갱신
//setInterval(fetchNaqData, 60 * 1000);
//fetchNaqData();

// API: BTC 데이터 가져오기
app.get("/api/btc", (req, res) => {
  try {
    const data = readBTCData();
    res.json(data);
  } catch (error) {
    res.status(500).send({ message: "BTC 데이터 가져오기 오류" });
  }
});
// API: 골드 데이터 가져오기
app.get("/api/gold", (req, res) => {
  try {
    const data = readGoldData();
    res.json(data);
  } catch (error) {
    res.status(500).send({ message: "BTC 데이터 가져오기 오류" });
  }
});
// API: 나스닥 데이터 가져오기
app.get("/api/naq", (req, res) => {
  try {
    const data = readNaqData();
    res.json(data);
  } catch (error) {
    res.status(500).send({ message: "BTC 데이터 가져오기 오류" });
  }
});

// 전체 사용자 거래 내역 조회
app.get("/api/alltrades", (req, res) => {
  const { startDate, endDate, type } = req.query;
  const basePath = path.join(__dirname, `./data/game/${type || "btc"}`); // 기본 종목은 BTC
  let allTrades = [];
  const start = startDate ? new Date(startDate) : getKoreanISOString();
  const end = endDate ? new Date(endDate) : getKoreanISOString();

  // 날짜 범위 내 파일 읽기
  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const fileName = `${date.toISOString().split("T")[0]}.json`; // YYYY-MM-DD.json
    const filePath = path.join(basePath, fileName);

    if (fs.existsSync(filePath)) {
      try {
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        allTrades = allTrades.concat(fileData); // 파일의 모든 거래 데이터 추가
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
  }

  const formattedTrades = allTrades.map((trade) => {
    const profit =
      trade.result === "win" ? 1.88 * trade.entryPrice : -trade.entryPrice;
    return { ...trade, profit };
  });

  res.json(formattedTrades);
});

// 특정 사용자 이름과 날짜 범위로 거래 내역 조회
app.get("/api/trades", (req, res) => {
  const { startDate, endDate, type } = req.query;

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  const name = user.name; // 로그인 사용자 이름

  if (!startDate || !endDate || !type) {
    return res
      .status(400)
      .json({ message: "시작 날짜, 종료 날짜, 종목을 모두 입력해주세요." });
  }

  const basePath = path.join(__dirname, `./data/game/${type}`); // 종목별 데이터 폴더
  let allTrades = [];
  const start = new Date(`${startDate}`);
  const end = new Date(`${endDate}`);

  // 날짜 범위 내의 모든 파일을 순회
  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const fileName = `${date.toISOString().split("T")[0]}.json`; // YYYY-MM-DD.json

    const filePath = path.join(basePath, fileName);

    if (fs.existsSync(filePath)) {
      try {
        fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (error) {}

      allTrades = allTrades.concat(fileData);
    }
  }

  const filteredTrades = allTrades
    .filter((trade) => trade.name == name)
    .map((trade) => {
      const profit =
        trade.result === "win" ? 1.88 * trade.entryPrice : -trade.entryPrice;
      return { ...trade, profit };
    }); // 이름만 필터링

  res.json(filteredTrades);
});

// 거래 기록 API
app.post("/api/btc/trade", (req, res) => {
  const { tradeType, entryPrice, currentPrice, time } = req.body;

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  // 오늘 날짜로 파일 경로 생성
  const today = getKoreanISOString().split("T")[0];
  const gameFolder = path.join(__dirname, "./data/game/btc");
  const filePath = path.join(gameFolder, `${today}.json`);

  // 기존 데이터 읽기
  let gameData = [];
  if (fs.existsSync(filePath)) {
    gameData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // 새로운 거래 기록 추가
  const newTrade = {
    time,
    id: user.id,
    name: user.name,
    game: "BTC/USD",
    tradeType,
    entryPrice,
    currentPrice,
    result: null, // 결과는 나중에 업데이트
    timestamp: getKoreanISOString(),
  };
  gameData.push(newTrade);

  // 파일 저장
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2), "utf8");

  res
    .status(200)
    .json({ message: "거래 기록이 저장되었습니다.", trade: newTrade });
});

function getKoreanISOString() {
  const now = new Date();
  const kstOffset = 9 * 60; // 한국은 UTC+9 (분 단위)
  const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstDate.toISOString().replace("Z", "+09:00"); // ISO 형식으로 변환
}
// 거래 기록 API
app.post("/api/gold/trade", (req, res) => {
  const { tradeType, entryPrice, currentPrice, time } = req.body;

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  // 오늘 날짜로 파일 경로 생성
  const today = getKoreanISOString().split("T")[0];
  const gameFolder = path.join(__dirname, "./data/game/gold");
  const filePath = path.join(gameFolder, `${today}.json`);

  // 기존 데이터 읽기
  let gameData = [];
  if (fs.existsSync(filePath)) {
    gameData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // 새로운 거래 기록 추가
  const newTrade = {
    time,
    id: user.id,
    name: user.name,
    game: "GOLD",
    tradeType,
    entryPrice,
    currentPrice,
    result: null, // 결과는 나중에 업데이트
    timestamp: getKoreanISOString(),
  };
  gameData.push(newTrade);

  // 파일 저장
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2), "utf8");

  res
    .status(200)
    .json({ message: "거래 기록이 저장되었습니다.", trade: newTrade });
});

// 거래 기록 API
app.post("/api/naq/trade", (req, res) => {
  const { tradeType, entryPrice, currentPrice, time } = req.body;

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  // 오늘 날짜로 파일 경로 생성
  const today = getKoreanISOString().split("T")[0];
  const gameFolder = path.join(__dirname, "./data/game/naq");
  const filePath = path.join(gameFolder, `${today}.json`);

  // 기존 데이터 읽기
  let gameData = [];
  if (fs.existsSync(filePath)) {
    gameData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // 새로운 거래 기록 추가
  const newTrade = {
    time,
    id: user.id,
    name: user.name,
    game: "NASDAQ",
    tradeType,
    entryPrice,
    currentPrice,
    result: null, // 결과는 나중에 업데이트
    timestamp: getKoreanISOString(),
  };
  gameData.push(newTrade);

  // 파일 저장
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2), "utf8");

  res
    .status(200)
    .json({ message: "거래 기록이 저장되었습니다.", trade: newTrade });
});

// 특정 회차와 이름을 기준으로 resultPrice 기록 API
app.put("/api/game/add-result", (req, res) => {
  const { time, resultPrice } = req.body;
  const gameFolder = path.join(__dirname, "./data/game/btc");

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  if (!time || resultPrice === undefined) {
    return res
      .status(400)
      .json({ message: "time, name, resultPrice는 필수입니다." });
  }

  // 오늘 날짜로 파일 경로 생성
  const today = getKoreanISOString().split("T")[0];
  const filePath = path.join(gameFolder, `${today}.json`);

  // 파일 존재 여부 확인
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "기록 파일이 존재하지 않습니다." });
  }

  // 기존 데이터 읽기
  let gameData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // 데이터 검색
  const trade = gameData.find(
    (entry) => entry.time === time && entry.name === user.name
  );

  if (!trade) {
    return res.status(404).json({
      message: "해당 회차와 이름에 해당하는 거래를 찾을 수 없습니다.",
    });
  }

  // resultPrice 추가
  trade.resultPrice = resultPrice;
  if (trade.tradeType == "매도") {
    trade.result = trade.resultPrice - trade.currentPrice < 0 ? "win" : "lose";
  } else {
    trade.result = trade.resultPrice - trade.currentPrice > 0 ? "win" : "lose";
  }

  // 변경된 데이터 저장
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2), "utf8");

  res
    .status(200)
    .json({ message: "resultPrice가 추가되었습니다.", updatedTrade: trade });
});

// 특정 회차와 이름을 기준으로 resultPrice 기록 API
app.put("/api/game/add-result-gold", (req, res) => {
  const { time, resultPrice } = req.body;
  const gameFolder = path.join(__dirname, "./data/game/gold");

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  if (!time || resultPrice === undefined) {
    return res
      .status(400)
      .json({ message: "time, name, resultPrice는 필수입니다." });
  }

  // 오늘 날짜로 파일 경로 생성
  const today = getKoreanISOString().split("T")[0];
  const filePath = path.join(gameFolder, `${today}.json`);

  // 파일 존재 여부 확인
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "기록 파일이 존재하지 않습니다." });
  }

  // 기존 데이터 읽기
  let gameData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // 데이터 검색
  const trade = gameData.find(
    (entry) => entry.time === time && entry.name === user.name
  );

  if (!trade) {
    return res.status(404).json({
      message: "해당 회차와 이름에 해당하는 거래를 찾을 수 없습니다.",
    });
  }

  // resultPrice 추가
  trade.resultPrice = resultPrice;
  if (trade.tradeType == "매도") {
    trade.result = trade.resultPrice - trade.currentPrice < 0 ? "win" : "lose";
  } else {
    trade.result = trade.resultPrice - trade.currentPrice > 0 ? "win" : "lose";
  }

  // 변경된 데이터 저장
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2), "utf8");

  res
    .status(200)
    .json({ message: "resultPrice가 추가되었습니다.", updatedTrade: trade });
});

// 특정 회차와 이름을 기준으로 resultPrice 기록 API
app.put("/api/game/add-result-naq", (req, res) => {
  const { time, resultPrice } = req.body;
  const gameFolder = path.join(__dirname, "./data/game/naq");

  // 로그인 사용자 정보 가져오기
  const authToken = req.cookies.auth_token;
  const user = parseJWT(authToken); // JWT 파싱 함수
  if (!user || !user.id || !user.name) {
    return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
  }

  if (!time || resultPrice === undefined) {
    return res
      .status(400)
      .json({ message: "time, name, resultPrice는 필수입니다." });
  }

  // 오늘 날짜로 파일 경로 생성
  const today = getKoreanISOString().split("T")[0];
  const filePath = path.join(gameFolder, `${today}.json`);

  // 파일 존재 여부 확인
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "기록 파일이 존재하지 않습니다." });
  }

  // 기존 데이터 읽기
  let gameData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // 데이터 검색
  const trade = gameData.find(
    (entry) => entry.time === time && entry.name === user.name
  );

  if (!trade) {
    return res.status(404).json({
      message: "해당 회차와 이름에 해당하는 거래를 찾을 수 없습니다.",
    });
  }

  // resultPrice 추가
  trade.resultPrice = resultPrice;
  if (trade.tradeType == "매도") {
    trade.result = trade.resultPrice - trade.currentPrice < 0 ? "win" : "lose";
  } else {
    trade.result = trade.resultPrice - trade.currentPrice > 0 ? "win" : "lose";
  }

  // 변경된 데이터 저장
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2), "utf8");

  res
    .status(200)
    .json({ message: "resultPrice가 추가되었습니다.", updatedTrade: trade });
});

// 서버 실행
app.listen(80, () => console.log("Server running on 80"));
