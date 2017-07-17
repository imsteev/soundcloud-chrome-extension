function streamController(SC, chrome) {
  var self = this;

  self.stream = null;
  self.tracks = null;
  self._currentSongIdx = -1;
  self._replayCount = 0;

  self.playSong = function(i, eventFns) {
    if (!!self.stream) {
      self.stream.pause();
    }

    var track = self.tracks[i];
    self._currentSongIdx = i;

    chrome.storage.sync.set({
      currentTrack: track
    });

    SC.stream("/tracks/" + track.id).then(
      function(stream) {
        self.stream = stream;

        stream.on("finish", function() {
          // TODO: remove the currentTrack key-val altogether?
          chrome.storage.sync.set({
            currentTrack: {}
          });

          // cached result will require a reset?
          stream.off("finish");
          stream.seek(0);

          // TODO: out-of-bounds handling that would require pagination
          self.playNextSong(eventFns);
        });

        initializeDefaultEventListeners(stream);

        if (!!eventFns) {
          $.each(eventFns, function(eventName, fn) {
            console.log(eventName, fn());
            self.stream.on(eventName, fn);
          });
        }
        stream.play();
      },
      function(error) {
        console.log(error);
      }
    );
  };

  self.playNextSong = function(eventFns) {
    if (!setNextTrack()) {
      console.log("couldn't play next song");
      return;
    }
    self.playSong(self._currentSongIdx, eventFns);
  };

  self.playPrevSong = function(eventFns) {
    if (!setPrevTrack()) {
      return;
    }
    self.playSong(self._currentSongIdx, eventFns);
  };

  self.queueReplay = function() {
    var stream = self.stream;
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

  self.getCurrentTrack = function() {
    if (!!self.tracks) {
      return self.tracks[self.currentSongIdx];
    }
    return null;
  };

  self.getStream = function() {
    return self.stream;
  };

  self.setStream = function(stream) {
    self.stream = stream;
  };

  self.removeStream = function() {
    if (!!self.stream) {
      self.stream = null;
    }
  };

  self.getTracks = function() {
    return self.tracks;
  };

  self.setTracks = function(tracks) {
    self.tracks = tracks;
  };

  self.removeTracks = function() {
    self.tracks = null;
  };

  function initializeDefaultEventListeners(stream) {
    stream.on("play-start", function() {
      console.log("trigger start");
    });

    stream.on("no_streams", function() {
      console.log("Error: Could not fetch streaming resource");
    });

    stream.on("audio_error", function() {
      console.log("Error: Something wrong with the audio resource");
    });

    stream.on("no_connection", function() {
      console.log("Error: No connection available. Try again later");
    });

    stream.on("geo_blocked", function() {
      console.log("Error: Cannot play requested song in this country");
    });

    stream.on("no_protocol", function() {
      console.log("Error: No protocol could be found");
    });
  }

  function setNextTrack() {
    if (++self._currentSongIdx >= self.tracks.length) {
      return false;
    }
    return true;
  }

  function setPrevTrack() {
    if (--self._currentSongIdx < 0) {
      return false;
    }
    return true;
  }
}
