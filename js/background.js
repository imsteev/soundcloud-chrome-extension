// Initialize soundcloud API with client key
$.getJSON("../config.json", function(data) {
  SC.initialize({
    client_id: data["soundcloud_client_id"]
  });
});

function sendMessage(port, message) {
  port.postMessage(message);
}

function sendCurrentSong(port) {
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
        "message": "current-song",
        "content": currentlyPlaying
      });
    }
  });
}

chrome.runtime.onConnect.addListener(function(port) {
  console.log("Connected to " + port.name);

  sendCurrentSong(port);

  port.onMessage.addListener(function(msg) {
    var searchString = msg.content;
    SC.get("/tracks", {
      q: searchString,
      linked_partitioning: 1
    }).then(function(res) {
      console.log("message from popup: " + msg);
      console.log(res);
      port.postMessage({
        "message": "search-results",
        "content": res
      });
    }, function(error) {
      console.log("Error: " + error);
    });
  });
});

// --------- KEYBOARD SHORTCUT LISTENERS -------------------------------------
function switchToTabInWindow(tabId, windowId) {
  var windowUpdateInfo = {
    "focused": true
  };
  chrome.windows.update(windowId, windowUpdateInfo);
  // TODO: not all tabs will have an id.
  var tabUpdateInfo = {
    "active": true
  };
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
