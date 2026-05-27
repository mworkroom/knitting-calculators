const projectYarnForm = document.getElementById("projectYarnForm");
const projectYarnList = document.getElementById("projectYarnList");
const addYarnButton = document.getElementById("addYarnButton");

const resultSection = document.getElementById("resultSection");
const resultText = document.getElementById("resultText");
const copyButton = document.getElementById("copyButton");
const copyStatus = document.getElementById("copyStatus");

let yarnCount = 0;

createYarnRow();
createYarnRow();

addYarnButton.addEventListener("click", () => {
  createYarnRow();
});

projectYarnForm.addEventListener("submit", (event) => {
  event.preventDefault();
  copyStatus.textContent = "";

  const targetLength = Number(document.getElementById("targetLength").value);

  if (targetLength <= 0) {
    showResult("목표 사용 길이를 입력하세요.");
    return;
  }

  const rows = [...document.querySelectorAll(".project-yarn-row")];

  const yarns = rows.map((row, index) => {
    const nameValue = row.querySelector(".project-yarn-name").value.trim();
    const lengthValue = Number(row.querySelector(".project-yarn-length").value);
    const stockInput = row.querySelector(".project-yarn-stock").value.trim();
    const stockValue = stockInput === "" ? null : Number(stockInput);

    return {
      name: nameValue || `실 ${index + 1}`,
      lengthPer100g: lengthValue,
      stock: stockValue
    };
  });

  const invalidYarn = yarns.find((yarn) => {
    return (
      yarn.lengthPer100g <= 0 ||
      (yarn.stock !== null && yarn.stock < 0)
    );
  });

  if (invalidYarn) {
    showResult("실의 굵기와 보유량을 다시 확인하세요.");
    return;
  }

  if (yarns.length < 2) {
    showResult("합사할 실을 2가닥 이상 입력하세요.");
    return;
  }

  const finalLengthPer100g = calculatePliedThickness(yarns);
  const totalRequiredWeight = yarns.reduce((sum, yarn) => {
    return sum + calculateRequiredWeight(targetLength, yarn.lengthPer100g);
  }, 0);

  let output =
`목표 사용 길이: ${formatNumber(targetLength)}m
합사 후 굵기: 약 ${Math.round(finalLengthPer100g)}m / 100g

`;

  const yarnResults = yarns.map((yarn) => {
    return buildYarnResult(yarn, targetLength);
  });

  output += yarnResults.join("\n\n");
  output += `\n\n총 사용량: ${formatWeight(totalRequiredWeight)}g`;

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

function createYarnRow() {
  yarnCount += 1;

  const row = document.createElement("div");
  row.className = "project-yarn-row";

  row.innerHTML = `
    <div class="project-yarn-row-header">
      <span class="project-yarn-row-title">실 ${yarnCount}</span>
      <button class="remove-yarn-button project-remove-button" type="button">
        삭제
      </button>
    </div>

    <label class="input-label" for="project-yarn-name-${yarnCount}">
      실 이름
    </label>
    <input
      type="text"
      id="project-yarn-name-${yarnCount}"
      class="project-text-input project-yarn-name"
      placeholder="뉴브리즈"
    >

    <label class="input-label" for="project-yarn-length-${yarnCount}">
      굵기
    </label>
    <div class="input-with-unit project-input-with-long-unit">
      <input
        type="number"
        id="project-yarn-length-${yarnCount}"
        class="project-yarn-length"
        inputmode="decimal"
        step="0.1"
        min="0"
        placeholder="800"
        required
      >
      <span>m / 100g</span>
    </div>

    <label class="input-label optional-label" for="project-yarn-stock-${yarnCount}">
      보유량
      <small>선택 입력</small>
    </label>
    <div class="input-with-unit">
      <input
        type="number"
        id="project-yarn-stock-${yarnCount}"
        class="project-yarn-stock"
        inputmode="decimal"
        step="0.1"
        min="0"
        placeholder="구매 예정이면 비워두기"
      >
      <span>g</span>
    </div>
  `;

  const removeButton = row.querySelector(".project-remove-button");

  removeButton.addEventListener("click", () => {
    const currentRows = document.querySelectorAll(".project-yarn-row");

    if (currentRows.length <= 2) {
      return;
    }

    row.remove();
    renumberYarnRows();
  });

  projectYarnList.appendChild(row);
  updateRemoveButtons();
}

function renumberYarnRows() {
  const rows = [...document.querySelectorAll(".project-yarn-row")];

  rows.forEach((row, index) => {
    const number = index + 1;
    row.querySelector(".project-yarn-row-title").textContent = `실 ${number}`;
  });

  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = [...document.querySelectorAll(".project-yarn-row")];
  const shouldShowRemove = rows.length > 2;

  rows.forEach((row) => {
    const button = row.querySelector(".project-remove-button");
    button.disabled = !shouldShowRemove;
    button.classList.toggle("is-hidden", !shouldShowRemove);
  });
}

function calculatePliedThickness(yarns) {
  const totalWeightPerMeter = yarns.reduce((sum, yarn) => {
    return sum + (100 / yarn.lengthPer100g);
  }, 0);

  return 100 / totalWeightPerMeter;
}

function calculateRequiredWeight(targetLength, lengthPer100g) {
  return (targetLength / lengthPer100g) * 100;
}

function buildYarnResult(yarn, targetLength) {
  const requiredWeight = calculateRequiredWeight(targetLength, yarn.lengthPer100g);

  let result =
`${yarn.name}
필요량: ${formatWeight(requiredWeight)}g`;

  if (yarn.stock === null) {
    result += `\n구매 필요량: ${formatWeight(requiredWeight)}g`;
    return result;
  }

  if (yarn.stock >= requiredWeight) {
    const remainingWeight = yarn.stock - requiredWeight;
    const usageRate = (requiredWeight / yarn.stock) * 100;

    result +=
`\n보유량: ${formatWeight(yarn.stock)}g
사용 후 잔여량: ${formatWeight(remainingWeight)}g
소진율: ${formatPercent(usageRate)}%`;

    return result;
  }

  const shortage = requiredWeight - yarn.stock;

  result +=
`\n보유량: ${formatWeight(yarn.stock)}g
보유량 전량 사용
추가 구매 필요량: ${formatWeight(shortage)}g
소진율: 100%`;

  return result;
}

function formatWeight(number) {
  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1).replace(/\.0$/, "");
}

function formatPercent(number) {
  return number.toFixed(1).replace(/\.0$/, "");
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
