// Функция для декодирования строки UTF-8
function decodeUtf8(encodedString) {
  return encodedString;
}

var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var audioElement = document.getElementById('audioPlayer');
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
        const decodedTitleAPI = decodeUtf8(title);
        updateCurrentSong(decodedTitleAPI);
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

function getCurrentSongInfo(selectedStation) {
  const apiUrl = `https://api.more.fm/api/get-icecast?stream=${selectedStation}`;

  $.ajax({
    type: 'GET',
    url: apiUrl,
    async: true,
    dataType: 'jsonp',
    jsonpCallback: 'parseMusic',
    success: function (response) {
      if (response && Object.keys(response).length > 0) {
        const title = response[Object.keys(response)[0]].title;
        const decodedTitleAPI = decodeUtf8(title);
        updateCurrentSong(decodedTitleAPI);
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
  $(document).on('click', '#playlist a', function (e) {
    e.preventDefault();
    var trackSource = $(this).attr('href');
    var trackTitle = $(this).data('title');
    playTrack(trackSource, trackTitle);
  });

  $(document).on('click', '#playBtn', function () {
    if (!audioPlayer.paused) {
      audioPlayer.pause();
    }
    audioPlayer.play();
  });

  $(document).on('click', '#pauseBtn', function () {
    audioPlayer.pause();
  });

  $(document).on('input', '#volumeRange', function () {
    audioPlayer.volume = parseFloat(volumeRange.value) / 100;
    var output = document.getElementById('val_lvl');
    output.innerHTML = volumeRange.value;
  });

  audioElement.style.display = 'none';
});

// $('#playlist a').on('click', function () {
//   const selectedStation = $(this).data('stream');
//   getCurrentSongInfo(selectedStation);
// });

$('#playlist a').on('click', function () {
  // Удаляем класс 'active' у всех ссылок внутри элемента с классом 'more'
  $('#playlist a').removeClass('active');
  
  // Добавляем класс 'active' к выбранной ссылке
  $(this).addClass('active');

  const selectedStation = $(this).data('stream');
  getCurrentSongInfo(selectedStation);
});


$('.more a').on('click', function () {
  const selectedStation = $(this).data('stream');
  getCurrentSongInfo(selectedStation);
});

$('.hitfm a').on('click', function () {
  const selectedStationHIT = $(this).data('stream');
  getRadioDataAndUpdateTitleAPI(selectedStationHIT);
});



setInterval(function () {
	const selectedStationHIT = $('.hitfm a').data('stream'); // Предполагая, что у вас есть активная станция
	getRadioDataAndUpdateTitleAPI(selectedStationHIT);
}, 30000);