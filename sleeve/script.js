const sleeveForm = document.getElementById("sleeveForm");
const hasNoDecreaseSection = document.getElementById("hasNoDecreaseSection");
const noDecreaseLengthWrap = document.getElementById("noDecreaseLengthWrap");
const noDecreaseLengthInput = document.getElementById("noDecreaseLength");

const resultSection = document.getElementById("resultSection");
const resultText = document.getElementById("resultText");
const copyButton = document.getElementById("copyButton");
const copyStatus = document.getElementById("copyStatus");

hasNoDecreaseSection.addEventListener("change", () => {
  const isChecked = hasNoDecreaseSection.checked;

  noDecreaseLengthWrap.classList.toggle("is-visible", isChecked);
  noDecreaseLengthInput.required = isChecked;

  if (!isChecked) {
    noDecreaseLengthInput.value = "";
  }
});

sleeveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  copyStatus.textContent = "";

  const postWashRows = getNumber("postWashRows");
  const preWashRows = getOptionalNumber("preWashRows");

  const targetLength = getNumber("targetLength");
  const ribLength = getNumber("ribLength");

  const noDecreaseLength = hasNoDecreaseSection.checked
    ? getNumber("noDecreaseLength")
    : 0;

  const startStitches = getNumber("startStitches");
  const endStitches = getNumber("endStitches");
  const decreaseStitches = getNumber("decreaseStitches");

  const error = validateInputs({
    postWashRows,
    preWashRows,
    targetLength,
    ribLength,
    noDecreaseLength,
    startStitches,
    endStitches,
    decreaseStitches
  });

  if (error) {
    showResult(error);
    return;
  }

  const decreaseLength = targetLength - ribLength - noDecreaseLength;
  const decreaseRows = Math.round((decreaseLength * postWashRows) / 10);

  const stitchesToDecrease = startStitches - endStitches;
  const decreaseCount = stitchesToDecrease / decreaseStitches;

  const rawInterval = decreaseRows / decreaseCount;

  if (rawInterval < 2) {
    showResult(
      "줄임 횟수가 줄임 구간 단수보다 많습니다.\n" +
      "2단마다 줄여도 목표 콧수에 도달하기 어려우므로 입력값을 다시 확인하세요."
    );
    return;
  }

  const recommendedInterval = nearestEvenNumber(rawInterval);
  const preciseDistribution = createPreciseDistribution(decreaseRows, decreaseCount);

  let output =
`줄여야 하는 길이: ${formatNumber(decreaseLength)}cm
줄임을 진행할 단수: ${decreaseRows}단

줄일 콧수: ${stitchesToDecrease}코
총 줄임 횟수: ${decreaseCount}회

추천 줄임 간격:
약 ${recommendedInterval}단마다 ${decreaseStitches}코씩 ${decreaseCount}회 줄이기

정밀 분배:
${preciseDistribution}`;

  if (preWashRows !== null) {
    const preWashMeasuredLength = (decreaseRows / preWashRows) * 10;

    output += `

세탁 전 측정 길이:
${formatNumber(preWashMeasuredLength)}cm 뜨기`;
  }

  showResult(output);
});

copyButton.addEventListener("click", async () => {
  const text = resultText.textContent;

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "복사되었습니다. 노션에 붙여넣으면 됩니다.";
  } catch (error) {
    fallbackCopy(text);
  }
});

function getNumber(id) {
  return Number(document.getElementById(id).value);
}

function getOptionalNumber(id) {
  const value = document.getElementById(id).value.trim();

  if (value === "") {
    return null;
  }

  return Number(value);
}

function validateInputs(values) {
  const {
    postWashRows,
    preWashRows,
    targetLength,
    ribLength,
    noDecreaseLength,
    startStitches,
    endStitches,
    decreaseStitches
  } = values;

  if (
    postWashRows <= 0 ||
    targetLength <= 0 ||
    ribLength < 0 ||
    noDecreaseLength < 0 ||
    startStitches <= 0 ||
    endStitches <= 0 ||
    decreaseStitches <= 0
  ) {
    return "입력값을 확인하세요.";
  }

  if (preWashRows !== null && preWashRows <= 0) {
    return "세탁 전 단 게이지를 다시 확인하세요.";
  }

  if (ribLength + noDecreaseLength >= targetLength) {
    return "고무단과 무수축 구간의 합이 목표 소매 길이보다 짧아야 합니다.";
  }

  if (startStitches <= endStitches) {
    return "시작 콧수는 목표 콧수보다 많아야 합니다.";
  }

  const stitchesToDecrease = startStitches - endStitches;

  if (stitchesToDecrease % decreaseStitches !== 0) {
    return (
      `총 ${stitchesToDecrease}코를 ${decreaseStitches}코씩 나누어 줄일 수 없습니다.\n` +
      "시작 콧수, 목표 콧수 또는 한 번에 줄이는 콧수를 다시 확인하세요."
    );
  }

  return null;
}

function nearestEvenNumber(number) {
  return Math.max(2, Math.round(number / 2) * 2);
}

function createPreciseDistribution(totalRows, decreaseCount) {
  const lowerInterval = Math.floor(totalRows / decreaseCount);
  const longerIntervalCount = totalRows % decreaseCount;
  const shorterIntervalCount = decreaseCount - longerIntervalCount;

  if (longerIntervalCount === 0) {
    return `${lowerInterval}단 간격 ${decreaseCount}회`;
  }

  if (shorterIntervalCount === 0) {
    return `${lowerInterval + 1}단 간격 ${longerIntervalCount}회`;
  }

  return (
    `${lowerInterval}단 간격 ${shorterIntervalCount}회 + ` +
    `${lowerInterval + 1}단 간격 ${longerIntervalCount}회`
  );
}

function formatNumber(number) {
  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1).replace(/\.0$/, "");
}

function showResult(text) {
  resultText.textContent = text;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function fallbackCopy(text) {
  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.value = text;
  temporaryTextArea.style.position = "fixed";
  temporaryTextArea.style.opacity = "0";

  document.body.appendChild(temporaryTextArea);
  temporaryTextArea.focus();
  temporaryTextArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(temporaryTextArea);

  copyStatus.textContent = copied
    ? "복사되었습니다."
    : "복사에 실패했습니다. 결과 텍스트를 직접 선택해 복사하세요.";
}
