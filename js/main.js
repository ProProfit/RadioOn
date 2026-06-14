var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var activeHls = null;

function playTrack(trackSource, trackTitle) {
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
  const apiUrl = `https://o.tavrmedia.ua/${selectedStation}`;
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

$(document).ready(function () {
  fetchAndRenderStations();
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

  $('.hitfm a').on('click', function () {
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
    if ($('.hitfm a.active').length) {
      getRadioDataAndUpdateTitleAPI(selectedStation);
    }
  }, 30000);

  $('.category-selector ul li a').on('click', function () {
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

  $('.playlist ul li a').on('click', function () {
    $('.playlist ul li a').removeClass('active');
    $(this).addClass('active');
    const selectedStation = $(this).data('stream');
    const selectedCategory = $(this).data('category');
    $('#currentTitle').text(`${selectedStation} (${selectedCategory})`);
    $('#currentSong').text(`Now playing: loading...`);
    updateStationData(selectedStation);
  });
});
