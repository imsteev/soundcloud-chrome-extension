// Keyboard shortcuts for this extension
chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "open-player" :
      chrome.tabs.create({url : "http://google.com" });
      break;
    case "open-soundcloud" :
      // console.log("opening soundcloud");
      var query = {
        "url" : "*://soundcloud.com/*"
      }
      chrome.tabs.query(query,function(soundcloudTabs) {
        if (soundcloudTabs.length == 0) {
          chrome.tabs.create({ url : "https://soundcloud.com" });
        } else {
          console.log("some tabs already open, switch to that tab");
          var tabToSwitchTo = null;
          var audibleTabs = soundcloudTabs.filter(function (t) {
            return t.audible == true;
          });
          if (audibleTabs.length > 0) {
            tabToSwitchTo = audibleTabs[0]; // still need to do a better switching
          } else {
            tabToSwitchTo = soundcloudTabs[0];
          }
          var windowUpdateInfo = {
            "focused" : true
          };
          var tabUpdateInfo = {
            "active" : true
          };
          chrome.windows.update(tabToSwitchTo.windowId, windowUpdateInfo);
          // TODO: not all tabs will have an id.
          chrome.tabs.update(tabToSwitchTo.id,tabUpdateInfo);
        }
      });
    default: break;
  }
});
