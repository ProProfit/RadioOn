# Universal Now Playing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-field now-playing system (`stream` + `nowplaying_url`) with a single `nowplaying_url` field that holds a full URL for all stations.

**Architecture:** Tavr stations receive a full URL (`https://o.tavr.media/hit`) instead of a short key. A single `fetchNowPlaying(url)` function handles all formats. The `getRadioDataAndUpdateTitleAPI` function and the `stream` field are deleted entirely.

**Tech Stack:** Vanilla JS (ES5), jQuery, JSON config files, GitHub Pages hosting.

## Global Constraints

- No build step — all changes take effect immediately on reload
- No test framework — verification is manual in-browser
- `stations.json` is both a data file and a persisted source; admin panel reads/writes it via GitHub API

---

### Task 1: Migrate `stations.json`

**Files:**
- Modify: `stations.json`

**What changes:** Replace `stream` field with `nowplaying_url` containing a full Tavr URL for the 10 Tavr stations. Remove `stream: ""` from all other stations. SomaFM already has `nowplaying_url`, just remove its `stream: ""`.

- [ ] **Step 1: Replace the entire content of `stations.json`**

```json
[
  {
    "title": "Hit-FM",
    "url": "https://online.hitfm.ua/HitFM_HD",
    "category": "pop",
    "nowplaying_url": "https://o.tavr.media/hit",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Radio ROKS",
    "url": "https://online.radioroks.ua/RadioROKS_HD",
    "category": "Rok",
    "nowplaying_url": "https://o.tavr.media/roks",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Kiss FM",
    "url": "https://online.kissfm.ua/KissFM_HD",
    "category": "pop",
    "nowplaying_url": "https://o.tavr.media/kiss",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Relax",
    "url": "https://online.radiorelax.ua/RadioRelax_HD",
    "category": "Relax",
    "nowplaying_url": "https://o.tavr.media/relax",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Radio Gold",
    "url": "https://online.radioplayer.ua/RadioGold_HD",
    "category": "",
    "nowplaying_url": "https://o.tavr.media/radio3gold",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Guliay",
    "url": "https://online.radioplayer.ua/GuliayRadio_HD",
    "category": "",
    "nowplaying_url": "https://o.tavr.media/guliay",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Flash Radio",
    "url": "https://online.radioplayer.ua/FlashRadio_HD",
    "category": "",
    "nowplaying_url": "https://o.tavr.media/radio3flash",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Melodia FM",
    "url": "https://online.melodiafm.ua/MelodiaFM_HD",
    "category": "",
    "nowplaying_url": "https://o.tavr.media/melodia",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Melodia Romantic",
    "url": "https://online.melodiafm.ua/MelodiaFM_Romantic_HD",
    "category": "Relax",
    "nowplaying_url": "https://o.tavr.media/melodiar",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Bayraktar",
    "url": "https://tavr.tvstitch.com/RadioBayraktar_HD",
    "category": "",
    "nowplaying_url": "https://o.tavr.media/bayraktar",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Lounge FM",
    "url": "https://cast.mediaonline.net.ua/loungefm320",
    "category": "LoFi",
    "type": "mp3",
    "group": "LoFi"
  },
  {
    "title": "Lounge FM Acoustic",
    "url": "https://cast.mediaonline.net.ua/acoustic",
    "category": "LoFi",
    "type": "mp3",
    "group": "LoFi"
  },
  {
    "title": "lux fm",
    "url": "https://streamvideo.luxnet.ua/lux/smil:lux.stream.smil/chunklist.m3u8",
    "category": "test",
    "type": "hls",
    "group": "TEST m3u8"
  },
  {
    "title": "lux lviv",
    "url": "https://streamvideo.luxnet.ua/luxlviv/luxlviv.stream/playlist.m3u8",
    "category": "test",
    "type": "hls",
    "group": "TEST m3u8"
  },
  {
    "title": "Radyo Şirin",
    "url": "http://154.53.167.66:9570/stream",
    "category": "Tyrok",
    "type": "mp3",
    "group": "Radio World"
  },
  {
    "title": "Radio NOSTALGIE",
    "url": "https://icecast.luxnet.ua/nostalgie_mp3",
    "category": "pop",
    "group": "Radio",
    "type": "mp3"
  },
  {
    "title": "Шлягер FM",
    "url": "https://cast.brg.ua/shanson_main_public_mp3_hq",
    "category": "pop",
    "group": "Radio",
    "type": "mp3"
  },
  {
    "title": "DJ FM Dance",
    "url": "https://cast.brg.ua/djfmdance_main_public_mp3_hq",
    "category": "DJ",
    "group": "DJ radio",
    "type": "mp3"
  },
  {
    "title": "SomaFM",
    "url": "https://ice4.somafm.com/groovesalad-64-aac",
    "category": "Relax",
    "group": "LoFi",
    "nowplaying_url": "https://somafm.com/songs/groovesalad.json",
    "type": "mp3"
  }
]
```

