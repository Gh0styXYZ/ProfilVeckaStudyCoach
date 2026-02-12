let tasks = [];
let done = 0;
const TASKS_KEY = 'pv_tasks';

// --- CONFIGURATION ---
// API key is read from localStorage to avoid embedding secrets in source.
function getApiKey() {
  return localStorage.getItem('API_KEY') || '';
}

function saveApiKey(key) {
  if (!key) return;
  localStorage.setItem('API_KEY', key);
}

function clearApiKey() {
  localStorage.removeItem('API_KEY');
}

// Convenience prompt to set the API key (calls `saveApiKey`).
function promptAndSaveApiKey() {
  const k = prompt('Klistra in din API-nyckel (sparas i localStorage):');
  if (k) saveApiKey(k.trim());
}

// UI helpers for API key input present on the page
function saveApiKeyFromInput() {
  const el = document.getElementById('apiKeyInput');
  if (!el) return;
  const v = el.value.trim();
  if (!v) {
    alert('Ingen nyckel angiven. Klistra in din API-nyckel i fältet.');
    return;
  }
  saveApiKey(v);
  updateApiKeyUI();
}

function clearApiKeyFromInput() {
  clearApiKey();
  updateApiKeyUI();
}

function updateApiKeyUI() {
  const el = document.getElementById('apiKeyInput');
  const status = document.getElementById('apiKeyStatus');
  const saved = getApiKey();
  if (el) el.value = saved || '';
  if (status) status.textContent = saved ? 'Sparad' : 'Ej sparad';
}

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      tasks = parsed.map(t => ({
        course: t.course || '',
        task: t.task || '',
        deadline: t.deadline || null,
        done: !!t.done
      }));
      // ensure done count is correct
      done = tasks.filter(t => t.done).length;
    }
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
}
const SYSTEM_PROMPT = "Du är en lärare på akademisk nivå. Svara kort och tydligt på enkla frågor. Var uppmuntrande och använd punktlistor när det behövs. Vid svårare frågor, utveckla svaret mer. Strukturera dina svar klart och koncist.";

// Theme toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeButton(next);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.textContent = theme === 'dark' ? '☀' : '☾';
}

// Initialize theme on load and mark dashboard active
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.querySelector('[data-section="dashboard"]')?.classList.add('active');
    // load tasks from storage and initialize UI
    loadTasks();
    updateTasks();
    // initialize API key UI if present
    updateApiKeyUI();
  });
} else {
  initTheme();
  document.querySelector('[data-section="dashboard"]')?.classList.add('active');
  // load tasks from storage and initialize UI
  loadTasks();
  updateTasks();
  // initialize API key UI if present
  updateApiKeyUI();
}

function showSection(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (!page) return;
  page.classList.add('active');
  // mark active nav button
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${id}"]`)?.classList.add('active');
}

function addTask() {
  const courseEl = document.getElementById('course');
  const taskEl = document.getElementById('task');
  const deadlineEl = document.getElementById('deadline');
  if (!courseEl || !taskEl) return;
  const course = courseEl.value.trim();
  const task = taskEl.value.trim();
  const deadline = deadlineEl ? (deadlineEl.value || '').trim() : '';
  if (!course || !task) return;
  tasks.push({ course, task, deadline: deadline || null, done: false });
  // clear inputs
  courseEl.value = '';
  taskEl.value = '';
  if (deadlineEl) deadlineEl.value = '';
  updateTasks();
}

function updateTasks() {
  const list = document.getElementById('taskList');
  if (!list) return;
  list.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = `${t.course}: ${t.task}`;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    // deadline / days left
    if (t.deadline) {
      const today = new Date();
      const dl = new Date(t.deadline + 'T23:59:59');
      const diffMs = dl - new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const dlSpan = document.createElement('span');
      dlSpan.className = 'task-deadline';
      if (diffDays < 0) {
        dlSpan.textContent = `Försenad ${Math.abs(diffDays)} dag${Math.abs(diffDays) === 1 ? '' : 'ar'}`;
        dlSpan.classList.add('overdue');
      } else if (diffDays === 0) {
        dlSpan.textContent = 'Sista dag idag';
        dlSpan.classList.add('due-today');
      } else {
        dlSpan.textContent = `${diffDays} dag${diffDays === 1 ? '' : 'ar'} kvar`;
      }
      meta.appendChild(dlSpan);
    }

    // done toggle
    const btn = document.createElement('button');
    btn.className = 'primary small';
    btn.textContent = t.done ? 'Ångra' : 'Markera klar';
    btn.onclick = () => toggleTaskDone(i);
    meta.appendChild(btn);

    li.appendChild(title);
    li.appendChild(meta);
    if (t.done) li.classList.add('done');
    list.appendChild(li);
  });
  // Recalculate done in case tasks were mutated directly
  done = tasks.filter(t => t.done).length;
  const taskCountEl = document.getElementById('taskCount');
  const doneCountEl = document.getElementById('doneCount');
  if (taskCountEl) taskCountEl.innerText = Math.max(0, tasks.length - done);
  if (doneCountEl) doneCountEl.innerText = done;

  // Also refresh dashboard mini list (next upcoming tasks)
  const dash = document.getElementById('dashboardTasks');
  if (dash) {
    dash.innerHTML = '';
    const upcoming = tasks.filter(t => !t.done).slice(0, 6);
    upcoming.forEach((t) => {
      const li = document.createElement('li');
      const part = `${t.course}: ${t.task}`;
      let info = '';
      if (t.deadline) {
        const today = new Date();
        const dl = new Date(t.deadline + 'T23:59:59');
        const diffDays = Math.ceil((dl - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          const daysLate = Math.abs(diffDays);
          info = ` — Försenad ${daysLate} dag${daysLate === 1 ? '' : 'ar'}`;
        } else if (diffDays === 0) {
          info = ' — Sista dag idag';
        } else {
          info = ` — ${diffDays} dag${diffDays === 1 ? '' : 'ar'} kvar`;
        }
      }
      li.textContent = part + info;
      dash.appendChild(li);
    });
  }
  // persist
  saveTasks();
}

