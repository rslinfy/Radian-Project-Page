const PAPER_GROUPS = {
  chunk: {
    label: "4-step chunk-wise",
    note: "4 NFE · 5 seconds",
    methods: [
      ["sf", "Self Forcing"],
      ["cf", "Causal Forcing"],
      ["salt", "Salt"],
      ["ditgan", "DiT-GAN"],
      ["radian", "Radian", true],
    ],
    cases: [
      { id: "618", title: "Panda in Paris", prompt: "A panda drinking coffee in a cafe in Paris, tilt up" },
      { id: "740", title: "Steam train", prompt: "A steam train moving on a mountainside" },
      { id: "646", title: "The Seine", prompt: "A boat sailing leisurely along the Seine River with the Eiffel Tower in background, pan left" },
      { id: "267", title: "Bicycle", prompt: "A bicycle accelerating to gain speed" },
    ],
  },
  frame: {
    label: "1-step frame-wise",
    note: "1† NFE · 5 seconds",
    methods: [
      ["cfpp", "CF++"],
      ["oneforcing", "One Forcing"],
      ["radian", "Radian", true],
    ],
    cases: [
      { id: "547", title: "Van Gogh riverboat", prompt: "A boat sailing leisurely along the Seine River with the Eiffel Tower in background, Van Gogh style" },
      { id: "753", title: "Panda at dinner", prompt: "A cute fluffy panda eating Chinese food in a restaurant" },
      { id: "304", title: "Dog drinking", prompt: "A dog drinking water" },
      { id: "691", title: "Forest pianist", prompt: "A koala bear playing piano in the forest." },
    ],
  },
  long: {
    label: "60-second long",
    note: "957 frames · 16 FPS",
    methods: [
      ["rf", "Rolling Forcing"],
      ["radian", "Radian", true],
    ],
    cases: [
      { id: "512", title: "Ocean shark", prompt: "A shark is swimming in the ocean, oil painting" },
      { id: "556", title: "Rainy evening", prompt: "A couple in formal evening wear going home get caught in a heavy downpour with umbrellas, Van Gogh style" },
      { id: "188", title: "Trumpet", prompt: "A person is playing trumpet" },
      { id: "182", title: "Castle kitchen", prompt: "An adult person prepares vegetables in a wok inside a historically textured medieval castle, preserving coherent hands, utensils, ingredients, and steam throughout the long rollout." },
    ],
  },
};

const MORE_RESULTS = [
  ["vbench_p813", "Natural scene", "Harbor", "A harbor with boats and surrounding waterfront structures."],
  ["vbench_p301", "Natural motion", "Running cat", "A cat running happily."],
  ["vbench_p421", "Object consistency", "Orange car", "An orange car."],
  ["vbench_p642", "Character motion", "Reading", "Gwen Stacy reading a book, racking focus."],
  ["vbench_p732", "Painterly scene", "The Seine in Van Gogh", "A boat sailing leisurely along the Seine River with the Eiffel Tower in the background, rendered in the style of Vincent van Gogh."],
  ["style_p021_s2360032", "Retro-futurism", "Phone call", "A person listens and speaks into a telephone receiver in a warm atomic-age interior."],
  ["style_p024_s6918661", "Retro-futurism", "Petting a cat", "A person gently strokes a relaxed cat amid rounded chrome and pastel atomic-age design."],
  ["style_p025_s2379747", "Retro-futurism", "Playing piano", "A pianist performs a short flowing phrase with coordinated hands and stable key geometry."],
  ["style_p042_s9274039", "35mm film", "Riding a bus", "A passenger sits by the window while a moving bus transitions smoothly from dense buildings to open landscape."],
  ["style_p049_s4", "35mm film", "Stir-frying", "A cook moves a spatula through a wok and performs one small controlled toss."],
  ["style_p058_s5", "Fairy tale", "Enchanted kiss", "Two adults share a gentle kiss in a painterly, candlelit storybook setting."],
  ["style_p062_s4656530", "Fairy tale", "Enchanted cat", "A person pets a relaxed cat in a richly illustrated fairy-tale interior."],
  ["style_p066_s4656530", "Fairy tale", "Playing guitar", "A musician forms a chord and performs two controlled strums in an enchanted setting."],
  ["style_p075_s4232825", "Fairy tale", "Lunar New Year", "A family hangs a red paper decoration and exchanges a greeting beneath swaying lanterns."],
  ["style_p076_s4232825", "Grotesque surrealism", "Drinking water", "A person takes a measured sip in an uncanny but physically coherent surreal interior."],
  ["style_p078_s4232825", "Grotesque surrealism", "Uncanny phone call", "A surreal phone-call scene preserving the receiver, hand, mouth, and head position while the environment deforms slowly."],
  ["style_p100_s5279402", "Far-future society", "Future cat", "A person gently strokes a cat in a clean far-future space with translucent displays and precise materials."],
];

