// Keyboard shortcuts for this extension
chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "open-player" :
      chrome.tabs.create({url : "http://google.com" });
      break;
    case "open-soundcloud" :
      console.log("opening soundcloud");
      var query = {
        "url" : "*://soundcloud.com/*"
      }
      chrome.tabs.query(query,function(soundcloudTabs) {
        if (soundcloudTabs.length == 0) {
          chrome.tabs.create({ url : "https://soundcloud.com" });
        } else {
          var tab = soundcloudTabs[0]; // TODO: determine which active tab to switch to. For now, just go to the first soundcloud tab that is already open
          
        }
      });
    default: break;
  }
});
