# Player Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить сохранение темы, динамические категории и плейлисты, управление ими в админке, и приватные плейлисты защищённые GitHub PAT.

**Architecture:** Статический GitHub Pages сайт. Данные в JSON-файлах в репозитории. Управление через GitHub Contents API из admin.html. Приватные плейлисты в отдельном приватном репо, доступны только с действующим PAT.

**Tech Stack:** jQuery 3.6, hls.js, GitHub Contents API, localStorage, btoa/atob UTF-8 base64.

---

## Файловая структура

| Файл | Действие | Ответственность |
|------|----------|-----------------|
| `categories.json` | СОЗДАТЬ | Список фильтр-категорий с порядком |
| `config.json` | СОЗДАТЬ через админку | owner + private_repo для приватных плейлистов |
| `index.html` | ИЗМЕНИТЬ | localStorage темы, кнопка 🔒, модал, очистить хардкод |
| `js/main.js` | ИЗМЕНИТЬ | fetchAndRenderCategories, fetchAndRenderPlaylists, private auth |
| `admin.html` | ИЗМЕНИТЬ | Табы Категории + Настройки, datalist для категорий |
| `js/admin.js` | ИЗМЕНИТЬ | loadCategories, saveCategories, moveCat, loadSettings, saveSettings |
| `css/style.css` | ИЗМЕНИТЬ | Стили модала и #privateBtn |
| `css/white.css` | ИЗМЕНИТЬ | Стили модала и #privateBtn |
| `css/gruvbox.css` | ИЗМЕНИТЬ | Стили модала и #privateBtn |
| `css/amber.css` | ИЗМЕНИТЬ | Стили модала и #privateBtn |
| `css/responsive.css` | ИЗМЕНИТЬ | Структурные стили модала |

---

## Task 1: Theme persistence via localStorage

**Files:**
- Modify: `index.html` (script-блок внизу, строки 112–131)

- [ ] **Step 1: Найти и заменить IIFE переключателя темы**

Открой `index.html`. Найди блок `<script>` после `</body>`. Замени IIFE переключателя темы (строки со `switchThemeBtn` по `})();`) на:

```javascript
(function() {
    var switchThemeBtn = document.getElementById('changeTheme'),
        styleTag = document.getElementById('styleSheet'),
        cssFiles = [
            "css/style.css",
            "css/white.css",
            "css/gruvbox.css",
            "css/amber.css",
        ],
        index = parseInt(localStorage.getItem('themeIndex') || '0', 10);

    styleTag.href = cssFiles[index];

    switchThemeBtn.onclick = function() {
        index = index < cssFiles.length - 1 ? index + 1 : 0;
        styleTag.href = cssFiles[index];
        localStorage.setItem('themeIndex', index);
    };
})();
```

- [ ] **Step 2: Проверить в браузере**

1. Открой `index.html` (локально или на GitHub Pages)
2. Переключи тему на Gruvbox (2 клика)
3. Обнови страницу (F5)
4. Тема должна остаться Gruvbox, не сброситься на Nord

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: persist theme selection in localStorage"
```

---

## Task 2: Создать categories.json

**Files:**
- Create: `categories.json`

- [ ] **Step 1: Создать файл**

Создай `categories.json` в корне репозитория:

```json
["all", "pop", "Rok", "Relax", "LoFi"]
```

- [ ] **Step 2: Commit**

```bash
git add categories.json
git commit -m "feat: add categories.json for dynamic filter"
```

---

## Task 3: Динамический фильтр категорий в main.js

**Files:**
- Modify: `js/main.js` (добавить функцию после `fetchAndRenderStations`, вызвать в ready)
- Modify: `index.html` (очистить `<ul>` в `.category-selector`)

- [ ] **Step 1: Очистить хардкодные категории в index.html**

Найди в `index.html` блок `.category-selector`. Замени его содержимое:

```html
<div class="category-selector">
    <h2>Select a category:</h2>
    <ul>
    </ul>
