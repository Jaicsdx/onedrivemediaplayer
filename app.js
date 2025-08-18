const STORAGE_KEY = "lifeCity.mediaLibrary";
const listEl = document.getElementById("media-list");
const player = document.getElementById("mediaPlayer");
const playerTitle = document.getElementById("playerTitle");

function loadLibrary() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveLibrary(lib) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lib));
}

function renderLibrary() {
  const lib = loadLibrary();
  listEl.innerHTML = "";
  lib.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "media-card";
    card.innerHTML = `
      <img src="${item.poster || 'https://via.placeholder.com/150x200?text=No+Poster'}" alt="${item.title}">
      <p>${item.title}</p>
    `;
    card.addEventListener("click", () => {
      playMedia(item);
    });
    listEl.appendChild(card);
  });
}

function playMedia(item) {
  player.src = item.embed;
  playerTitle.textContent = "▶ " + item.title;
}

document.getElementById("addMediaBtn").addEventListener("click", () => {
  const title = document.getElementById("movieTitle").value.trim();
  const poster = document.getElementById("posterUrl").value.trim();
  const embed = document.getElementById("embedUrl").value.trim();
  if (!title || !embed) return alert("Title and Embed Link required!");

  const lib = loadLibrary();
  lib.push({ title, poster, embed });
  saveLibrary(lib);
  renderLibrary();

  // Clear fields
  document.getElementById("movieTitle").value = "";
  document.getElementById("posterUrl").value = "";
  document.getElementById("embedUrl").value = "";
});

// Init
renderLibrary();
