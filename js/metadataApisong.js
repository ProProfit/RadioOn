// requires jQuery
var data = {
	'api_token': 'e2197c6b7c447fc209f7f9b759f69c40',
	'url': 'https://cdn.drivemusic.club/dl/online/2ch0fXeFoheunF-2XnzAPA/1701131204/download_music/2012/08/robert-miles-children.mp3',
	'return': 'apple_music,spotify',
};
$.getJSON("https://api.audd.io/?jsonp=?", data, function(result){
	console.log(result);
});