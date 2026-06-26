# Универсальный Now Playing

**Дата:** 2026-06-19  
**Статус:** Одобрен

## Проблема

Два раздельных механизма получения текущего трека:
- `stream` — ключ Tavr API (`"hit"`, `"roks"`), код достраивает `https://o.tavr.media/{key}`
- `nowplaying_url` — полный URL для всех остальных (SomaFM и т.д.)

При добавлении новой станции нужно выбирать правильное поле. При ошибке (как произошло с SomaFM) — поток не играет и Now Playing выдаёт ошибку.

## Решение

Единственное поле `nowplaying_url` с полным URL для всех станций.  
Поле `stream` удаляется. Единственная функция получения трека — `fetchNowPlaying(url)`.

## Изменения

### `stations.json`

- Удалить поле `stream` у всех станций
- Tavr-станции: `stream: "hit"` → `nowplaying_url: "https://o.tavr.media/hit"`
- Станции без now-playing: просто удалить `stream: ""`
- SomaFM: уже имеет `nowplaying_url`, удалить `stream: ""`

Список Tavr-маппингов (ключ → полный URL):

| Ключ | URL |
|------|-----|
| hit | https://o.tavr.media/hit |
| roks | https://o.tavr.media/roks |
| kiss | https://o.tavr.media/kiss |
| relax | https://o.tavr.media/relax |
| radio3gold | https://o.tavr.media/radio3gold |
| guliay | https://o.tavr.media/guliay |
| radio3flash | https://o.tavr.media/radio3flash |
| melodia | https://o.tavr.media/melodia |
| melodiar | https://o.tavr.media/melodiar |
| bayraktar | https://o.tavr.media/bayraktar |

### `js/main.js`

- **Удалить** функцию `getRadioDataAndUpdateTitleAPI()` (строки 43–66)
- **Оставить** `fetchNowPlaying(url)` без изменений — уже парсит Tavr (`[{singer,song}]`), SomaFM (`{songs:[{artist,title}]}`), generic (`{artist,title}`)
- В `renderStations`: удалить `hasTavr`, убрать `.attr('data-stream', ...)`, упростить условие `.hitfm` до `if (hasNowPlaying)`
- В click-handler `.hitfm a`: удалить ветку `selectedStation` / `getRadioDataAndUpdateTitleAPI`, оставить только `fetchNowPlaying(nowplayingUrl)`
- В `setInterval`: то же упрощение

### `admin.html`

- Удалить строку с `id="stationStream"` (поле «data-stream (tavrmedia)»)
- Метку `stationNowplaying` изменить на: «Now Playing URL (для отображения текущего трека)»

### `admin.js`

- Удалить строку `stream: document.getElementById('stationStream').value.trim()`
- Удалить строку `document.getElementById('stationStream').value = s.stream || ''`
- В шаблоне нового объекта станции убрать поле `stream`

## Верификация

1. Открыть плеер, кликнуть на Tavr-станцию (Hit FM) — через несколько секунд в Now Playing должен появиться трек
2. Кликнуть на SomaFM — поток играет, трек отображается
3. Кликнуть на станцию без nowplaying_url (Lux FM) — Now Playing остаётся пустым / не меняется
4. Открыть админ-панель — поле «data-stream» отсутствует, только «Now Playing URL»
5. Добавить тестовую станцию через админ с nowplaying_url — сохранение работает корректно
