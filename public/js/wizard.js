// wizard.js — 4-step Investment Wizard

let wizardStep = 1;
const wizardData = {};

function updateWizardProgress() {
  const steps = document.querySelectorAll('.wizard-step-indicator');
  steps.forEach((s, i) => {
    s.classList.toggle('active', i + 1 === wizardStep);
    s.classList.toggle('done', i + 1 < wizardStep);
  });

  const panels = document.querySelectorAll('.wizard-panel');
  panels.forEach((p, i) => {
    p.classList.toggle('active', i + 1 === wizardStep);
  });

  document.getElementById('wizard-prev-btn').style.visibility = wizardStep > 1 ? 'visible' : 'hidden';
  document.getElementById('wizard-next-btn').textContent = wizardStep === 4 ? 'Generate Report 🚀' : 'Next →';

  const progressBar = document.getElementById('wizard-progress-bar');
  progressBar.style.width = `${(wizardStep / 4) * 100}%`;
}

function validateStep() {
  if (wizardStep === 1) {
    const budget = document.getElementById('w-budget').value;
    const unit = document.querySelector('input[name="budget-unit"]:checked')?.value;
    if (!budget || budget <= 0) { showToast('Please enter a valid budget.', 'error'); return false; }
    wizardData.budget = budget;
    wizardData.budgetUnit = unit || 'Cr';
  }
  if (wizardStep === 2) {
    wizardData.city = document.getElementById('w-city').value.trim() || 'Open to all cities';
  }
  if (wizardStep === 3) {
    const goal = document.querySelector('input[name="inv-goal"]:checked')?.value;
    if (!goal) { showToast('Please select an investment goal.', 'error'); return false; }
    wizardData.goal = goal;
  }
  if (wizardStep === 4) {
    const type = document.querySelector('input[name="prop-type"]:checked')?.value;
    if (!type) { showToast('Please select a property type.', 'error'); return false; }
    wizardData.propertyType = type;
    wizardData.additionalNotes = document.getElementById('w-notes').value.trim();
  }
  return true;
}

async function submitWizard() {
  const resultSection = document.getElementById('wizard-result');
  const reportEl = document.getElementById('wizard-report');

  resultSection.classList.remove('hidden');
  reportEl.innerHTML = `
    <div class="wizard-loading">
      <div class="spinner"></div>
      <p>Analyzing your profile and generating personalized recommendations...</p>
    </div>
  `;
  resultSection.scrollIntoView({ behavior: 'smooth' });

  try {
    const { report } = await api.generateRecommendation(wizardData);
    reportEl.innerHTML = `<div class="report-content">${renderMarkdown(report)}</div>`;

    // Show copy + restart buttons
    document.getElementById('wizard-action-btns').classList.remove('hidden');
  } catch (err) {
    reportEl.innerHTML = `<div class="error-msg">❌ Failed to generate report: ${err.message}</div>`;
  }
}

function renderMarkdown(text) {
  if (window.marked) return marked.parse(text);
  return text.replace(/\n/g, '<br>');
}

function initWizard() {
  updateWizardProgress();

  document.getElementById('wizard-next-btn').addEventListener('click', async () => {
    if (!validateStep()) return;

    if (wizardStep === 4) {
      await submitWizard();
      return;
    }

    wizardStep++;
    updateWizardProgress();
  });

  document.getElementById('wizard-prev-btn').addEventListener('click', () => {
    if (wizardStep > 1) {
      wizardStep--;
      updateWizardProgress();
    }
  });

  document.getElementById('wizard-restart-btn')?.addEventListener('click', () => {
    wizardStep = 1;
    document.getElementById('wizard-result').classList.add('hidden');
    document.getElementById('wizard-action-btns').classList.add('hidden');
    document.getElementById('wizard-form').reset();
    Object.keys(wizardData).forEach(k => delete wizardData[k]);
    updateWizardProgress();
  });

  document.getElementById('wizard-copy-btn')?.addEventListener('click', () => {
    const text = document.getElementById('wizard-report').innerText;
    navigator.clipboard.writeText(text).then(() => showToast('Report copied to clipboard!', 'success'));
  });
}

window.initWizard = initWizard;
