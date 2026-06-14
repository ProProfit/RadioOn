var currentCategory = '';

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
      playlistTrack(randomTrack.url, randomTrack.title);
    })
    .catch(function(error) {
      console.error(error);
    });
}

function playlistTrack(url, title) {
  if (typeof activeHls !== 'undefined' && activeHls) {
    activeHls.destroy();
    activeHls = null;
  }
  var audioPlayer = document.getElementById('audioPlayer');
  audioPlayer.src = url;
  audioPlayer.play().catch(function(err) { console.error('Playback failed:', err); });
  document.getElementById('currentSong').textContent = 'Now playing: ' + title;
  document.getElementById('currentTitle').textContent = title;
  audioPlayer.onended = function() {
    playRandomTrackFromPlaylist(currentCategory);
  };
}

// Only handles custom playlist links (href="#") — real stream links are handled by main.js
document.querySelectorAll('.playlist a[href="#"]').forEach(function(station) {
  station.addEventListener('click', function(event) {
    event.preventDefault();
    var category = this.getAttribute('list');
    currentCategory = category;
    playRandomTrackFromPlaylist(category);
  });
});

// Sleep timer
document.getElementById('sleepTimerBtn').addEventListener('click', function() {
  var minutes = parseFloat(prompt('Enter sleep timer in minutes:'));
  if (!isNaN(minutes) && minutes > 0) {
    setTimeout(function() {
      document.getElementById('audioPlayer').pause();
    }, minutes * 60000);
  }
});
