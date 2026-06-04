const state = {
  activities: [],
  goals: [],
  preferences: { theme: 'light' },
  achievements: { burner: false, hydrated: false, walking: false },
  lastStreakUpdate: null,
  dailySteps: 0,
  dailyWater: 0,
  streak: 0,
  motivationalQuotes: [
    'Consistency beats intensity. Keep going.',
    'Every workout is a step closer to a stronger you.',
    'Hydrate, move, recover — repeat.',
    'Small progress is still progress.',
    'Your body can stand almost anything. It’s your mind you have to convince.'
  ]
};

const elements = {
  panels: document.querySelectorAll('.panel'),
  menuButtons: document.querySelectorAll('.menu-item'),
  themeSwitcher: document.getElementById('themeSwitcher'),
  themeLabel: document.getElementById('themeLabel'),
  todaySteps: document.getElementById('todaySteps'),
  todayCalories: document.getElementById('todayCalories'),
  todayWorkoutMinutes: document.getElementById('todayWorkoutMinutes'),
  todayWater: document.getElementById('todayWater'),
  stepGoalValue: document.getElementById('stepGoalValue'),
  waterGoalValue: document.getElementById('waterGoalValue'),
  weeklyCalories: document.getElementById('weeklyCalories'),
  stepProgressBar: document.getElementById('stepProgressBar'),
  calorieProgressBar: document.getElementById('calorieProgressBar'),
  workoutProgressBar: document.getElementById('workoutProgressBar'),
  stepProgressLabel: document.getElementById('stepProgressLabel'),
  calorieProgressLabel: document.getElementById('calorieProgressLabel'),
  workoutProgressLabel: document.getElementById('workoutProgressLabel'),
  streakBadge: document.getElementById('streakBadge'),
  motivationQuote: document.getElementById('motivationQuote'),
  activityTableBody: document.getElementById('activityTableBody'),
  openActivityModal: document.getElementById('openActivityModal'),
  modalOverlay: document.getElementById('modalOverlay'),
  closeModal: document.getElementById('closeModal'),
  cancelModal: document.getElementById('cancelModal'),
  activityForm: document.getElementById('activityForm'),
  searchActivity: document.getElementById('searchActivity'),
  filterActivity: document.getElementById('filterActivity'),
  goalList: document.getElementById('goalList'),
  openGoalModal: document.getElementById('openGoalModal'),
  heightInput: document.getElementById('heightInput'),
  weightInput: document.getElementById('weightInput'),
  calculateBmiBtn: document.getElementById('calculateBmiBtn'),
  bmiResult: document.getElementById('bmiResult'),
  waterInput: document.getElementById('waterInput'),
  addWaterBtn: document.getElementById('addWaterBtn'),
  waterStatus: document.getElementById('waterStatus'),
  waterGoalStatus: document.getElementById('waterGoalStatus'),
  weeklyReport: document.getElementById('weeklyReport'),
  reportSteps: document.getElementById('reportSteps'),
  reportCalories: document.getElementById('reportCalories'),
  reportWorkouts: document.getElementById('reportWorkouts'),
  exportDataBtn: document.getElementById('exportDataBtn'),
  importDataBtn: document.getElementById('importDataBtn'),
  mobileAddButton: document.getElementById('mobileAddButton'),
  toastContainer: document.getElementById('toastContainer')
};

const charts = {
  steps: null,
  calories: null,
  duration: null
};

function loadState() {
  const stored = localStorage.getItem('fitpulseState');
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.assign(state, parsed);
  } else {
    state.goals = [
      { id: crypto.randomUUID(), title: 'Daily Step Goal', type: 'steps', target: 10000 },
      { id: crypto.randomUUID(), title: 'Workout Time Goal', type: 'duration', target: 45 },
      { id: crypto.randomUUID(), title: 'Calorie Burn Goal', type: 'calories', target: 500 },
      { id: crypto.randomUUID(), title: 'Water Intake Goal', type: 'water', target: 8 }
    ];
  }
}

