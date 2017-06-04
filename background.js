function switchToTabInWindow(tabId,windowId) {
  var windowUpdateInfo = { "focused" : true };
  chrome.windows.update(windowId, windowUpdateInfo);

  // TODO: not all tabs will have an id.
  var tabUpdateInfo = { "active" : true };
  chrome.tabs.update(tabId,tabUpdateInfo);
}

function setPrevPageInfo(tabId,windowId) {
  var newPrevInfo = {
    "prevTabId" : tabId,
    "prevWindowId" : windowId
  };
  chrome.storage.sync.set(newPrevInfo);
}

function getActiveTab() {
  var activeTabInfo = {"currentWindow": true, "active" : true};
  return chrome.tabs.query(activeTabInfo,function (tabs) {
    console.log("getting active tab");
    console.log(tabs.length);
    return tabs[0];
  });
}
chrome.tabs.onActivated.addListener(function (activeInfo) {
  setPrevPageInfo(activeInfo.tabId,activeInfo.windowId);
});

// Keyboard shortcuts for this extension
chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "open-player" :
      // TODO: bring up the audio UI
      break;
    case "open-soundcloud" :
      var activeTab = getActiveTab();
      setPrevPageInfo(activeTab.id, activeTab.windowId);
      var query = {
        "url" : "*://soundcloud.com/*"
      }
      chrome.tabs.query(query,function(soundcloudTabs) {
        if (soundcloudTabs.length == 0) {
          chrome.tabs.create({ url : "https://soundcloud.com" });
        } else {
          var tabToSwitchTo = null;
          // TODO: try to not have to look thru all the tabs every time. Caching?
          var audibleTabs = soundcloudTabs.filter(function (t) {
            return t.audible == true;
          });
          if (audibleTabs.length > 0) {
            tabToSwitchTo = audibleTabs[0]; // still need to do a better switching
          } else {
            tabToSwitchTo = soundcloudTabs[0];
          }
          // TODO: only update if not on tabToSwitchTo
          switchToTabInWindow(tabToSwitchTo.id,tabToSwitchTo.windowId);
        }
      });
      break;
    case "previous-location" :
      var prevInfo = ["prevTabId", "prevWindowId"];
      chrome.storage.sync.get(prevInfo, function (prevInfo) {
        if (chrome.runtime.lastError == null) {
          console.log("going back");
          switchToTabInWindow(prevInfo.prevTabId,prevInfo.prevWindowId);
        }
      });
      break;
    default: break;
  }
});