</div>
```

(Убрать все `<li>` внутри `<ul>` — они будут рендериться из `categories.json`)

- [ ] **Step 2: Добавить fetchAndRenderCategories() в main.js**

После функции `renderStations` (строка ~97) добавь:

```javascript
function fetchAndRenderCategories() {
  fetch('categories.json')
    .then(function(r) {
      if (!r.ok) throw new Error('categories.json not found');
      return r.json();
    })
    .then(function(categories) {
      var $ul = $('.category-selector ul');
      $ul.empty();
      categories.forEach(function(cat) {
        var label = cat === 'all' ? 'All' : cat;
        var $a = $('<a>').attr('href', '#').attr('data-category', cat).text(label);
        if (cat === 'all') $a.addClass('active');
        $('<li>').append($a).appendTo($ul);
      });
    })
    .catch(function(err) {
      console.error('Could not load categories:', err);
    });
}
```

- [ ] **Step 3: Вызвать в $(document).ready()**

Найди в `main.js` строку `fetchAndRenderStations();` внутри `$(document).ready(function () {`. Добавь после неё:

```javascript
fetchAndRenderCategories();
```

- [ ] **Step 4: Проверить в браузере**

1. Открой страницу
2. В левой панели должны появиться: All, pop, Rok, Relax, LoFi
3. Клик на категорию — должна добавляться `.active` и работать фильтрация

- [ ] **Step 5: Commit**

```bash
git add js/main.js index.html
git commit -m "feat: render category filter dynamically from categories.json"
```

---

## Task 4: Динамический рендер публичных плейлистов

**Files:**
- Modify: `js/main.js` (добавить fetchAndRenderPlaylists)
- Modify: `index.html` (удалить хардкодные .custom-playlist div-ы)

- [ ] **Step 1: Удалить хардкодные плейлисты из index.html**

Найди в `index.html` блок `<div class="playList-container">`. Внутри него удали оба `<div>` с классом `custom-playlist`:

```html
<!-- УДАЛИТЬ ЭТИ ДВА БЛОКА: -->
<div id="TrackList" class="playlist custom-playlist" >...</div>
<div class="playlist custom-playlist" >...</div>
```

`<div class="playList-container">` должен остаться пустым (без дочерних элементов).

- [ ] **Step 2: Добавить fetchAndRenderPlaylists() в main.js**

После `fetchAndRenderCategories` добавь:

```javascript
function fetchAndRenderPlaylists() {
  fetch('PlayList/playlist.json')
    .then(function(r) {
      if (!r.ok) throw new Error('playlist.json not found');
      return r.json();
    })
    .then(function(tracks) {
      var $container = $('.playList-container');
      $container.find('.custom-playlist').remove();

      var groupNames = [];
      var groups = {};
      tracks.forEach(function(track) {
        var g = track.category || 'My Playlist';
        if (!groups[g]) { groups[g] = []; groupNames.push(g); }
        groups[g].push(track);
      });

      groupNames.forEach(function(groupName) {
        var $div = $('<div>').addClass('playlist custom-playlist');
        $('<h2>').addClass('playlist-title').text(groupName).appendTo($div);
        var $ul = $('<ul>').addClass('station-list').appendTo($div);

        groups[groupName].forEach(function(track) {
          var $a = $('<a>')
            .attr('href', track.url)
            .attr('data-title', track.title)
            .text(track.title);
          $('<li>').append($a).appendTo($ul);
        });

        $container.append($div);
      });
    })
    .catch(function(err) {
      console.error('Could not load playlists:', err);
    });
}
```

- [ ] **Step 3: Вызвать в $(document).ready()**

После `fetchAndRenderCategories();` добавь:

```javascript
fetchAndRenderPlaylists();
```

- [ ] **Step 4: Проверить в браузере**

1. Открой страницу
2. Должны появиться плейлисты: РВВ (2 трека), Tyrok (2 трека), MyHit (1 трек)
3. Клик на трек — должен воспроизводиться в `#audioPlayer`
4. `#currentTitle` должен обновиться

- [ ] **Step 5: Commit**

```bash
git add js/main.js index.html
git commit -m "feat: render public playlists dynamically from playlist.json"
```

---

## Task 5: Админка — вкладка Категории

**Files:**
- Modify: `admin.html`
- Modify: `js/admin.js`

- [ ] **Step 1: Добавить стиль для списка категорий в admin.html**

В блоке `<style>` внутри `admin.html` добавь перед закрывающим `</style>`:

```css
#catFilterList li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid #4c566a;
  font-size: 0.85rem;
}
#catFilterList li span { flex: 1; }
#catFilterList li button {
  background: none;
  border: none;
  color: #eceff4;
  cursor: pointer;
  font-family: monospace;
  padding: 2px 6px;
}
#catFilterList li button.del:hover { color: #bf616a; }
#catFilterList li button:disabled { opacity: 0.3; cursor: default; }
#catFilterInput { display: flex; gap: 10px; margin-bottom: 10px; }
#catFilterInput input {
  padding: 6px;
  background: #3b4252;
  color: #eceff4;
  border: 1px solid #4c566a;
  font-family: monospace;
  width: 200px;
}
```

- [ ] **Step 2: Добавить кнопку вкладки Категории в admin.html**

Найди строку с `<button id="tabPlaylists">[ Плейлисты ]</button>`. После неё добавь:

```html
<button id="tabCategories">[ Категории ]</button>
```

- [ ] **Step 3: Добавить секцию Категории в admin.html**

После закрывающего `</div>` секции `sectionPlaylists` (перед `</div>` mainSection) добавь:

```html
<!-- CATEGORIES TAB -->
<div id="sectionCategories" class="hidden">
  <div class="section-header">
    <strong>Категории фильтра</strong>
    <button class="btn-add" id="addCatFilterBtn">[ + Добавить ]</button>
  </div>
  <div id="catFilterInput" class="hidden">
    <input type="text" id="newCatFilterInput" placeholder="Название категории">
    <button class="btn-add" id="saveCatFilterBtn">[ OK ]</button>
    <button id="cancelCatFilterBtn" style="background:none;border:1px solid #4c566a;color:#eceff4;padding:4px 12px;cursor:pointer;font-family:monospace;">[ Отмена ]</button>
  </div>
  <ul id="catFilterList"></ul>
</div>
```

- [ ] **Step 4: Обновить state в admin.js**

Найди объект `state` в начале `admin.js`. Замени его на:

```javascript
var state = {
  pat: '', owner: '', repo: '',
  stations: [], stationsSHA: '',
  playlist: [], playlistSHA: '',
  categories: [], categoriesSHA: '',
  config: {}, configSHA: ''
};
```

- [ ] **Step 5: Обновить switchTab() в admin.js**

Найди функцию `switchTab`. Замени её полностью на:

```javascript
function switchTab(tab) {
  ['stations', 'playlists', 'categories', 'settings'].forEach(function(t) {
    var capT = t.charAt(0).toUpperCase() + t.slice(1);
    var sec = document.getElementById('section' + capT);
    var btn = document.getElementById('tab' + capT);
    if (sec) sec.classList.toggle('hidden', tab !== t);
    if (btn) btn.classList.toggle('active', tab === t);
  });
  if (tab === 'stations')   loadStations();
  if (tab === 'playlists')  loadPlaylist();
  if (tab === 'categories') loadCategories();
  if (tab === 'settings')   loadSettings();
}
```

- [ ] **Step 6: Добавить функции управления категориями в admin.js**

После функции `deleteCategory` (строка ~334) добавь:

```javascript
// ── Filter Categories ────────────────────────────────────────────────────────

function loadCategories() {
  getFile('categories.json').then(function(data) {
    state.categories = decodeFile(data.content);
    state.categoriesSHA = data.sha;
    renderCategoryFilterList();
    updateCategoriesDatalist();
  }).catch(function(err) { showStatus(err.message, true); });
}

function renderCategoryFilterList() {
  var ul = document.getElementById('catFilterList');
  ul.innerHTML = '';
  var last = state.categories.length - 1;
  state.categories.forEach(function(cat, i) {
    var isAll = cat === 'all';
    var li = document.createElement('li');
    li.innerHTML =
      '<span>' + esc(cat) + '</span>' +
      '<button onclick="Admin.moveCat(' + i + ',-1)"' + (isAll || i <= 1 ? ' disabled' : '') + '>↑</button>' +
      '<button onclick="Admin.moveCat(' + i + ',1)"'  + (isAll || i === last ? ' disabled' : '') + '>↓</button>' +
      '<button class="del" onclick="Admin.deleteCat(' + i + ')"' + (isAll ? ' disabled' : '') + '>🗑</button>';
    ul.appendChild(li);
  });
}

function saveCategoriesFile(msg) {
  putFile('categories.json', state.categories, state.categoriesSHA, msg)
    .then(function(res) {
      state.categoriesSHA = res.content.sha;
      renderCategoryFilterList();
      updateCategoriesDatalist();
      showStatus('Сохранено');
    }).catch(function(err) { showStatus(err.message, true); });
}

function addCategoryFilter() {
  var name = document.getElementById('newCatFilterInput').value.trim();
  if (!name) return;
  if (state.categories.indexOf(name) >= 0) { showStatus('Уже существует', true); return; }
  var updated = state.categories.slice();
  updated.push(name);
  state.categories = updated;
  document.getElementById('newCatFilterInput').value = '';
  document.getElementById('catFilterInput').classList.add('hidden');
  saveCategoriesFile('admin: add category "' + name + '"');
}

function deleteCategoryFilter(i) {
  var cat = state.categories[i];
  if (cat === 'all') return;
  if (!confirm('Удалить «' + cat + '»? Станции с этой категорией останутся.')) return;
  var updated = state.categories.slice();
  updated.splice(i, 1);
  state.categories = updated;
  saveCategoriesFile('admin: delete category "' + cat + '"');
}

function moveCategoryFilter(i, dir) {
  var cats = state.categories.slice();
  var j = i + dir;
  if (j < 1 || j >= cats.length) return;
  var tmp = cats[i]; cats[i] = cats[j]; cats[j] = tmp;
  state.categories = cats;
  saveCategoriesFile('admin: reorder categories');
}

function updateCategoriesDatalist() {
  var dl = document.getElementById('categoriesList');
  if (!dl) return;
  dl.innerHTML = '';
  state.categories.forEach(function(cat) {
    if (cat === 'all') return;
    var opt = document.createElement('option');
    opt.value = cat;
    dl.appendChild(opt);
  });
}
```

- [ ] **Step 7: Обновить window.Admin и init() в admin.js**

Найди `window.Admin = { ... }`. Замени на:

```javascript
window.Admin = {
  editStation:   function(i) { openStationForm(i); },
  deleteStation: function(i) { deleteStation(i); },
  editTrack:     function(i) { openTrackForm(i); },
  deleteTrack:   function(i) { deleteTrack(i); },
  moveCat:       function(i, dir) { moveCategoryFilter(i, dir); },
  deleteCat:     function(i) { deleteCategoryFilter(i); }
};
```

Найди в `init()` строку:
```javascript
document.getElementById('tabPlaylists').addEventListener('click', function () { switchTab('playlists'); });
```

После неё добавь:
```javascript
document.getElementById('tabCategories').addEventListener('click', function () { switchTab('categories'); });

document.getElementById('addCatFilterBtn').addEventListener('click', function () {
  document.getElementById('catFilterInput').classList.remove('hidden');
  document.getElementById('newCatFilterInput').focus();
});
document.getElementById('saveCatFilterBtn').addEventListener('click', addCategoryFilter);
document.getElementById('cancelCatFilterBtn').addEventListener('click', function () {
  document.getElementById('catFilterInput').classList.add('hidden');
  document.getElementById('newCatFilterInput').value = '';
});
```

- [ ] **Step 8: Проверить в браузере**

1. Открой `admin.html`, войди
2. Нажми вкладку `[ Категории ]`
3. Должны загрузиться: all, pop, Rok, Relax, LoFi
4. Добавь новую категорию "Jazz" — должна появиться в списке
5. Перемести её стрелками ↑↓ — порядок должен меняться и сохраняться
6. Удали "Jazz" — должна исчезнуть

- [ ] **Step 9: Commit**

```bash
git add admin.html js/admin.js
git commit -m "feat: admin categories tab with add/delete/reorder"
```

---

## Task 6: Админка — вкладка Настройки + datalist

**Files:**
- Modify: `admin.html`
- Modify: `js/admin.js`

- [ ] **Step 1: Добавить datalist к полю Категория в форме станции**

В `admin.html` найди:
```html
<div class="form-group"><label>Категория</label><input type="text" id="stationCategory" placeholder="pop, Rok, Relax…"></div>
```

Замени на:
```html
<div class="form-group">
  <label>Категория</label>
  <input type="text" id="stationCategory" placeholder="pop, Rok, Relax…" list="categoriesList">
  <datalist id="categoriesList"></datalist>
</div>
```

- [ ] **Step 2: Добавить кнопку вкладки Настройки**

В `admin.html` после `<button id="tabCategories">[ Категории ]</button>` добавь:

```html
<button id="tabSettings">[ Настройки ]</button>
```

- [ ] **Step 3: Добавить секцию Настройки**

После секции `sectionCategories` добавь:

```html
<!-- SETTINGS TAB -->
<div id="sectionSettings" class="hidden">
  <h3 style="margin-bottom:16px;color:#88c0d0;">Приватные плейлисты</h3>
  <div class="form-group">
    <label>GitHub Owner (username)</label>
    <input type="text" id="privateOwnerInput" placeholder="ProProfit">
  </div>
  <div class="form-group">
    <label>Приватный репозиторий (имя)</label>
    <input type="text" id="privateRepoInput" placeholder="RaqdioON-private">
  </div>
  <div class="form-actions">
    <button id="saveSettingsBtn" class="primary">[ Сохранить ]</button>
  </div>
</div>
```

- [ ] **Step 4: Добавить функции настроек в admin.js**

После `updateCategoriesDatalist` добавь:

```javascript
// ── Settings ─────────────────────────────────────────────────────────────────

function loadSettings() {
  getFile('config.json').then(function(data) {
    state.config = decodeFile(data.content);
    state.configSHA = data.sha;
    document.getElementById('privateOwnerInput').value = state.config.owner || '';
    document.getElementById('privateRepoInput').value  = state.config.private_repo || '';
  }).catch(function() {
    state.config = {};
    state.configSHA = '';
  });
}

function saveSettings() {
  var updated = {
    owner:        document.getElementById('privateOwnerInput').value.trim(),
    private_repo: document.getElementById('privateRepoInput').value.trim()
  };
  var body = {
    message: 'admin: update config',
    content: btoa(unescape(encodeURIComponent(JSON.stringify(updated, null, 2))))
  };
  if (state.configSHA) body.sha = state.configSHA;

  fetch('https://api.github.com/repos/' + state.owner + '/' + state.repo + '/contents/config.json', {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify(body)
  }).then(function(r) {
    if (!r.ok) return r.json().then(function(e) { throw new Error(e.message || 'PUT failed'); });
    return r.json();
  }).then(function(res) {
    state.config = updated;
    state.configSHA = res.content.sha;
    showStatus('Настройки сохранены');
  }).catch(function(err) { showStatus(err.message, true); });
}
```

- [ ] **Step 5: Добавить listener для вкладки Настройки в init()**

После listener для `tabCategories` добавь:

```javascript
document.getElementById('tabSettings').addEventListener('click', function () { switchTab('settings'); });
document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
```

- [ ] **Step 6: Проверить в браузере**

1. Нажми вкладку `[ Настройки ]`
2. Заполни owner (например `ProProfit`) и repo (например `RaqdioON-private`)
3. Нажми `[ Сохранить ]` — должно показать "Настройки сохранены"
4. Обнови страницу, войди снова, открой Настройки — поля должны заполниться автоматически
5. При добавлении/редактировании станции поле Категория должно показывать выпадающий список существующих категорий

- [ ] **Step 7: Commit**

```bash
git add admin.html js/admin.js
git commit -m "feat: admin settings tab for private repo config + category datalist"
```

---

## Task 7: Приватные плейлисты на главной странице

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `css/responsive.css`
- Modify: `css/style.css`
- Modify: `css/white.css`
- Modify: `css/gruvbox.css`
- Modify: `css/amber.css`

- [ ] **Step 1: Добавить кнопку 🔒 в шапку index.html**

Найди в `index.html`:
```html
<li><div>	<button id="sleepTimerBtn" title="Set Sleep Timer"><i class="fi fi-rr-moon-stars"></i></button></div></li>
```

После этой строки добавь:
```html
<li><div><button id="privateBtn" title="Private playlists" class="hidden">🔒</button></div></li>
```

- [ ] **Step 2: Добавить модал авторизации в index.html**

Перед закрывающим `</body>` добавь:

```html
<div id="privateModal" class="hidden">
  <div id="privateModalInner">
    <h3>Private Playlists</h3>
    <div id="privateLoginForm">
      <input type="password" id="privatePat" placeholder="GitHub PAT (ghp_…)">
      <div class="modal-actions">
        <button id="privateLoginBtn">[ Войти ]</button>
      </div>
    </div>
    <div class="modal-actions hidden" id="privateLogoutRow">
      <button id="privateLogoutBtn">[ Выйти ]</button>
    </div>
    <div class="modal-actions" style="margin-top:10px;">
      <button id="privateCloseBtn">[ Закрыть ]</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Добавить структурные стили модала в responsive.css**

В конец `css/responsive.css` добавь:

```css
/* Utility — нужен для #privateBtn и #privateModal */
.hidden { display: none !important; }

#privateModal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
#privateModalInner {
  padding: 30px;
  min-width: 300px;
  border: 1px solid;
}
#privateModalInner h3 { margin-bottom: 16px; font-size: 1rem; }
#privatePat {
  width: 100%;
  padding: 6px;
  font-family: "Iosevka Web", monospace;
  font-size: 0.9rem;
  margin-bottom: 12px;
  display: block;
}
.modal-actions { display: flex; gap: 10px; margin-top: 8px; }
.modal-actions button {
  background: none;
  cursor: pointer;
  padding: 6px 14px;
  font-family: "Iosevka Web", monospace;
  font-size: 0.85rem;
}
#privateBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0;
  line-height: 1;
  opacity: 0.75;
}
#privateBtn:hover { opacity: 1; }
```

- [ ] **Step 4: Добавить цветовые стили модала в css/style.css**

В конец `css/style.css` добавь:

```css
#privateModalInner {
  background: #2e3440;
  border-color: #4c566a;
}
#privatePat {
  background: #3b4252;
  color: #eceff4;
  border: 1px solid #4c566a;
}
.modal-actions button {
  border: 1px solid #4c566a;
  color: #eceff4;
}
.modal-actions button:hover { border-color: #eceff4; }
```

- [ ] **Step 5: Добавить цветовые стили модала в css/white.css**

В конец `css/white.css` добавь:

```css
#privateModalInner {
  background: #eceff4;
  border-color: #4c566a;
}
#privatePat {
  background: #ffffff;
  color: #2e3440;
  border: 1px solid #4c566a;
}
.modal-actions button {
  border: 1px solid #4c566a;
  color: #2e3440;
}
.modal-actions button:hover { border-color: #2e3440; }
```

- [ ] **Step 6: Добавить цветовые стили модала в css/gruvbox.css**

В конец `css/gruvbox.css` добавь:

```css
#privateModalInner {
  background: #282828;
  border-color: #504945;
}
#privatePat {
  background: #3c3836;
  color: #ebdbb2;
  border: 1px solid #504945;
}
.modal-actions button {
  border: 1px solid #504945;
  color: #ebdbb2;
}
.modal-actions button:hover { border-color: #d79921; color: #fabd2f; }
```

- [ ] **Step 7: Добавить цветовые стили модала в css/amber.css**

В конец `css/amber.css` добавь:

```css
#privateModalInner {
  background: #0a0a0a;
  border-color: #cc8800;
}
#privatePat {
  background: #1a1400;
  color: #ffb000;
  border: 1px solid #cc8800;
}
.modal-actions button {
  border: 1px solid #cc8800;
  color: #ffb000;
}
.modal-actions button:hover { border-color: #ffb000; color: #ffe066; }
```

- [ ] **Step 8: Добавить функции приватных плейлистов в main.js**

После `fetchAndRenderPlaylists` добавь:

```javascript
function renderPrivatePlaylists(tracks) {
  var $container = $('.playList-container');
  $container.find('.private-playlist').remove();

  var groupNames = [];
  var groups = {};
  tracks.forEach(function(track) {
    var g = track.category || 'Private';
    if (!groups[g]) { groups[g] = []; groupNames.push(g); }
    groups[g].push(track);
  });

  groupNames.forEach(function(groupName) {
    var $div = $('<div>').addClass('playlist custom-playlist private-playlist');
    $('<h2>').addClass('playlist-title').text('🔒 ' + groupName).appendTo($div);
    var $ul = $('<ul>').addClass('station-list').appendTo($div);

    groups[groupName].forEach(function(track) {
      var $a = $('<a>')
        .attr('href', track.url)
        .attr('data-title', track.title)
        .text(track.title);
      $('<li>').append($a).appendTo($ul);
    });

    $container.append($div);
  });
}

function fetchAndRenderPrivatePlaylists(pat) {
  fetch('config.json')
    .then(function(r) {
      if (!r.ok) throw new Error('config.json not found');
      return r.json();
    })
    .then(function(config) {
      if (!config.owner || !config.private_repo) throw new Error('Private repo not configured in admin settings');
      return fetch(
        'https://api.github.com/repos/' + config.owner + '/' + config.private_repo + '/contents/playlist-private.json',
        { headers: { 'Authorization': 'token ' + pat, 'Accept': 'application/vnd.github.v3+json' } }
      );
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Access denied or playlist-private.json not found');
      return r.json();
    })
    .then(function(data) {
      var tracks = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
      renderPrivatePlaylists(tracks);
      document.getElementById('privateBtn').classList.add('hidden');
    })
    .catch(function(err) {
      console.error('Private playlists:', err.message);
      document.getElementById('privateBtn').classList.remove('hidden');
    });
}

function initPrivateAuth() {
  var pat = localStorage.getItem('admin_pat');

  var $btn    = $('#privateBtn');
  var $modal  = $('#privateModal');
  var $loginForm  = $('#privateLoginForm');
  var $logoutRow  = $('#privateLogoutRow');

  function updateModalState() {
    var hasPat = !!localStorage.getItem('admin_pat');
    // Используем CSS классы, не jQuery show/hide, чтобы сохранить display:flex
    $loginForm.toggleClass('hidden', hasPat);
    $logoutRow.toggleClass('hidden', !hasPat);
  }

  if (pat) {
    fetchAndRenderPrivatePlaylists(pat);
  } else {
    $btn.removeClass('hidden');
  }

  $btn.on('click', function() {
    updateModalState();
    $modal.removeClass('hidden');
  });

  $('#privateLoginBtn').on('click', function() {
    var newPat = $('#privatePat').val().trim();
    if (!newPat) return;
    localStorage.setItem('admin_pat', newPat);
    $modal.addClass('hidden');
    $('#privatePat').val('');
    fetchAndRenderPrivatePlaylists(newPat);
  });

  $('#privateLogoutBtn').on('click', function() {
    localStorage.removeItem('admin_pat');
    localStorage.removeItem('admin_owner');
    $('.private-playlist').remove();
    $btn.removeClass('hidden');
    $modal.addClass('hidden');
  });

  // Закрыть по кнопке или клику на фон (не на содержимое)
  $('#privateCloseBtn').on('click', function() { $modal.addClass('hidden'); });
  $modal.on('click', function(e) {
    if (e.target === this) $modal.addClass('hidden');
  });
}
```

- [ ] **Step 9: Вызвать initPrivateAuth() в $(document).ready()**

После `fetchAndRenderPlaylists();` добавь:

```javascript
initPrivateAuth();
```

- [ ] **Step 10: Создать playlist-private.json в приватном репозитории**

В приватном репо (`RaqdioON-private`) создай файл `playlist-private.json` в корне:

```json
[
  { "title": "My Private Track", "url": "https://example.com/track.mp3", "category": "Private Mix" }
]
```

(Замени на реальный трек)

- [ ] **Step 11: Настроить в админке**

1. Открой `admin.html`, войди
2. Нажми `[ Настройки ]`
3. Заполни Owner и Private Repo
4. Нажми `[ Сохранить ]`

- [ ] **Step 12: Проверить в браузере**

**Сценарий A — нет PAT:**
1. Открой в режиме инкогнито (без localStorage)
2. Должна быть кнопка 🔒 в шапке
3. Клик → модал с полем PAT
4. Введи правильный PAT → приватные плейлисты появляются с префиксом 🔒
5. Кнопка 🔒 скрывается

**Сценарий B — PAT уже есть:**
1. Открой обычную вкладку (PAT сохранён после Task 5–6)
2. Приватные плейлисты должны загрузиться автоматически
3. Кнопка 🔒 не видна

**Сценарий C — выйти:**
1. Нажми 🔒 (если видна) или зайди через кнопку
2. Нажми `[ Выйти ]`
3. Приватные плейлисты исчезают
4. Кнопка 🔒 снова видна

- [ ] **Step 13: Commit**

```bash
git add index.html js/main.js css/responsive.css css/style.css css/white.css css/gruvbox.css css/amber.css
git commit -m "feat: private playlists with GitHub PAT auth and lock modal"
```

---

## Task 8: Push и финальная проверка

- [ ] **Step 1: Push на GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Подождать 1-3 минуты и проверить на GitHub Pages**

- [ ] **Step 3: Финальный чеклист**

- [ ] Тема сохраняется после перезагрузки
- [ ] Категории из `categories.json` рендерятся динамически
- [ ] Плейлисты из `PlayList/playlist.json` рендерятся динамически
- [ ] В админке вкладка Категории: add/delete/reorder работает
- [ ] В админке поле Категория в форме станции показывает datalist
- [ ] В админке вкладка Настройки: сохраняет `config.json`
- [ ] На главной: кнопка 🔒 видна без PAT, скрыта с PAT
- [ ] Приватные плейлисты загружаются с правильным PAT
- [ ] `[ Выйти ]` очищает PAT и скрывает приватные плейлисты