const videoPath = (mode, id, method) => `assets/videos/${mode}/p${id}/${method}.mp4`;
const posterPath = (path) => `assets/posters/${path.replace("assets/videos/", "").replaceAll("/", "__").replace(".mp4", ".jpg")}`;

function setActiveResult(name) {
  document.querySelectorAll(".result-tab").forEach((button) => {
    const active = button.dataset.resultTab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".result-panel").forEach((panel) => {
    const active = panel.id === `result-${name}`;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
}

document.querySelectorAll(".result-tab").forEach((button) => {
  button.addEventListener("click", () => setActiveResult(button.dataset.resultTab));
});

function setActiveAblation(name) {
  document.querySelectorAll(".ablation-tab").forEach((button) => {
    const active = button.dataset.ablationTab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".ablation-panel").forEach((panel) => {
    const active = panel.id === `ablation-${name}`;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
}

document.querySelectorAll(".ablation-tab").forEach((button) => {
  button.addEventListener("click", () => setActiveAblation(button.dataset.ablationTab));
});

class ComparisonPlayer {
  constructor(root) {
    this.root = root;
    this.videos = [...root.querySelectorAll("video")];
    this.playButton = root.querySelector('[data-action="play"]');
    this.restartButton = root.querySelector('[data-action="restart"]');
    this.muteButton = root.querySelector('[data-action="mute"]');
    this.range = root.querySelector("input[type=range]");
    this.time = root.querySelector(".sync-time");
    this.playing = false;
    this.raf = null;
    this.bind();
  }

  bind() {
    this.playButton.addEventListener("click", () => this.playing ? this.pause() : this.play());
    this.restartButton.addEventListener("click", () => this.restart());
    this.muteButton.addEventListener("click", () => this.toggleMute());
    this.range.addEventListener("input", () => this.seek(Number(this.range.value) / 1000));
    this.videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.addEventListener("click", () => this.playing ? this.pause() : this.play());
      video.addEventListener("dblclick", () => video.requestFullscreen?.());
    });
    this.update();
  }

  async play() {
    const master = this.videos[0];
    if (master.duration && master.currentTime >= master.duration - .08) this.seek(0);
    const progress = master.duration ? master.currentTime / master.duration : 0;
    this.videos.forEach((video) => {
      if (video.duration) video.currentTime = Math.min(progress * video.duration, Math.max(0, video.duration - .04));
    });
    await Promise.allSettled(this.videos.map((video) => video.play()));
    this.playing = true;
    this.playButton.textContent = "Ⅱ";
    this.playButton.setAttribute("aria-label", "Pause synchronized videos");
    this.tick();
  }

  pause() {
    this.videos.forEach((video) => video.pause());
    this.playing = false;
    this.playButton.textContent = "▶";
    this.playButton.setAttribute("aria-label", "Play synchronized videos");
    cancelAnimationFrame(this.raf);
    this.update();
  }

  restart() {
    this.pause();
    this.seek(0);
    this.play();
  }

  seek(progress) {
    this.videos.forEach((video) => {
      if (Number.isFinite(video.duration)) video.currentTime = Math.min(video.duration * progress, Math.max(0, video.duration - .03));
    });
    this.update();
  }

  toggleMute() {
    const muted = !this.videos[0].muted;
    this.videos.forEach((video) => { video.muted = muted; });
    this.muteButton.textContent = muted ? "⌁" : "♪";
    this.muteButton.setAttribute("aria-label", muted ? "Unmute videos" : "Mute videos");
  }

  tick() {
    if (!this.playing) return;
    const master = this.videos[0];
    if (master.ended) return this.pause();
    if (Number.isFinite(master.duration)) {
      const progress = master.currentTime / master.duration;
      this.videos.slice(1).forEach((video) => {
        if (!Number.isFinite(video.duration)) return;
        const target = progress * video.duration;
        if (Math.abs(video.currentTime - target) > .12) video.currentTime = target;
      });
    }
    this.update();
    this.raf = requestAnimationFrame(() => this.tick());
  }

  update() {
    const master = this.videos[0];
    const duration = Number.isFinite(master.duration) ? master.duration : 0;
    const progress = duration ? master.currentTime / duration : 0;
    this.range.value = String(Math.round(progress * 1000));
    this.time.textContent = `${formatTime(master.currentTime || 0)} / ${formatTime(duration)}`;
  }

  destroy() { this.pause(); }
}

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function renderPaperVideos() {
  const mount = document.querySelector("#paper-video-app");
  let currentMode = "chunk";
  let currentCase = 0;
  let player = null;

  const render = () => {
    player?.destroy();
    const group = PAPER_GROUPS[currentMode];
    const item = group.cases[currentCase];
    mount.className = "video-app";
    mount.innerHTML = `
      <div class="mode-tabs" role="tablist">
        ${Object.entries(PAPER_GROUPS).map(([key, value]) => `<button class="mode-tab ${key === currentMode ? "active" : ""}" data-mode="${key}" role="tab" aria-selected="${key === currentMode}">${value.label}</button>`).join("")}
      </div>
      <div class="video-case-panel">
        <div class="case-tabs" role="tablist" aria-label="Prompt cases">
          ${group.cases.map((entry, index) => `<button class="case-tab ${index === currentCase ? "active" : ""}" data-case="${index}" role="tab" aria-selected="${index === currentCase}">${String(index + 1).padStart(2, "0")} · ${entry.title}</button>`).join("")}
        </div>
        <div class="comparison-header">
          <div><h3>${item.title}</h3><p>“${item.prompt}”</p></div>
          <div class="sync-controls">
            <button data-action="play" aria-label="Play synchronized videos">▶</button>
            <button data-action="restart" aria-label="Restart synchronized videos">↺</button>
            <button data-action="mute" aria-label="Unmute videos">⌁</button>
            <input type="range" min="0" max="1000" value="0" aria-label="Synchronized video timeline">
            <span class="sync-time">0:00 / 0:00</span>
          </div>
        </div>
        <div class="comparison-grid cols-${group.methods.length}">
          ${group.methods.map(([key, label, ours]) => {
            const path = videoPath(currentMode, item.id, key);
            return `<article class="method-card ${ours ? "ours" : ""}"><video preload="metadata" muted playsinline poster="${posterPath(path)}" src="${path}" aria-label="${label}: ${item.prompt}"></video><div class="method-label"><span>${label}</span>${ours ? "<em>Ours</em>" : ""}</div></article>`;
          }).join("")}
        </div>
        <p class="sync-note">${group.note}. Click any video to play or pause the complete synchronized group; double-click for full screen.</p>
      </div>`;

    mount.querySelectorAll(".mode-tab").forEach((button) => button.addEventListener("click", () => {
      currentMode = button.dataset.mode;
      currentCase = 0;
      render();
    }));
    mount.querySelectorAll(".case-tab").forEach((button) => button.addEventListener("click", () => {
      currentCase = Number(button.dataset.case);
      render();
    }));
    player = new ComparisonPlayer(mount.querySelector(".video-case-panel"));
  };

  render();
}

function renderMoreResults() {
  const carousel = document.querySelector("#more-carousel");
  carousel.innerHTML = MORE_RESULTS.map(([slug, category, title, prompt]) => {
    const path = `assets/videos/more/${slug}.mp4`;
    return `<article class="more-card"><video muted loop playsinline preload="none" poster="${posterPath(path)}" src="${path}" aria-label="Radian: ${prompt}"></video><div class="more-copy"><span>${category}</span><h3>${title}</h3><p>${prompt}</p></div></article>`;
  }).join("");

  carousel.querySelectorAll("video").forEach((video) => {
    video.addEventListener("click", () => video.paused ? video.play() : video.pause());
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");
      if (entry.isIntersecting && entry.intersectionRatio > .72) video.play().catch(() => {});
      else video.pause();
    });
  }, { root: carousel, threshold: [.25, .72, .9] });
  carousel.querySelectorAll(".more-card").forEach((card) => observer.observe(card));

  const advance = (direction) => carousel.scrollBy({ left: direction * carousel.clientWidth * .78, behavior: "smooth" });
  document.querySelector("#more-prev").addEventListener("click", () => advance(-1));
  document.querySelector("#more-next").addEventListener("click", () => advance(1));
}

function bindLightbox() {
  const dialog = document.querySelector("#lightbox");
  const image = dialog.querySelector("img");
  document.querySelectorAll("[data-lightbox]").forEach((button) => button.addEventListener("click", () => {
    image.src = button.dataset.lightbox;
    dialog.showModal();
  }));
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}

function bindHero() {
  document.querySelectorAll(".hero-video video").forEach((video) => {
    video.addEventListener("mouseenter", () => video.pause());
    video.addEventListener("mouseleave", () => video.play().catch(() => {}));
    video.addEventListener("click", () => { video.currentTime = 0; video.play().catch(() => {}); });
  });
}

function bindCopy() {
  const button = document.querySelector("[data-copy-bib]");
  button.addEventListener("click", async () => {
    const text = document.querySelector(".citation-section code").textContent;
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = "Copy BibTeX"; }, 1600);
  });
}

renderPaperVideos();
renderMoreResults();
bindLightbox();
bindHero();
bindCopy();
