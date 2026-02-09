let tasks = [];
let done = 0;

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
    li.innerHTML = `${t.course}: ${t.task}
      <button onclick="completeTask(${i})">✔</button>`;
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

function coachReply() {
  const input = document.getElementById('coachInput').value;
  document.getElementById('coachOutput').innerText =
    "Tips: Dela upp uppgiften i mindre delar och börja med 15 minuter.";
}
