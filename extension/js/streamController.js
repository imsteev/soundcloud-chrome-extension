function streamController(chrome) {
  var self = this;

  self.replayCount = 0;
  self.stream = null;

  self.playSong = function(index, port, finishFn) {
    if (self.streamExists()) {
      self.stream.pause();
    }

    var track = currentTracks[index];
    chrome.storage.sync.set({
      currentTrack: track
    });
    try {
      displayCurrentExtensionTrack(port);
    } catch (error) {}

    SC.stream("/tracks/" + track.id).then(
      function(player) {
        self.stream = player;

        // TODO: set this in backgroundjs
        currentSongIdx = index;

        self.stream.play();

        self.stream.on("finish", function() {
          chrome.storage.sync.set({
            currentTrack: {}
          });

          // cached result will require a reset
          self.stream.off("finish");
          self.stream.seek(0);

          // TODO: automatically display new current song when popup is open
          // TODO: out-of-bounds handling that would require pagination
          self.playSong(index + 1, port);
        });
      },
      function(error) {
        console.log("Streaming error: " + error);
      }
    );
  };

  self.queueReplay = function() {
    self.replayCount++;
    stream.on("time", function() {
      var diff = stream.controller.getDuration() - stream.currentTime();
      if (diff < 1000) {
        stream.pause();
        stream.seek(0);
        stream.play();
        self.replayCount--;
      }
      if (self.replayCount === 0) {
        self.stream.off("time");
      }
    });
  };

  self.setStream = function(stream) {
    self.stream = stream;
  };

  self.removeStream = function() {
    if (!!self.stream) {
      self.stream = null;
    }
  };

  self.currentStream = function() {
    return self.stream;
  };
}
