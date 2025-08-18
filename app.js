const STORAGE_KEY = "lifeCity.mediaList";
const grid = document.getElementById("media-grid");
const addBtn = document.getElementById("addBtn");

function loadMedia() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveMedia(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function render() {
  const list = loadMedia();
  grid.innerHTML = "";
  list.forEach((m, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${m.poster}" alt="${m.title}">
      <h3>${m.title}</h3>
      <button onclick="playMedia('${m.embed}')">▶ Play</button>
    `;
    grid.appendChild(card);
  });
}

addBtn.addEventListener("click", () => {
  const poster = document.getElementById("poster").value.trim();
  const title = document.getElementById("title").value.trim();
  const embed = document.getElementById("embed").value.trim();

  if (!poster || !title || !embed) return alert("Please fill all fields");

  const list = loadMedia();
  list.push({ poster, title, embed });
  saveMedia(list);
  render();

  document.getElementById("poster").value = "";
  document.getElementById("title").value = "";
  document.getElementById("embed").value = "";
});

function playMedia(embedUrl) {
  const modal = document.getElementById("playerModal");
  const frame = document.getElementById("playerFrame");
  frame.src = embedUrl; // must be a valid OneDrive embed link
  modal.style.display = "flex";
}

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("playerModal").style.display = "none";
  document.getElementById("playerFrame").src = "";
});

render();
