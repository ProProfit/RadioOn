var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var activeHls = null;

function playTrack(trackSource, trackTitle) {
  if (activeHls) {
    activeHls.destroy();
    activeHls = null;
  }
  audioPlayer.pause();
  audioPlayer.src = trackSource;
  currentTitleElement.textContent = trackTitle;
  audioPlayer.load();
  audioPlayer.play().catch(function (err) { console.error('Playback failed:', err); });
}

function updateCurrentSong(title) {
  const currentSongElement = document.getElementById('currentSong');
  currentSongElement.textContent = 'Now playing: ' + title;
}

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

function renderPlaylistGroups(tracks, extraClass, titlePrefix, defaultGroup) {
  var $container = $('.playList-container');
  var groupNames = [];
  var groups = {};
  tracks.forEach(function(track) {
    var g = track.category || defaultGroup;
    if (!groups[g]) { groups[g] = []; groupNames.push(g); }
    groups[g].push(track);
  });
  groupNames.forEach(function(groupName) {
    var $div = $('<div>').addClass('playlist custom-playlist' + (extraClass ? ' ' + extraClass : ''));
    $('<h2>').addClass('playlist-title').text(titlePrefix + groupName).appendTo($div);
    var $ul = $('<ul>').addClass('station-list').appendTo($div);
    groups[groupName].forEach(function(track) {
      var $a = $('<a>').attr('href', track.url).attr('data-title', track.title).text(track.title);
      $('<li>').append($a).appendTo($ul);
    });
    $container.append($div);
  });
}

function fetchAndRenderPlaylists() {
  fetch('PlayList/playlist.json')
    .then(function(r) {
      if (!r.ok) throw new Error('playlist.json not found');
      return r.json();
    })
    .then(function(tracks) {
      $('.playList-container').find('.custom-playlist:not(.private-playlist)').remove();
      renderPlaylistGroups(tracks, '', '', 'My Playlist');
    })
    .catch(function(err) {
      console.error('Could not load playlists:', err);
    });
}

