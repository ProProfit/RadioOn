# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub-API-backed admin panel (`admin.html`) for managing radio stations and playlist tracks on the RaqdioON static GitHub Pages site without editing code.

**Architecture:** Stations migrate from hardcoded HTML into `stations.json`; `main.js` fetches and renders them dynamically. `admin.html` + `admin.js` provide a two-tab UI (Станции / Плейлисты) that reads/writes JSON files directly via the GitHub Contents API using a PAT stored in `localStorage`.

**Tech Stack:** Vanilla JS (ES5), jQuery 3.6 (in main.js only — admin.js uses native fetch), GitHub REST API v3, `localStorage`, `btoa`/`atob` for base64.

---

### Task 1: Create stations.json

**Files:**
- Create: `stations.json`

- [ ] **Step 1: Create stations.json at project root**

```json
[
  { "title": "Hit-FM",            "url": "https://online.hitfm.ua/HitFM_HD",                                       "category": "pop",   "stream": "hit",             "type": "mp3", "group": "Tavr media" },
  { "title": "Radio ROKS",        "url": "https://online.radioroks.ua/RadioROKS_HD",                                "category": "Rok",   "stream": "roks",            "type": "mp3", "group": "Tavr media" },
  { "title": "Kiss FM",           "url": "https://online.kissfm.ua/KissFM_HD",                                     "category": "pop",   "stream": "kiss",            "type": "mp3", "group": "Tavr media" },
  { "title": "Relax",             "url": "https://online.radiorelax.ua/RadioRelax_HD",                              "category": "Relax", "stream": "relax",           "type": "mp3", "group": "Tavr media" },
  { "title": "Radio Gold",        "url": "https://online.radioplayer.ua/RadioGold_HD",                              "category": "",      "stream": "radio3gold",      "type": "mp3", "group": "Tavr media" },
  { "title": "Guliay",            "url": "https://online.radioplayer.ua/GuliayRadio_HD",                            "category": "",      "stream": "guliay",          "type": "mp3", "group": "Tavr media" },
  { "title": "Flash Radio",       "url": "https://online.radioplayer.ua/FlashRadio_HD",                             "category": "",      "stream": "radio3flash",     "type": "mp3", "group": "Tavr media" },
  { "title": "Melodia FM",        "url": "https://online.melodiafm.ua/MelodiaFM_HD",                               "category": "",      "stream": "melodia",         "type": "mp3", "group": "Tavr media" },
  { "title": "Melodia Romantic",  "url": "https://online.melodiafm.ua/MelodiaFM_Romantic_HD",                      "category": "Relax", "stream": "melodiar",        "type": "mp3", "group": "Tavr media" },
  { "title": "Bayraktar",         "url": "https://online.radiobayraktar.ua/RadioBayraktar_HD",                      "category": "",      "stream": "radio3bayraktar", "type": "mp3", "group": "Tavr media" },
  { "title": "Lounge FM",         "url": "https://cast.mediaonline.net.ua/loungefm320",                            "category": "LoFi",  "stream": "",                "type": "hls", "group": "LoFi" },
  { "title": "Lounge FM Acoustic","url": "https://cast.mediaonline.net.ua/acoustic",                               "category": "LoFi",  "stream": "",                "type": "hls", "group": "LoFi" },
  { "title": "lux fm",            "url": "https://streamvideo.luxnet.ua/lux/smil:lux.stream.smil/chunklist.m3u8",  "category": "test",  "stream": "",                "type": "hls", "group": "TEST m3u8" },
  { "title": "TEST2",             "url": "https://hlsyoufm.akamaized.net/hls/live/2016538/youfm/master.m3u8",      "category": "test",  "stream": "",                "type": "hls", "group": "TEST m3u8" },
  { "title": "lux lviv",          "url": "https://streamvideo.luxnet.ua/luxlviv/luxlviv.stream/playlist.m3u8",      "category": "test",  "stream": "",                "type": "hls", "group": "TEST m3u8" },
  { "title": "Radyo Şirin",       "url": "http://154.53.167.66:9570/stream",                                        "category": "Tyrok", "stream": "",                "type": "mp3", "group": "Radio World" },
  { "title": "Radyo 22222",       "url": "https://fs24.fex.net/play/5467959707.mp3",                               "category": "2222",  "stream": "",                "type": "mp3", "group": "Radio" }
]
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('stations.json','utf8')); console.log('Valid JSON, stations:', JSON.parse(require('fs').readFileSync('stations.json','utf8')).length)"
```

