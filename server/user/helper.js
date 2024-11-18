const fs = require("fs");
const path = require("path");

const userPath = path.join(__dirname, "../data/user/user-list.json");
const infoPath = path.join(__dirname, "../data/admin/info.json");
const accountPath = path.join(__dirname, "../data/admin/account.json");
// JSON 파일 읽기
function readUsers() {
  try {
    const data = fs.readFileSync(userPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading user list:", error);
    return { users: [] };
  }
}

// JSON 파일 쓰기
function writeUsers(data) {
  try {
    fs.writeFileSync(userPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing user list:", error);
  }
}

// JSON 파일 읽기
function readInfo() {
  const data = fs.readFileSync(infoPath, "utf8");
  return JSON.parse(data);
}

// JSON 파일 쓰기
function writeInfo(data) {
  fs.writeFileSync(infoPath, JSON.stringify(data, null, 2));
}

// JSON 파일 읽기
function readAccounts() {
  if (!fs.existsSync(accountPath)) {
    fs.writeFileSync(accountPath, JSON.stringify(data, null, 2)); // 파일이 없으면 빈 배열 생성
  }
  const data = fs.readFileSync(accountPath, "utf-8");
  return JSON.parse(data);
}

// JSON 파일 쓰기
function writeAccounts(accounts) {
  fs.writeFileSync(accountPath, JSON.stringify(accounts, null, 2), "utf-8");
}

module.exports = {
  readUsers,
  writeUsers,
  readInfo,
  writeInfo,
  readAccounts,
  writeAccounts,
};
