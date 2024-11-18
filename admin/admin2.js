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