Expected: `Valid JSON, stations: 17`

- [ ] **Step 3: Commit**

```bash
git add stations.json
git commit -m "feat: add stations.json (migrated from index.html)"
```

---

### Task 2: Migrate stations to dynamic rendering

**Files:**
- Modify: `js/main.js`
- Modify: `index.html`

Both files are changed together — separating them would temporarily show double station lists.

- [ ] **Step 1: Add fetchAndRenderStations() and renderStations() to main.js**

Add these two functions directly BEFORE the `$(document).ready(...)` block in `js/main.js`:

```javascript
function fetchAndRenderStations() {
  fetch('stations.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Failed to load stations.json');
      return response.json();
    })
    .then(function (stations) {
      renderStations(stations);
    })
    .catch(function (err) {
      console.error('Could not load stations:', err);
    });
}

function renderStations(stations) {
  var $container = $('.playList-container');
  $container.find('.playlist:not(.custom-playlist)').remove();

  var groupNames = [];
  var groups = {};
  stations.forEach(function (station) {
    var g = station.group || 'Other';
    if (!groups[g]) { groups[g] = []; groupNames.push(g); }
    groups[g].push(station);
  });

  var $anchor = $container.find('.custom-playlist').first();
  groupNames.forEach(function (groupName) {
    var groupStations = groups[groupName];
    var hasTavr = groupStations.some(function (s) { return s.stream; });

    var $div = $('<div>').addClass('playlist');
    if (hasTavr) $div.addClass('hitfm');
    $('<h2>').addClass('playlist-title').text(groupName).appendTo($div);
    var $ul = $('<ul>').addClass('station-list').appendTo($div);

    groupStations.forEach(function (station) {
      var $a = $('<a>')
        .attr('href', station.url)
        .attr('data-title', station.title)
        .attr('data-stream', station.stream || '')
        .attr('data-category', station.category || '')
        .text(station.title);
      if (station.type === 'hls') $a.addClass('play-m3u8');
      $('<li>').append($a).appendTo($ul);
    });

    if ($anchor.length) { $anchor.before($div); } else { $container.append($div); }
  });
}
```

- [ ] **Step 2: Call fetchAndRenderStations() inside $(document).ready()**

Add as the FIRST line inside `$(document).ready(function () { ... })`:

```javascript
fetchAndRenderStations();
```

- [ ] **Step 3: Mark custom playlist divs in index.html**

In `index.html`, find the two divs with `playlist-title` "My PlayLists" and "My Hits" and add class `custom-playlist` to each:

Change:
```html
<div id="TrackList" class="playlist" >
    <h2 class="playlist-title">My PlayLists</h2>
```
To:
```html
<div id="TrackList" class="playlist custom-playlist" >
    <h2 class="playlist-title">My PlayLists</h2>
```

And:
```html
<div id="TrackList" class="playlist" >
    <h2 class="playlist-title">My Hits</h2>
```
To:
```html
<div id="TrackList" class="playlist custom-playlist" >
    <h2 class="playlist-title">My Hits</h2>
```

- [ ] **Step 4: Remove all hardcoded station divs from index.html**

Remove these entire `<div>` blocks from inside `.playList-container` (keep only the `.custom-playlist` divs):

- `<div id="playlist" class="playlist hitfm">` — Tavr media block (lines with Hit-FM, Radio ROKS, etc.)
- `<div id="TrackList" class="playlist M3U8">` — LoFi block
- `<div id="playlist" class="playlist M3U8">` — TEST m3u8 block
- `<div id="playlist" class="playlist World">` — Radio World block
- `<div id="playlist" class="playlist World">` — Radio block

After removal `.playList-container` should contain ONLY the two `.custom-playlist` divs.

