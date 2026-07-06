const STORAGE_KEYS = {
  logs: "daylight.logs",
  profile: "daylight.profile"
};

const facts = [
  {
    title: "Teens, screens and mental health",
    text: "WHO/HBSC во 2022 опфатиле речиси 280.000 млади на 11, 13 и 15 години од 44 земји и региони. Проблематичната употреба на социјални медиуми пораснала од 7% во 2018 на 11% во 2022.",
    url: "https://www.who.int/europe/news/item/25-09-2024-teens--screens-and-mental-health"
  },
  {
    title: "Дигитален ритам",
    text: "WHO/HBSC бележи дека проблематичната употреба на социјални медиуми е поврзувана со помалку сон и подоцна легнување, што може да влијае на здравјето и училишниот фокус.",
    url: "https://www.who.int/europe/news/item/25-09-2024-teens--screens-and-mental-health"
  },
  {
    title: "HBSC 2021/2022",
    text: "HBSC извештаите ги следат здравјето и благосостојбата на адолесценти на 11, 13 и 15 години и се користат за политики и училишни интервенции.",
    url: "https://www.hbsc.org/publications/reports/"
  }
];

const badges = [
  {
    id: "first-log",
    icon: "◐",
    title: "Прва светлина",
    description: "Направен е првиот дневен внес.",
    earned: (state) => state.logs.length >= 1
  },
  {
    id: "seven-logs",
    icon: "▦",
    title: "7 дена следење",
    description: "Собрани се најмалку седум дневни внесови.",
    earned: (state) => state.logs.length >= 7
  },
  {
    id: "sleep-seven",
    icon: "☾",
    title: "7 дена добар сон",
    description: "Постигнат е streak со здрав сон од 7 до 9 часа.",
    earned: (state) => state.longestSleepStreak >= 7
  },
  {
    id: "screen-down",
    icon: "↓",
    title: "Екран во пад",
    description: "Screen time е намален 3 внесови по ред.",
    earned: (state) => hasScreenDrop(state.logs)
  },
  {
    id: "balanced",
    icon: "✦",
    title: "Баланс",
    description: "Еден ден со 7-9ч сон и 4ч или помалку screen time.",
    earned: (state) => state.logs.some((log) => isHealthySleep(log.sleepHours) && log.screenTime <= 4)
  },
  {
    id: "bright-mood",
    icon: "☼",
    title: "Добро утро",
    description: "Три внесови со расположение 4 или 5.",
    earned: (state) => state.logs.filter((log) => log.mood >= 4).length >= 3
  },
  {
    id: "low-screen",
    icon: "⌁",
    title: "Мирен екран",
    description: "Три дена со screen time до 3 часа.",
    earned: (state) => state.logs.filter((log) => log.screenTime <= 3).length >= 3
  },
  {
    id: "thirty",
    icon: "◆",
    title: "30 дена ритам",
    description: "Собрани се 30 дневни внесови.",
    earned: (state) => state.logs.length >= 30
  }
];

let logs = loadLogs();
let profile = loadProfile();
let currentRange = 7;

const els = {
  panels: document.querySelectorAll(".panel"),
  tabs: document.querySelectorAll(".tab-button"),
  rangeButtons: document.querySelectorAll(".range-button"),
  form: document.querySelector("#log-form"),
  date: document.querySelector("#entry-date"),
  bedTime: document.querySelector("#bed-time"),
  wakeTime: document.querySelector("#wake-time"),
  screenTime: document.querySelector("#screen-time"),
  screenOutput: document.querySelector("#screen-output"),
  dailySummary: document.querySelector("#daily-summary"),
  streak: document.querySelector("#streak-count"),
  points: document.querySelector("#points-count"),
  avgSleep: document.querySelector("#avg-sleep"),
  avgScreen: document.querySelector("#avg-screen"),
  chart: document.querySelector("#trend-chart"),
  correlationTitle: document.querySelector("#correlation-title"),
  correlationCopy: document.querySelector("#correlation-copy"),
  todayScore: document.querySelector("#today-score"),
  todayScoreCopy: document.querySelector("#today-score-copy"),
  badgeGrid: document.querySelector("#badge-grid"),
  nextGoal: document.querySelector("#next-goal"),
  goalProgress: document.querySelector("#goal-progress"),
  tipsList: document.querySelector("#tips-list"),
  hbscTitle: document.querySelector("#hbsc-fact-title"),
  hbscFact: document.querySelector("#hbsc-fact"),
  demoData: document.querySelector("#demo-data"),
  resetData: document.querySelector("#reset-data"),
  toast: document.querySelector("#toast"),
  onboarding: document.querySelector("#onboarding"),
  onboardingForm: document.querySelector("#onboarding-form"),
  profileAge: document.querySelector("#profile-age"),
  profileBedtime: document.querySelector("#profile-bedtime")
};