function saveState() {
  localStorage.setItem('fitpulseState', JSON.stringify(state));
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.preferences.theme = theme;
  elements.themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  saveState();
  if (document.querySelector('#stepsChart')) {
    renderCharts();
  }
}

function initTheme() {
  if (state.preferences.theme === 'dark') {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

function switchPanel(panelId) {
  elements.panels.forEach(panel => panel.classList.add('hidden'));
  document.getElementById(`${panelId}Panel`).classList.remove('hidden');
  elements.menuButtons.forEach(btn => {
    const active = btn.dataset.panel === panelId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function getWeeklySummary() {
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 6);
  return state.activities.filter(activity => new Date(activity.date) >= oneWeekAgo);
}

function updateDashboard() {
  const todays = state.activities.filter(activity => {
    const date = new Date(activity.date);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  });

  const totalSteps = todays.reduce((sum, entry) => sum + Number(entry.steps || 0), 0);
  const totalCalories = todays.reduce((sum, entry) => sum + Number(entry.calories), 0);
  const totalDuration = todays.reduce((sum, entry) => sum + Number(entry.duration), 0);

  elements.todaySteps.textContent = totalSteps;
  elements.todayCalories.textContent = totalCalories;
  elements.todayWorkoutMinutes.textContent = totalDuration;
  elements.todayWater.textContent = state.dailyWater;

  const weeklyCalories = getWeeklySummary().reduce((sum, entry) => sum + Number(entry.calories), 0);
  elements.weeklyCalories.textContent = weeklyCalories;
  elements.waterGoalStatus.textContent = state.goals.find(goal => goal.type === 'water')?.target ?? 8;

  const stepGoal = Number(state.goals.find(goal => goal.type === 'steps')?.target ?? 10000);
  const calorieGoal = Number(state.goals.find(goal => goal.type === 'calories')?.target ?? 500);
  const workoutGoal = Number(state.goals.find(goal => goal.type === 'duration')?.target ?? 45);

  const stepPercent = Math.min(100, Math.round((totalSteps / stepGoal) * 100));
  const calPercent = Math.min(100, Math.round((totalCalories / calorieGoal) * 100));
  const durationPercent = Math.min(100, Math.round((totalDuration / workoutGoal) * 100));

  elements.stepProgressBar.style.width = `${stepPercent}%`;
  elements.calorieProgressBar.style.width = `${calPercent}%`;
  elements.workoutProgressBar.style.width = `${durationPercent}%`;
  elements.stepProgressLabel.textContent = `${stepPercent}%`;
  elements.calorieProgressLabel.textContent = `${calPercent}%`;
  elements.workoutProgressLabel.textContent = `${durationPercent}%`;

  elements.stepGoalValue.textContent = stepGoal;
  elements.waterGoalValue.textContent = state.goals.find(goal => goal.type === 'water')?.target ?? 8;

  elements.streakBadge.textContent = `Streak: ${state.streak} days`;
  const quote = state.motivationalQuotes[Math.floor(Math.random() * state.motivationalQuotes.length)];
  elements.motivationQuote.innerHTML = `<p>${quote}</p>`;
  
  const waterGoal = Number(state.goals.find(goal => goal.type === 'water')?.target ?? 8);
  updateAchievements(totalCalories, state.dailyWater, totalSteps, calorieGoal, waterGoal, stepGoal);
}

function renderActivities() {
  const query = elements.searchActivity.value.toLowerCase();
  const filterType = elements.filterActivity.value;
  const filtered = state.activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(query) || activity.type.toLowerCase().includes(query);
    const matchesFilter = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    elements.activityTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);"><strong>No Activities Found</strong><br />Click Add Activity to start tracking your workouts.</td></tr>';
    return;
  }

  elements.activityTableBody.innerHTML = filtered.map(activity => `
      <tr>
        <td>${activity.name}</td>
        <td>${activity.type}</td>
        <td>${activity.duration} min</td>
        <td>${activity.calories} kcal</td>
        <td>${formatDateTime(activity.date)}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${activity.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn" data-action="delete" data-id="${activity.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
}

function renderGoals() {
  elements.goalList.innerHTML = state.goals.map(goal => {
    const currentValue = getGoalCurrentValue(goal.type);
    const achieved = Math.min(100, Math.round((currentValue / goal.target) * 100));
    return `
      <article class="goal-card">
        <div>
          <h4>${goal.title}</h4>
          <div class="goal-status"><span>${currentValue} / ${goal.target}</span><span>${achieved}%</span></div>
        </div>
        <div class="goal-progress"><span style="width: ${achieved}%"></span></div>
      </article>
    `;
  }).join('');
}

function getGoalCurrentValue(type) {
  const today = new Date().toDateString();
  const todays = state.activities.filter(activity => new Date(activity.date).toDateString() === today);
  if (type === 'steps') return todays.reduce((sum, entry) => sum + Number(entry.steps || 0), 0);
  if (type === 'calories') return todays.reduce((sum, entry) => sum + Number(entry.calories), 0);
  if (type === 'duration') return todays.reduce((sum, entry) => sum + Number(entry.duration), 0);
  if (type === 'water') return state.dailyWater;
  return 0;
}

function renderReport() {
  const weekly = getWeeklySummary();
  elements.reportSteps.textContent = weekly.reduce((sum, entry) => sum + Number(entry.steps || 0), 0);
  elements.reportCalories.textContent = weekly.reduce((sum, entry) => sum + Number(entry.calories), 0);
  elements.reportWorkouts.textContent = weekly.length;
}

function renderCharts() {
  const days = [];
  const stepsData = [];
  const caloriesData = [];
  const durationData = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString([], { weekday: 'short' });
    days.push(label);
    const dayActivities = state.activities.filter(entry => new Date(entry.date).toDateString() === date.toDateString());
    stepsData.push(dayActivities.reduce((sum, entry) => sum + Number(entry.steps || 0), 0));
    caloriesData.push(dayActivities.reduce((sum, entry) => sum + Number(entry.calories), 0));
    durationData.push(dayActivities.reduce((sum, entry) => sum + Number(entry.duration), 0));
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, filler: { propagate: true } },
    scales: {
      x: { ticks: { color: 'var(--muted)' }, grid: { display: false } },
      y: { ticks: { color: 'var(--muted)' }, grid: { color: 'rgba(145, 158, 171, 0.16)' } }
    }
  };

  const stepsChartEl = document.getElementById('stepsChart');
  const caloriesChartEl = document.getElementById('caloriesChart');
  const durationChartEl = document.getElementById('durationChart');

  if (!stepsChartEl || !caloriesChartEl || !durationChartEl) return;

  stepsChartEl.style.maxHeight = '280px';
  caloriesChartEl.style.maxHeight = '280px';
  durationChartEl.style.maxHeight = '280px';

  const ctxSteps = stepsChartEl.getContext('2d');
  const ctxCalories = caloriesChartEl.getContext('2d');
  const ctxDuration = durationChartEl.getContext('2d');

  if (charts.steps) charts.steps.destroy();
  if (charts.calories) charts.calories.destroy();
  if (charts.duration) charts.duration.destroy();

  charts.steps = new Chart(ctxSteps, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{ data: stepsData, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.18)', tension: 0.35, fill: true, pointRadius: 4 }]
    },
    options: chartOptions
  });

  charts.calories = new Chart(ctxCalories, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{ data: caloriesData, backgroundColor: '#22c55e', borderRadius: 12, maxBarThickness: 28 }]
    },
    options: chartOptions
  });

  charts.duration = new Chart(ctxDuration, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{ data: durationData, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.18)', tension: 0.35, fill: true, pointRadius: 4 }]
    },
    options: chartOptions
  });
}

function resetActivityForm() {
  elements.activityForm.reset();
  elements.activityDate.value = new Date().toISOString().slice(0, 16);
  elements.activitySteps.value = 0;
}

function openModal() {
  document.getElementById('modalTitle').textContent = 'Add Activity';
  elements.modalOverlay.classList.remove('hidden');
  elements.modalOverlay.setAttribute('aria-hidden', 'false');
  resetActivityForm();
  elements.activityForm.dataset.editId = '';
  // focus first input for keyboard users
  const firstInput = document.getElementById('activityName');
  if (firstInput) firstInput.focus();
  // add modal key handler to trap focus and handle Escape
  document.addEventListener('keydown', modalKeyHandler);
}

function closeModal() {
  elements.modalOverlay.classList.add('hidden');
  elements.modalOverlay.setAttribute('aria-hidden', 'true');
  document.removeEventListener('keydown', modalKeyHandler);
}

function modalKeyHandler(e) {
  const modal = document.querySelector('.modal-card');
  if (!modal || elements.modalOverlay.classList.contains('hidden')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

function addOrUpdateActivity(event) {
  event.preventDefault();
  const id = elements.activityForm.dataset.editId;
  const activity = {
    id: id || crypto.randomUUID(),
    name: document.getElementById('activityName').value.trim(),
    type: document.getElementById('activityType').value,
    duration: Number(document.getElementById('activityDuration').value),
    calories: Number(document.getElementById('activityCalories').value),
    steps: Number(document.getElementById('activitySteps').value),
    date: document.getElementById('activityDate').value
  };

  if (!activity.name || !activity.date) {
    showToast('Please complete the activity form.', 'error');
    return;
  }

  if (id) {
    const index = state.activities.findIndex(entry => entry.id === id);
    if (index !== -1) state.activities[index] = activity;
    showToast('Activity updated successfully.');
  } else {
    state.activities.unshift(activity);
    showToast('Activity added successfully.');
  }

  saveState();
  closeModal();
  refreshApp();
}

function updateStreak() {
  const now = new Date().toDateString();
  if (state.lastStreakUpdate === now) return;
  const todayString = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(new Date().getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const hasTodayActivity = state.activities.some(entry => new Date(entry.date).toDateString() === todayString);
  const hasYesterdayActivity = state.activities.some(entry => new Date(entry.date).toDateString() === yesterdayString);
  if (hasTodayActivity && hasYesterdayActivity) {
    state.streak += 1;
  } else if (!hasTodayActivity && hasYesterdayActivity) {
    state.streak = 1;
  } else if (hasTodayActivity && !hasYesterdayActivity) {
    state.streak = 1;
  } else {
    state.streak = 0;
  }
  state.lastStreakUpdate = now;
}

function handleActivityTableClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'delete') {
    if (!confirm('Delete this activity?')) return;
    state.activities = state.activities.filter(activity => activity.id !== id);
    saveState();
    refreshApp();
    showToast('Activity deleted.', 'success');
  }
  if (action === 'edit') {
    const activity = state.activities.find(item => item.id === id);
    if (!activity) return;
    openModal();
    document.getElementById('modalTitle').textContent = 'Edit Activity';
    document.getElementById('activityName').value = activity.name;
    document.getElementById('activityType').value = activity.type;
    document.getElementById('activityDuration').value = activity.duration;
    document.getElementById('activityCalories').value = activity.calories;
    document.getElementById('activityDate').value = activity.date;
    document.getElementById('activitySteps').value = activity.steps;
    elements.activityForm.dataset.editId = activity.id;
  }
}

function handleGoalCreation() {
  openGoalModal();
}

function openGoalModal() {
  const goalName = prompt('Enter goal name:');
  if (!goalName) return;
  const goalTypeStr = prompt('Enter goal type (steps/calories/duration/water):');
  if (!goalTypeStr) return;
  const allowedTypes = ['steps', 'calories', 'duration', 'water'];
  if (!allowedTypes.includes(goalTypeStr.toLowerCase())) {
    showToast('Invalid goal type. Use: steps, calories, duration, or water', 'error');
    return;
  }
  const goalTarget = Number(prompt('Enter goal target:'));
  if (!goalTarget) return;
  const newGoal = {
    id: crypto.randomUUID(),
    title: goalName,
    type: goalTypeStr.toLowerCase(),
    target: goalTarget
  };
  state.goals.push(newGoal);
  saveState();
  renderGoals();
  showToast('New goal created successfully!');
}

function updateAchievements(calories, water, steps, calGoal, waterGoal, stepGoal) {
  state.achievements.burner = calories >= (calGoal * 0.5);
  state.achievements.hydrated = water >= (waterGoal * 0.75);
  state.achievements.walking = steps >= (stepGoal * 0.8);
  renderAchievements();
}

function renderAchievements() {
  const badgeGrid = document.querySelector('.badge-grid');
  if (!badgeGrid) return;
  badgeGrid.innerHTML = `
    <div class="achievement-badge ${state.achievements.burner ? 'unlocked' : ''}">
      <i class="fa-solid fa-fire"></i><span>Burner</span>
    </div>
    <div class="achievement-badge ${state.achievements.hydrated ? 'unlocked' : ''}">
      <i class="fa-solid fa-water"></i><span>Hydrated</span>
    </div>
    <div class="achievement-badge ${state.achievements.walking ? 'unlocked' : ''}">
      <i class="fa-solid fa-shoe-prints"></i><span>Walking Champ</span>
    </div>
  `;
}

function calculateBMI() {
  const height = Number(elements.heightInput.value) / 100;
  const weight = Number(elements.weightInput.value);
  if (!height || !weight) {
    elements.bmiResult.textContent = 'Enter valid height and weight.';
    return;
  }
  const bmi = (weight / (height * height)).toFixed(1);
  let category = 'Healthy';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  elements.bmiResult.textContent = `BMI: ${bmi} — ${category}`;
  showToast('BMI calculated.');
}

function incrementWater() {
  const amount = Math.max(1, Number(elements.waterInput.value));
  state.dailyWater += amount;
  saveState();
  renderApp();
  showToast(`${amount} glass(es) of water logged.`);
}

function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  anchor.download = `fitpulse-${dateStr}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Fitness data exported successfully.');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', () => {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported.activities || !imported.goals) {
          throw new Error('Missing required data');
        }
        Object.assign(state, imported);
        saveState();
        refreshApp();
        showToast('Data imported successfully.');
      } catch (error) {
        showToast('Invalid JSON file. Make sure it contains activities and goals.', 'error');
      }
    };
    reader.readAsText(input.files[0]);
  });
  input.click();
}

