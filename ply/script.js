const plyForm = document.getElementById("plyForm");
const yarnList = document.getElementById("yarnList");
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

plyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  copyStatus.textContent = "";

  const yarnInputs = [...document.querySelectorAll(".yarn-length-input")];
  const yarnLengths = yarnInputs
    .map((input) => Number(input.value))
    .filter((value) => value > 0);

  if (yarnLengths.length < 2) {
    showResult("합사할 실을 2가닥 이상 입력하세요.");
    return;
  }

  const reciprocalSum = yarnLengths.reduce((sum, length) => {
    return sum + (1 / length);
  }, 0);

  const finalLength = 1 / reciprocalSum;
  const roundedLength = Math.round(finalLength);

  const yarnDescription = yarnLengths
    .map((length, index) => `실 ${index + 1}: ${formatNumber(length)}m / 100g`)
    .join("\n");

  const output =
`${yarnDescription}

총 가닥 수: ${yarnLengths.length}가닥

합사 결과:
약 ${roundedLength}m / 100g`;

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
  row.className = "yarn-row";

  row.innerHTML = `
    <label class="yarn-number" for="yarn-${yarnCount}">
      실 ${yarnCount}
    </label>

    <div class="yarn-input-area">
      <div class="input-with-unit yarn-input">
        <input
          type="number"
          id="yarn-${yarnCount}"
          class="yarn-length-input"
          inputmode="decimal"
          step="0.1"
          min="0"
          placeholder="400"
          required
        >
        <span>m / 100g</span>
      </div>

      <button class="remove-yarn-button" type="button" aria-label="실 삭제">
        삭제
      </button>
    </div>
  `;

  const removeButton = row.querySelector(".remove-yarn-button");

  removeButton.addEventListener("click", () => {
    const rows = document.querySelectorAll(".yarn-row");

    if (rows.length <= 2) {
      return;
    }

    row.remove();
    renumberYarnRows();
  });

  yarnList.appendChild(row);
  updateRemoveButtons();
}

function renumberYarnRows() {
  const rows = [...document.querySelectorAll(".yarn-row")];

  rows.forEach((row, index) => {
    const number = index + 1;
    const label = row.querySelector(".yarn-number");
    const input = row.querySelector(".yarn-length-input");

    label.textContent = `실 ${number}`;
    label.setAttribute("for", `yarn-visible-${number}`);
    input.id = `yarn-visible-${number}`;
  });

  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = [...document.querySelectorAll(".yarn-row")];
  const shouldShowRemove = rows.length > 2;

  rows.forEach((row) => {
    const button = row.querySelector(".remove-yarn-button");
    button.disabled = !shouldShowRemove;
    button.classList.toggle("is-hidden", !shouldShowRemove);
  });
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
