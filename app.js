const STORAGE_KEY = "daymark-tasks";
const filters = new Set(["all", "active", "completed"]);

const addForm = document.querySelector("#add-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyMessage = document.querySelector("#empty-message");
const emptyIllustration = document.querySelector("#empty-illustration");
const allCount = document.querySelector("#all-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const appMessage = document.querySelector("#app-message");
const filterButtons = [...document.querySelectorAll(".filter-button")];

let currentFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) return [];

    const parsedTasks = JSON.parse(savedTasks);
    if (
      !Array.isArray(parsedTasks) ||
      !parsedTasks.every(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.text === "string" &&
          typeof task.completed === "boolean",
      )
    ) {
      throw new Error("Saved tasks have an unexpected format.");
    }

    return parsedTasks;
  } catch (error) {
    console.error("Could not load saved tasks.", error);
    announce("Saved tasks could not be loaded. You can still add tasks for this session.");
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks.", error);
    announce("Your changes could not be saved. Check your browser storage settings.");
    return false;
  }
}

function announce(message) {
  appMessage.textContent = message;
}

function makeIcon(paths) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  paths.forEach((path) => {
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shape.setAttribute("d", path);
    svg.append(shape);
  });
  return svg;
}

function render() {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  taskList.replaceChildren(...visibleTasks.map(createTaskElement));
  allCount.textContent = String(tasks.length);
  clearCompletedButton.hidden = completedTasks === 0;
  emptyState.hidden = visibleTasks.length > 0;
  emptyMessage.hidden = currentFilter !== "completed" || visibleTasks.length > 0;
  emptyMessage.textContent = "No completed Tasks Yet";
  emptyIllustration.hidden = !emptyMessage.hidden;

  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-complete" : ""}`;

  const toggle = document.createElement("button");
  toggle.className = "task-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-pressed", String(task.completed));
  toggle.setAttribute(
    "aria-label",
    `${task.completed ? "Mark as active" : "Mark as completed"}: ${task.text}`,
  );
  if (task.completed) toggle.append(makeIcon(["M20 6 9 17l-5-5"]));
  toggle.addEventListener("click", () => {
    task.completed = !task.completed;
    saveTasks();
    render();
  });

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.setAttribute("aria-label", `Delete task: ${task.text}`);
  remove.append(
    makeIcon([
      "M3 6h18",
      "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M10 11v6",
      "M14 11v6",
    ]),
  );
  remove.addEventListener("click", () => {
    tasks = tasks.filter((itemTask) => itemTask.id !== task.id);
    saveTasks();
    render();
    announce(`Deleted task: ${task.text}`);
  });

  item.append(toggle, text, remove);
  return item;
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
  });
  saveTasks();
  currentFilter = "all";
  taskInput.value = "";
  render();
  taskInput.focus();
  announce(`Added task: ${text}`);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextFilter = button.dataset.filter;
    if (!filters.has(nextFilter)) return;
    currentFilter = nextFilter;
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  const completedCount = tasks.filter((task) => task.completed).length;
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
  announce(`Cleared ${completedCount} completed ${completedCount === 1 ? "task" : "tasks"}.`);
});

render();
