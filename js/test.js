// Глобальная переменная для хранения текущей выбранной категории
var currentCategory = '';

// Функция для загрузки и проигрывания случайной песни из списка
function playRandomTrackFromPlaylist(category) {
  fetch('/PlayList/playlist.json')
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Failed to fetch playlist.json');
      }
      return response.json();
    })
    .then(function(data) {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format in playlist.json');
      }
      var filteredSongs = data.filter(function(song) {
        return song.category === category;
      });
      if (filteredSongs.length === 0) {
        throw new Error('No songs found in the category: ' + category);
      }
      var randomIndex = Math.floor(Math.random() * filteredSongs.length);
      var randomTrack = filteredSongs[randomIndex];
      if (!randomTrack.hasOwnProperty('title') || !randomTrack.hasOwnProperty('url')) {
        throw new Error('Invalid track format in playlist.json');
      }
      playTrack(randomTrack.url, randomTrack.title); // передаем название песни в функцию playTrack
    })
    .catch(function(error) {
      console.error(error);
    });
}

// Функция для проигрывания песни
function playTrack(url, title) {
  var audioPlayer = document.getElementById('audioPlayer');
  audioPlayer.src = url;
  audioPlayer.play();

  // Обновляем название текущей проигрываемой песни
  document.getElementById('currentSong').textContent = 'Now playing: ' + title;

  // Событие, которое вызывается, когда песня завершается
  audioPlayer.addEventListener('ended', function() {
    // После завершения текущей песни проигрываем следующую из той же категории
    playRandomTrackFromPlaylist(currentCategory);
  });
}

// Обработчики событий для кликов по ссылкам категорий
document.querySelectorAll('.category-selector a').forEach(function(link) {
  link.addEventListener('click', function(event) {
    event.preventDefault();
    currentCategory = this.getAttribute('data-category'); // Обновляем текущую категорию
    playRandomTrackFromPlaylist(currentCategory);
  });
});

// Обработчики событий для кликов по станциям
document.querySelectorAll('.playlist a').forEach(function(station) {
  station.addEventListener('click', function(event) {
    event.preventDefault();
    var category = this.getAttribute('list');
    currentCategory = category; // Обновляем текущую категорию
    playRandomTrackFromPlaylist(category);
  });
});

// Обработчик событий для ссылок с классом play-m3u8
document.querySelectorAll('.play-m3u8').forEach(function(link) {
  link.addEventListener('click', function(event) {
    event.preventDefault();
    var url = this.getAttribute('href');
    var title = this.getAttribute('data-title');
    var category = this.getAttribute('data-category');
    currentCategory = category; // Обновляем текущую категорию
    playTrack(url, title);
  });
});
//////////////////////////////

// Таймер сна

document.getElementById('sleepTimerBtn').addEventListener('click', function() {
  var minutes = prompt('Enter sleep timer in minutes:');
  if (minutes) {
    setTimeout(function() {
      document.getElementById('audioPlayer').pause();
    }, minutes * 60000); // Умножаем на 60000, чтобы получить миллисекунды
  }
});


// Поиск станций

// document.getElementById('searchInput').addEventListener('input', function() {
//   var filter = this.value.toLowerCase();
//   var stationList = document.querySelectorAll('.station-list li');
//   stationList.forEach(function(station) {
//     var stationTitle = station.querySelector('a').getAttribute('data-title').toLowerCase();
//     if (stationTitle.includes(filter)) {
//       station.style.display = '';
//     } else {
//       station.style.display = 'none';
//     }
//   });
// });
