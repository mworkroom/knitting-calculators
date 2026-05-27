const gaugeForm = document.getElementById("gaugeForm");

const resultSection = document.getElementById("resultSection");
const resultText = document.getElementById("resultText");
const copyButton = document.getElementById("copyButton");
const copyStatus = document.getElementById("copyStatus");

gaugeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  copyStatus.textContent = "";

  const stitchGauge = getNumber("stitchGauge");
  const rowGauge = getNumber("rowGauge");
  const targetBust = getNumber("targetBust");
  const targetLength = getOptionalNumber("targetLength");

  if (
    stitchGauge <= 0 ||
    rowGauge <= 0 ||
    targetBust <= 0 ||
    (targetLength !== null && targetLength <= 0)
  ) {
    showResult("입력값을 확인하세요.");
    return;
  }

  const calculatedStitches = (stitchGauge * targetBust) / 10;
  const roundedStitches = Math.round(calculatedStitches);

  let output =
`내 게이지: ${formatNumber(stitchGauge)}코 x ${formatNumber(rowGauge)}단 / 10cm

목표 가슴둘레: ${formatNumber(targetBust)}cm`;

  if (Number.isInteger(calculatedStitches)) {
    output += `\n필요 콧수: ${calculatedStitches}코`;
  } else {
    output +=
`\n계산상 필요 콧수: ${formatNumber(calculatedStitches)}코
가까운 정수: ${roundedStitches}코

패턴의 몸판 콧수에서 ${roundedStitches}코에 가까운 사이즈를 선택하세요.`;
  }

  if (targetLength !== null) {
    const calculatedRows = (rowGauge * targetLength) / 10;
    const roundedRows = Math.round(calculatedRows);

    output += `\n\n목표 길이: ${formatNumber(targetLength)}cm`;

    if (Number.isInteger(calculatedRows)) {
      output += `\n필요 단수: ${calculatedRows}단`;
    } else {
      output +=
`\n계산상 필요 단수: ${formatNumber(calculatedRows)}단
가까운 정수: ${roundedRows}단`;
    }
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
    copyStatus.textContent = "복사되었습니다.";
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
