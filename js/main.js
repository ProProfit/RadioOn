var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var audioElement = document.getElementById('audioPlayer');
var isAudioReady = false;

function playTrack(trackSource, trackTitle) {
		audioPlayer.pause(); // Пауза текущей станции (если она воспроизводится)
		audioPlayer.setAttribute('src', trackSource);
		currentTitleElement.innerHTML = trackTitle;
		
    // Проверяем, готово ли аудио к воспроизведению
    if (isAudioReady) {
			audioPlayer.play();
	} else {
			// Если аудио еще не готово, добавляем обработчик события canplay
			audioPlayer.addEventListener('canplay', function () {
					isAudioReady = true;
					audioPlayer.play(); // Теперь, когда аудио готово, проигрываем его
			}, { once: true }); // { once: true } чтобы событие выполнилось только один раз
	}
}

$(document).ready(function () {
		$(document).on('click', '#playlist a', function (e) {
				e.preventDefault();
				var trackSource = $(this).attr('href');
				var trackTitle = $(this).data('title');
				playTrack(trackSource, trackTitle);
		});

		$(document).on('click', '#playBtn', function () {
				audioPlayer.play();
		});

		$(document).on('click', '#pauseBtn', function () {
				audioPlayer.pause();
		});

		$(document).on('click', '#stopBtn', function () {
				audioPlayer.pause();
				audioPlayer.currentTime = 0;
		});

		$(document).on('input', '#volumeRange', function () {
				audioPlayer.volume = parseFloat(volumeRange.value) / 100;
				var output = document.getElementById('val_lvl');
				output.innerHTML = volumeRange.value;
		});

		// Скрыть элемент <audio>
		audioElement.style.display = 'none';

});
$('#playlist a').on('click', function () {
  // Получите значение data-stream выбранной радиостанции
  const selectedStation = $(this).data('stream');

  // Вызовите getCurrentSongInfo с выбранной станцией
  getCurrentSongInfo(selectedStation);
});

function getCurrentSongInfo(selectedStation) {
  // Здесь замените URL на конечную точку вашего API радиостанции
  const apiUrl = `https://api.more.fm/api/get-icecast?stream=${selectedStation}`;

  // Остальной код getCurrentSongInfo остается без изменений
	$.ajax({
		type: 'GET',
		url: apiUrl,
		async: true,
		dataType: 'jsonp',
		jsonpCallback: 'parseMusic',
		success: function (response) {
				if (response && Object.keys(response).length > 0) {
						const titleAPI = response[Object.keys(response)[0]].title;
						const decodedTitleAPI = decodeURIComponent(titleAPI); // Декодируем текст
						const utf8TitleAPI = decodeUtf8(decodedTitleAPI); // Декодируем в формат UTF-8
						updateCurrentSong(utf8TitleAPI);
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

function updateCurrentSong(titleAPI) {
		const currentSongElement = document.getElementById('currentSong');
		currentSongElement.textContent = 'Now playing: ' + titleAPI;
}

// Вызывать при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
		getCurrentSongInfo();
});

// Функция для декодирования строки UTF-8
function decodeUtf8(encodedString) {
  return decodeURIComponent(escape(encodedString));
}