function init() {
  els.date.value = toDateInput(new Date());
  els.screenOutput.value = Number(els.screenTime.value).toFixed(1);
  bindEvents();
  rotateFact();

  if (!profile) {
    openOnboarding();
  }

  render();
}

function bindEvents() {
  els.tabs.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  els.rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentRange = Number(button.dataset.range);
      els.rangeButtons.forEach((rangeButton) => rangeButton.classList.remove("active"));
      button.classList.add("active");
      drawChart();
      renderCorrelation();
    });
  });

  els.screenTime.addEventListener("input", () => {
    els.screenOutput.value = Number(els.screenTime.value).toFixed(1);
  });

  els.form.addEventListener("submit", handleSave);
  els.demoData.addEventListener("click", loadDemoData);
  els.resetData.addEventListener("click", resetData);
  els.onboardingForm.addEventListener("submit", saveProfile);
  window.addEventListener("resize", drawChart);
}

function activateTab(tabId) {
  els.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  els.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  if (tabId === "stats") {
    requestAnimationFrame(drawChart);
  }
}

function handleSave(event) {
  event.preventDefault();

  const mood = Number(new FormData(els.form).get("mood"));
  const sleepHours = calculateSleepHours(els.bedTime.value, els.wakeTime.value);
  const entry = {
    date: els.date.value,
    bedTime: els.bedTime.value,
    wakeTime: els.wakeTime.value,
    sleepHours,
    screenTime: Number(els.screenTime.value),
    mood,
    savedAt: new Date().toISOString()
  };

  logs = upsertLog(logs, entry);
  saveLogs();
  render();
  showToast(`Зачувано: ${formatHours(sleepHours)} сон, ${entry.screenTime.toFixed(1)}ч екран.`);
}

function saveProfile(event) {
  event.preventDefault();
  const selectedGoal = new FormData(els.onboardingForm).get("goal");

  profile = {
    age: els.profileAge.value,
    goal: selectedGoal,
    bedtime: els.profileBedtime.value
  };

  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  els.onboarding.close();
  showToast("Daylight е подготвен.");
  renderTips();
}

function openOnboarding() {
  if (typeof els.onboarding.showModal === "function") {
    els.onboarding.showModal();
  }
}

function render() {
  const state = getState();
  renderSummary(state);
  renderMetrics(state);
  drawChart();
  renderCorrelation();
  renderBadges(state);
  renderTips();
}

function renderSummary(state) {
  const latest = getLatestLog();

  if (!latest) {
    els.dailySummary.textContent = "Внеси го денешниот сон, екран и расположение.";
    return;
  }

  const sleepLabel = isHealthySleep(latest.sleepHours) ? "здрав сон" : "сон за подобрување";
  const screenLabel = latest.screenTime <= 4 ? "умерен екран" : "повисок screen time";
  els.dailySummary.textContent = `${formatDate(latest.date)}: ${formatHours(latest.sleepHours)} ${sleepLabel}, ${latest.screenTime.toFixed(1)}ч ${screenLabel}.`;
}

function renderMetrics(state) {
  const lastSeven = getLogsInRange(7);

  els.streak.textContent = state.currentSleepStreak;
  els.points.textContent = state.points;
  els.avgSleep.textContent = lastSeven.length ? `${average(lastSeven.map((log) => log.sleepHours)).toFixed(1)}ч` : "0ч";
  els.avgScreen.textContent = lastSeven.length ? `${average(lastSeven.map((log) => log.screenTime)).toFixed(1)}ч` : "0ч";

  const latest = getLatestLog();
  const score = latest ? calculateDayScore(latest) : 0;
  els.todayScore.textContent = `${score}/100`;
  els.todayScoreCopy.textContent = latest
    ? getScoreCopy(score)
    : "Скорот се гради од сон, screen time и расположение.";
}

