const stitchForm = document.getElementById("stitchForm");

const resultSection = document.getElementById("resultSection");
const resultText = document.getElementById("resultText");
const copyButton = document.getElementById("copyButton");
const copyStatus = document.getElementById("copyStatus");


let latestCalculation = null;

stitchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  copyStatus.textContent = "";

  const startStitches = getNumber("startStitches");
  const endStitches = getNumber("endStitches");

  if (!Number.isInteger(startStitches) || !Number.isInteger(endStitches)) {
    showResult("콧수는 정수로 입력하세요.");
    return;
  }

  if (startStitches <= 0 || endStitches <= 0) {
    showResult("콧수를 다시 확인하세요.");
    return;
  }

  if (startStitches === endStitches) {
    showResult("시작 콧수와 목표 콧수가 같습니다.");
    return;
  }

  if (startStitches > endStitches) {
    calculateDecrease(startStitches, endStitches);
  } else {
    calculateIncrease(startStitches, endStitches);
  }
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


function calculateDecrease(startStitches, endStitches) {
  const decreaseCount = startStitches - endStitches;
  const plainKnitStitches = startStitches - (decreaseCount * 2);

  if (plainKnitStitches < 0) {
    showResult(
      "한 단에서 k2tog만 사용해 이만큼 줄일 수 없습니다.\n" +
      "목표 콧수는 시작 콧수의 절반 이상이어야 합니다."
    );
    return;
  }

  const intervals = distributeEvenly(plainKnitStitches, decreaseCount);
  const instruction = buildInstruction(intervals, "k2tog");

  latestCalculation = {
    type: "decrease",
    startStitches,
    endStitches,
    operationCount: decreaseCount
  };

  const output =
`시작 콧수: ${startStitches}코
목표 콧수: ${endStitches}코

총 ${decreaseCount}코를 줄여야 합니다.
k2tog ${decreaseCount}회 = ${decreaseCount}코 감소


${instruction}`;

  showResult(output);
}

function calculateIncrease(startStitches, endStitches) {
  const increaseCount = endStitches - startStitches;

  if (increaseCount > startStitches) {
    showResult(
      "한 단에서 M1만 사용해 이만큼 늘리기에는 간격 계산이 복잡합니다.\n" +
      "늘릴 코 수가 시작 콧수 이하인 경우에 사용하세요."
    );
    return;
  }

  const intervals = distributeEvenly(startStitches, increaseCount);
  const instruction = buildInstruction(intervals, "M1");

  latestCalculation = {
    type: "increase",
    startStitches,
    endStitches,
    operationCount: increaseCount
  };

  const output =
`시작 콧수: ${startStitches}코
목표 콧수: ${endStitches}코

총 ${increaseCount}코를 늘려야 합니다.
M1 ${increaseCount}회 = ${increaseCount}코 증가
작업 후 남아야 하는 콧수: ${endStitches}코

지시문:
${instruction}`;

  showResult(output);
}

function distributeEvenly(totalPlainStitches, operationCount) {
  const intervals = [];
  let previousPoint = 0;

  for (let i = 1; i <= operationCount; i += 1) {
    const currentPoint = Math.round(
      (i * totalPlainStitches) / operationCount
    );

    intervals.push(currentPoint - previousPoint);
    previousPoint = currentPoint;
  }

  return intervals;
}

function buildInstruction(intervals, operation) {
  const steps = intervals.map((knitCount) => {
    if (knitCount === 0) {
      return `(${operation})`;
    }

    return `(k${knitCount}, ${operation})`;
  });

  const compressedSteps = [];
  let currentStep = steps[0];
  let repeatCount = 1;

  for (let i = 1; i < steps.length; i += 1) {
    if (steps[i] === currentStep) {
      repeatCount += 1;
    } else {
      compressedSteps.push(formatRepeat(currentStep, repeatCount));
      currentStep = steps[i];
      repeatCount = 1;
    }
  }

  compressedSteps.push(formatRepeat(currentStep, repeatCount));

  return compressedSteps.join("\n");
}

function formatRepeat(step, count) {
  return count === 1 ? step : `${step} x ${count}`;
}

function getNumber(id) {
  return Number(document.getElementById(id).value);
}

function showResult(text) {
  latestCalculation = latestCalculation || null;
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
