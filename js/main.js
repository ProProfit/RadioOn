var audioPlayer = document.getElementById('audioPlayer');
var currentTitleElement = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var audioElement = document.getElementById('audioPlayer');

function playTrack(trackSource, trackTitle) {
    audioPlayer.setAttribute('src', trackSource);
    currentTitleElement.innerHTML = trackTitle;
    audioPlayer.play();
}

// Обновленный код для вывода значения API в строке Play Now
function updatePlayNowTitle(title) {
    var audioTitlePlayAPI = document.querySelector('#Audio-Title-Play-title-API');
    audioTitlePlayAPI.innerHTML = 'Play Now: ' + title; // Обновляем содержимое div с полученным значением
}

$(document).ready(function() {
    $(document).on('click', '#playlist a', function(e) {
        e.preventDefault();
        var trackSource = $(this).attr('href');
        var trackTitle = $(this).data('title');
        var stream = $(this).data('stream'); // Извлекаем значение атрибута data-stream
        playTrack(trackSource, trackTitle, stream); // Передаем значение stream в функцию playTrack
        updatePlayNowTitle(trackTitle); // Обновляем Play Now с названием текущей станции
    });

    $(document).on('click', '#playBtn', function() {
        audioPlayer.play();
    });

    $(document).on('click', '#pauseBtn', function() {
        audioPlayer.pause();
    });

    $(document).on('click', '#stopBtn', function() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    });

    $(document).on('input', '#volumeRange', function() {
        audioPlayer.volume = volumeRange.value;
    });

    // Скрыть элемент <audio>
    audioElement.style.display = 'none';


		
});