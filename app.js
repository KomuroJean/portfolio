(() => {
  "use strict";
  const DEFAULT_DATA = JSON.parse(
    document.getElementById("portfolio-data").textContent,
  );
  const config = structuredClone(DEFAULT_DATA);
  const highlightedRepos = [
    {
      name: "IsacFragoso/agendamento-frontend",
      description:
        "SAPNE · Frontend colaborativo do TCC — React, JavaScript e CSS.",
      language: "JavaScript",
      html_url: "https://github.com/IsacFragoso/agendamento-frontend",
      stargazers_count: null,
      forks_count: null,
      collab: true,
    },
    {
      name: "IsacFragoso/agendamento-backend",
      description:
        "SAPNE · API colaborativa do TCC — NestJS, TypeScript e PostgreSQL.",
      language: "TypeScript",
      html_url: "https://github.com/IsacFragoso/agendamento-backend",
      stargazers_count: null,
      forks_count: null,
      collab: true,
    },
  ];
  let repos = [...highlightedRepos],
    repoSource = "loading";
  let mediaPlayer = null;
  let mediaPlayerType = "";
  let mediaPlayerReady = false;
  let mediaPlayerTimer = null;
  let mediaRequestId = 0;
  let youtubeApiPromise = null;
  let lastVideoVolume = 80;
  let videoVolume = 80;
  let videoMuted = false;
  const $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  const safeUrl = (raw) => {
    try {
      const u = new URL(raw);
      return ["http:", "https:"].includes(u.protocol) ? u.href : "";
    } catch {
      return "";
    }
  };
  const photoData = (raw) =>
    typeof raw === "string" &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw)
      ? raw
      : "";
  const projectLinks = (p) =>
    Array.isArray(p.links)
      ? p.links
          .filter((l) => l && safeUrl(l.url))
          .map((l) => ({
            label: String(l.label || "Abrir projeto").slice(0, 60),
            url: safeUrl(l.url),
          }))
      : safeUrl(p.url)
        ? [{ label: "Visitar projeto", url: safeUrl(p.url) }]
        : [];
  const sapneInitial = JSON.parse(
    document.getElementById("portfolio-data").textContent,
  ).projects[0];
  if (
    Array.isArray(config.projects) &&
    config.projects.some((p) => p.id === "agendaja")
  ) {
    config.projects = [
      sapneInitial,
      ...config.projects.filter((p) => p.id !== "agendaja" && p.id !== "sapne"),
    ];
  }

  const username = () =>
    /^\w[\w-]{0,38}$/.test(config.github) ? config.github : "abatt-hash";
  const githubUrl = () => `https://github.com/${username()}`;
  function renderProfile() {
    $("brandName").textContent = config.brand || "abatt";
    $("footerBrand").textContent = config.brand || "abatt";
    $("heroKicker").textContent = config.kicker || "";
    $("heroLine1").textContent = config.line1 || "";
    $("heroLine2").textContent = config.line2 || "";
    $("heroIntro").textContent = config.intro || "";
    $("aboutText").textContent = config.about || "";
    document.title = (config.brand || "Portfólio") + " — Portfólio criativo";
    const portrait = photoData(config.photo);
    $("aboutPortrait").hidden = !portrait;
    if (portrait) $("aboutPortrait").src = portrait;
    else $("aboutPortrait").removeAttribute("src");
    ["heroGithub", "githubProfileLink", "contactGithub"].forEach(
      (id) => ($(id).href = githubUrl()),
    );
    if (config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
      $("contactLink").href = "mailto:" + config.email;
      $("contactLink").removeAttribute("target");
      $("contactLink").innerHTML =
        'Enviar e-mail <span aria-hidden="true">↗</span>';
    } else {
      $("contactLink").href = githubUrl();
      $("contactLink").target = "_blank";
      $("contactLink").innerHTML =
        'Visitar meu GitHub <span aria-hidden="true">↗</span>';
    }
  }
  const starSVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M50 5C55 34 66 45 95 50C66 55 55 66 50 95C45 66 34 55 5 50C34 45 45 34 50 5Z" fill="#c3ddcb"/><path d="M50 18C54 39 61 46 82 50C61 54 54 61 50 82C46 61 39 54 18 50C39 46 46 39 50 18Z" stroke="#e9bb8f"/></svg>`;
  function visual(project) {
    const v = ["product", "vesper", "avatar"].includes(project.visual)
      ? project.visual
      : "custom";
    let interior = "";
    if (v === "product")
      interior = `<div class="mock-app" aria-hidden="true"><div class="mock-top">SAPNE <span>✳</span> <small>✦ ◦ ◦</small></div><div class="mock-body"><div class="mock-side"><div class="block"></div><div class="block"></div><div class="block"></div><div class="block"></div></div><div class="mock-cal">${Array.from({ length: 12 }, (_, i) => `<span>${i + 10}</span>`).join("")}</div></div></div>`;
    else if (v === "vesper")
      interior = `<div class="celestial-mini" aria-hidden="true">${starSVG}</div>`;
    else if (v === "avatar")
      interior = `<div class="moon" aria-hidden="true"></div><div class="landscape" aria-hidden="true"></div>`;
    else interior = `<div class="visual-mark" aria-hidden="true">✳</div>`;
    return `<div class="project-visual visual-${v}">${interior}<span class="visual-label">${esc(project.category)}</span></div>`;
  }
  function renderProjects() {
    $("projectsGrid").innerHTML =
      (config.projects || [])
        .map((p, i) => {
          const links = projectLinks(p);
          return `<article class="project-card">${visual(p)}<div class="project-info"><span class="project-index">${String(i + 1).padStart(2, "0")} / ${esc(p.category)}</span><h3>${esc(p.title)}</h3><p class="project-description">${esc(p.description)}</p><div class="project-tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>${i === 0 && links.length > 1 ? `<div class="project-direct-links">${links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}<div class="project-footer"><small>${links.length === 1 ? "1 link disponível" : links.length > 1 ? `${links.length} links disponíveis` : "Projeto autoral"}</small><button type="button" data-project-id="${esc(p.id)}">Explorar projeto <span aria-hidden="true">↗</span></button></div></div></article>`;
        })
        .join("") ||
      `<div class="empty-media"><h3>Projetos em breve.</h3><p>Novos trabalhos serão publicados aqui.</p></div>`;
    $("projectsGrid")
      .querySelectorAll("[data-project-id]")
      .forEach((b) =>
        b.addEventListener("click", () => openProject(b.dataset.projectId)),
      );
  }
  function openProject(id) {
    const p = (config.projects || []).find((x) => x.id === id);
    if (!p) return;
    $("detailTitle").textContent = p.title;
    $("detailCategory").textContent = p.category;
    $("detailDescription").textContent = p.description;
    $("detailTags").innerHTML = (p.tags || [])
      .map((t) => `<span class="tag">${esc(t)}</span>`)
      .join("");
    $("detailLinks").innerHTML = projectLinks(p)
      .map(
        (l) =>
          `<a class="primary-btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} <span aria-hidden="true">↗</span></a>`,
      )
      .join("");
    $("projectDialog").showModal();
  }
  async function loadRepos() {
    repoSource = "loading";
    $("repoStatus").textContent = "Buscando repositórios públicos…";
    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username())}/repos?per_page=100&sort=updated`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!response.ok) throw new Error("API " + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Resposta inválida");
      repos = [
        ...highlightedRepos,
        ...data.filter(
          (r) =>
            !r.fork &&
            !["agendaja-front", "agendaja-back"].includes(r.name) &&
            !highlightedRepos.some((h) => h.html_url === r.html_url),
        ),
      ];
      repoSource = "live";
    } catch (err) {
      repos = [...highlightedRepos];
      repoSource = "fallback";
    }
    renderRepos();
  }
  function renderRepos() {
    const term = $("repoSearch").value.trim().toLowerCase();
    const result = repos.filter((r) =>
      (r.name + " " + (r.description || "") + " " + (r.language || ""))
        .toLowerCase()
        .includes(term),
    );
    $("repoCount").textContent =
      `${result.length} ${result.length === 1 ? "REPOSITÓRIO" : "REPOSITÓRIOS"}`;
    $("repoList").innerHTML =
      result
        .map(
          (r) =>
            `<article class="repo-item"><a href="${esc(safeUrl(r.html_url) || githubUrl())}" target="_blank" rel="noopener noreferrer" class="repo-name">${esc(r.name)} <span aria-hidden="true">↗</span></a><p class="repo-desc">${esc(r.description || "Repositório público no GitHub.")}</p><div class="repo-meta">${r.collab ? "<span>EM EQUIPE</span>" : ""}<span><span class="lang-dot"></span>${esc(r.language || "Código")}</span>${typeof r.stargazers_count === "number" ? `<span>☆ ${r.stargazers_count}</span>` : ""}${typeof r.forks_count === "number" ? `<span>⑂ ${r.forks_count}</span>` : ""}</div></article>`,
        )
        .join("") ||
      `<p class="repo-status">${repoSource === "fallback" ? "Não foi possível buscar repositórios deste perfil." : "Nenhum repositório encontrado."}</p>`;
    $("repoStatus").textContent =
      repoSource === "live"
        ? "Repositórios do SAPNE em equipe e outros projetos públicos consultados no GitHub."
        : repoSource === "fallback"
          ? "Repositórios do SAPNE disponíveis; a lista do seu perfil não pôde ser atualizada."
          : "Carregando…";
  }
  function getYouTubeVideoId(raw) {
    const url = safeUrl(raw);
    if (!url) return "";
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    let id = "";
    if (host === "youtu.be") id = u.pathname.split("/")[1] || "";
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
      else if (/^\/(shorts|embed|live)\//.test(u.pathname))
        id = u.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  }
  function getVimeoVideoId(raw) {
    const url = safeUrl(raw);
    if (!url) return "";
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return "";
    return u.pathname.match(/\/(?:video\/)?(\d+)/)?.[1] || "";
  }
  function loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;
    youtubeApiPromise = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        youtubeApiPromise = null;
        reject(new Error("Não foi possível carregar a API do YouTube."));
      };
      document.head.append(script);
    });
    return youtubeApiPromise;
  }
  function formatVideoTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, "0")}`;
  }
  function getCurrentVideoTime() {
    return mediaPlayerType === "youtube"
      ? mediaPlayer.getCurrentTime()
      : mediaPlayer.currentTime;
  }
  function getVideoDuration() {
    return mediaPlayerType === "youtube"
      ? mediaPlayer.getDuration()
      : mediaPlayer.duration;
  }
  function updateRangeProgress(input) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 0;
    const value = Number(input.value) || 0;
    const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
    input.style.setProperty("--range-progress", `${progress}%`);
  }
  function updateVolumeControls() {
    const slider = $("videoVolume");
    slider.value = String(videoVolume);
    updateRangeProgress(slider);
    const button = document.querySelector('[data-player-action="mute"]');
    button.dataset.muted = String(videoMuted);
    button.setAttribute("aria-label", videoMuted ? "Ativar som" : "Silenciar");
    button.title = videoMuted ? "Ativar som" : "Silenciar";
  }
  function applyVideoVolume() {
    if (!mediaPlayer || !mediaPlayerReady) return;
    if (mediaPlayerType === "youtube") {
      mediaPlayer.setVolume(videoVolume);
      if (videoMuted) mediaPlayer.mute();
      else mediaPlayer.unMute();
    } else {
      mediaPlayer.volume = videoVolume / 100;
      mediaPlayer.muted = videoMuted;
    }
  }
  function setVideoVolume(volume) {
    if (!mediaPlayer || !mediaPlayerReady) return;
    const value = Math.max(0, Math.min(100, volume));
    videoVolume = value;
    videoMuted = value === 0;
    if (value > 0) lastVideoVolume = value;
    applyVideoVolume();
    updateVolumeControls();
  }
  function toggleVideoMute() {
    if (!mediaPlayer || !mediaPlayerReady) return;
    if (videoMuted) {
      if (videoVolume === 0) videoVolume = lastVideoVolume;
      videoMuted = false;
    } else videoMuted = true;
    applyVideoVolume();
    updateVolumeControls();
  }
  function updateMediaControls() {
    if (!mediaPlayer || !mediaPlayerReady) return;
    const currentTime = getCurrentVideoTime() || 0;
    const duration = getVideoDuration() || 0;
    const seek = $("videoSeek");
    seek.max = String(Math.floor(duration));
    seek.value = String(Math.min(Math.floor(currentTime), Math.floor(duration)));
    seek.disabled = duration <= 0;
    updateRangeProgress(seek);
    $("videoCurrentTime").textContent = formatVideoTime(currentTime);
    $("videoDuration").textContent = formatVideoTime(duration);
    const playing =
      mediaPlayerType === "youtube"
        ? mediaPlayer.getPlayerState() === window.YT.PlayerState.PLAYING
        : !mediaPlayer.paused;
    const toggle = document.querySelector('[data-player-action="toggle"]');
    toggle.dataset.playing = String(playing);
    toggle.setAttribute("aria-label", playing ? "Pausar" : "Reproduzir");
    toggle.title = playing ? "Pausar" : "Reproduzir";
    updateVolumeControls();
  }
  function seekVideo(seconds) {
    if (!mediaPlayer || !mediaPlayerReady) return;
    const duration = getVideoDuration() || 0;
    const target = Math.max(
      0,
      Math.min(duration, getCurrentVideoTime() + seconds),
    );
    if (mediaPlayerType === "youtube") mediaPlayer.seekTo(target, true);
    else mediaPlayer.currentTime = target;
    updateMediaControls();
  }
  function showMediaPlayerError(message, error) {
    $("mediaPlayerStatus").textContent = message;
    $("mediaPlayerControls").hidden = true;
    if (error) console.error("Falha ao carregar o vídeo.", error);
  }
  async function openYouTubeVideo(videoId, requestId) {
    try {
      const api = await loadYouTubeApi();
      if (requestId !== mediaRequestId || !$("mediaDialog").open) return;
      const target = document.createElement("div");
      $("mediaPlayerHost").replaceChildren(target);
      mediaPlayerType = "youtube";
      const playerVars = {
        controls: 0,
        enablejsapi: 1,
        playsinline: 1,
        rel: 0,
      };
      if (location.origin !== "null") playerVars.origin = location.origin;
      mediaPlayer = new api.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars,
        events: {
          onReady: () => {
            if (requestId !== mediaRequestId) return;
            mediaPlayerReady = true;
            videoVolume = lastVideoVolume;
            applyVideoVolume();
            $("mediaPlayerStatus").textContent = "";
            $("mediaPlayerControls").hidden = false;
            updateMediaControls();
            mediaPlayerTimer = setInterval(updateMediaControls, 250);
          },
          onStateChange: updateMediaControls,
          onError: (event) =>
            showMediaPlayerError(
              "Não foi possível carregar este vídeo. Verifique se ele permite incorporação.",
              event.data,
            ),
        },
      });
    } catch (error) {
      if (requestId !== mediaRequestId) return;
      showMediaPlayerError(
        "Não foi possível carregar o player. Verifique sua conexão e tente novamente.",
        error,
      );
    }
  }
  function openVideo(item) {
    const requestId = ++mediaRequestId;
    const url = safeUrl(item.url);
    $("mediaDialogTitle").textContent = item.title;
    $("mediaPlayerHost").replaceChildren();
    $("mediaPlayerControls").hidden = true;
    $("mediaPlayerStatus").textContent = "Carregando vídeo…";
    $("mediaDialog").showModal();

    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      openYouTubeVideo(youtubeId, requestId);
      return;
    }
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
      const iframe = document.createElement("iframe");
      iframe.title = item.title;
      iframe.src = `https://player.vimeo.com/video/${vimeoId}`;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      $("mediaPlayerHost").append(iframe);
      $("mediaPlayerStatus").textContent = "";
      return;
    }
    if (url && /\.(mp4|webm|ogv)(\?|$)/i.test(url)) {
      const video = document.createElement("video");
      video.src = url;
      video.playsInline = true;
      video.preload = "metadata";
      mediaPlayer = video;
      mediaPlayerType = "html5";
      $("mediaPlayerHost").append(video);
      video.addEventListener("loadedmetadata", () => {
        mediaPlayerReady = true;
        videoVolume = lastVideoVolume;
        applyVideoVolume();
        $("mediaPlayerStatus").textContent = "";
        $("mediaPlayerControls").hidden = false;
        updateMediaControls();
      });
      video.addEventListener("timeupdate", updateMediaControls);
      video.addEventListener("play", updateMediaControls);
      video.addEventListener("pause", updateMediaControls);
      video.addEventListener("error", () =>
        showMediaPlayerError("Não foi possível carregar este vídeo."),
      );
      return;
    }
    showMediaPlayerError(
      url ? "Este formato de vídeo não é compatível." : "Endereço de vídeo inválido.",
    );
  }
  function closeVideo() {
    mediaRequestId++;
    clearInterval(mediaPlayerTimer);
    mediaPlayerTimer = null;
    const player = mediaPlayer;
    const playerType = mediaPlayerType;
    mediaPlayer = null;
    mediaPlayerType = "";
    mediaPlayerReady = false;
    if (playerType === "youtube" && player) player.destroy();
    $("mediaPlayerHost").replaceChildren();
    $("mediaPlayerControls").hidden = true;
  }
  function renderMedia() {
    const filtered = (config.media || []).filter((m) => m.type === "video");
    if (!filtered.length) {
      $("mediaGrid").innerHTML =
        `<div class="empty-media"><div class="eyebrow">SHOWREEL / BASTIDORES</div><h3>Vídeos em breve.</h3><p>Novos vídeos serão publicados aqui.</p></div>`;
    } else {
      $("mediaGrid").innerHTML = filtered
        .map(
          (m) => {
            const videoId = getYouTubeVideoId(m.url);
            const thumbnail = videoId
              ? `<img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" data-fallback="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="" loading="lazy">`
              : `<span class="media-thumbnail-placeholder" aria-hidden="true">VÍDEO</span>`;
            return `<article class="media-card"><button class="media-thumbnail" type="button" data-video-id="${esc(m.id)}" aria-label="Reproduzir ${esc(m.title)}">${thumbnail}<span class="media-thumbnail-play" aria-hidden="true">▶</span></button><div class="media-info"><small>▶ Vídeo</small><h3>${esc(m.title)}</h3><p>${esc(m.description || "")}</p></div></article>`;
          },
        )
        .join("");
      $("mediaGrid")
        .querySelectorAll(".media-thumbnail img")
        .forEach((image) => {
          image.addEventListener("error", () => {
            const fallback = image.dataset.fallback;
            if (!fallback) return;
            delete image.dataset.fallback;
            image.src = fallback;
          });
        });
      $("mediaGrid")
        .querySelectorAll("[data-video-id]")
        .forEach((button) => {
          button.addEventListener("click", () => {
            const item = filtered.find((video) => video.id === button.dataset.videoId);
            if (item) openVideo(item);
          });
        });
    }
  }
  function renderAll() {
    renderProfile();
    renderProjects();
    renderMedia();
  }
  document
    .querySelectorAll("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () => $(b.dataset.close).close()),
    );
  $("mediaDialog").addEventListener("close", closeVideo);
  document
    .querySelectorAll("[data-player-action]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        if (!mediaPlayer || !mediaPlayerReady) return;
        const action = button.dataset.playerAction;
        if (action === "backward") seekVideo(-5);
        else if (action === "forward") seekVideo(5);
        else if (action === "toggle") {
          if (mediaPlayerType === "youtube") {
            if (
              mediaPlayer.getPlayerState() === window.YT.PlayerState.PLAYING
            )
              mediaPlayer.pauseVideo();
            else mediaPlayer.playVideo();
          } else if (mediaPlayer.paused) {
            mediaPlayer.play().catch((error) =>
              showMediaPlayerError(
                "Não foi possível reproduzir este vídeo.",
                error,
              ),
            );
          } else mediaPlayer.pause();
        } else if (action === "mute") toggleVideoMute();
      }),
    );
  $("videoSeek").addEventListener("input", () => {
    if (!mediaPlayer || !mediaPlayerReady) return;
    const target = Number($("videoSeek").value);
    if (mediaPlayerType === "youtube") mediaPlayer.seekTo(target, true);
    else mediaPlayer.currentTime = target;
    $("videoCurrentTime").textContent = formatVideoTime(target);
    updateRangeProgress($("videoSeek"));
  });
  $("videoVolume").addEventListener("input", () => {
    if (!mediaPlayer || !mediaPlayerReady) return;
    setVideoVolume(Number($("videoVolume").value));
  });
  $("repoSearch").addEventListener("input", renderRepos);
  $("menuToggle").addEventListener("click", () => {
    const open = $("navMenu").classList.toggle("open");
    $("menuToggle").setAttribute("aria-expanded", String(open));
  });
  $("navMenu")
    .querySelectorAll("a")
    .forEach((a) =>
      a.addEventListener("click", () => {
        $("navMenu").classList.remove("open");
        $("menuToggle").setAttribute("aria-expanded", "false");
      }),
    );
  renderAll();
  loadRepos();
})();