- [ ] **Step 5: Verify in browser**

Serve the project locally (e.g. `npx serve .` or `python -m http.server 8080`). Open `http://localhost:8080`.

Check:
1. All 17 stations appear (grouped: Tavr media, LoFi, TEST m3u8, Radio World, Radio)
2. Custom playlists "My PlayLists" and "My Hits" still present
3. Click a station → audio plays
4. Category filter works (Tavr media stations tagged pop/Rok/Relax show/hide)
5. No console errors

- [ ] **Step 6: Commit**

```bash
git add js/main.js index.html
git commit -m "feat: render stations dynamically from stations.json"
```

---

### Task 3: Create admin.html

**Files:**
- Create: `admin.html`

- [ ] **Step 1: Create admin.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RadioOn Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; background: #2e3440; color: #eceff4; padding: 20px; }
    h1 { margin-bottom: 20px; }
    .hidden { display: none !important; }

    #loginForm label { display: block; margin: 10px 0 4px; }
    #loginForm input { width: 300px; padding: 6px; background: #3b4252; color: #eceff4; border: 1px solid #4c566a; font-family: monospace; }
    #loginError { color: #bf616a; margin-top: 10px; }

    #tabs { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
    #tabs button, #logoutBtn { background: none; border: 1px solid #4c566a; color: #eceff4; padding: 6px 14px; cursor: pointer; font-family: monospace; }
    #tabs button.active { border-color: #eceff4; }
    #logoutBtn { margin-left: auto; border-color: #bf616a; color: #bf616a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #4c566a; font-size: 0.85rem; }
    th { color: #88c0d0; }
    td button { background: none; border: none; color: #eceff4; cursor: pointer; font-family: monospace; padding: 2px 6px; }
    td button.del:hover { color: #bf616a; }

    .form-group { margin: 10px 0; }
    .form-group label { display: block; margin-bottom: 4px; font-size: 0.85rem; color: #88c0d0; }
    .form-group input, .form-group select { width: 100%; padding: 6px; background: #3b4252; color: #eceff4; border: 1px solid #4c566a; font-family: monospace; }
    .radio-group { display: flex; gap: 20px; }
    .form-actions { display: flex; gap: 10px; margin-top: 16px; }
    .form-actions button { padding: 6px 16px; background: none; border: 1px solid #4c566a; color: #eceff4; cursor: pointer; font-family: monospace; }
    .form-actions button.primary { border-color: #a3be8c; color: #a3be8c; }

    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .btn-add { background: none; border: 1px solid #a3be8c; color: #a3be8c; padding: 4px 12px; cursor: pointer; font-family: monospace; }
    .btn-del { background: none; border: 1px solid #bf616a; color: #bf616a; padding: 4px 12px; cursor: pointer; font-family: monospace; }

    #categoryRow { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    #categoryRow select { padding: 6px; background: #3b4252; color: #eceff4; border: 1px solid #4c566a; font-family: monospace; }
    #newCategoryInput { padding: 6px; background: #3b4252; color: #eceff4; border: 1px solid #4c566a; font-family: monospace; width: 160px; }

    .status { margin: 10px 0; font-size: 0.85rem; min-height: 1.2em; }
    .status.ok { color: #a3be8c; }
    .status.err { color: #bf616a; }

    td.url-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  </style>
</head>
<body>

<!-- LOGIN -->
<div id="loginSection">
  <h1>RadioOn Admin</h1>
  <div id="loginForm">
    <label>GitHub PAT<input type="password" id="pat" placeholder="ghp_…"></label>
    <label>Owner (username)<input type="text" id="owner" placeholder="ProProfit"></label>
    <label>Repo<input type="text" id="repo" placeholder="RaqdioON"></label>
    <div class="form-actions">
      <button type="button" id="loginBtn" class="primary">[ Войти ]</button>
    </div>
    <div id="loginError" class="hidden"></div>
  </div>
</div>

<!-- MAIN -->
<div id="mainSection" class="hidden">
  <div id="tabs">
    <button id="tabStations" class="active">[ Станции ]</button>
    <button id="tabPlaylists">[ Плейлисты ]</button>
    <button id="logoutBtn">[ Выход ]</button>
  </div>
  <div id="statusMsg" class="status"></div>

  <!-- STATIONS TAB -->
  <div id="sectionStations">
    <div class="section-header">
      <strong>Станции</strong>
      <button class="btn-add" id="addStationBtn">[ + Добавить ]</button>
    </div>
    <table id="stationsTable">
      <thead><tr><th>Название</th><th>URL</th><th>Категория</th><th>Тип</th><th>Группа</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
    <div id="stationForm" class="hidden">
      <strong id="stationFormTitle">Добавить станцию</strong>
      <input type="hidden" id="stationIndex" value="-1">
      <div class="form-group"><label>Название</label><input type="text" id="stationTitle"></div>
      <div class="form-group"><label>URL потока</label><input type="text" id="stationUrl"></div>
      <div class="form-group"><label>Категория</label><input type="text" id="stationCategory" placeholder="pop, Rok, Relax…"></div>
      <div class="form-group"><label>Группа (плейлист)</label><input type="text" id="stationGroup" placeholder="Tavr media, LoFi…"></div>
      <div class="form-group"><label>data-stream (tavrmedia, пусто если не нужен)</label><input type="text" id="stationStream" placeholder="hit, roks, kiss…"></div>
      <div class="form-group">
        <label>Тип потока</label>
        <div class="radio-group">
          <label><input type="radio" name="stationType" value="mp3" checked> MP3</label>
          <label><input type="radio" name="stationType" value="hls"> HLS</label>
        </div>
      </div>
      <div class="form-actions">
        <button id="saveStationBtn" class="primary">[ Сохранить ]</button>
        <button id="cancelStationBtn">[ Отмена ]</button>
      </div>
    </div>
  </div>

  <!-- PLAYLISTS TAB -->
  <div id="sectionPlaylists" class="hidden">
    <div id="categoryRow">
      <select id="categorySelect"></select>
      <button class="btn-add" id="addCategoryBtn">[ + Новая ]</button>
      <input type="text" id="newCategoryInput" class="hidden" placeholder="Название категории">
      <button id="saveCategoryBtn" class="btn-add hidden">[ OK ]</button>
      <button id="deleteCategoryBtn" class="btn-del">[ Удалить категорию ]</button>
    </div>
    <div class="section-header">
      <strong id="trackListTitle">Треки</strong>
      <button class="btn-add" id="addTrackBtn">[ + Трек ]</button>
    </div>
    <table id="tracksTable">
      <thead><tr><th>Название</th><th>URL</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
    <div id="trackForm" class="hidden">
      <strong id="trackFormTitle">Добавить трек</strong>
      <input type="hidden" id="trackIndex" value="-1">
      <div class="form-group"><label>Название</label><input type="text" id="trackTitle"></div>
      <div class="form-group"><label>URL</label><input type="text" id="trackUrl"></div>
      <div class="form-actions">
        <button id="saveTrackBtn" class="primary">[ Сохранить ]</button>
        <button id="cancelTrackBtn">[ Отмена ]</button>
      </div>
    </div>
  </div>
</div>

<script src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify structure**

Open `admin.html` via local server. Verify:
1. Login form visible, all three fields present
2. Main section hidden
3. No console errors

- [ ] **Step 3: Commit**

```bash
git add admin.html
git commit -m "feat: add admin.html shell (login + tab layout)"
```

---

### Task 4: Create admin.js — Auth + GitHub API + tab skeleton

**Files:**
- Create: `js/admin.js`

- [ ] **Step 1: Create js/admin.js**

```javascript
(function () {
  var state = {
    pat: '', owner: '', repo: '',
    stations: [], stationsSHA: '',
    playlist: [], playlistSHA: ''
  };

  // ── GitHub API ──────────────────────────────────────────────────────────────

  function apiHeaders() {
    return {
      'Authorization': 'token ' + state.pat,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  function getFile(path) {
    return fetch('https://api.github.com/repos/' + state.owner + '/' + state.repo + '/contents/' + path, {
      headers: apiHeaders()
    }).then(function (r) {
      if (!r.ok) throw new Error('GET ' + path + ' failed: ' + r.status);
      return r.json();
    });
  }

  function putFile(path, content, sha, message) {
    return fetch('https://api.github.com/repos/' + state.owner + '/' + state.repo + '/contents/' + path, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({
        message: message,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
        sha: sha
      })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.message || 'PUT failed: ' + r.status); });
      return r.json();
    });
  }

  function decodeFile(b64) {
    return JSON.parse(decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))));
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  function showStatus(msg, isError) {
    var el = document.getElementById('statusMsg');
    el.textContent = msg;
    el.className = 'status ' + (isError ? 'err' : 'ok');
    if (isError) return;
    setTimeout(function () { el.textContent = ''; el.className = 'status'; }, 3000);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  function tryLogin() {
    var pat   = document.getElementById('pat').value.trim();
    var owner = document.getElementById('owner').value.trim();
    var repo  = document.getElementById('repo').value.trim();
    var errEl = document.getElementById('loginError');
    errEl.classList.add('hidden');

    if (!pat || !owner || !repo) {
      errEl.textContent = 'Заполните все поля';
      errEl.classList.remove('hidden');
      return;
    }

    fetch('https://api.github.com/repos/' + owner + '/' + repo, {
      headers: { 'Authorization': 'token ' + pat }
    }).then(function (r) {
      if (!r.ok) throw new Error('Токен недействителен или репозиторий не найден (' + r.status + ')');
      state.pat = pat; state.owner = owner; state.repo = repo;
      localStorage.setItem('admin_pat', pat);
      localStorage.setItem('admin_owner', owner);
      localStorage.setItem('admin_repo', repo);
      enterAdmin();
    }).catch(function (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    });
  }

  function logout() {
    ['admin_pat', 'admin_owner', 'admin_repo'].forEach(function (k) { localStorage.removeItem(k); });
    state.pat = state.owner = state.repo = '';
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('mainSection').classList.add('hidden');
  }

  function enterAdmin() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainSection').classList.remove('hidden');
    switchTab('stations');
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────

  function switchTab(tab) {
    document.getElementById('sectionStations').classList.toggle('hidden', tab !== 'stations');
    document.getElementById('sectionPlaylists').classList.toggle('hidden', tab !== 'playlists');
    document.getElementById('tabStations').classList.toggle('active', tab === 'stations');
    document.getElementById('tabPlaylists').classList.toggle('active', tab === 'playlists');
    if (tab === 'stations') loadStations();
    if (tab === 'playlists') loadPlaylist();
  }

  // ── Stations ─────────────────────────────────────────────────────────────────

  function loadStations() {
    getFile('stations.json').then(function (data) {
      state.stations = decodeFile(data.content);
      state.stationsSHA = data.sha;
      renderStationsTable();
    }).catch(function (err) { showStatus(err.message, true); });
  }

  function renderStationsTable() {
    var tbody = document.querySelector('#stationsTable tbody');
    tbody.innerHTML = '';
    state.stations.forEach(function (s, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(s.title) + '</td>' +
        '<td class="url-cell">' + esc(s.url) + '</td>' +
        '<td>' + esc(s.category) + '</td>' +
        '<td>' + esc(s.type) + '</td>' +
        '<td>' + esc(s.group) + '</td>' +
        '<td>' +
          '<button onclick="Admin.editStation(' + i + ')">✏</button>' +
          '<button class="del" onclick="Admin.deleteStation(' + i + ')">🗑</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function openStationForm(i) {
    document.getElementById('stationFormTitle').textContent = i >= 0 ? 'Редактировать станцию' : 'Добавить станцию';
    document.getElementById('stationIndex').value = i;
    var s = i >= 0 ? state.stations[i] : { title: '', url: '', category: '', group: '', stream: '', type: 'mp3' };
    document.getElementById('stationTitle').value    = s.title    || '';
    document.getElementById('stationUrl').value      = s.url      || '';
    document.getElementById('stationCategory').value = s.category || '';
    document.getElementById('stationGroup').value    = s.group    || '';
    document.getElementById('stationStream').value   = s.stream   || '';
    document.querySelector('input[name="stationType"][value="' + (s.type || 'mp3') + '"]').checked = true;
    document.getElementById('stationForm').classList.remove('hidden');
  }

  function saveStation() {
    var i = parseInt(document.getElementById('stationIndex').value, 10);
    var s = {
      title:    document.getElementById('stationTitle').value.trim(),
      url:      document.getElementById('stationUrl').value.trim(),
      category: document.getElementById('stationCategory').value.trim(),
      group:    document.getElementById('stationGroup').value.trim(),
      stream:   document.getElementById('stationStream').value.trim(),
      type:     document.querySelector('input[name="stationType"]:checked').value
    };
    if (!s.title || !s.url) { showStatus('Название и URL обязательны', true); return; }

    if (i >= 0) { state.stations[i] = s; } else { state.stations.push(s); }

    putFile('stations.json', state.stations, state.stationsSHA,
      'admin: ' + (i >= 0 ? 'update' : 'add') + ' station "' + s.title + '"')
      .then(function (res) {
        state.stationsSHA = res.content.sha;
        document.getElementById('stationForm').classList.add('hidden');
        renderStationsTable();
        showStatus('Сохранено');
      }).catch(function (err) { showStatus(err.message, true); });
  }

  function deleteStation(i) {
    if (!confirm('Удалить «' + state.stations[i].title + '»?')) return;
    var name = state.stations[i].title;
    state.stations.splice(i, 1);
    putFile('stations.json', state.stations, state.stationsSHA,
      'admin: delete station "' + name + '"')
      .then(function (res) {
        state.stationsSHA = res.content.sha;
        renderStationsTable();
        showStatus('Удалено');
      }).catch(function (err) { showStatus(err.message, true); });
  }

  // ── Playlists ─────────────────────────────────────────────────────────────────

  function loadPlaylist() {
    getFile('PlayList/playlist.json').then(function (data) {
      state.playlist = decodeFile(data.content);
      state.playlistSHA = data.sha;
      renderCategories();
    }).catch(function (err) { showStatus(err.message, true); });
  }

  function getCategories() {
    var seen = {}, cats = [];
    state.playlist.forEach(function (t) {
      if (!seen[t.category]) { seen[t.category] = true; cats.push(t.category); }
    });
    return cats;
  }

  function renderCategories() {
    var cats = getCategories();
    var sel = document.getElementById('categorySelect');
    var prev = sel.value;
    sel.innerHTML = '';
    cats.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
    if (prev && cats.indexOf(prev) >= 0) sel.value = prev;
    renderTracksTable();
  }

  function renderTracksTable() {
    var cat = document.getElementById('categorySelect').value;
    document.getElementById('trackListTitle').textContent = 'Треки в «' + cat + '»';
    var tbody = document.querySelector('#tracksTable tbody');
    tbody.innerHTML = '';
    state.playlist.forEach(function (t, globalIdx) {
      if (t.category !== cat) return;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(t.title) + '</td>' +
        '<td class="url-cell">' + esc(t.url) + '</td>' +
        '<td>' +
          '<button onclick="Admin.editTrack(' + globalIdx + ')">✏</button>' +
          '<button class="del" onclick="Admin.deleteTrack(' + globalIdx + ')">🗑</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function openTrackForm(i) {
    document.getElementById('trackFormTitle').textContent = i >= 0 ? 'Редактировать трек' : 'Добавить трек';
    document.getElementById('trackIndex').value = i;
    var t = i >= 0 ? state.playlist[i] : { title: '', url: '' };
    document.getElementById('trackTitle').value = t.title || '';
    document.getElementById('trackUrl').value   = t.url   || '';
    document.getElementById('trackForm').classList.remove('hidden');
  }

  function saveTrack() {
    var i   = parseInt(document.getElementById('trackIndex').value, 10);
    var cat = document.getElementById('categorySelect').value;
    var t   = {
      title:    document.getElementById('trackTitle').value.trim(),
      url:      document.getElementById('trackUrl').value.trim(),
      category: cat
    };
    if (!t.title || !t.url) { showStatus('Название и URL обязательны', true); return; }

    if (i >= 0) { state.playlist[i] = t; } else { state.playlist.push(t); }

    putFile('PlayList/playlist.json', state.playlist, state.playlistSHA,
      'admin: ' + (i >= 0 ? 'update' : 'add') + ' track "' + t.title + '" in ' + cat)
      .then(function (res) {
        state.playlistSHA = res.content.sha;
        document.getElementById('trackForm').classList.add('hidden');
        renderTracksTable();
        showStatus('Сохранено');
      }).catch(function (err) { showStatus(err.message, true); });
  }

  function deleteTrack(i) {
    if (!confirm('Удалить «' + state.playlist[i].title + '»?')) return;
    var name = state.playlist[i].title;
    state.playlist.splice(i, 1);
    putFile('PlayList/playlist.json', state.playlist, state.playlistSHA,
      'admin: delete track "' + name + '"')
      .then(function (res) {
        state.playlistSHA = res.content.sha;
        renderTracksTable();
        renderCategories();
        showStatus('Удалено');
      }).catch(function (err) { showStatus(err.message, true); });
  }

  function addCategory() {
    var name = document.getElementById('newCategoryInput').value.trim();
    if (!name) return;
    var sel = document.getElementById('categorySelect');
    var exists = Array.from(sel.options).some(function (o) { return o.value === name; });
    if (!exists) {
      var opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      sel.appendChild(opt);
    }
    sel.value = name;
    document.getElementById('newCategoryInput').value = '';
    document.getElementById('newCategoryInput').classList.add('hidden');
    document.getElementById('saveCategoryBtn').classList.add('hidden');
    renderTracksTable();
    showStatus('Категория готова — добавьте первый трек');
    openTrackForm(-1);
  }

  function deleteCategory() {
    var cat = document.getElementById('categorySelect').value;
    if (!cat) return;
    var count = state.playlist.filter(function (t) { return t.category === cat; }).length;
    if (!confirm('Удалить категорию «' + cat + '» и все треки (' + count + ')?')) return;
    state.playlist = state.playlist.filter(function (t) { return t.category !== cat; });
    putFile('PlayList/playlist.json', state.playlist, state.playlistSHA,
      'admin: delete category "' + cat + '"')
      .then(function (res) {
        state.playlistSHA = res.content.sha;
        renderCategories();
        showStatus('Категория удалена');
      }).catch(function (err) { showStatus(err.message, true); });
  }

  // ── Public (called from onclick in rendered HTML) ─────────────────────────────

  window.Admin = {
    editStation:  function (i) { openStationForm(i); },
    deleteStation: function (i) { deleteStation(i); },
    editTrack:    function (i) { openTrackForm(i); },
    deleteTrack:  function (i) { deleteTrack(i); }
  };

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    state.pat   = localStorage.getItem('admin_pat')   || '';
    state.owner = localStorage.getItem('admin_owner') || '';
    state.repo  = localStorage.getItem('admin_repo')  || '';

    if (state.pat && state.owner && state.repo) {
      document.getElementById('pat').value   = state.pat;
      document.getElementById('owner').value = state.owner;
      document.getElementById('repo').value  = state.repo;
      enterAdmin();
    }

    document.getElementById('loginBtn').addEventListener('click', tryLogin);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('tabStations').addEventListener('click', function () { switchTab('stations'); });
    document.getElementById('tabPlaylists').addEventListener('click', function () { switchTab('playlists'); });

    document.getElementById('addStationBtn').addEventListener('click', function () { openStationForm(-1); });
    document.getElementById('saveStationBtn').addEventListener('click', saveStation);
    document.getElementById('cancelStationBtn').addEventListener('click', function () {
      document.getElementById('stationForm').classList.add('hidden');
    });

    document.getElementById('categorySelect').addEventListener('change', renderTracksTable);
    document.getElementById('addCategoryBtn').addEventListener('click', function () {
      document.getElementById('newCategoryInput').classList.remove('hidden');
      document.getElementById('saveCategoryBtn').classList.remove('hidden');
    });
    document.getElementById('saveCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('deleteCategoryBtn').addEventListener('click', deleteCategory);
    document.getElementById('addTrackBtn').addEventListener('click', function () { openTrackForm(-1); });
    document.getElementById('saveTrackBtn').addEventListener('click', saveTrack);
    document.getElementById('cancelTrackBtn').addEventListener('click', function () {
      document.getElementById('trackForm').classList.add('hidden');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
```

- [ ] **Step 2: Verify auth flow**

Open `admin.html` via local server.
1. Enter valid GitHub PAT + owner + repo → click Войти
2. Verify: login form hides, tab UI appears, stations table loads
3. Console: no errors
4. Click Выход → login form reappears

- [ ] **Step 3: Verify stations CRUD**

1. Table shows all 17 stations
2. Click ✏ on a station → form pre-fills correctly
3. Change the title → Сохранить → table updates, green status shows
4. Click `[ + Добавить ]` → fill all fields → Сохранить → new row appears
5. Click 🗑 → confirm → row removed
6. Open GitHub repo → `stations.json` → verify commit was created with message `admin: add station "…"`

- [ ] **Step 4: Verify playlists CRUD**

1. Click `[ Плейлисты ]` tab
2. Category dropdown populates from `playlist.json`
3. Select a category → tracks appear in table
4. Click `[ + Трек ]` → fill title + URL → Сохранить → track appears
5. Click ✏ on a track → edit → Сохранить → track updates
6. Click 🗑 → track removed
7. Click `[ + Новая ]` → enter name → OK → add-track form auto-opens → save first track
8. Select any category → `[ Удалить категорию ]` → confirm → category gone
9. Verify `PlayList/playlist.json` commits in GitHub

- [ ] **Step 5: Commit**

```bash
git add js/admin.js
git commit -m "feat: admin.js — full auth, stations CRUD, playlists CRUD"
```

---

## Self-review

**Spec coverage:**
- ✅ GitHub API + PAT auth → Task 4 (`tryLogin`, `getFile`, `putFile`)
- ✅ Separate `admin.html` page → Task 3
- ✅ PAT/owner/repo in `localStorage` → Task 4 (`init`, `tryLogin`, `logout`)
- ✅ Two-tab layout → Task 3 (HTML) + Task 4 (`switchTab`)
- ✅ Full CRUD for stations → Task 4 (`openStationForm`, `saveStation`, `deleteStation`)
- ✅ `stations.json` schema (title, url, category, group, stream, type) → Task 1
- ✅ Full CRUD for playlist tracks → Task 4 (`openTrackForm`, `saveTrack`, `deleteTrack`)
- ✅ Category management → Task 4 (`addCategory`, `deleteCategory`)
- ✅ GitHub API save flow (GET SHA → mutate → PUT) → Task 4 (`putFile`, all save functions)
- ✅ Commit message format → embedded in every `putFile` call
- ✅ `main.js` loads stations dynamically → Task 2 (`fetchAndRenderStations`, `renderStations`)
- ✅ `.hitfm` class applied to groups with tavrmedia stations → Task 2 (`renderStations`)

**Type consistency:**
- `state.stations[i]` — `{ title, url, category, group, stream, type }` — consistent across `renderStationsTable`, `openStationForm`, `saveStation`, `deleteStation`
- `state.playlist[i]` — `{ title, url, category }` — consistent across `renderTracksTable`, `openTrackForm`, `saveTrack`, `deleteTrack`
- `state.stationsSHA` / `state.playlistSHA` — updated from `res.content.sha` after every `putFile` — consistent
- `window.Admin.editStation(i)` → `openStationForm(i)` — matches `onclick` in `renderStationsTable`
- `window.Admin.deleteStation(i)` → `deleteStation(i)` — matches `onclick` in `renderStationsTable`
- `window.Admin.editTrack(i)` → `openTrackForm(i)` — matches `onclick` in `renderTracksTable`
- `window.Admin.deleteTrack(i)` → `deleteTrack(i)` — matches `onclick` in `renderTracksTable`
