// Initialization --------------------------------------------------------------
$.getJSON("../config.json", function(data) {
  console.log("initialized");
  SC.initialize({
    client_id: data["soundcloud_client_id"]
  });
});

chrome.storage.sync.clear();
var stream = null;
var currentTracks = null;
var currentSongIdx = -1;
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
        playSong(content.index);
        displayCurrentExtensionTrack(port);
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
        if (currentSongIdx < currentTracks.length - 1) {
          playSong(++currentSongIdx);
          try {
            displayCurrentExtensionTrack(port);
          } catch (error) {}
        }
        break;
      case "prev-track":
        if (currentSongIdx > 0) {
          playSong(--currentSongIdx);
          try {
            displayCurrentExtensionTrack(port);
          } catch (error) {}
        }
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
      default:
        break;
    }
  };
  // displayCurrentSong(port); // might not need
  return listener;
}

// BUG: you can't replay the same song over. probably because the stream
// doesn't close/is cached? Have to look into this.
function playSong(index) {
  if (!!stream) {
    stream.pause();
  }

  var track = currentTracks[index];
  chrome.storage.sync.set({
    currentTrack: track
  });

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
        playSong(index + 1);
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
      port.postMessage({
        message: "display-current-track",
        content: {
          track: obj.currentTrack,
          isPlaying: !!stream && stream.controller.getState() === "playing"
        }
      });
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

// --------- KEYBOARD SHORTCUT LISTENERS -------------------------------------
function switchToTabInWindow(tabId, windowId) {
  var windowUpdateInfo = { focused: true };
  chrome.windows.update(windowId, windowUpdateInfo);

  var tabUpdateInfo = { active: true };
  chrome.tabs.update(tabId, tabUpdateInfo);
}

function setPrevPageInfo(tabId, windowId) {
  var newPrevInfo = {
    prevTabId: tabId,
    prevWindowId: windowId
  };
  chrome.storage.sync.set(newPrevInfo);
}

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case "open-soundcloud":
      var activeTabInfo = {
        lastFocusedWindow: true,
        active: true
      };
      chrome.tabs.query(activeTabInfo, function(tabs) {
        if (tabs.length > 0) {
          // only set previous info if the page you are looking at is a
          // "tabbable" window. For example, a develepor tools window. TODO: look more into this.
          setPrevPageInfo(tabs[0].id, tabs[0].windowId);
        }
      });
      var query = {
        url: "*://soundcloud.com/*"
      };
      chrome.tabs.query(query, function(soundcloudTabs) {
        if (soundcloudTabs.length == 0) {
          chrome.tabs.create({
            url: "https://soundcloud.com"
          });
        } else {
          var tabToSwitchTo = null;
          // TODO: try to not have to look thru all the tabs every time. Caching?
          var audibleTabs = soundcloudTabs.filter(function(t) {
            return t.audible == true;
          });
          if (audibleTabs.length > 0) {
            tabToSwitchTo = audibleTabs[0];
          } else {
            tabToSwitchTo = soundcloudTabs[0];
          }
          // TODO: only update if not on tabToSwitchTo
          switchToTabInWindow(tabToSwitchTo.id, tabToSwitchTo.windowId);
        }
      });
      break;
    case "previous-location":
      var prevInfo = ["prevTabId", "prevWindowId"];
      chrome.storage.sync.get(prevInfo, function(prevInfo) {
        if (chrome.runtime.lastError == null) {
          switchToTabInWindow(prevInfo.prevTabId, prevInfo.prevWindowId);
        }
      });
    default:
      break;
  }
});
