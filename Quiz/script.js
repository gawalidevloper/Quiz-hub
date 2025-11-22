document.addEventListener("DOMContentLoaded", () => {
  // ---------- SECTIONS ----------
  const homeSection = document.getElementById("home-section");
  const loginSection = document.getElementById("login-section");
  const quizSection = document.getElementById("quiz-section");
  const leaderboardSection = document.getElementById("leaderboard-section");

  // ---------- HOME BUTTONS ----------
  const guestPlayBtn = document.getElementById("guest-play-btn");
  const goToLoginBtn = document.getElementById("go-to-login-btn");
  const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");

  // ---------- LOGIN ELEMENTS ----------
  const usernameInput = document.getElementById("username-input");
  const pinInput = document.getElementById("pin-input");
  const avatarOptions = document.querySelectorAll(".avatar-option");
  const loginBtn = document.getElementById("login-btn");
  const loginBackBtn = document.getElementById("login-back-btn");

  // ---------- QUIZ ELEMENTS ----------
  const setupContainer = document.getElementById("setup-container");
  const questionContainer = document.getElementById("question-container");
  const resultContainer = document.getElementById("result-container");
  const quizContainer = document.getElementById("quiz-container");

  const startBtn = document.getElementById("start-btn");
  const nextBtn = document.getElementById("next-btn");
  const restartBtn = document.getElementById("restart-btn");

  const questionText = document.getElementById("question-text");
  const choicesList = document.getElementById("choices-list");
  const scoreDisplay = document.getElementById("score");
  const bestScoreText = document.getElementById("best-score-text");

  // ---------- HUD ----------
  const hud = document.getElementById("hud");
  const questionCounter = document.getElementById("question-counter");
  const progressFill = document.getElementById("progress-fill");
  const timerDisplay = document.getElementById("timer");
  const highScoreDisplay = document.getElementById("high-score");

  hud.classList.add("setup-hidden");


  const categorySelect = document.getElementById("category-select");
  const difficultySelect = document.getElementById("difficulty-select");

  // ---------- THEME ----------
  const themeToggle = document.getElementById("theme-toggle");

  // ---------- SHARE BUTTONS ----------
  const shareWhatsAppBtn = document.getElementById("share-whatsapp");
  const shareLinkedInBtn = document.getElementById("share-linkedin");
  const shareCopyBtn = document.getElementById("share-copy");

  // ---------- LEADERBOARD ELEMENTS ----------
  const leaderboardCategorySelect = document.getElementById(
    "leaderboard-category-select"
  );
  const leaderboardList = document.getElementById("leaderboard-list");
  const leaderboardBackBtn = document.getElementById("leaderboard-back-btn");

  // ---------- CONSTANTS ----------
  const QUESTIONS_URL = "questions.json";
  const baseQuizUrl = window.location.href.split("#")[0].split("?")[0];

  // ---------- STATE ----------
  let allQuestions = [];
  let filteredQuestions = [];
  let currentQuestionIndex = 0;
  let completedQuestions = 0;
  let score = 0;
  let hasAnswered = false;

  let timerInterval = null;
  let timeLeft = 15;

  let selectedCategory = "All";
  let selectedDifficulty = "All";

  let currentUser = null; // { name, pin, avatar, isGuest? }
  let users = [];
  let selectedAvatar = null;

  // ---------- THEME INIT ----------
  const savedTheme = localStorage.getItem("quizTheme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }
  updateThemeToggleIcon();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      localStorage.setItem("quizTheme", isLight ? "light" : "dark");
      updateThemeToggleIcon();
    });
  }

  function updateThemeToggleIcon() {
    if (!themeToggle) return;
    const isLight = document.body.classList.contains("light-theme");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
  }

  // ---------- LOAD USERS ----------
  function loadUsers() {
    const raw = localStorage.getItem("quizUsers");
    users = raw ? JSON.parse(raw) : [];
  }

  function saveUsers() {
    localStorage.setItem("quizUsers", JSON.stringify(users));
  }

  function findUserByName(name) {
    return users.find((u) => u.name.toLowerCase() === name.toLowerCase());
  }

  loadUsers();

  const lastUserName = localStorage.getItem("quizCurrentUserName");
  if (lastUserName && usernameInput) {
    usernameInput.value = lastUserName;
  }

  // ---------- FETCH QUESTIONS ----------
  fetch(QUESTIONS_URL)
    .then((res) => res.json())
    .then((data) => {
      allQuestions = data.questions || [];
      updateHighScoreDisplay();
    })
    .catch((err) => {
      console.error("Error loading questions.json:", err);
      alert("Could not load questions. Check console for details.");
    });

  // ======================================================
  // EVENT LISTENERS
  // ======================================================

  // ----- HOME → GUEST -----
  if (guestPlayBtn && homeSection && quizSection) {
    guestPlayBtn.addEventListener("click", () => {
      currentUser = {
        name: "Guest",
        avatar: "🧠",
        isGuest: true,
      };
      homeSection.classList.add("hidden");
      leaderboardSection?.classList.add("hidden");
      loginSection?.classList.add("hidden");
      quizSection.classList.remove("hidden");
    });
  }

  // ----- HOME → LOGIN -----
  if (goToLoginBtn && homeSection && loginSection) {
    goToLoginBtn.addEventListener("click", () => {
      homeSection.classList.add("hidden");
      leaderboardSection?.classList.add("hidden");
      loginSection.classList.remove("hidden");

      pinInput.value = "";
      selectedAvatar = null;
      avatarOptions.forEach((b) => b.classList.remove("selected"));
    });
  }

  // ----- LOGIN BACK -----
  if (loginBackBtn && loginSection && homeSection) {
    loginBackBtn.addEventListener("click", () => {
      loginSection.classList.add("hidden");
      homeSection.classList.remove("hidden");
    });
  }

  // ----- AVATAR SELECTION -----
  avatarOptions.forEach((btn) => {
    btn.addEventListener("click", () => {
      avatarOptions.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAvatar = btn.dataset.avatar;
    });
  });

  // ----- LOGIN SUBMIT -----
  if (loginBtn && loginSection && quizSection) {
    loginBtn.addEventListener("click", () => {
      const name = usernameInput.value.trim();
      const pin = pinInput.value.trim();

      if (!name) {
        alert("Please enter your name.");
        return;
      }
      if (!pin || pin.length < 4) {
        alert("Please enter a 4-digit PIN.");
        return;
      }

      loadUsers(); // refresh latest

      let user = findUserByName(name);

      if (user) {
        // Existing user → verify PIN
        if (user.pin !== pin) {
          alert("Incorrect PIN for this user.");
          return;
        }
        currentUser = user;
      } else {
        // New user → must select avatar
        if (!selectedAvatar) {
          alert("Please select an avatar for your new profile.");
          return;
        }
        user = {
          name,
          pin,
          avatar: selectedAvatar,
        };
        users.push(user);
        saveUsers();
        currentUser = user;
      }

      localStorage.setItem("quizCurrentUserName", currentUser.name);

      loginSection.classList.add("hidden");
      quizSection.classList.remove("hidden");
    });
  }

  // ----- HOME → LEADERBOARD -----
  if (viewLeaderboardBtn && homeSection && leaderboardSection) {
    viewLeaderboardBtn.addEventListener("click", () => {
      homeSection.classList.add("hidden");
      leaderboardSection.classList.remove("hidden");
      if (leaderboardCategorySelect) {
        leaderboardCategorySelect.value = "All";
      }
      loadLeaderboard("All");
    });
  }

  // ----- LEADERBOARD BACK -----
  if (leaderboardBackBtn && leaderboardSection && homeSection) {
    leaderboardBackBtn.addEventListener("click", () => {
      leaderboardSection.classList.add("hidden");
      homeSection.classList.remove("hidden");
    });
  }

  // ----- LEADERBOARD CATEGORY CHANGE -----
  if (leaderboardCategorySelect) {
    leaderboardCategorySelect.addEventListener("change", () => {
      loadLeaderboard(leaderboardCategorySelect.value);
    });
  }

  // ----- START QUIZ -----
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      selectedCategory = categorySelect.value;
      selectedDifficulty = difficultySelect.value;
      startQuiz();
    });
  }

  // ----- NEXT QUESTION -----
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (completedQuestions < filteredQuestions.length) {
        completedQuestions++;
        updateHud();
      }

      currentQuestionIndex++;
      if (currentQuestionIndex < filteredQuestions.length) {
        showQuestion();
      } else {
        showResult();
      }
    });
  }

  // ----- RESTART QUIZ -----
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
  resultContainer.classList.add("hidden");
  setupContainer.classList.remove("hidden");
  quizContainer.classList.remove("hidden");

  hud.classList.add("setup-hidden");   // 👈 NEW
  hud.classList.add("hidden");         // keep this
});

  }

  // ----- CATEGORY / DIFFICULTY CHANGE -----
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      selectedCategory = categorySelect.value;
      updateHighScoreDisplay();
    });
  }

  if (difficultySelect) {
    difficultySelect.addEventListener("change", () => {
      selectedDifficulty = difficultySelect.value;
      updateHighScoreDisplay();
    });
  }

  // ----- SHARE BUTTONS -----
  if (shareWhatsAppBtn) {
    shareWhatsAppBtn.addEventListener("click", () => {
      const text = `${getShareMessage()} Try it here: ${baseQuizUrl}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
    });
  }

  if (shareLinkedInBtn) {
    shareLinkedInBtn.addEventListener("click", () => {
      const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        baseQuizUrl
      )}`;
      window.open(liUrl, "_blank");
    });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener("click", async () => {
      const text = `${getShareMessage()} ${baseQuizUrl}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          shareCopyBtn.textContent = "Copied!";
          setTimeout(() => (shareCopyBtn.textContent = "Copy Link"), 1500);
        } else {
          alert("Copy this text:\n" + text);
        }
      } catch (err) {
        alert("Could not copy. Here is the text:\n" + text);
      }
    });
  }

  // ======================================================
  // QUIZ LOGIC
  // ======================================================

  function getTimeForDifficulty() {
    switch (selectedDifficulty) {
      case "Easy":
        return 20;
      case "Hard":
        return 10;
      case "Medium":
      default:
        return 15;
    }
  }

  function startQuiz() {
    // If user hasn't chosen guest or login, default to Guest
    if (!currentUser) {
      currentUser = {
        name: "Guest",
        avatar: "🧠",
        isGuest: true,
      };
    }

    score = 0;
    currentQuestionIndex = 0;
    completedQuestions = 0;

    filteredQuestions = getQuestionsForSelection(
      selectedCategory,
      selectedDifficulty
    );

    if (filteredQuestions.length === 0) {
      alert("No questions yet for this combination. Try another one!");
      return;
    }

    shuffleArray(filteredQuestions);

    // Mixed mode: All categories + All difficulties → random 10
    if (
      selectedCategory === "All" &&
      selectedDifficulty === "All" &&
      filteredQuestions.length > 10
    ) {
      filteredQuestions = filteredQuestions.slice(0, 10);
    }

    setupContainer.classList.add("hidden");

    hud.classList.remove("setup-hidden");
    hud.classList.remove("hidden");
    questionContainer.classList.remove("hidden");
    resultContainer.classList.add("hidden");

    showQuestion();
  }

  function getQuestionsForSelection(category, difficulty) {
    let questions = [...allQuestions];

    if (category !== "All") {
      questions = questions.filter((q) => q.category === category);
    }
    if (difficulty !== "All") {
      questions = questions.filter((q) => q.difficulty === difficulty);
    }

    return questions;
  }

  function showQuestion() {
    resetState();

    const currentQuestion = filteredQuestions[currentQuestionIndex];
    questionText.textContent = currentQuestion.question;

    const shuffledChoices = shuffleArray([...currentQuestion.choices]);

    shuffledChoices.forEach((choiceText) => {
      const li = document.createElement("li");
      li.textContent = choiceText;
      li.classList.add("choice-item");
      li.addEventListener("click", () =>
        selectAnswer(li, currentQuestion.answer)
      );
      choicesList.appendChild(li);
    });

    updateHud();
  }

  function resetState() {
    clearInterval(timerInterval);
    timeLeft = getTimeForDifficulty();
    timerDisplay.textContent = timeLeft;

    hasAnswered = false;
    nextBtn.classList.add("hidden");
    choicesList.innerHTML = "";

    startTimer();
  }

  function selectAnswer(selectedLi, correctAnswer) {
    if (hasAnswered) return;
    hasAnswered = true;
    clearInterval(timerInterval);

    const options = Array.from(choicesList.children);

    options.forEach((option) => {
      option.classList.add("disabled");
      option.style.pointerEvents = "none";

      if (option.textContent === correctAnswer) {
        option.classList.add("correct");
      }
    });

    if (selectedLi.textContent !== correctAnswer) {
      selectedLi.classList.add("wrong");
    } else {
      score++;
    }

    nextBtn.classList.remove("hidden");
  }

  function startTimer() {
    timerDisplay.textContent = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeUp();
      }
    }, 1000);
  }

  function handleTimeUp() {
    if (hasAnswered) return;
    hasAnswered = true;

    const currentQuestion = filteredQuestions[currentQuestionIndex];
    const options = Array.from(choicesList.children);

    options.forEach((option) => {
      option.classList.add("disabled");
      option.style.pointerEvents = "none";

      if (option.textContent === currentQuestion.answer) {
        option.classList.add("correct");
      }
    });

    nextBtn.classList.remove("hidden");
  }

  function getShareMessage() {
    const categoryText =
      selectedCategory === "All" ? "All Categories" : selectedCategory;
    const diffText =
      selectedDifficulty === "All" ? "All Levels" : selectedDifficulty;

    return `I scored ${score}/${filteredQuestions.length} in the ${categoryText} quiz (${diffText})!`;
  }

  function showResult() {
    clearInterval(timerInterval);

    completedQuestions = filteredQuestions.length;
    updateHud();

    questionContainer.classList.add("hidden");
    hud.classList.add("hidden");
    resultContainer.classList.remove("hidden");

    scoreDisplay.textContent = `${score} out of ${filteredQuestions.length}`;

    const previousBest = updateHighScoreIfNeeded();
    bestScoreText.textContent = `Best for "${selectedCategory}" (${selectedDifficulty}) : ${previousBest} → ${Math.max(
      previousBest,
      score
    )}`;

    saveScoreToLeaderboard();
  }

  // ======================================================
  // HUD / HIGHSCORE / LEADERBOARD
  // ======================================================

  function updateHud() {
  const total = filteredQuestions.length;

  // 👇 Clamp so we never go beyond total questions
  let currentNumber;
  if (total === 0) {
    currentNumber = 0;
  } else if (currentQuestionIndex >= total) {
    currentNumber = total;
  } else {
    currentNumber = currentQuestionIndex + 1;
  }

  questionCounter.textContent = `Question ${currentNumber} / ${total}`;

  const progressPercent =
    total === 0 ? 0 : (completedQuestions / total) * 100;
  progressFill.style.width = `${progressPercent}%`;
}


  function getHighScoreKey() {
    return `quizHighScore_${selectedCategory}_${selectedDifficulty}`;
  }

  function updateHighScoreDisplay() {
    const key = getHighScoreKey();
    const stored = parseInt(localStorage.getItem(key)) || 0;
    highScoreDisplay.textContent = stored;
  }

  function updateHighScoreIfNeeded() {
    const key = getHighScoreKey();
    const previous = parseInt(localStorage.getItem(key)) || 0;
    if (score > previous) {
      localStorage.setItem(key, score.toString());
    }
    updateHighScoreDisplay();
    return previous;
  }

  function saveScoreToLeaderboard() {
    const categoryKey =
      selectedCategory === "All" ? "Mixed" : selectedCategory;

    const entry = {
      user: currentUser ? currentUser.name : "Guest",
      avatar:
        currentUser && currentUser.avatar ? currentUser.avatar : "🧠",
      score: score,
      total: filteredQuestions.length,
      difficulty: selectedDifficulty,
      date: new Date().toLocaleString(),
    };

    const key = `leaderboard_${categoryKey}`;
    let list = JSON.parse(localStorage.getItem(key)) || [];

    list.push(entry);

    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);

    localStorage.setItem(key, JSON.stringify(list));
  }

  function loadLeaderboard(category) {
    leaderboardList.innerHTML = "";

    let allEntries = [];

    if (category === "All") {
      const cats = [
        "HTML",
        "CSS",
        "JavaScript",
        "GK",
        "Web",
        "CoreJava",
        "OOP",
        "DSA",
        "Mixed",
      ];
      cats.forEach((cat) => {
        const data =
          JSON.parse(localStorage.getItem(`leaderboard_${cat}`)) || [];
        allEntries = allEntries.concat(data);
      });
    } else {
      const key = category === "All" ? "Mixed" : category;
      allEntries =
        JSON.parse(localStorage.getItem(`leaderboard_${key}`)) || [];
    }

    allEntries.sort((a, b) => b.score - a.score);

    if (allEntries.length === 0) {
      const li = document.createElement("li");
      li.classList.add("leaderboard-item");
      li.textContent = "No scores yet for this selection.";
      leaderboardList.appendChild(li);
      return;
    }

    allEntries.slice(0, 10).forEach((entry, index) => {
      addRow(entry, index);
    });
  }

  function addRow(entry, index) {
    const li = document.createElement("li");
    li.classList.add("leaderboard-item");

    if (index === 0) li.classList.add("rank-1");
    else if (index === 1) li.classList.add("rank-2");
    else if (index === 2) li.classList.add("rank-3");

    const rankDiv = document.createElement("div");
    rankDiv.classList.add("leaderboard-rank");
    const medals = ["🥇", "🥈", "🥉"];
    rankDiv.textContent = medals[index] || index + 1;

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("leaderboard-avatar");
    avatarDiv.textContent = entry.avatar || "🧠";

    const textDiv = document.createElement("div");
    textDiv.classList.add("leaderboard-text");
    textDiv.innerHTML = `<strong>${entry.user}</strong> – ${entry.score}/${entry.total} (${entry.difficulty})`;

    const metaDiv = document.createElement("div");
    metaDiv.classList.add("leaderboard-meta");
    metaDiv.textContent = entry.date;
    textDiv.appendChild(metaDiv);

    li.appendChild(rankDiv);
    li.appendChild(avatarDiv);
    li.appendChild(textDiv);

    leaderboardList.appendChild(li);
  }

  // ======================================================
  // UTILITY
  // ======================================================

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
