// Initialization --------------------------------------------------------------
$.getJSON("../config.json", function(data) {
  console.log('initialized');
  SC.initialize({
    client_id: data["soundcloud_client_id"]
  });
});
chrome.storage.sync.clear();
var stream = null;
var n = 0;
// -----------------------------------------------------------------------------
function sendMessage(port, msg, details) {
  port.postMessage({
    message: message,
    content: details
  });
}

function displayCurrentSong(port) {
  // chrome.storage.sync.get("currentTracks", function(tracks) {
  //   console.log('getting sstored tracks');
  //   port.postMessage({
  //     message: "search-results",
  //     content: Object.values(tracks)
  //   });
  // });
  displayCurrentTrack(port);
  chrome.tabs.query({
    "url": "*://soundcloud.com/*"
  }, function(soundcloudTabs) {
    if (soundcloudTabs.length > 0) {
      var currentlyPlaying = null;
      // TODO: try to not have to look thru all the tabs every time. Caching?
      var audibleTabs = soundcloudTabs.filter(function(t) {
        return t.audible == true;
      });
      if (audibleTabs.length == 0) {
        return;
      }
      currentlyPlaying = audibleTabs[0];
      console.log(currentlyPlaying);
      port.postMessage({
        "message": "display-current-track",
        "content": currentlyPlaying
      });
    }
  });
}

function displayTracks(port, tracks) {
  port.postMessage({
    message: "display-tracks",
    content: tracks
  });
}

function displayPreviousSearch(port) {
  chrome.storage.sync.get(["previousSearch"], function(obj) {
    if ((chrome.runtime.lastError == null) && ('previousSearch' in obj)) {
      SC.get('/tracks', obj.previousSearch).then(function(res) {
        console.log("previous search is: ")
        console.log(obj.previousSearch);
        displayTracks(port, res);
      });
    }
  });
}

function displayCurrentTrack(port) {
  chrome.storage.sync.get(["currentTrack"], function(obj) {
    if (chrome.runtime.lastError == null &&
      ('currentTrack' in obj) &&
      (!$.isEmptyObject(obj.currentTrack))) {
      port.postMessage({
        message: "display-current-track",
        content: obj.currentTrack
      });
    }
  });
}
chrome.runtime.onSuspend.addListener(function() {
  console.log("reloaded the extension");
});

chrome.runtime.onConnect.addListener(function(port) {
  console.log("Connected to " + port.name + " " + n);
  n += 1;

  clearPagination();
  displayCurrentSong(port);
  displayPreviousSearch(port);
  console.log(port.onMessage.removeListener);
  port.onMessage.addListener(createListener(port));
});


// Assumes valid API url from soundcloud
function getPrevHref(url) {
  var oldUrl = url.split('?');
  var params = $.parseParams(oldUrl[1]);
  if (params.offset > 0) {
    params.offset = Number.parseInt(params.offset) - Number.parseInt(params.limit);
  }
  return oldUrl[0] + "?" + $.param(params);
}

function getNextHref(url) {
  var oldUrl = url.split('?');
  var params = $.parseParams(oldUrl[1]);
  params.offset = Number.parseInt(params.offset) + Number.parseInt(params.limit);
  return oldUrl[0] + "?" + $.param(params);
}

function clearPagination() {
  chrome.storage.sync.remove(["prevTracks", "nextTracks"])
}


function createListener(port) {
  var listener = function(msg) {
    n += 1;
      //TODO: On each successive message in a row (e.g not closing the popup),
      //      you're adding another listener. Need to remove 'previous' listener.
    console.log("<MESSAGE INCOMING FROM POPUP>");
    console.log("Port action: " + msg.message);
    console.log("Content: " + msg.content);
    console.log("<END OF MESSAGE>");

    var content = msg.content;
    var message = msg.message;
    switch (message) {
      case "play-song":
          var track = content;
          SC.stream('/tracks/' + track.id).then(function(player) {
            player.on('state-change', function(state) {
              console.log('state changed ' + state);
            })
            player.on('finish', function() {
              chrome.storage.sync.set({
                'currentTrack': {}
              });
            })
            player.on('buffering_start', function() {
              console.log('buffering start');
            })
            player.on('buffering_end', function() {
              console.log('end buffering');
            })

            player.play();

            stream = player;
          });
          chrome.storage.sync.set({
            "currentTrack": track
          });
          displayCurrentSong(port);
          break;
      case "search":
          var searchString = content;
          var searchInfo = {
            q: searchString,
            limit: 10,
            linked_partitioning: 1
          }
          SC.get("/tracks", searchInfo).then(function(res) {
            chrome.storage.sync.set({
              "previousSearch": searchInfo
            });
            displayTracks(port, res);
          });
          break;
      case "pause":
        if (!!stream) {
          stream.pause();
        }
        break;
      case "next":
          break;
      case "prev":
          break;
      case "get-reposts":
          break;
      case "next-tracks":
        var currentTrackHref = content;
        console.log(currentTrackHref);
        $.getJSON(currentTrackHref, function(res) {
          
          displayTracks(port,res);
          chrome.storage.sync.set({"prevTracks" : getPrevHref(currentTrackHref) });
        });        
        break;
      case "prev-tracks":
        chrome.storage.sync.get("prevTracks", function(obj) {
          if (chrome.runtime.lastError == null && !$.isEmptyObject(obj)) {
            var currentTrackHref = obj.prevTracks;
            $.getJSON(obj.prevTracks, function(res) {
              //TODO THIS IS SO BUGGY WHY IS IT BEING CALLED SO MANY TIMES :C 
              displayTracks(port,res);
              chrome.storage.sync.set({"prevTracks" : getPrevHref(currentTrackHref) });
            });
          }
        });
        break;
      default:
          break;
    }
  }
  return listener;
}


// --------- KEYBOARD SHORTCUT LISTENERS -------------------------------------
function switchToTabInWindow(tabId, windowId) {
    var windowUpdateInfo = { "focused": true };
    chrome.windows.update(windowId, windowUpdateInfo);

    var tabUpdateInfo = { "active": true };
    chrome.tabs.update(tabId, tabUpdateInfo);
}

function setPrevPageInfo(tabId, windowId) {
    var newPrevInfo = {
      "prevTabId": tabId,
      "prevWindowId": windowId
    };
    chrome.storage.sync.set(newPrevInfo);
}


chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case "open-soundcloud":
      var activeTabInfo = {
        "lastFocusedWindow": true,
        "active": true
      };
      chrome.tabs.query(activeTabInfo, function(tabs) {
        if (tabs.length > 0) {
          // only set previous info if the page you are looking at is a
          // "tabbable" window. For example, a develepor tools window. TODO: look more into this.
          setPrevPageInfo(tabs[0].id, tabs[0].windowId);
        }
      });
      var query = {
        "url": "*://soundcloud.com/*"
      }
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

// https://gist.github.com/kares/956897
(function($) {
var re = /([^&=]+)=?([^&]*)/g;
var decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
var decode = function (str) {return decodeURIComponent( str.replace(decodeRE, " ") );};
$.parseParams = function(query) {
    var params = {}, e;
    while ( e = re.exec(query) ) { 
        var k = decode( e[1] ), v = decode( e[2] );
        if (k.substring(k.length - 2) === '[]') {
            k = k.substring(0, k.length - 2);
            (params[k] || (params[k] = [])).push(v);
        }
        else params[k] = v;
    }
    return params;
};
})(jQuery);