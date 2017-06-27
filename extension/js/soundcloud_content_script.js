// TODO: use https://developer.chrome.com/extensions/tabs#method-executeScript
// chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
//     sendResponse({
//       message: "hello from content script"
//     }));
//   return true;
// }
// $(".playButton").click();
console.log("This is the content script in soundcloud.com");
$(document).ready(function() {
  console.log("done loading");
  var firstSongButton = $(".playButton");
  console.log(firstSongButton);
});
