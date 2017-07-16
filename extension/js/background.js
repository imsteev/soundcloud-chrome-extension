// Initialization --------------------------------------------------------------
$.getJSON("../config.json", function(data) {
  console.log("initialized");
  SC.initialize({
    client_id: data["soundcloud_client_id"]
  });
});

var commands = new commands(chrome);
var controller = new controller(chrome);

chrome.storage.sync.clear();

// GLOBALS - since the background page keeps running, these variables will
// be tracked and used.
var stream = null,
  currentTracks = null,
  currentSongIdx = -1;
// -----------------------------------------------------------------------------
chrome.runtime.onConnect.addListener(function(port) {
  clearPagination();
  displayCurrentSong(port);
  displayPreviousSearch(port);
  port.onMessage.addListener(messageHandler(port));
});

function messageHandler(port) {
  var listener = function(msg) {
    var content = msg.content;
    var message = msg.message;

    switch (message) {
      case "play-song":
        playSong(content.index, port);
        break;
      case "search":
        var searchInfo = {
          q: content,
          limit: 10,
          linked_partitioning: 1
        };

        SC.get("/tracks", searchInfo).then(function(res) {
          chrome.storage.sync.set({
            previousSearch: searchInfo
          });
          displayTracks(port, res);
        });
        break;
      case "toggle":
        if (!!stream) {
          stream.toggle();
        }
        break;
      case "next-track":
        if (currentSongIdx >= currentTracks.length) {
          break;
        }
        playSong(++currentSongIdx, port);

        break;
      case "prev-track":
        if (currentSongIdx <= 0) {
          break;
        }
        playSong(--currentSongIdx, port);

        break;
      case "next-tracks":
        var currentTrackHref = content;
        $.getJSON(currentTrackHref, function(res) {
          displayTracks(port, res);
          chrome.storage.sync.set({
            prevTracks: getPrevHref(currentTrackHref)
          });
        });
        break;
      case "prev-tracks":
        chrome.storage.sync.get("prevTracks", function(obj) {
          if (chrome.runtime.lastError == null && !$.isEmptyObject(obj)) {
            var currentTrackHref = obj.prevTracks;
            $.getJSON(obj.prevTracks, function(res) {
              displayTracks(port, res);
              chrome.storage.sync.set({
                prevTracks: getPrevHref(currentTrackHref)
              });
            });
          }
        });
        break;
      case "replay":
        if (!!!stream) {
          break;
        }
        stream.on("time", function() {
          var diff = stream.controller.getDuration() - stream.currentTime();
          if (diff < 1000) {
            console.log("seeking to beginning");
            stream.pause();
            stream.seek(0);
            stream.play();
            stream.off("time");
          }
        });
        break;
      default:
        break;
    }
  };
  return listener;
}

function playSong(index, port) {
  if (!!stream) {
    stream.pause();
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
      stream = player;
      currentSongIdx = index;

      stream.play();

      stream.on("finish", function() {
        chrome.storage.sync.set({
          currentTrack: {}
        });

        // cached result will require a reset
        stream.off("finish");
        stream.seek(0);

        // TODO: automatically display new current song when popup is open
        // TODO: out-of-bounds handling that would require pagination
        playSong(index + 1, port);
      });
    },
    function(error) {
      console.log("Streaming error: " + error);
    }
  );
}

function displayTracks(port, tracksResp) {
  currentTracks = tracksResp.collection;
  port.postMessage({
    message: "display-tracks",
    content: tracksResp
  });
}

function displayPreviousSearch(port) {
  chrome.storage.sync.get(["previousSearch"], function(obj) {
    if (chrome.runtime.lastError == null && "previousSearch" in obj) {
      SC.get("/tracks", obj.previousSearch).then(function(res) {
        displayTracks(port, res);
      });
    }
  });
}

function displayCurrentSong(port) {
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
          displayCurrentExtensionTrack(port);
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
        displayCurrentExtensionTrack(port);
      }
    }
  );
}

function displayCurrentExtensionTrack(port) {
  chrome.storage.sync.get(["currentTrack"], function(obj) {
    if (
      chrome.runtime.lastError == null &&
      "currentTrack" in obj &&
      !$.isEmptyObject(obj.currentTrack)
    ) {
      try {
        port.postMessage({
          message: "display-current-track",
          content: {
            track: obj.currentTrack,
            isPlaying: !!stream && stream.controller.getState() === "playing"
          }
        });
      } catch (e) {
        console.log("Couldn't display track: " + e);
      }
    }
  });
}

function clearPagination() {
  chrome.storage.sync.remove(["prevTracks", "nextTracks"]);
}

// Assumes valid API url from soundcloud
function getPrevHref(url) {
  var oldUrl = url.split("?");
  var params = $.parseParams(oldUrl[1]);
  if (params.offset > 0) {
    params.offset =
      Number.parseInt(params.offset) - Number.parseInt(params.limit);
  }
  return oldUrl[0] + "?" + $.param(params);
}

function getNextHref(url) {
  var oldUrl = url.split("?");
  var params = $.parseParams(oldUrl[1]);
  params.offset =
    Number.parseInt(params.offset) + Number.parseInt(params.limit);
  return oldUrl[0] + "?" + $.param(params);
}

// --------- keyboard shortcut listener -------------------------------------
chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case "open-soundcloud":
      commands.switchToSoundcloudTab();
      break;
    case "previous-location":
      commands.switchToPreviousLocation();
    default:
      break;
  }
});

// https://gist.github.com/kares/956897
(function($) {
  var re = /([^&=]+)=?([^&]*)/g;
  var decodeRE = /\+/g; // Regex for replacing addition symbol with a space
  var decode = function(str) {
    return decodeURIComponent(str.replace(decodeRE, " "));
  };
  $.parseParams = function(query) {
    var params = {},
      e;
    while ((e = re.exec(query))) {
      var k = decode(e[1]),
        v = decode(e[2]);
      if (k.substring(k.length - 2) === "[]") {
        k = k.substring(0, k.length - 2);
        (params[k] || (params[k] = [])).push(v);
      } else params[k] = v;
    }
    return params;
  };
})(jQuery);