function drawChart() {
  const canvas = els.chart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  if (rect.width === 0) {
    return;
  }

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(Math.max(rect.height, 300) * dpr);
  ctx.scale(dpr, dpr);

  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const chartLogs = getLogsInRange(currentRange);
  const pad = { top: 26, right: 28, bottom: 54, left: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, pad, plotW, plotH);

  if (!chartLogs.length) {
    drawEmptyChart(ctx, width, height);
    return;
  }

  const maxY = Math.max(10, ...chartLogs.map((log) => Math.max(log.sleepHours, log.screenTime)));
  const xFor = (index) => {
    if (chartLogs.length === 1) return pad.left + plotW / 2;
    return pad.left + (index / (chartLogs.length - 1)) * plotW;
  };
  const yFor = (value) => pad.top + plotH - (value / maxY) * plotH;
  const barWidth = Math.max(10, Math.min(28, plotW / Math.max(chartLogs.length, 1) - 8));

  chartLogs.forEach((log, index) => {
    const x = xFor(index);
    const y = yFor(log.screenTime);
    ctx.fillStyle = "rgba(44, 154, 152, 0.24)";
    roundedRect(ctx, x - barWidth / 2, y, barWidth, pad.top + plotH - y, 5);
    ctx.fill();
  });

  drawLine(ctx, chartLogs.map((log, index) => [xFor(index), yFor(log.sleepHours)]), "#ef806f", 3);
  drawLine(ctx, chartLogs.map((log, index) => [xFor(index), yFor((log.mood / 5) * maxY)]), "#b7a2d8", 3);

  chartLogs.forEach((log, index) => {
    const x = xFor(index);
    drawDot(ctx, x, yFor(log.sleepHours), "#ef806f");
    drawDot(ctx, x, yFor((log.mood / 5) * maxY), "#b7a2d8");

    if (index === 0 || index === chartLogs.length - 1 || chartLogs.length <= 7) {
      ctx.fillStyle = "#66747b";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(shortDate(log.date), x, height - 22);
    }
  });

  ctx.fillStyle = "#66747b";
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${Math.round(maxY)}ч`, 10, pad.top + 4);
  ctx.fillText("0", 18, pad.top + plotH + 4);
}

function drawGrid(ctx, pad, plotW, plotH) {
  ctx.strokeStyle = "#e8f0ed";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }
}

function drawEmptyChart(ctx, width, height) {
  ctx.fillStyle = "#66747b";
  ctx.font = "800 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Додај внес или вчитај демо податоци", width / 2, height / 2);
}

function drawLine(ctx, points, color, lineWidth) {
  if (!points.length) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function drawDot(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(height) / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function renderCorrelation() {
  const chartLogs = getLogsInRange(currentRange);
  const allLogs = sortLogs(logs);
  const hasSleepContrast = (items) =>
    items.filter((log) => log.sleepHours < 7).length >= 2 &&
    items.filter((log) => isHealthySleep(log.sleepHours)).length >= 2;
  const hasScreenContrast = (items) =>
    items.filter((log) => log.screenTime > 4).length >= 2 &&
    items.filter((log) => log.screenTime <= 4).length >= 2;
  const sourceLogs = hasSleepContrast(chartLogs) || hasScreenContrast(chartLogs) ? chartLogs : allLogs;
  const sourceLabel = sourceLogs === chartLogs ? `последните ${currentRange} дена` : "сите внесови";
  const lowSleep = sourceLogs.filter((log) => log.sleepHours < 7);
  const healthySleep = sourceLogs.filter((log) => isHealthySleep(log.sleepHours));
  const highScreen = sourceLogs.filter((log) => log.screenTime > 4);
  const lowerScreen = sourceLogs.filter((log) => log.screenTime <= 4);

  if (lowSleep.length >= 2 && healthySleep.length >= 2) {
    const lowMood = average(lowSleep.map((log) => log.mood));
    const healthyMood = average(healthySleep.map((log) => log.mood));
    els.correlationTitle.textContent = lowMood < healthyMood ? "Повеќе сон, подобро расположение" : "Твојот ритам е мешан";
    els.correlationCopy.textContent = `Во ${sourceLabel}, кога спиеш под 7ч, расположението е ${lowMood.toFixed(1)}/5. Со 7-9ч сон е ${healthyMood.toFixed(1)}/5.`;
    return;
  }

  if (highScreen.length >= 2 && lowerScreen.length >= 2) {
    const highMood = average(highScreen.map((log) => log.mood));
    const lowerMood = average(lowerScreen.map((log) => log.mood));
    els.correlationTitle.textContent = lowerMood >= highMood ? "Помалку екран, полесен ден" : "Потребни се уште внесови";
    els.correlationCopy.textContent = `Во ${sourceLabel}, со над 4ч screen time расположението е ${highMood.toFixed(1)}/5. Со 4ч или помалку е ${lowerMood.toFixed(1)}/5.`;
    return;
  }

  els.correlationTitle.textContent = "Нема доволно податоци";
  els.correlationCopy.textContent = "Додај барем неколку денови со различен сон или screen time за да се појави личен увид.";
}

function renderBadges(state) {
  els.badgeGrid.innerHTML = badges
    .map((badge) => {
      const earned = badge.earned(state);
      return `
        <article class="badge ${earned ? "" : "locked"}">
          <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
          <h3>${badge.title}</h3>
          <p>${badge.description}</p>
          <strong>${earned ? "Освоено" : "Заклучено"}</strong>
        </article>
      `;
    })
    .join("");

  const sleepGoal = Math.min(7, state.currentSleepStreak);
  els.nextGoal.textContent = state.longestSleepStreak >= 7 ? "Одржи го ритамот" : "7 дена добар сон";
  els.goalProgress.style.width = `${Math.round((sleepGoal / 7) * 100)}%`;
}

function renderTips() {
  const latest = getLatestLog();
  const goal = profile?.goal || "sleep";
  const tips = [];

  if (!latest) {
    tips.push({
      icon: "◐",
      title: "Почни со еден ден",
      text: "Внеси сон, screen time и расположение денес. Утре Daylight веќе ќе има со што да спореди."
    });
  } else {
    if (latest.sleepHours < 7) {
      tips.push({
        icon: "☾",
        title: "30 минути тивок режим",
        text: "Пробај телефонот да биде настрана половина час пред спиење и задржи исто време за легнување."
      });
    }

    if (latest.screenTime > 4) {
      tips.push({
        icon: "⌁",
        title: "Една мала пауза",
        text: "Постави пауза од 10 минути после подолг scroll, игра или видео. Мал прекин прави разлика."
      });
    }

    if (latest.mood <= 2) {
      tips.push({
        icon: "♡",
        title: "Провери го телото",
        text: "Вода, кратко движење или разговор со некој близок може да го смени тонот на денот."
      });
    }

    if (isHealthySleep(latest.sleepHours) && latest.screenTime <= 4) {
      tips.push({
        icon: "☼",
        title: "Задржи го истиот ритам",
        text: "Овој ден е добар шаблон: доволно сон и разумен екран. Повтори го утре со мала варијација."
      });
    }
  }

  if (goal === "screen") {
    tips.push({
      icon: "↓",
      title: "Намали без драма",
      text: "Одбери една апликација и скрати ја за 15 минути денес, наместо да менуваш се одеднаш."
    });
  } else if (goal === "mood") {
    tips.push({
      icon: "✦",
      title: "Планирај едно добро нешто",
      text: "Стави мал настан што го сакаш пред екранот: музика, прошетка, цртање или разговор."
    });
  } else {
    tips.push({
      icon: "▥",
      title: "Ист час, полесно будење",
      text: "Кога легнувањето се повторува во слично време, телото полесно го препознава ноќниот ритам."
    });
  }

  els.tipsList.innerHTML = tips.slice(0, 4).map((tip) => `
    <article class="tip-card">
      <span aria-hidden="true">${tip.icon}</span>
      <div>
        <h3>${tip.title}</h3>
        <p>${tip.text}</p>
      </div>
    </article>
  `).join("");
}

function rotateFact() {
  const index = Math.floor(new Date().getDate() % facts.length);
  const fact = facts[index];
  els.hbscTitle.textContent = fact.title;
  els.hbscFact.textContent = fact.text;
  const link = document.querySelector(".hbsc-card a");
  link.href = fact.url;
}

function getState() {
  const sorted = sortLogs(logs);
  return {
    logs: sorted,
    currentSleepStreak: getCurrentSleepStreak(sorted),
    longestSleepStreak: getLongestSleepStreak(sorted),
    points: getPoints(sorted)
  };
}

function getPoints(items) {
  return items.reduce((total, log) => {
    let points = 2;
    if (isHealthySleep(log.sleepHours)) points += 10;
    if (log.screenTime <= 4) points += 5;
    if (log.mood >= 4) points += 3;
    return total + points;
  }, 0);
}

function calculateDayScore(log) {
  const sleepScore = isHealthySleep(log.sleepHours)
    ? 45
    : Math.max(0, 45 - Math.abs(8 - log.sleepHours) * 12);
  const screenScore = Math.max(0, 35 - Math.max(0, log.screenTime - 2) * 7);
  const moodScore = log.mood * 4;
  return Math.min(100, Math.round(sleepScore + screenScore + moodScore));
}

function getScoreCopy(score) {
  if (score >= 82) return "Силен баланс: сон, екран и расположение се во добар ритам.";
  if (score >= 62) return "Добра основа. Еден мал чекор може да го крене утрешниот скор.";
  return "Нежен ден за поправка: почни со сон или кратка screen пауза.";
}

function getCurrentSleepStreak(items) {
  const sorted = sortLogs(items);
  if (!sorted.length) return 0;

  let streak = 0;
  let previousDate = null;

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const log = sorted[index];
    if (!isHealthySleep(log.sleepHours)) break;

    if (previousDate && dayDiff(log.date, previousDate) !== 1) break;

    streak += 1;
    previousDate = log.date;
  }

  return streak;
}

function getLongestSleepStreak(items) {
  const sorted = sortLogs(items);
  let longest = 0;
  let current = 0;
  let previous = null;

  sorted.forEach((log) => {
    if (isHealthySleep(log.sleepHours) && (!previous || dayDiff(previous.date, log.date) === 1)) {
      current += 1;
    } else if (isHealthySleep(log.sleepHours)) {
      current = 1;
    } else {
      current = 0;
    }

    longest = Math.max(longest, current);
    previous = log;
  });

  return longest;
}

function hasScreenDrop(items) {
  const sorted = sortLogs(items);
  for (let index = 2; index < sorted.length; index += 1) {
    const first = sorted[index - 2];
    const second = sorted[index - 1];
    const third = sorted[index];
    if (second.screenTime < first.screenTime && third.screenTime < second.screenTime) {
      return true;
    }
  }
  return false;
}

function getLogsInRange(days) {
  const sorted = sortLogs(logs);
  return sorted.slice(Math.max(0, sorted.length - days));
}

function getLatestLog() {
  return sortLogs(logs).at(-1);
}

function upsertLog(items, entry) {
  const next = items.filter((item) => item.date !== entry.date);
  next.push(entry);
  return sortLogs(next);
}

function sortLogs(items) {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

function calculateSleepHours(bedTime, wakeTime) {
  const bed = timeToMinutes(bedTime);
  let wake = timeToMinutes(wakeTime);

  if (wake <= bed) {
    wake += 24 * 60;
  }

  return Math.round(((wake - bed) / 60) * 10) / 10;
}

function isHealthySleep(hours) {
  return hours >= 7 && hours <= 9;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function dayDiff(first, second) {
  const one = new Date(`${first}T12:00:00`);
  const two = new Date(`${second}T12:00:00`);
  return Math.round((two - one) / 86400000);
}

function formatHours(hours) {
  return `${hours.toFixed(1)}ч`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("mk-MK", {
    day: "numeric",
    month: "short"
  }).format(new Date(`${value}T12:00:00`));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("mk-MK", {
    day: "numeric",
    month: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function toDateInput(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.logs)) || [];
  } catch {
    return [];
  }
}

function saveLogs() {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.profile));
  } catch {
    return null;
  }
}

function loadDemoData() {
  logs = createDemoLogs();
  saveLogs();
  render();
  showToast("Демо податоците се вчитани.");
}

function createDemoLogs() {
  const today = new Date();
  const pattern = [
    ["23:45", "06:25", 6.7, 5.5, 2],
    ["23:20", "06:50", 7.5, 5.0, 3],
    ["22:55", "06:55", 8.0, 4.3, 4],
    ["23:10", "07:05", 7.9, 4.8, 4],
    ["00:20", "06:40", 6.3, 6.2, 2],
    ["23:05", "07:00", 7.9, 4.2, 4],
    ["22:40", "06:55", 8.3, 3.8, 5],
    ["22:35", "06:50", 8.3, 3.5, 5],
    ["22:30", "06:45", 8.3, 3.1, 4],
    ["22:50", "06:50", 8.0, 2.8, 5],
    ["23:15", "06:35", 7.3, 3.0, 4],
    ["23:00", "06:50", 7.8, 2.7, 5],
    ["22:45", "06:55", 8.2, 2.6, 5],
    ["22:35", "07:00", 8.4, 2.4, 5]
  ];

  return pattern.map(([bedTime, wakeTime, sleepHours, screenTime, mood], index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (pattern.length - index - 1));

    return {
      date: toDateInput(date),
      bedTime,
      wakeTime,
      sleepHours,
      screenTime,
      mood,
      savedAt: new Date().toISOString()
    };
  });
}

function resetData() {
  logs = [];
  saveLogs();
  render();
  showToast("Дневникот е исчистен.");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 2400);
}

init();
