var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var isAudioReady = false;

function playTrack(trackSource, trackTitle) {
  audioPlayer.pause();
  audioPlayer.setAttribute('src', trackSource);
  currentTitleElement.innerHTML = trackTitle;

  if (isAudioReady) {
    audioPlayer.play();
  } else {
    audioPlayer.addEventListener('canplay', function () {
      isAudioReady = true;
      audioPlayer.play();
    }, { once: true });
  }
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

$(document).ready(function () {
  function playM3U8WithHLS(url) {
    var audioPlayer = document.getElementById('audioPlayer');
    if (Hls.isSupported()) {
      var hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(audioPlayer);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        audioPlayer.play();
      });
    } else {
      console.log('Your browser does not support playing M3U8 streams using Hls.js.');
    }
  }

  $(document).on('click', '#playlist a', function (e) {
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
    if (!audioPlayer.paused) {
      audioPlayer.pause();
    }
    audioPlayer.play();
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
    if (selectedStation === 'hitfm') {
      const selectedStationHIT = $('.hitfm a.active').data('stream');
      getRadioDataAndUpdateTitleAPI(selectedStationHIT);
    }
  }

  setInterval(function () {
    const selectedStation = $('.hitfm a.active').data('stream');
    if ($('.hitfm a.active').length) {
      getRadioDataAndUpdateTitleAPI(selectedStation);
    }
  }, 300);

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
