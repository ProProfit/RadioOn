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
    editStation:   function (i) { openStationForm(i); },
    deleteStation: function (i) { deleteStation(i); },
    editTrack:     function (i) { openTrackForm(i); },
    deleteTrack:   function (i) { deleteTrack(i); }
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
