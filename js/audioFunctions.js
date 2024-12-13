// // audioFunctions.js

// function playRandomTrackFromJSON(jsonFileUrl) {
//   var audioPlayer = document.getElementById('audioPlayer');
//   var currentTitleElement = document.getElementById('currentTitle');
//   var isAudioReady = false;

//   function playTrack(trackSource, trackTitle) {
//     audioPlayer.pause();
//     audioPlayer.setAttribute('src', trackSource);
//     currentTitleElement.innerHTML = trackTitle;

//     if (isAudioReady) {
//       audioPlayer.play();
//     } else {
//       audioPlayer.addEventListener('canplay', function () {
//         isAudioReady = true;
//         audioPlayer.play();
//       }, { once: true });
//     }
//   }

//   function getRandomTrack(tracks) {
//     if (tracks && tracks.length > 0) {
//       var randomIndex = Math.floor(Math.random() * tracks.length);
//       return tracks[randomIndex];
//     } else {
//       return null;
//     }
//   }

//   function playM3U8WithHLS(url) {
//     if (Hls.isSupported()) {
//       var hls = new Hls();
//       hls.loadSource(url);
//       hls.attachMedia(audioPlayer);
//       hls.on(Hls.Events.MANIFEST_PARSED, function () {
//         audioPlayer.play();
//       });
//     } else {
//       console.log('Your browser does not support playing M3U8 streams using Hls.js.');
//     }
//   }

//   $(document).on('click', '#TrackList a', function (e) {
//     e.preventDefault();
//     $.getJSON(jsonFileUrl, function (tracks) {
//       var randomTrack = getRandomTrack(tracks);

//       if (randomTrack) {
//         var trackTitle = randomTrack.title;
//         var trackUrl = randomTrack.url;

//         if ($(this).hasClass('play-json')) {
//           playM3U8WithHLS(trackUrl, trackTitle);
//         } else {
//           playTrack(trackUrl, trackTitle);
//         }
//       } else {
//         console.error('No tracks found in the JSON file');
//       }
//     });
//   });
// }
// // playRandomTrackFromJSON('PlayList/playlist.json');




//   $('#All').on('click', function () {
//     playRandomTrackFromJSON('PlayList/song.json');
//   });

//   $('#Ruki_Vverh').on('click', function () {
//     playRandomTrackFromJSON('PlayList/playlist.json');
//   });

//   $('.s3').on('click', function () {
//     playRandomTrackFromJSON('f3.json');
//   });