function refreshApp() {
  renderActivities();
  updateStreak();
  updateDashboard();
  renderGoals();
  renderReport();
  renderCharts();
}

function renderApp() {
  renderActivities();
  updateDashboard();
  renderGoals();
  renderReport();
  renderCharts();
}

function attachEventListeners() {
  elements.menuButtons.forEach(button => {
    button.addEventListener('click', () => switchPanel(button.dataset.panel));
    // support keyboard activation (Enter / Space)
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });
  elements.themeSwitcher.addEventListener('click', () => {
    const nextTheme = state.preferences.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
  elements.openActivityModal.addEventListener('click', openModal);
  elements.closeModal.addEventListener('click', closeModal);
  elements.cancelModal.addEventListener('click', closeModal);
  elements.modalOverlay.addEventListener('click', event => {
    if (event.target === elements.modalOverlay) closeModal();
  });
  // ensure Escape closes modal if visible
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modalOverlay.classList.contains('hidden')) {
      closeModal();
    }
  });
  elements.activityForm.addEventListener('submit', addOrUpdateActivity);
  elements.searchActivity.addEventListener('input', renderActivities);
  elements.filterActivity.addEventListener('change', renderActivities);
  elements.activityTableBody.addEventListener('click', handleActivityTableClick);
  elements.openGoalModal.addEventListener('click', handleGoalCreation);
  elements.calculateBmiBtn.addEventListener('click', calculateBMI);
  elements.addWaterBtn.addEventListener('click', incrementWater);
  elements.exportDataBtn.addEventListener('click', exportData);
  elements.importDataBtn.addEventListener('click', importData);
  elements.mobileAddButton?.addEventListener('click', openModal);
}

function initialize() {
  loadState();
  initTheme();
  attachEventListeners();
  switchPanel('dashboard');
  renderApp();
}

window.addEventListener('DOMContentLoaded', initialize);