- [ ] **Step 2: Verify JSON is valid**

Open `stations.json` in an editor or paste into https://jsonlint.com — expected: Valid JSON.

- [ ] **Step 3: Commit**

```bash
git add stations.json
git commit -m "refactor: migrate stations to single nowplaying_url field"
```

---

### Task 2: Simplify `js/main.js`

**Files:**
- Modify: `js/main.js`

**What changes:**
1. Delete `getRadioDataAndUpdateTitleAPI()` (lines 43–66)
2. In `renderStations`: remove `hasTavr`, `data-stream` attribute, simplify `.hitfm` condition
3. In click handler: remove `selectedStation` branch
4. In `setInterval`: same cleanup

- [ ] **Step 1: Delete `getRadioDataAndUpdateTitleAPI`**

Remove lines 43–66 entirely:
```js
// DELETE this entire function:
function getRadioDataAndUpdateTitleAPI(selectedStation) {
  const apiUrl = `https://o.tavr.media/${selectedStation}`;
  $.ajax({
    type: 'GET',
    url: apiUrl,
    async: true,
    dataType: 'json',
    success: function (response) {
      if (response && Array.isArray(response) && response.length > 0) {
        const radioData = response[0];
        const singer = radioData.singer;
        const song = radioData.song;
        const title = `${singer} - ${song}`;
        updateCurrentSong(title);
      } else {
        updateCurrentSong('No data');
      }
    },
    error: function (error) {
      console.error('An error occurred while receiving data: ', error);
      updateCurrentSong('Error while receiving data');
    }
  });
}
```

- [ ] **Step 2: Simplify `renderStations` — remove `hasTavr` and `data-stream`**

Replace the block at lines 97–113:

Old:
```js
    var hasTavr = groupStations.some(function (s) { return s.stream; });
    var hasNowPlaying = groupStations.some(function (s) { return s.nowplaying_url; });

    var $div = $('<div>').addClass('playlist');
    if (hasTavr || hasNowPlaying) $div.addClass('hitfm');
    $('<h2>').addClass('playlist-title').text(groupName).appendTo($div);
    var $ul = $('<ul>').addClass('station-list').appendTo($div);

    groupStations.forEach(function (station) {
      var $a = $('<a>')
        .attr('href', station.url)
        .attr('data-title', station.title)
        .attr('data-stream', station.stream || '')
        .attr('data-category', station.category || '')
        .text(station.title);
      if (station.nowplaying_url) $a.attr('data-nowplaying', station.nowplaying_url);
```

New:
```js
    var hasNowPlaying = groupStations.some(function (s) { return s.nowplaying_url; });

    var $div = $('<div>').addClass('playlist');
    if (hasNowPlaying) $div.addClass('hitfm');
    $('<h2>').addClass('playlist-title').text(groupName).appendTo($div);
    var $ul = $('<ul>').addClass('station-list').appendTo($div);

    groupStations.forEach(function (station) {
      var $a = $('<a>')
        .attr('href', station.url)
        .attr('data-title', station.title)
        .attr('data-category', station.category || '')
        .text(station.title);
      if (station.nowplaying_url) $a.attr('data-nowplaying', station.nowplaying_url);
```

- [ ] **Step 3: Simplify click handler — remove `selectedStation` branch**

Old (lines 320–330):
```js
  $(document).on('click', '.hitfm a', function () {
    var selectedStation = $(this).data('stream');
    var nowplayingUrl = $(this).data('nowplaying');
    $('.hitfm a').removeClass('active');
    $(this).addClass('active');
    if (selectedStation) {
      getRadioDataAndUpdateTitleAPI(selectedStation);
    } else if (nowplayingUrl) {
      fetchNowPlaying(nowplayingUrl);
    }
  });
```

New:
```js
  $(document).on('click', '.hitfm a', function () {
    var nowplayingUrl = $(this).data('nowplaying');
    $('.hitfm a').removeClass('active');
    $(this).addClass('active');
    if (nowplayingUrl) {
      fetchNowPlaying(nowplayingUrl);
    }
  });
```

- [ ] **Step 4: Simplify `setInterval` — remove `selectedStation` branch**

Old (lines 332–342):
```js
  setInterval(function () {
    var $active = $('.hitfm a.active');
    if (!$active.length) return;
    var selectedStation = $active.data('stream');
    var nowplayingUrl = $active.data('nowplaying');
    if (selectedStation) {
      getRadioDataAndUpdateTitleAPI(selectedStation);
    } else if (nowplayingUrl) {
      fetchNowPlaying(nowplayingUrl);
    }
  }, 30000);
```

New:
```js
  setInterval(function () {
    var $active = $('.hitfm a.active');
    if (!$active.length) return;
    var nowplayingUrl = $active.data('nowplaying');
    if (nowplayingUrl) {
      fetchNowPlaying(nowplayingUrl);
    }
  }, 30000);
```

- [ ] **Step 5: Manual verification**

Open `index.html` in browser (or live site):
- Click Hit-FM → поток играет, через 2–3 сек в "Now playing:" появляется трек
- Click SomaFM → поток играет, трек появляется
- Click Lounge FM → поток играет, "Now playing:" не меняется (нет URL)
- Открыть DevTools → Console: никаких ошибок `getRadioDataAndUpdateTitleAPI is not defined`

- [ ] **Step 6: Commit**

```bash
git add js/main.js
git commit -m "refactor: remove getRadioDataAndUpdateTitleAPI, unify to fetchNowPlaying"
```

---

### Task 3: Update Admin Panel

**Files:**
- Modify: `admin.html` (line 128)
- Modify: `js/admin.js` (lines 155, 160, 178)

**What changes:** Remove the `stationStream` input field from the form and all JS references to it.

- [ ] **Step 1: Remove `stationStream` field from `admin.html`**

Delete line 128:
```html
<!-- DELETE this line: -->
<div class="form-group"><label>data-stream (tavrmedia, пусто если не нужен)</label><input type="text" id="stationStream" placeholder="hit, roks, kiss…"></div>
```

Also update the label on line 129 (now becomes the line after the deletion):
```html
<!-- OLD: -->
<div class="form-group"><label>Now Playing URL (необязательно, для отображения текущего трека)</label><input type="text" id="stationNowplaying" placeholder="https://somafm.com/songs/groovesalad.json"></div>

<!-- NEW: -->
<div class="form-group"><label>Now Playing URL (для отображения текущего трека)</label><input type="text" id="stationNowplaying" placeholder="https://o.tavr.media/hit или https://somafm.com/songs/groovesalad.json"></div>
```

- [ ] **Step 2: Remove `stream` from new-station template in `admin.js`**

Line 155, old:
```js
    var s = i >= 0 ? state.stations[i] : { title: '', url: '', category: '', group: '', stream: '', nowplaying_url: '', type: 'mp3' };
```

New:
```js
    var s = i >= 0 ? state.stations[i] : { title: '', url: '', category: '', group: '', nowplaying_url: '', type: 'mp3' };
```

- [ ] **Step 3: Remove `stationStream` read in `openStationForm`**

Line 160, delete:
```js
// DELETE:
    document.getElementById('stationStream').value     = s.stream        || '';
```

- [ ] **Step 4: Remove `stream` from saved object in `saveStation`**

Line 178, old:
```js
      stream:        document.getElementById('stationStream').value.trim(),
```

Delete this line entirely. The `s` object becomes:
```js
    var s = {
      title:         document.getElementById('stationTitle').value.trim(),
      url:           document.getElementById('stationUrl').value.trim(),
      category:      document.getElementById('stationCategory').value.trim(),
      group:         document.getElementById('stationGroup').value.trim(),
      nowplaying_url: nowplaying,
      type:          document.querySelector('input[name="stationType"]:checked').value
    };
```

- [ ] **Step 5: Manual verification**

Open `admin.html`, login:
- Открыть форму редактирования Hit-FM → поле «data-stream» отсутствует, поле «Now Playing URL» заполнено `https://o.tavr.media/hit`
- Изменить nowplaying_url на что-нибудь и нажать Сохранить → сохранение проходит без ошибок
- Добавить новую станцию с nowplaying_url → в `stations.json` нет поля `stream`

- [ ] **Step 6: Commit**

```bash
git add admin.html js/admin.js
git commit -m "refactor: remove stream field from admin panel"
```
