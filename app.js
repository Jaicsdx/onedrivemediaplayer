/* ====== Config ====== */
const DATA_FILE = 'movies.json'; // lives in repo; your “database”

/* ====== Helpers ====== */
const $ = (s, r = document) => r.querySelector(s);
const create = (t, cls) => {
  const el = document.createElement(t);
  if (cls) el.className = cls;
  return el;
};
const slugify = (s) => (s || '').toLowerCase()
  .replace(/<[^>]+>/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 80);

/* Accepts OneDrive embed URL or iframe, or long link with resid/authkey. */
function extractIframeSrc(maybeHtml) {
  const s = (maybeHtml || '').trim();
  if (!s.startsWith('<')) return null;
  const m = s.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
function toEmbedOnly(raw) {
  const iframeSrc = extractIframeSrc(raw);
  const url = iframeSrc || raw;
  try {
    const u = new URL(url);
    if (u.hostname.includes('onedrive.live.com') && u.pathname.includes('/embed')) {
      return { embed: url, ok: true };
    }
    const resid = u.searchParams.get('resid');
    const authkey = u.searchParams.get('authkey') || u.searchParams.get('authKey');
    if (u.hostname.includes('onedrive.live.com') && resid) {
      const embed = `https://onedrive.live.com/embed?resid=${encodeURIComponent(resid)}${authkey ? `&authkey=${encodeURIComponent(authkey)}` : ''}&em=2`;
      return { embed, ok: true };
    }
    return { embed: url, ok: false }; // 1drv.ms or unknown → might open share page
  } catch {
    return { embed: raw, ok: false };
  }
}

/* ====== State ====== */
let MOVIES = [];   // loaded from movies.json
let FILTER = '';   // search query
let SORT = 'new';  // 'new' | 'az' | 'za'
let CURRENT = null; // current movie obj

/* ====== Load JSON (no caching issues) ====== */
async function loadMovies() {
  // Cache-bust so GH pages/CDN doesn’t serve stale JSON
  const url = `${DATA_FILE}?v=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load movies.json');
  const arr = await res.json();

  // Normalize records
  MOVIES = (arr || []).map((m, i) => {
    const id = m.id || slugify(m.title) || `item-${i + 1}`;
    const poster = m.poster || '';
    const tags = Array.isArray(m.tags) ? m.tags : (m.tags ? String(m.tags).split(',').map(s => s.trim()) : []);
    const { embed, ok } = toEmbedOnly(m.embed || m.link || '');
    return {
      id, title: m.title || '(Untitled)', poster, tags, year: m.year || '', embed, ok,
      addedAt: m.addedAt || m.date || new Date().toISOString()
    };
  });
}

/* ====== Render grid ====== */
function render() {
  // Filter & sort
  const q = FILTER.toLowerCase();
  let list = MOVIES.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.tags.some(t => t.toLowerCase().includes(q))
  );
  if (SORT === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
  if (SORT === 'za') list.sort((a, b) => b.title.localeCompare(a.title));
  if (SORT === 'new') list.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));

  const grid = $('#grid');
  const empty = $('#empty');
  grid.innerHTML = '';
  if (list.length === 0) {
    empty.classList.remove('hidden');
    return;
  } else {
    empty.classList.add('hidden');
  }

  for (const m of list) {
    const card = create('article', 'card');
    const thumb = create('div', 'thumb');
    const img = create('img');
    img.alt = m.title;
    img.loading = 'lazy';
    img.src = m.poster || 'https://dummyimage.com/400x600/0b1324/ffffff&text=Poster';
    thumb.append(img);

    const badge = create('span', 'badge');
    badge.textContent = m.ok ? 'Embed OK' : 'Needs Embed';
    if (!m.ok) badge.style.borderColor = '#5b1a1e', badge.style.background = '#2a0f12';
    thumb.append(badge);

    const body = create('div', 'body');
    const ttl = create('div', 'titleline'); ttl.textContent = m.title;
    const tgs = create('div', 'tags'); tgs.textContent = m.tags.join(' • ');
    const row = create('div', 'playrow');
    const play = create('button', 'btn primary'); play.textContent = 'Play';
    const open = create('a', 'btn'); open.textContent = 'Open'; open.target = '_blank'; open.rel = 'noopener'; open.href = m.embed;

    play.addEventListener('click', () => openPlayer(m));
    thumb.addEventListener('click', () => openPlayer(m));

    row.append(play, open);
    body.append(ttl, tgs, row);
    card.append(thumb, body);
    grid.append(card);
  }
}

/* ====== Player modal ====== */
function openPlayer(movie) {
  CURRENT = movie;
  $('#mTitle').textContent = movie.title;
  $('#mTags').textContent = movie.tags.join(' • ');
  $('#player').src = movie.embed;
  $('#btnOpen').href = movie.embed;
  $('#overlay').classList.remove('hidden');

  const url = new URL(location.href);
  url.searchParams.set('id', movie.id);
  history.replaceState(null, '', url.toString());
}
function closePlayer() {
  $('#overlay').classList.add('hidden');
  $('#player').src = 'about:blank';
  const url = new URL(location.href);
  url.searchParams.delete('id');
  history.replaceState(null, '', url.toString());
}

/* Fullscreen on the container, so iframe fills via CSS :fullscreen */
function enterFullscreen() {
  const el = $('#playerWrap');
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) req.call(el);
}

/* ====== Wire up ====== */
async function boot() {
  try {
    await loadMovies();
    render();

    // Deep-link support
    const id = new URL(location.href).searchParams.get('id');
    if (id) {
      const m = MOVIES.find(x => x.id === id);
      if (m) openPlayer(m);
    }
  } catch (e) {
    console.error(e);
    $('#grid').innerHTML = `<div class="empty">Could not load <b>movies.json</b>. Make sure it exists in the repo.</div>`;
  }

  $('#q').addEventListener('input', e => { FILTER = e.target.value; render(); });
  $('#sort').addEventListener('change', e => { SORT = e.target.value; render(); });

  $('#closeModal').addEventListener('click', closePlayer);
  $('#overlay').addEventListener('click', (ev) => { if (ev.target.id === 'overlay') closePlayer(); });
  $('#btnCopy').addEventListener('click', () => {
    if (!CURRENT) return;
    navigator.clipboard?.writeText(CURRENT.embed);
  });
  $('#btnFullscreen').addEventListener('click', enterFullscreen);
}

document.addEventListener('DOMContentLoaded', boot);
