
let tasks = [];
let done = 0;

// --- CONFIGURATION ---
const API_KEY = "API.KEY.HERE"; // <--- PASTE YOUR KEY HERE
const SYSTEM_PROMPT = "Du är en akdemisk nivå lärare. Svara kort på letta frågor. Svra uppmuntrande och använd punkter om det behövs. Om det är svart fråga utveckal extra. Structurera dina svår";

function showSection(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
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
// --- UPDATED AI COACH LOGIC (DEBUG VERSION) ---
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
      
      // --- DEBUGGING: Check for API Errors ---
      if (data.error) {
          console.error("API Error:", data.error);
          outputField.innerHTML = `<span style="color:red; font-weight:bold;">API ERROR:</span><br>${data.error.message}`;
          return;
      }
  
      // 2. Handle Success
      if (data.candidates && data.candidates[0].content) {
         const rawText = data.candidates[0].content.parts[0].text;
         const formattedText = rawText
           .replace(/\*\*(.*?)\* \* /g, '<b>$1</b>')
           .replace(/\* /g, '•'); 
         outputField.innerHTML = formattedText;
      } else {
         // This happens if the AI returns an empty response (rare)
         console.log("Full Response:", data);
         outputField.innerText = "Svaret var tomt. Kolla konsolen (F12) för mer info.";
      }
  
    } catch (error) {
      console.error("Network Error:", error);
      outputField.innerHTML = "<span style='color:red'>Nätverksfel. Kolla att du har internet.</span>";
    }
  }
    /*
    Available Models for your Key:
gemini-2.5-flash
gemini-2.5-pro
gemini-2.0-flash
gemini-2.0-flash-001
gemini-2.0-flash-lite-001
gemini-2.0-flash-lite
gemini-exp-1206
gemini-2.5-flash-preview-tts
gemini-2.5-pro-preview-tts
gemma-3-1b-it
gemma-3-4b-it
gemma-3-12b-it
gemma-3-27b-it
gemma-3n-e4b-it
gemma-3n-e2b-it
gemini-flash-latest
gemini-flash-lite-latest
gemini-pro-latest
gemini-2.5-flash-lite
gemini-2.5-flash-image
gemini-2.5-flash-preview-09-2025
gemini-2.5-flash-lite-preview-09-2025
gemini-3-pro-preview
gemini-3-flash-preview
gemini-3-pro-image-preview
nano-banana-pro-preview
gemini-robotics-er-1.5-preview
gemini-2.5-computer-use-preview-10-2025
deep-research-pro-preview-12-2025
    */ 
