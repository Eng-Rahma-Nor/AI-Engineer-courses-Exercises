const form = document.getElementById("generate-form");
const topicInput = document.getElementById("topic");
const slideCountSelect = document.getElementById("slideCount");
const generateBtn = document.getElementById("generate-btn");
const errorEl = document.getElementById("error");
const emptyState = document.getElementById("empty-state");
const loadingEl = document.getElementById("loading");
const deckEl = document.getElementById("deck");
const thumbRail = document.getElementById("thumb-rail");

const slideImage = document.getElementById("slide-image");
const slideEyebrow = document.getElementById("slide-eyebrow");
const slideTitle = document.getElementById("slide-title");
const slideBullets = document.getElementById("slide-bullets");
const slideNotes = document.getElementById("slide-notes");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const playBtn = document.getElementById("play-btn");
const playIcon = document.getElementById("play-icon");
const playLabel = document.getElementById("play-label");
const audioPlayer = document.getElementById("audio-player");

let slides = [];
let current = 0;

const loadingMessages = [
  "Drafting your deck…",
  "Sketching slide concepts…",
  "Generating imagery…",
  "Recording narration…",
];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const topic = topicInput.value.trim();
  if (!topic) return;

  setLoading(true);
  hideError();
  deckEl.classList.add("hidden");
  emptyState.classList.add("hidden");

  let msgIndex = 0;
  const loadingTextEl = document.getElementById("loading-text");
  const loadingInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % loadingMessages.length;
    loadingTextEl.textContent = loadingMessages[msgIndex];
  }, 3500);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        slideCount: Number(slideCountSelect.value),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");

    slides = data.slides;
    current = 0;
    renderThumbRail();
    renderSlide();
    deckEl.classList.remove("hidden");
  } catch (err) {
    showError(err.message);
    emptyState.classList.remove("hidden");
  } finally {
    clearInterval(loadingInterval);
    setLoading(false);
  }
});

function setLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
  generateBtn.disabled = isLoading;
  document.getElementById("loading-text").textContent = loadingMessages[0];
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function hideError() {
  errorEl.classList.add("hidden");
}

function renderThumbRail() {
  thumbRail.innerHTML = "";
  slides.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.className = "thumb" + (i === current ? " active" : "");
    btn.innerHTML = `
      <img src="${s.imageUrl}" alt="" />
      <span class="thumb-text"><span class="thumb-num">${i + 1}</span>${escapeHtml(s.title)}</span>
    `;
    btn.addEventListener("click", () => goTo(i));
    thumbRail.appendChild(btn);
  });
}

function goTo(index) {
  stopAudio();
  current = index;
  renderSlide();
  [...thumbRail.children].forEach((el, i) => el.classList.toggle("active", i === current));
}

function renderSlide() {
  const s = slides[current];
  if (!s) return;

  slideImage.src = s.imageUrl;
  slideImage.alt = s.title;
  slideTitle.textContent = s.title;
  slideNotes.textContent = s.notes;

  slideEyebrow.textContent =
    current === 0
      ? "Opening"
      : current === slides.length - 1
      ? "Closing"
      : `Slide ${current + 1} of ${slides.length}`;

  slideBullets.innerHTML = "";
  (s.bullets || []).forEach((b) => {
    const li = document.createElement("li");
    li.textContent = b;
    slideBullets.appendChild(li);
  });

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;

  audioPlayer.src = s.audioUrl;
  setPlayingState(false);
}

prevBtn.addEventListener("click", () => current > 0 && goTo(current - 1));
nextBtn.addEventListener("click", () => current < slides.length - 1 && goTo(current + 1));

playBtn.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    setPlayingState(true);
  } else {
    audioPlayer.pause();
    setPlayingState(false);
  }
});

audioPlayer.addEventListener("ended", () => setPlayingState(false));

function setPlayingState(isPlaying) {
  playBtn.classList.toggle("playing", isPlaying);
  playIcon.textContent = isPlaying ? "■" : "▶";
  playLabel.textContent = isPlaying ? "Stop narration" : "Play narration";
}

function stopAudio() {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  setPlayingState(false);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
