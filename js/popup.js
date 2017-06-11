function getPopupSearch() {
  return {
    "general": $("#general").val(),
    "artist": $("#artist").val(),
    "genre": $("#genre").val()
  }
}

$("#testButton").on('click', function() {
  chrome.runtime.sendMessage(getPopupSearch());
});
// SC.get("/users", {
//   q: "imsteev"
// }).then(function(users) {
//   console.log(users[0]);
// }, function(error) {
//   console.log("Error: " + error);
// });
