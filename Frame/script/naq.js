let previousPrice = null;

async function fetchBinanceData() {
  const url =
    "https://api.investing.com/api/financialdata/20/historical/chart/?period=P1D&interval=PT1M&pointscount=120";
  const response = await fetch(url);
  data = await response.json();
  data = data.data;

  const trace = {
    x: data.map((item) => new Date(item[0])),
    open: data.map((item) => parseFloat(item[1])),
    high: data.map((item) => parseFloat(item[2])),
    low: data.map((item) => parseFloat(item[3])),
    close: data.map((item) => parseFloat(item[4])),
    type: "candlestick",
    increasing: { line: { color: "red" } },
    decreasing: { line: { color: "blue" } },
  };

  const currentPrice = trace.close[trace.close.length - 1];
  // 시가, 고가, 저가, 종가 정보
  const openPrice = trace.open[trace.open.length - 1];
  const highPrice = Math.max(...trace.high);
  const lowPrice = Math.min(...trace.low);
  const closePrice = currentPrice;

  return { trace, currentPrice, openPrice, highPrice, lowPrice, closePrice };
}

async function drawChart() {
  const { trace, currentPrice, openPrice, highPrice, lowPrice, closePrice } =
    await fetchBinanceData();

  document.getElementById("right-text").innerText = `${currentPrice.toFixed(
    2
  )}`;
  if (closePrice.toFixed(2) - openPrice.toFixed(2) > 0) {
    document.getElementById("right-text").style.color = "red";
  } else if (closePrice.toFixed(2) - openPrice.toFixed(2) == 0) {
    document.getElementById("right-text").style.color = "black";
  } else {
    document.getElementById("right-text").style.color = "blue";
  }

  const lastDataTime = trace.x[trace.x.length - 1];
  const twoHoursBefore = new Date(lastDataTime.getTime() - 2 * 60 * 60 * 1000); // 2시간 전
  const layout = {
    autosize: true, // 자동 크기 조정
    margin: { l: 25, r: 62.5, t: 25, b: 50 }, // 여백 조정
    hovermode: "x unified",
    xaxis: {
      type: "date",
      rangeslider: { visible: false },
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "grey",
      range: [twoHoursBefore, lastDataTime], // 2시간 범위 설정
    },
    yaxis: {
      side: "right",
      tickformat: ".2f",
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "grey",
    },
    shapes: [
      {
        type: "line",
        x0: 0,
        x1: 1,
        y0: currentPrice,
        y1: currentPrice,
        xref: "paper",
        yref: "y",
        line: {
          color: "grey",
          width: 1,
          dash: "dashdot",
        },
      },
    ],
    annotations: [
      {
        x: 1,
        y: currentPrice,
        xref: "paper",
        yref: "y",
        text: `${currentPrice.toFixed(2)}`,
        showarrow: false,
        xanchor: "left",
        yanchor: "middle",
        font: { color: "black", weight: "bold" },
        bgcolor: "yellow",
      },
      {
        x: 0.01,
        y: 1.05,
        xref: "paper",
        yref: "paper",
        text: `시가: ${openPrice.toFixed(2)} 고가: ${highPrice.toFixed(
          2
        )} 저가: ${lowPrice.toFixed(2)} 종가: ${closePrice.toFixed(2)}`,
        showarrow: false,
        align: "left",
        font: { color: "black", size: 12 },
      },
    ],
  };

  Plotly.newPlot("chartDiv", [trace], layout, {
    displaylogo: false,
    responsive: true,
  });
}

async function updateChart() {
  const { trace, currentPrice, openPrice, highPrice, lowPrice, closePrice } =
    await fetchBinanceData();

  Plotly.update("chartDiv", {
    x: [trace.x],
    open: [trace.open],
    high: [trace.high],
    low: [trace.low],
    close: [trace.close],
  });

  document.getElementById("right-text").innerText = `${currentPrice.toFixed(
    2
  )}`;
  if (closePrice.toFixed(2) - openPrice.toFixed(2) > 0) {
    document.getElementById("right-text").style.color = "red";
  } else if (closePrice.toFixed(2) - openPrice.toFixed(2) == 0) {
    document.getElementById("right-text").style.color = "black";
  } else {
    document.getElementById("right-text").style.color = "blue";
  }
  Plotly.relayout("chartDiv", {
    shapes: [
      {
        type: "line",
        x0: 0,
        x1: 1,
        y0: currentPrice,
        y1: currentPrice,
        xref: "paper",
        yref: "y",
        line: {
          color: "grey",
          width: 1,
          dash: "dashdot",
        },
      },
    ],
    annotations: [
      {
        x: 1,
        y: currentPrice,
        xref: "paper",
        yref: "y",
        text: `${currentPrice.toFixed(2)}`,
        showarrow: false,
        xanchor: "left",
        yanchor: "middle",
        font: { color: "black", weight: "bold" },
        bgcolor: "yellow",
      },
      {
        x: 0.01,
        y: 1.05,
        xref: "paper",
        yref: "paper",
        text: `시가: ${openPrice.toFixed(2)} 고가: ${highPrice.toFixed(
          2
        )} 저가: ${lowPrice.toFixed(2)} 종가: ${closePrice.toFixed(2)}`,
        showarrow: false,
        align: "left",
        font: { color: "black", size: 12 },
      },
    ],
  });
}

window.onload = async function () {
  await drawChart();
  setInterval(updateChart, 1000);
};
