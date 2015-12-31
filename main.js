var fs = require('fs');
var groove = require('groove');
var assert = require('assert');
var Batch = require('batch'); // npm install batch

// read files from the directory
var path = process.argv[2];
var songs = fs.readdirSync(path);

global.playlist = groove.createPlaylist();
var player = groove.createPlayer();
var batch = new Batch();

var currentSong = 0;

player.on('nowplaying', function () {
  var current = player.position();
  if (!current.item) {
    cleanup();
    return;
  }
  var artist = current.item.file.getMetadata('artist');
  var title = current.item.file.getMetadata('title');
  console.log('Now playing:', artist, '-', title);
});

for (var i = 0, _len = songs.length; i < _len; i++) {
  batch.push(openFileFn(path + songs[i]));
}

batch.end(function (err, files) {
  files.forEach(function (file) {
    if (file) {
      playlist.insert(file);
    }
  });
  player.attach(playlist, function (err) {
    assert.ifError(err);
  });
  process.stdin.resume();
  process.stdin.on('data', function (data) {
    //console.log('okay..?');
    //playlist.seek(++currentSong, 0);
  });
});

function openFileFn(filename) {
  return function (cb) {
    groove.open(filename, cb);
  };
}

function cleanup() {
  var batch = new Batch();
  var files = playlist.items().map(function (item) { return item.file; });
  playlist.clear();
  files.forEach(function (file) {
    batch.push(function (cb) {
      file.close(cb);
    });
  });
  batch.end(function (err) {
    player.detach(function (err) {
      if (err) console.error(err.stack);
    });
  });
}
