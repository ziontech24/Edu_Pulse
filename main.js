/* EduPulse — fully working JavaScript logic (no modules required)
   Features:
   - Theme toggle (persists)
   - Stats (XP, Level, Streak) update/persist
   - Sounds on actions (safe if files missing)
   - Chatbot: opens with FAB, replies to messages
   - Quiz: start, timer, questions, scoring, results with confetti
   - Flashcards: add, flip, delete, persist
   - Notepad: add, delete, drag-reorder, persist
*/

(function () {
  // ---------- State ----------
  const state = {
    xp: Number(localStorage.getItem("edu_xp")) || 0,
    streak: Number(localStorage.getItem("edu_streak")) || 0,
    lastOpen: localStorage.getItem("edu_lastOpen") || null,
    theme: localStorage.getItem("edu_theme") || "dark",
    cards: JSON.parse(localStorage.getItem("edu_cards")) || [],
    notes: JSON.parse(localStorage.getItem("edu_notes")) || [],
    sounds: {
      click: makeAudio("assets/audio/click.mp3"),
      correct: makeAudio("assets/audio/correct.mp3"),
      wrong: makeAudio("assets/audio/wrong.mp3"),
      flip: makeAudio("assets/audio/flip.mp3"),
      add: makeAudio("assets/audio/add.mp3"),
      del: makeAudio("assets/audio/delete.mp3"),
      bot: makeAudio("assets/audio/bot.mp3"),
    },
    quizData: {
      html: [
        { q: "Which tag defines the document body?", a: ["<head>", "<meta>", "<body>", "<html>"], c: 2 },
        { q: "Largest heading tag?", a: ["<h6>", "<h1>", "<head>", "<header>"], c: 1 },
        { q: "Semantic container for navigation?", a: ["<nav>", "<menu>", "<links>", "<ul>"], c: 0 },
        { q: "Semantic content block?", a: ["<div>", "<section>", "<article>", "<span>"], c: 2 },
        { q: "Image tag?", a: ["<pic>", "<image>", "<img>", "<src>"], c: 2 },
        { q: "Link tag?", a: ["<link>", "<a>", "<url>", "<hyperlink>"], c: 1 },
        { q: "Form tag?", a: ["<form>", "<input>", "<submit>", "<fields>"], c: 0 },
        { q: "Table row tag?", a: ["<tr>", "<th>", "<td>", "<row>"], c: 0 },
        { q: "List item tag?", a: ["<li>", "<ul>", "<ol>", "<item>"], c: 0 },
        { q: "Metadata tag?", a: ["<meta>", "<data>", "<info>", "<script>"], c: 0 },
      ],
      css: [
        { q: "Background color property?", a: ["color", "bg", "background-color", "fill"], c: 2 },
        { q: "Text size property?", a: ["font-size", "text-size", "size", "fontsize"], c: 0 },
        { q: "Bold text?", a: ["font-weight", "bold", "text-style", "weight"], c: 0 },
        { q: "Spacing between lines?", a: ["line-height", "spacing", "margin", "padding"], c: 0 },
        { q: "Flex container?", a: ["display: flex", "flex: 1", "justify-flex", "grid: flex"], c: 0 },
        { q: "Center horizontally with flex?", a: ["align-items: center", "justify-content: center", "place-items: center", "text-align: center"], c: 1 },
        { q: "Grid columns?", a: ["grid-template-columns", "grid-columns", "columns", "grid-cols"], c: 0 },
        { q: "Box shadow?", a: ["box-shadow", "shadow", "filter-shadow", "text-shadow"], c: 0 },
        { q: "Rounded corners?", a: ["border-radius", "radius", "corner-round", "round"], c: 0 },
        { q: "Change font?", a: ["font-family", "font", "text-font", "family"], c: 0 },
      ],
      js: [
        { q: "Constant variable keyword?", a: ["let", "var", "const", "fixed"], c: 2 },
        { q: "Convert JSON to object?", a: ["JSON.parse()", "JSON.stringify()", "toObject()", "parseJSON()"], c: 0 },
        { q: "Strict equality?", a: ["==", "===", "=", "!=="], c: 1 },
        { q: "Loop for arrays?", a: ["for", "while", "for...of", "do...while"], c: 2 },
        { q: "Block-scoped variable?", a: ["var", "let", "const", "scope"], c: 1 },
        { q: "Function keyword?", a: ["def", "fn", "function", "lambda"], c: 2 },
        { q: "Arrow function symbol?", a: ["=>", "->", "<-", "~>"], c: 0 },
        { q: "Array length property?", a: ["count", "size", "length", "items"], c: 2 },
        { q: "Add to end of array?", a: ["push()", "append()", "add()", "insert()"], c: 0 },
        { q: "Remove last element?", a: ["pop()", "removeLast()", "splice()", "shift()"], c: 0 },
      ],
    },
  };

  function makeAudio(src) {
    try {
      const a = new Audio(src);
      a.preload = "auto";
      return a;
    } catch {
      return null;
    }
  }
  function playSound(name) {
    const a = state.sounds[name];
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  }

  // ---------- Theme ----------
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const btn = document.getElementById("theme-btn");
    if (btn) btn.textContent = state.theme === "dark" ? "🌙" : "☀️";
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("edu_theme", state.theme);
    applyTheme();
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.id === "theme-btn") toggleTheme();
  });

  // ---------- Stats & Streak ----------
  function levelFromXP(xp) {
    return Math.floor(xp / 100) + 1;
  }
  function updateStatsUI() {
    const xpEl = document.getElementById("stat-xp");
    const levelEl = document.getElementById("stat-level");
    const streakEl = document.getElementById("stat-streak");
    if (xpEl) xpEl.textContent = state.xp;
    if (levelEl) levelEl.textContent = levelFromXP(state.xp);
    if (streakEl) streakEl.textContent = state.streak;
  }
  function checkDailyStreak() {
    const todayStr = new Date().toDateString();
    if (!state.lastOpen) {
      state.streak = 1;
    } else {
      const lastStr = new Date(state.lastOpen).toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      if (lastStr === yesterdayStr) {
        state.streak += 1;
        state.xp += 5;
      } else if (lastStr !== todayStr) {
        state.streak = 1;
      }
    }
    state.lastOpen = new Date().toISOString();
    localStorage.setItem("edu_streak", state.streak);
    localStorage.setItem("edu_lastOpen", state.lastOpen);
    localStorage.setItem("edu_xp", state.xp);
    updateStatsUI();
  }
  function addXP(amount) {
    state.xp += amount;
    localStorage.setItem("edu_xp", state.xp);
    updateStatsUI();
  }

  // ---------- Chatbot (dashboard only) ----------
  function initChatbot() {
    const fab = document.getElementById("chat-fab");
    const bot = document.getElementById("chatbot");
    const close = document.getElementById("chat-close");
    const messages = document.getElementById("chat-messages");
    const sendBtn = document.getElementById("chat-send");
    const input = document.getElementById("chat-input");
    if (!fab || !bot || !messages || !sendBtn || !input) return;

    function botMsg(html) {
      playSound("bot");
      const div = document.createElement("div");
      div.className = "message bot-msg";
      div.innerHTML = html;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
    function userMsg(text) {
      const div = document.createElement("div");
      div.className = "message user-msg";
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
    function reply(message) {
      const m = message.toLowerCase();
      if (m.includes("joke")) return "Why do programmers prefer dark mode? Because light attracts bugs! 🐛";
      if (m.includes("tip")) return "Study Tip: Use active recall—explain a concept out loud without notes, then verify.";
      if (m.includes("fact")) return "Fact: The first computer bug was an actual moth found in 1947.";
      if (m.includes("help")) return "Help: Dashboard tracks XP & streaks; Quiz earns XP; Flashcards help study; Notepad stores ideas.";
      return "Try: Joke, Tip, Fact, or Help.";
    }

    fab.addEventListener("click", () => {
      bot.classList.toggle("hidden");
      if (!bot.classList.contains("hidden") && messages.childElementCount === 0) {
        botMsg("<strong>Hey!</strong> I’m EduBot.<br>Ask me for a <em>Joke</em>, a <em>Tip</em>, a <em>Fact</em>, or <em>Help</em>.");
      }
    });
    close.addEventListener("click", () => bot.classList.add("hidden"));
    function handleSend() {
      const msg = (input.value || "").trim();
      if (!msg) return;
      userMsg(msg);
      input.value = "";
      setTimeout(() => botMsg(reply(msg)), 250);
    }
    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });
  }

  // ---------- Confetti ----------
  function launchConfetti(canvasId, durationMs = 1500) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const colors = ["#8b5cf6", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#22d3ee"];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * 100,
      r: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      rotate: Math.random() * Math.PI,
    }));
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotate += 0.03;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotate);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      });
      if (elapsed < durationMs) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(tick);
  }

  // ---------- Quiz ----------
  function initQuiz() {
    const start = document.getElementById("quiz-start");
    const body = document.getElementById("quiz-body");
    const result = document.getElementById("quiz-result");
    if (!start || !body || !result) return;

    const beginBtn = document.getElementById("quiz-begin");
    const topicSel = document.getElementById("quiz-topic");
    const diffSel = document.getElementById("quiz-difficulty");
    const qText = document.getElementById("question-text");
    const qCount = document.getElementById("question-count");
    const optionsBox = document.getElementById("options-container");
    const timerEl = document.getElementById("quiz-timer");

    let currentQ = 0;
    let score = 0;
    let set = [];
    let xpPerCorrect = 10;
    let timerSecs = 600;
    let timerId = null;

    function formatTime(s) {
      const m = Math.floor(s / 60).toString().padStart(2, "0");
      const ss = (s % 60).toString().padStart(2, "0");
      return `${m}:${ss}`;
    }
    function stopTimer() {
      if (timerId) { clearInterval(timerId); timerId = null; }
    }
    function startTimer() {
      timerEl.textContent = formatTime(timerSecs);
      timerId = setInterval(() => {
        timerSecs -= 1;
        timerEl.textContent = formatTime(timerSecs);
        if (timerSecs <= 0) { stopTimer(); finishQuiz(); }
      }, 1000);
    }
    function finishQuiz() {
      body.classList.add("hidden");
      result.classList.remove("hidden");
      document.getElementById("final-score").textContent = `Results: ${score}/${set.length}`;
      document.getElementById("performance-msg").textContent =
        score === set.length ? "Perfect score! 🎯" :
        score >= Math.ceil(set.length * 0.7) ? "Great job! 💪" : "Keep practicing! 🔁";
      if (score === set.length) addXP(30);
      launchConfetti("confetti-canvas", 1800);
    }
    function renderQuestion() {
      if (currentQ >= set.length) { stopTimer(); finishQuiz(); return; }
      const q = set[currentQ];
      qText.textContent = q.q;
      qCount.textContent = `Question ${currentQ + 1}/${set.length}`;
      optionsBox.innerHTML = "";
      q.a.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (i === q.c) { playSound("correct"); score++; addXP(xpPerCorrect); }
          else { playSound("wrong"); }
          currentQ++; renderQuestion();
        });
        optionsBox.appendChild(btn);
      });
    }

    beginBtn.addEventListener("click", () => {
      const topic = topicSel.value;
      const difficulty = diffSel.value;
      set = state.quizData[topic] ? [...state.quizData[topic]] : [];
      xpPerCorrect = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
      timerSecs = 600;
      currentQ = 0; score = 0;
      start.classList.add("hidden");
      body.classList.remove("hidden");
      renderQuestion();
      startTimer();
    });
  }

  // ---------- Flashcards ----------
  function initFlashcards() {
    const grid = document.getElementById("flashcard-grid");
    const addBtn = document.getElementById("add-card");
    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");
    if (!grid || !addBtn || !front || !back) return;

    function saveCards() { localStorage.setItem("edu_cards", JSON.stringify(state.cards)); }
    function renderCards() {
      grid.innerHTML = "";
      state.cards.forEach((c, i) => {
        const wrapper = document.createElement("div");
        wrapper.className = "flashcard";
        wrapper.innerHTML = `
          <div class="flashcard-inner">
            <div class="flashcard-front"><strong>${escapeHTML(c.q)}</strong></div>
            <div class="flashcard-back">
              <div>
                <p>${escapeHTML(c.a)}</p>
                <button class="btn-delete" data-del="${i}">Delete</button>
              </div>
            </div>
          </div>
        `;
        wrapper.addEventListener("click", () => {
          playSound("flip");
          wrapper.classList.toggle("flipped");
          addXP(1);
        });
        grid.appendChild(wrapper);
      });
      grid.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = Number(btn.getAttribute("data-del"));
          state.cards.splice(idx, 1);
          playSound("del");
          addXP(1);
          saveCards();
          renderCards();
        });
      });
    }
    addBtn.addEventListener("click", () => {
      const q = (front.value || "").trim();
      const a = (back.value || "").trim();
      if (!q) return;
      state.cards.push({ q, a });
      playSound("add");
      addXP(2);
      saveCards();
      front.value = ""; back.value = "";
      renderCards();
    });
    renderCards();
  }

  // ---------- Notepad ----------
  function initNotepad() {
    const board = document.getElementById("notes-board");
    const addBtn = document.getElementById("add-note");
    const text = document.getElementById("note-text");
    const color = document.getElementById("note-color");
    if (!board || !addBtn || !text || !color) return;

    function saveNotes() { localStorage.setItem("edu_notes", JSON.stringify(state.notes)); }
    function renderNotes() {
      board.innerHTML = "";
      state.notes.forEach((n, i) => {
        const note = document.createElement("div");
        note.className = "note";
        note.style.background = n.color;
        note.setAttribute("draggable", "true");
        note.innerHTML = `
          <button class="delete" data-del="${i}">✕</button>
          <div class="content">${escapeHTML(n.text)}</div>
        `;
        note.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", i));
        note.addEventListener("dragover", (e) => e.preventDefault());
        note.addEventListener("drop", (e) => {
          e.preventDefault();
          const from = Number(e.dataTransfer.getData("text/plain"));
          const to = i;
          const moved = state.notes.splice(from, 1)[0];
          state.notes.splice(to, 0, moved);
          saveNotes();
          renderNotes();
        });
        board.appendChild(note);
      });
      board.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-del"));
          state.notes.splice(idx, 1);
          playSound("del");
          addXP(1);
          saveNotes();
          renderNotes();
        });
      });
    }
    addBtn.addEventListener("click", () => {
      const t = (text.value || "").trim();
      const c = color.value;
      if (!t) return;
      state.notes.push({ text: t, color: c });
      playSound("add");
      addXP(2);
      saveNotes();
      text.value = "";
      renderNotes();
    });
    renderNotes();
  }

  // ---------- Helpers ----------
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function enableCardClickSound() {
    document.querySelectorAll("[data-click-sound], .feature-card").forEach((el) => {
      el.addEventListener("click", () => playSound("click"));
    });
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    checkDailyStreak();
    updateStatsUI();
    enableCardClickSound();

    // Page-specific inits run only if their elements exist
    initChatbot();     // dashboard only (FAB + chatbot elements exist there)
    initQuiz();        // quiz page only
    initFlashcards();  // flashcards page only
    initNotepad();     // notepad page only
  });
})();