function renderPrivatePlaylists(tracks) {
  $('.playList-container').find('.private-playlist').remove();
  renderPlaylistGroups(tracks, 'private-playlist', '🔒︎ ', 'Private');
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
      if (r.status === 401 || r.status === 403) throw new Error('AUTH_FAIL');
      if (!r.ok) throw new Error('NOT_FOUND');
      return r.json();
    })
    .then(function(data) {
      var tracks = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
      renderPrivatePlaylists(tracks);
      document.getElementById('privateBtn').classList.add('hidden');
    })
    .catch(function(err) {
      console.error('Private playlists:', err.message);
      if (err.message === 'AUTH_FAIL') {
        localStorage.removeItem('admin_pat');
        document.getElementById('privateBtn').classList.remove('hidden');
      }
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

  $('#privateCloseBtn').on('click', function() { $modal.addClass('hidden'); });
  $modal.on('click', function(e) {
    if (e.target === this) $modal.addClass('hidden');
  });
}

$(document).ready(function () {
  fetchAndRenderStations();
  fetchAndRenderCategories();
  fetchAndRenderPlaylists();
  initPrivateAuth();
  function playM3U8WithHLS(url, title) {
    if (activeHls) {
      activeHls.destroy();
      activeHls = null;
    }
    if (Hls.isSupported()) {
      var hls = new Hls();
      activeHls = hls;
      hls.loadSource(url);
      hls.attachMedia(audioPlayer);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        audioPlayer.play().catch(function (err) { console.error('Playback failed:', err); });
        if (title) currentTitleElement.textContent = title;
      });
    } else {
      console.log('Your browser does not support playing M3U8 streams using Hls.js.');
    }
  }

  $(document).on('click', '.playlist a:not([href="#"])', function (e) {
    e.preventDefault();
    var trackSource = $(this).attr('href');
    var trackTitle = $(this).data('title');

    if ($(this).hasClass('play-m3u8')) {
      playM3U8WithHLS(trackSource, trackTitle);
    } else {
      playTrack(trackSource, trackTitle);
    }
  });

  $(document).on('click', '#playBtn', function () {
    if (audioPlayer.paused) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  });

  $(document).on('click', '#stopBtn', function () {
    audioPlayer.pause();
  });

  $(document).on('click', '.hitfm a', function () {
    const selectedStation = $(this).data('stream');
    $('.hitfm a').removeClass('active');
    $(this).addClass('active');
    getRadioDataAndUpdateTitleAPI(selectedStation);
  });

  function updateStationData(selectedStation) {
    if ($('.hitfm a[data-stream="' + selectedStation + '"]').length) {
      getRadioDataAndUpdateTitleAPI(selectedStation);
    }
  }

  setInterval(function () {
    const selectedStation = $('.hitfm a.active').data('stream');
    if ($('.hitfm a.active').length && selectedStation) {
      getRadioDataAndUpdateTitleAPI(selectedStation);
    }
  }, 30000);

  $(document).on('click', '.category-selector ul li a', function () {
    $('.category-selector ul li a').removeClass('active');
    $(this).addClass('active');
    const selectedCategory = $(this).data('category');

    $('.playlist').each(function () {
      const $playlist = $(this);
      const $stations = $playlist.find('ul li a');

      const isVisible = $stations.toArray().some(function (station) {
        const stationCategory = $(station).data('category');
        return selectedCategory === 'all' || selectedCategory === stationCategory;
      });

      $playlist.toggle(isVisible || selectedCategory === 'all');
      $stations.each(function () {
        const stationCategory = $(this).data('category');
        $(this).toggle(selectedCategory === 'all' || selectedCategory === stationCategory);
      });
    });
  });

  $(document).on('click', '.playlist ul li a', function () {
    $('.playlist ul li a').removeClass('active');
    $(this).addClass('active');
    const selectedTitle = $(this).data('title');
    $('#currentTitle').text(selectedTitle || '');
    $('#currentSong').text('Now playing: loading...');
  });

  // Sleep timer
  var sleepTimeout = null;
  var sleepInterval = null;

  function startSleep(minutes) {
    clearTimeout(sleepTimeout);
    clearInterval(sleepInterval);
    var endsAt = Date.now() + minutes * 60 * 1000;

    function tick() {
      var left = endsAt - Date.now();
      if (left <= 0) return;
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      $('#sleepTimerBtn').text('[' + m + ':' + (s < 10 ? '0' : '') + s + ']');
    }
    tick();
    sleepInterval = setInterval(tick, 1000);

    sleepTimeout = setTimeout(function() {
      clearInterval(sleepInterval);
      audioPlayer.pause();
      $('#sleepTimerBtn').text('[clock]');
      $('#sleepCancelBtn').addClass('hidden');
    }, minutes * 60 * 1000);

    $('#sleepCancelBtn').removeClass('hidden');
    $('#sleepModal').addClass('hidden');
  }

  function cancelSleep() {
    clearTimeout(sleepTimeout);
    clearInterval(sleepInterval);
    sleepTimeout = null;
    $('#sleepTimerBtn').text('[clock]');
    $('#sleepCancelBtn').addClass('hidden');
  }

  $('#sleepTimerBtn').on('click', function() {
    $('#sleepModal').removeClass('hidden');
  });

  $(document).on('click', '.sleep-opt', function() {
    startSleep(parseInt($(this).data('min')));
  });

  $('#sleepCustomBtn').on('click', function() {
    var val = parseInt($('#sleepMinInput').val());
    if (val > 0) startSleep(val);
  });

  $('#sleepCancelBtn').on('click', function() {
    cancelSleep();
    $('#sleepModal').addClass('hidden');
  });

  $('#sleepCloseBtn').on('click', function() {
    $('#sleepModal').addClass('hidden');
  });

  $('#sleepModal').on('click', function(e) {
    if (e.target === this) $('#sleepModal').addClass('hidden');
  });
});
