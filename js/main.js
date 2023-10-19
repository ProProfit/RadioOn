var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var audioElement = document.getElementById('audioPlayer');
var audioPlayer2 = document.getElementById('audioPlayer2');
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
	function decodeUtf8(encodedString) {
		const decodedText = decodeURIComponent(escape(encodedString));
		return decodedText;
	}
}
$(document).ready(function () {
  // Определение функции playM3U8WithHLS здесь
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
      alert('Ваш браузер не поддерживает воспроизведение M3U8-потоков с использованием Hls.js.');
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
  $(document).on('click', '#pauseBtn', function () {
    audioPlayer.pause();
  });
  $(document).on('input', '#volumeRange', function () {
    audioPlayer.volume = parseFloat(volumeRange.value) / 100;
    var output = document.getElementById('val_lvl');
    output.innerHTML = volumeRange.value;
  });
  // audioElement.style.display = 'none';
});

// Добавьте класс "playlist" ко всем ссылкам плейлиста
$('.more a, .hitfm a').on('click', function () {
  const selectedStation = $(this).data('stream');
  // Удаляем класс 'active' у всех ссылок внутри элемента с классом 'playlist'
  $('.more a, .hitfm a').removeClass('active');
  // Добавляем класс 'active' к выбранной ссылке
  $(this).addClass('active');
  // Проверяем, к какому плейлисту относится выбранная ссылка, и выполняем соответствующие действия
  if ($(this).closest('.more').length) {
    getCurrentSongInfo(selectedStation);
  } else if ($(this).closest('.hitfm').length) {
    getRadioDataAndUpdateTitleAPI(selectedStation);
  }
});

// Создаем функцию, которая будет обновлять данные для выбранной станции
function updateStationData(selectedStation) {
  if (selectedStation) {
    if (selectedStation === 'more') {
      const selectedStationMore = $('.more a.active').data('stream');
      getCurrentSongInfo(selectedStationMore);
    } else if (selectedStation === 'hitfm') {
      const selectedStationHIT = $('.hitfm a.active').data('stream');
      getRadioDataAndUpdateTitleAPI(selectedStationHIT);
    }
  }
}

// Устанавливаем интервал обновления каждые 30 секунд (30000 миллисекунд)
setInterval(function () {
  // Получаем активную станцию
  const selectedStation = $('.more a.active, .hitfm a.active').data('stream');
  // Проверяем, к какому плейлисту относится выбранная ссылка, и выполняем соответствующие действия
  if ($('.more a.active').length) {
    getCurrentSongInfo(selectedStation);
  } else if ($('.hitfm a.active').length) {
    getRadioDataAndUpdateTitleAPI(selectedStation);
  }
}, 30000);



$(document).ready(function () {
	// Обработчик клика для выбора категории
	$('.category-selector ul li a').on('click', function () {
			// Удалим класс 'active' у всех ссылок внутри .category-selector
			$('.category-selector ul li a').removeClass('active');

			// Добавим класс 'active' к выбранной ссылке
			$(this).addClass('active');

			// Получим выбранную категорию
			const selectedCategory = $(this).data('category');

			// Покажем или скроем станции в зависимости от выбранной категории
			$('.hitfm ul li a, .more ul li a,.M3U8 ul li a').each(function () {
					const stationCategory = $(this).data('category');

					if (selectedCategory === 'all' || selectedCategory === stationCategory) {
							$(this).show();
					} else {
							$(this).hide();
					}
			});
	});

// Обработчик клика для выбора станции
$('.hitfm ul li a, .more ul li a, .M3U8 ul li a').on('click', function () {
	// Удалим класс 'active' у всех ссылок внутри .category-selector
	$('.hitfm ul li a, .more ul li a, .M3U8 ul li a').removeClass('active');

	// Добавим класс 'active' к выбранной ссылке
	$(this).addClass('active');

	// Получим выбранную станцию и категорию
	const selectedStation = $(this).data('stream');
	const selectedCategory = $(this).data('category');

	// Здесь выполняйте действия в зависимости от выбранной станции и категории
	// Например, выводите информацию о выбранной станции и категории
	console.log(`Selected Station: ${selectedStation}`);
	console.log(`Selected Category: ${selectedCategory}`);
});

});
