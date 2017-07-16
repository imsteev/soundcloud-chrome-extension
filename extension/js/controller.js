function controller(chrome) {
  var self = this;

  self.displayTracks = function(port, tracksResp) {
    currentTracks = tracksResp.collection;
    port.postMessage({
      message: "display-tracks",
      content: tracksResp
    });
  };

  self.displayPreviousSearch = function(port) {
    chrome.storage.sync.get(["previousSearch"], function(obj) {
      if (chrome.runtime.lastError == null && "previousSearch" in obj) {
        SC.get("/tracks", obj.previousSearch).then(function(res) {
          self.displayTracks(port, res);
        });
      }
    });
  };

  self.displayCurrentSong = function(port) {
    chrome.tabs.query(
      {
        url: "*://soundcloud.com/*"
      },
      function(soundcloudTabs) {
        if (soundcloudTabs.length > 0) {
          var currentlyPlaying = null;
          // TODO: try to not have to look thru all the tabs every time. Caching?
          var audibleTabs = soundcloudTabs.filter(function(t) {
            return t.audible == true;
          });
          if (audibleTabs.length == 0) {
            self.displayCurrentExtensionTrack(port);
            return;
          }
          port.postMessage({
            message: "display-current-track",
            content: {
              track: audibleTabs[0],
              isPlaying: true
            }
          });
        } else {
          self.displayCurrentExtensionTrack(port);
        }
      }
    );
  };

  self.displayCurrentExtensionTrack = function(port, message) {
    // TODO: determine if port is connected before trying to read from storage
    chrome.storage.sync.get(["currentTrack"], function(obj) {
      if (
        chrome.runtime.lastError == null &&
        "currentTrack" in obj &&
        !$.isEmptyObject(obj.currentTrack)
      ) {
        port.postMessage({
          message: "display-current-track",
          content: {
            track: obj.currentTrack,
            isPlaying: isPlaying
          }
        });
      }
    });
  };
}