function completeTask(index) {
  // For backward compatibility: mark task complete from dashboard list
  if (!tasks || !tasks[index]) return;
  tasks[index].done = true;
  updateTasks();
}

function toggleTaskDone(index) {
  if (!tasks || !tasks[index]) return;
  tasks[index].done = !tasks[index].done;
  updateTasks();
}

// --- UPDATED AI COACH LOGIC ---
async function coachReply() {
  const inputField = document.getElementById('coachInput');
  const outputField = document.getElementById('coachOutput');
  if (!inputField || !outputField) return;
  const userText = (inputField.value || '').trim();
  if (!userText) return;

  // 1. Show Loading State
  try { outputField.classList.add('visible'); } catch (e) {}
  outputField.innerHTML = "<span class='loading'>Tänker...</span>";
  
    try {
      const finalPrompt = `${SYSTEM_PROMPT}\n\nFråga: ${userText}`;

      const model = document.getElementById('modelSelect')?.value || 'gemini-3-flash-preview';

      const API_KEY = getApiKey();
      if (!API_KEY) {
        outputField.innerHTML = "<span style='color:#f59e0b'>Ingen API-nyckel är inställd. Kör <code>promptAndSaveApiKey()</code> eller använd <code>saveApiKey(your_key)</code> i konsolen.</span>";
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }]
          })
        }
      );
  
      const data = await response.json();

      if (data.error) {
          console.error("API Error:", data.error);
          outputField.innerHTML = `<span style="color:red; font-weight:bold;">API ERROR:</span><br>${data.error.message}`;
          return;
      }

      // Robust extraction of text from several possible response shapes
      let rawText = '';
      try {
        if (data.candidates && data.candidates[0]) {
          const c = data.candidates[0];
          if (c.content && c.content.parts && c.content.parts.length) {
            rawText = c.content.parts.map(p => p.text || p).join('\n');
          } else if (c.outputText) {
            rawText = c.outputText;
          }
        } else if (data.outputText) {
          rawText = data.outputText;
        } else if (typeof data === 'string') {
          rawText = data;
        } else {
          rawText = JSON.stringify(data, null, 2);
        }
      } catch (e) {
        console.error('Parsing error:', e, data);
        rawText = JSON.stringify(data, null, 2);
      }

      if (rawText) {
         const formattedText = String(rawText)
           .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
           .replace(/\* /g, '• ');
         outputField.innerHTML = formattedText;
      } else {
         console.log("Full Response:", data);
         outputField.innerText = "Svaret var tomt. Kolla konsolen (F12) för mer info.";
      }
  
    } catch (error) {
      console.error("Network Error:", error);
      outputField.innerHTML = "<span style='color:red'>Nätverksfel. Kolla att du har internet.</span>";
    }
}

/* Available models (examples) - choose one and replace in the request URL above:
   - gemini-3-flash-preview        : fast, lower-latency text generation (good for UI responsiveness)
   - gemini-3-pro                  : higher-capacity, more detailed answers (slower, more thorough)
   - gemini-2.1                    : stable general-purpose model
   - gemini-1.0                    : legacy / smaller model

   Example: change the fetch URL to use a different model name
     `https://generativelanguage.googleapis.com/v1beta/models/<MODEL_NAME>:generateContent?key=${API_KEY}`

   Notes:
   - Use the model that fits your latency / quality tradeoff.
   - Some models may require billing or access permissions on your Google Cloud project.
   - If you need code or instruction-tuned variants, check the provider docs for available model IDs.
*/
