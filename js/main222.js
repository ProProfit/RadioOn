// Ваш существующий код
var audioPlayer = document.getElementById('audioPlayer');
var currentTitle = document.getElementById('currentTitle');
var volumeRange = document.getElementById('volumeRange');
var audioElement = document.getElementById('audioPlayer');

function playTrack(trackSource, trackTitle) {
    audioPlayer.setAttribute('src', trackSource);
    currentTitle.innerHTML = trackTitle;
    audioPlayer.play();

    $.get('https://api.example.com/data', function(response) {
        console.log('Data:', response);
    });
}

$(document).on('click', '#playlist a', function(e) {
    e.preventDefault();
    var trackSource = $(this).attr('href');
    var trackTitle = $(this).data('title');
    playTrack(trackSource, trackTitle);
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
    var volumeValue = parseInt(this.value); // Получите значение ползунка как целое число
    if (volumeValue >= 0 && volumeValue <= 100) {
        audioPlayer.volume = volumeValue / 100; // Установите громкость
    }
    // Теперь вы можете обновить значение на странице
    var output = document.getElementById("val_lvl");
    output.innerHTML = volumeValue;
});

// Скрыть элемент <audio>
audioElement.style.display = 'none';

// Обновленный код для вывода значения API в строке Play Now
function updatePlayNowTitle(title) {
    var audioTitlePlay = document.querySelector('.Audio-Title-Play');
    audioTitlePlay.innerHTML = 'Play Now: ' + title;
}

$(document).on('click', '#playlist a', function(e) {
    e.preventDefault();
    var trackSource = $(this).attr('href');
    var stream = $(this).data('stream'); // Извлекаем значение атрибута data-stream
    playTrack(trackSource, stream); // Передаем stream в функцию playTrack
});

function playTrack(trackSource, stream) {
    audioPlayer.setAttribute('src', trackSource);
    audioPlayer.play();

    $.get('https://api.more.fm/api/get-icecast?stream=' + stream, function(response) {
        console.log('Data:', response);
        if (response.title) {
            updatePlayNowTitle(response.title); // Обновляем заголовок с полученным значением
        } else {
            updatePlayNowTitle(''); // Если нет заголовка, то очищаем заголовок
        }
    });
}
