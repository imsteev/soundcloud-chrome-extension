// TODO: use https://developer.chrome.com/extensions/tabs#method-executeScript
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
      sendResponse({
        message: "hello from content script"
      });
      return true;
    }
