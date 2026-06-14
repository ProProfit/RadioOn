# Player Improvements Implementation Plan

**Goal:** Добавить сохранение темы, динамические категории и плейлисты, управление ими в админке, и приватные плейлисты с реальной защитой через GitHub PAT.

**Architecture:** Статический GitHub Pages сайт. Данные хранятся в JSON-файлах в репозитории, управляются через GitHub Contents API из админки. Приватные плейлисты — в отдельном приватном репо, доступны только с действующим PAT.

**Tech Stack:** jQuery 3.6, hls.js, GitHub Contents API, localStorage, btoa/atob UTF-8 base64.

---

## Раздел 1 — Структура данных

### `categories.json` (новый, корень публичного репо)
```json
["all", "pop", "Rok", "Relax", "LoFi"]
```
- Простой массив строк
- Порядок элементов = порядок в UI фильтра
- `"all"` всегда первый, не удаляется
- Управляется через вкладку «Категории» в админке

### `config.json` (новый, корень публичного репо)
```json
{ "private_repo": "RaqdioON-private" }
```
- Хранит имя приватного репо (не секрет — без PAT файл всё равно недоступен)
- Управляется через вкладку «Настройки» в админке

### `PlayList/playlist.json` (существующий, дополнить начальными данными)
```json
[
  { "title": "Руки Вверх", "url": "...", "category": "My PlayLists" },
  { "title": "Турк Music",  "url": "...", "category": "My PlayLists" },
  { "title": "My Best",     "url": "...", "category": "My Hits" }
]
```
- Поле `category` = название группы плейлиста, не фильтр-категория
- Управляется через вкладку «Плейлисты» в админке

### `playlist-private.json` (в приватном репо `{owner}/{private_repo}`)
```json
[
  { "title": "...", "url": "...", "category": "Private Mix" }
]
```
- Та же структура что и `PlayList/playlist.json`
- Доступен только с действующим GitHub PAT

### localStorage
- `themeIndex` — число 0–3, сохраняется при смене темы
- `admin_pat` — GitHub PAT (используется и для админки, и для приватных плейлистов)
- `admin_owner` — GitHub username
- `admin_repo` — публичное репо

---

## Раздел 2 — `main.js`

### Новые функции

**`fetchAndRenderCategories()`**
- Загружает `categories.json`
- Очищает `<ul>` в `.category-selector`
- Рендерит `<li><a href="#" data-category="...">` для каждой категории
- Первый элемент (`all`) получает класс `active`
- Graceful fallback: если файл не загрузился — фильтр остаётся пустым (не падает)

**`fetchAndRenderPlaylists()`**
- Загружает `PlayList/playlist.json`
- Удаляет все `.custom-playlist` из `.playList-container`
- Группирует треки по полю `category`
- Рендерит `<div class="playlist custom-playlist">` для каждой группы
- Graceful fallback: если файл не загрузился — плейлистов нет, ошибки нет

**`fetchAndRenderPrivatePlaylists(pat, owner)`**
- Загружает `playlist-private.json` из `{owner}/{private_repo}` через GitHub API с PAT
- Читает `config.json` чтобы узнать имя приватного репо
- Рендерит группы с префиксом `🔒` в названии
- Если PAT недействителен (401/404) — тихо игнорирует, кнопка 🔒 остаётся видна

### Вызов при старте
```javascript
$(document).ready(function () {
  fetchAndRenderStations();
  fetchAndRenderCategories();
  fetchAndRenderPlaylists();
  initPrivateAuth(); // проверяет localStorage, грузит приватные если PAT есть
});
```

### `initPrivateAuth()`
- Читает `admin_pat` + `admin_owner` из localStorage
- Если оба есть → вызывает `fetchAndRenderPrivatePlaylists()`, скрывает кнопку 🔒
- Если нет → показывает кнопку 🔒

---

## Раздел 3 — Приватные плейлисты

### Репозиторий
- Отдельный приватный GitHub репо: `{admin_owner}/{private_repo}`
- Файл: `playlist-private.json` в корне

### Кнопка 🔒 на главной странице
- Расположение: шапка рядом с `[THEME]`
- Скрыта если PAT есть в localStorage
- При клике: показывает попап с полем PAT + кнопка «Войти» + кнопка «Выйти»
- «Войти»: сохраняет PAT в `localStorage.admin_pat`, вызывает `fetchAndRenderPrivatePlaylists()`, закрывает попап, скрывает кнопку 🔒
- «Выйти»: удаляет `admin_pat`, `admin_owner` из localStorage, удаляет приватные плейлисты из DOM, показывает кнопку 🔒. Примечание: это также разлогинивает из админки (намеренно — один PAT для обоих).

### Визуальное отличие
- Заголовок группы приватного плейлиста: `🔒 {category}`
- CSS класс `private-playlist` на div для возможной стилизации

---

## Раздел 4 — Админка

### Новая вкладка «Категории»

**HTML:** новый `<div id="sectionCategories" class="hidden">` в `admin.html`
- Список `<ul id="categoryList">` — каждый элемент: `[название] [↑] [↓] [Удалить]`
- Кнопка «+ Добавить» + поле ввода + «OK»
- `"all"` отображается но кнопки ↑↓ и «Удалить» заблокированы

**JS в `admin.js`:**
- `loadCategories()` — `getFile('categories.json')` → `state.categories`, вызывает `renderCategoryList()`
- `renderCategoryList()` — рендерит `<ul>`, кнопки ↑↓ сдвигают элемент в массиве, `saveCategories()` после каждого изменения
- `saveCategories()` — `putFile('categories.json', ...)` + обновляет SHA
- `addCategory(name)` — добавляет в конец массива, `saveCategories()`
- `deleteCategory(name)` — удаляет из массива, `saveCategories()`, не трогает станции

### Новая вкладка «Настройки»

**HTML:** новый `<div id="sectionSettings" class="hidden">`
- Одно поле: `<input id="privateRepo" placeholder="RaqdioON-private">`
- Кнопка «Сохранить»

**JS в `admin.js`:**
- `loadSettings()` — `getFile('config.json')` → подставляет значение в поле
- `saveSettings()` — `putFile('config.json', { private_repo: value }, ...)`

### `<datalist>` для категорий в форме станции
- `<input id="stationCategory" list="categoriesList">`
- `<datalist id="categoriesList">` — заполняется при `loadCategories()`

---

## Раздел 5 — `index.html`

### Тема (localStorage)
```javascript
var index = parseInt(localStorage.getItem('themeIndex') || '0', 10);
styleTag.href = cssFiles[index]; // применить сразу

switchThemeBtn.onclick = function () {
  index = index < cssFiles.length - 1 ? index + 1 : 0;
  styleTag.href = cssFiles[index];
  localStorage.setItem('themeIndex', index);
};
```

### Убирается хардкод
- `<ul>` в `.category-selector` остаётся пустым (без `<li>`)
- Оба `<div class="custom-playlist">` удаляются из `.playList-container`

### Кнопка 🔒
```html
<li><div><button id="privateBtn" title="Private playlists">🔒</button></div></li>
```
В шапке рядом с `[THEME]`.

### Попап авторизации
```html
<div id="privateModal" class="hidden">
  <input type="password" id="privatePat" placeholder="GitHub PAT">
  <button id="privateLoginBtn">[ Войти ]</button>
  <button id="privateLogoutBtn">[ Выйти ]</button>
</div>
```
Стилизуется под существующую тему.
