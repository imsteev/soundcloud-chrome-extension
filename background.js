chrome.commands.onCommand.addListener(function (command) {
  if (command === "open-player") {
    chrome.tabs.create({url : "http://google.com" });
  }
});
