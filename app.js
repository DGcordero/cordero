/* ===========================================================
   CORDERO F — app.js
   Gestión de tareas 100% local. No hay llamadas de red, no hay
   claves de API, no hay analítica. Todo el estado vive en
   localStorage, en el propio dispositivo del usuario.
   =========================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "cordero-f-tasks-v1";
  var state = {
    tasks: [],
    filter: "todas",
    priority: "tactica"
  };

  // ---------- Persistencia local ----------
  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("No se pudo leer el almacenamiento local:", e);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (e) {
      console.error("No se pudo guardar el almacenamiento local:", e);
      showToast("No se pudo guardar. Almacenamiento lleno o bloqueado.");
    }
  }

  function uid() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Utilidades ----------
  var PRIORITY_LABEL = { critica: "Crítica", tactica: "Táctica", rutina: "Rutina" };
  var STATUS_LABEL = { pendiente: "Pendiente", en_curso: "En curso", cumplida: "Cumplida" };
  var STATUS_ORDER = ["pendiente", "en_curso", "cumplida"];

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return null;
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function isOverdue(task) {
    if (!task.due || task.status === "cumplida") return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var due = new Date(task.due + "T00:00:00");
    return due < today;
  }

  function showToast(msg) {
    var toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  // ---------- Render: SITREP (resumen) ----------
  function renderSitrep() {
    var el = document.getElementById("sitrep");
    var counts = { pendiente: 0, en_curso: 0, cumplida: 0 };
    state.tasks.forEach(function (t) { counts[t.status]++; });
    el.innerHTML =
      '<div class="sitrep-cell" style="--stat-color:#8a9a5b"><div class="num">' + counts.pendiente + '</div><div class="label">Pendientes</div></div>' +
      '<div class="sitrep-cell" style="--stat-color:#c1850a"><div class="num">' + counts.en_curso + '</div><div class="label">En curso</div></div>' +
      '<div class="sitrep-cell" style="--stat-color:#6b8e23"><div class="num">' + counts.cumplida + '</div><div class="label">Cumplidas</div></div>';
  }

  // ---------- Render: lista de tareas ----------
  function getFilteredTasks() {
    var f = state.filter;
    var list = state.tasks.slice();
    if (f !== "todas") {
      if (["pendiente", "en_curso", "cumplida"].indexOf(f) !== -1) {
        list = list.filter(function (t) { return t.status === f; });
      } else {
        list = list.filter(function (t) { return t.priority === f; });
      }
    }
    var order = { critica: 0, tactica: 1, rutina: 2 };
    list.sort(function (a, b) {
      if (a.status === "cumplida" && b.status !== "cumplida") return 1;
      if (b.status === "cumplida" && a.status !== "cumplida") return -1;
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.createdAt - a.createdAt;
    });
    return list;
  }

  function renderTasks() {
    var el = document.getElementById("taskList");
    var list = getFilteredTasks();

    if (list.length === 0) {
      el.innerHTML =
        '<div class="empty-state">' +
        '<div class="glyph">&#9733;</div>' +
        '<div class="msg">Sin misiones en este filtro</div>' +
        '</div>';
      return;
    }

    el.innerHTML = list.map(function (t) {
      var overdue = isOverdue(t);
      var dueHtml = t.due
        ? '<span class="' + (overdue ? "overdue" : "") + '">' + (overdue ? "VENCIDA · " : "Plazo: ") + formatDate(t.due) + "</span>"
        : "<span>Sin plazo</span>";
      var nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(t.status) + 1) % STATUS_ORDER.length];

      return (
        '<div class="task-card p-' + t.priority + (t.status === "cumplida" ? " done" : "") + '" data-id="' + t.id + '">' +
          '<div class="task-top">' +
            '<div style="min-width:0">' +
              '<p class="task-title">' + escapeHtml(t.title) + "</p>" +
              (t.desc ? '<p class="task-desc">' + escapeHtml(t.desc) + "</p>" : "") +
              '<div class="task-meta">' +
                '<span class="badge priority-' + t.priority + '">' + PRIORITY_LABEL[t.priority] + "</span>" +
                '<span class="badge status-' + t.status + '">' + STATUS_LABEL[t.status] + "</span>" +
                (t.category ? '<span class="badge">' + escapeHtml(t.category) + "</span>" : "") +
              "</div>" +
            "</div>" +
            '<div class="task-actions">' +
              '<button class="icon-btn advance" data-action="advance" title="Avanzar estado">&#8594;</button>' +
              '<button class="icon-btn danger" data-action="delete" title="Eliminar misión">&#10005;</button>' +
            "</div>" +
          "</div>" +
          '<div class="task-footer">' +
            dueHtml +
            '<button class="status-cycle-btn" data-action="advance">Marcar: ' + STATUS_LABEL[nextStatus] + "</button>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderAll() {
    renderSitrep();
    renderTasks();
  }

  // ---------- Acciones sobre tareas ----------
  function addTask(data) {
    state.tasks.push({
      id: uid(),
      title: data.title.trim(),
      desc: data.desc.trim(),
      category: data.category.trim(),
      due: data.due || null,
      priority: data.priority,
      status: "pendiente",
      createdAt: Date.now()
    });
    saveTasks();
    renderAll();
    showToast("Misión desplegada");
  }

  function advanceTask(id) {
    var t = state.tasks.find(function (x) { return x.id === id; });
    if (!t) return;
    var idx = STATUS_ORDER.indexOf(t.status);
    t.status = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    saveTasks();
    renderAll();
    showToast("Estado: " + STATUS_LABEL[t.status]);
  }

  function deleteTask(id) {
    var t = state.tasks.find(function (x) { return x.id === id; });
    if (!t) return;
    if (!confirm('Eliminar la misión "' + t.title + '"? Esta acción no se puede deshacer.')) return;
    state.tasks = state.tasks.filter(function (x) { return x.id !== id; });
    saveTasks();
    renderAll();
    showToast("Misión eliminada");
  }

  // ---------- Formulario ----------
  function setupForm() {
    var toggleBtn = document.getElementById("toggleForm");
    var toggleIcon = document.getElementById("toggleIcon");
    var formBody = document.getElementById("taskForm");
    var picker = document.getElementById("priorityPicker");

    toggleBtn.addEventListener("click", function () {
      var open = formBody.classList.toggle("open");
      toggleIcon.textContent = open ? "−" : "＋";
      if (open) document.getElementById("title").focus();
    });

    picker.addEventListener("click", function (e) {
      var opt = e.target.closest(".priority-opt");
      if (!opt) return;
      picker.querySelectorAll(".priority-opt").forEach(function (o) { o.classList.remove("active"); });
      opt.classList.add("active");
      state.priority = opt.dataset.p;
    });

    formBody.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = document.getElementById("title").value;
      if (!title.trim()) return;
      addTask({
        title: title,
        desc: document.getElementById("desc").value,
        category: document.getElementById("category").value,
        due: document.getElementById("due").value,
        priority: state.priority
      });
      formBody.reset();
      picker.querySelectorAll(".priority-opt").forEach(function (o) { o.classList.remove("active"); });
      picker.querySelector('[data-p="tactica"]').classList.add("active");
      state.priority = "tactica";
      formBody.classList.remove("open");
      toggleIcon.textContent = "＋";
    });
  }

  function setupFilters() {
    var el = document.getElementById("filters");
    el.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;
      el.querySelectorAll(".filter-chip").forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      state.filter = chip.dataset.filter;
      renderTasks();
    });
  }

  function setupTaskListDelegation() {
    var el = document.getElementById("taskList");
    el.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var card = e.target.closest(".task-card");
      if (!card) return;
      var id = card.dataset.id;
      if (btn.dataset.action === "advance") advanceTask(id);
      if (btn.dataset.action === "delete") deleteTask(id);
    });
  }

  // ---------- Instalación nativa (PWA) ----------
  function setupInstall() {
    var installBtn = document.getElementById("installBtn");
    var deferredPrompt = null;

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.classList.add("show");
    });

    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        installBtn.classList.remove("show");
      });
    });

    window.addEventListener("appinstalled", function () {
      installBtn.classList.remove("show");
      showToast("Cordero F instalada");
    });
  }

  function setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function (err) {
          console.warn("No se pudo registrar el service worker:", err);
        });
      });
    }
  }

  // ---------- Arranque ----------
  function init() {
    state.tasks = loadTasks();
    setupForm();
    setupFilters();
    setupTaskListDelegation();
    setupInstall();
    setupServiceWorker();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
