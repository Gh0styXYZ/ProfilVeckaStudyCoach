let tasks = [];
let done = 0;

// --- CONFIGURATION ---
const API_KEY = "API.KEY.HERE"; // <--- PASTE YOUR KEY HERE
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
  });
} else {
  initTheme();
  document.querySelector('[data-section="dashboard"]')?.classList.add('active');
}

function showSection(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // mark active nav button
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${id}"]`)?.classList.add('active');
}

function addTask() {
  const course = document.getElementById('course').value;
  const task = document.getElementById('task').value;
  if (!course || !task) return;
  tasks.push({ course, task, done: false });
  updateTasks();
}

function updateTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${t.course}: ${t.task} <button onclick="completeTask(${i})">✔</button>`;
    list.appendChild(li);
  });
  document.getElementById('taskCount').innerText = tasks.length - done;
  document.getElementById('doneCount').innerText = done;
}

function completeTask(index) {
  if (!tasks[index].done) {
    tasks[index].done = true;
    done++;
    updateTasks();
  }
}

// --- UPDATED AI COACH LOGIC ---
async function coachReply() {
    const inputField = document.getElementById('coachInput');
    const outputField = document.getElementById('coachOutput');
    
    const userText = inputField.value.trim();
    if (!userText) return;
  
    // 1. Show Loading State
    outputField.classList.add('visible');
    outputField.innerHTML = "<span class='loading'>Tänker...</span>";
  
    try {
      const finalPrompt = `${SYSTEM_PROMPT}\n\nFråga: ${userText}`;
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
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
  
      if (data.candidates && data.candidates[0].content) {
         const rawText = data.candidates[0].content.parts[0].text;
         const formattedText = rawText
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

/* Available Models list omitted for brevity */
