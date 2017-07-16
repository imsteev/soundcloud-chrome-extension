function commands(chrome) {
  var self = this;

  self.switchToSoundcloudTab = function() {
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
  };

  self.switchToPreviousLocation = function() {
    var prevInfo = ["prevTabId", "prevWindowId"];
    chrome.storage.sync.get(prevInfo, function(prevInfo) {
      if (chrome.runtime.lastError == null) {
        switchToTabInWindow(prevInfo.prevTabId, prevInfo.prevWindowId);
      }
    });
  };

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
}
