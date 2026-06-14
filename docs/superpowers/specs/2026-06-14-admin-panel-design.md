# Admin Panel Design — RadioOn

**Date:** 2026-06-14  
**Status:** Approved

## Overview

A static admin panel (`admin.html`) hosted on GitHub Pages that allows the site owner to manage radio stations and playlist tracks without editing code. Changes are committed directly to the repository via the GitHub API using a Personal Access Token (PAT).

## Architecture

Stations are moved out of `index.html` into a new `stations.json` file. The player loads stations dynamically via `fetch()`. The admin panel reads and writes two JSON files via the GitHub API.

```
index.html              ← no hardcoded stations
stations.json           ← radio station list (new)
PlayList/
  playlist.json         ← playlist tracks (existing)
admin.html              ← admin page (new)
js/
  main.js               ← updated: fetch and render stations.json
  admin.js              ← admin logic (new)
```

**Data flow:**
```
admin.html → admin.js → GitHub API → stations.json / playlist.json
                                    → GitHub Pages rebuilds automatically
```

## Authentication

- `admin.html` shows a login form if no PAT is found in `localStorage`
- Login form fields: GitHub PAT, owner (username), repo name
- On submit: validates token via `GET /repos/{owner}/{repo}`
- On success: stores PAT, owner, repo in `localStorage`; shows main UI
- Logout button: clears `localStorage`, returns to login form

### Login form

```
┌─────────────────────────────────────┐
│           RadioOn Admin             │
│                                     │
│  GitHub PAT: [__________________]   │
│  Owner:      [__________________]   │
│  Repo:       [__________________]   │
│                                     │
│            [ Войти ]                │
└─────────────────────────────────────┘
```

## Main UI

Two-tab layout after login:

```
┌──────────────────────────────────────┐
│  [ Станции ]  [ Плейлисты ]  [Выход] │
├──────────────────────────────────────┤
│                                      │
│  (active tab content)                │
│                                      │
└──────────────────────────────────────┘
```

## Stations Tab

Full CRUD for radio stations stored in `stations.json`.

### Station list view

```
┌──────────────────────────────────────────┐
│  Станции                  [ + Добавить ] │
├──────────────────────────────────────────┤
│  Название    URL           Категория  Тип│
│  ────────────────────────────────────────│
│  Hit-FM      https://…    pop        MP3 │  [✏] [🗑]
│  Radio ROKS  https://…    Rok        MP3 │  [✏] [🗑]
│  Lounge FM   https://…    LoFi       HLS │  [✏] [🗑]
└──────────────────────────────────────────┘
```

### Add / Edit form

```
Название:   [________________]
URL потока: [________________]
Категория:  [pop ▾]            ← dropdown of existing categories + "new"
Тип:        [● MP3  ○ HLS]
data-stream:[________________]  ← key for tavrmedia API
            [ Сохранить ]  [ Отмена ]
```

### stations.json schema

```json
[
  {
    "title": "Hit-FM",
    "url": "https://online.hitfm.ua/HitFM_HD",
    "category": "pop",
    "stream": "hit",
    "type": "mp3",
    "group": "Tavr media"
  },
  {
    "title": "Lounge FM",
    "url": "https://cast.mediaonline.net.ua/loungefm320",
    "category": "LoFi",
    "stream": "loungefm320",
    "type": "hls",
    "group": "LoFi"
  }
]
```

- `type`: `"mp3"` or `"hls"` — determines whether `playM3U8WithHLS()` or `playTrack()` is called
- `stream`: key for the tavrmedia API (`getRadioDataAndUpdateTitleAPI`); empty string `""` for non-tavrmedia stations
- `group`: display group name; stations sharing a group are rendered into the same `.playlist` div

The `.hitfm` CSS class is applied to playlist divs whose stations have a non-empty `stream` field — this enables the tavrmedia API polling.

## Playlists Tab

Full CRUD for tracks in `PlayList/playlist.json`, organized by category.

### Playlist view

```
┌──────────────────────────────────────────┐
│  Плейлисты                               │
│  Категория: [Руки Вверх ▾]  [ + Новая ] │
├──────────────────────────────────────────┤
│  Треки в «Руки Вверх»     [ + Трек ]    │
│  ────────────────────────────────────────│
│  Название           URL                  │
│  Хочу всё           https://…           │  [✏] [🗑]
│  Ты меня любишь     https://…           │  [✏] [🗑]
└──────────────────────────────────────────┘
```

### Add / Edit track form

```
Название: [________________]
URL:      [________________]
          [ Сохранить ]  [ Отмена ]
```

Category is inherited from the active dropdown selection.

### Category management

- Dropdown lists all unique categories from `playlist.json`
- **+ Новая** button: shows a text input to name a new category
- Delete category: removes all tracks with that category (requires confirmation dialog)

## GitHub API Save Flow

Every create/update/delete operation follows the same pattern:

1. `GET /repos/{owner}/{repo}/contents/{path}` — fetch current file + SHA
2. Apply change to the parsed JSON in memory
3. `PUT /repos/{owner}/{repo}/contents/{path}` — write back with SHA and a commit message

Commit message format: `admin: update {stations|playlist} — {action} "{name}"`

## main.js Changes

`main.js` is updated to load stations dynamically instead of reading from hardcoded HTML:

1. On `$(document).ready`: `fetch('stations.json')` 
2. Parse JSON, render station `<a>` elements into `.playlist` containers
3. Existing click handlers remain unchanged (they use event delegation)

Stations are grouped by their `group` field. For each unique `group` value, a `.playlist` div is created with `<h2>` as the group title. If any station in the group has a non-empty `stream` field, the div also receives the `.hitfm` class (enabling the tavrmedia API polling interval).

## Out of Scope

- User roles / multiple admin accounts
- Drag-and-drop reorder of stations
- Bulk import/export
- Station categories management (add/remove categories for stations)
