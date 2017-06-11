// Initialize soundcloud API with client key
$.getJSON("../config.json", function(data) {
  SC.initialize({
    client_id: data["soundcloud_client_id"]
  });
  console.log(SC);
});


chrome.runtime.onMessage.addListener(function(msg, sender, response) {
  var searchedTracks = [];
  var general = msg['general'];
  SC.get("/tracks", {
    q: msg['general']
  }).then(function(tracks) {
    console.log(tracks);
  }, function(error) {
    console.log("Error: " + error);
  });

  // var SC = msg["SC"];
  // SC.get("/users", {
  //   q: "imsteev"
  // }).then(function(users) {
  //   console.log(users[0]);
  // }, function(error) {
  //   console.log("Error: " + error);
  // });
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
