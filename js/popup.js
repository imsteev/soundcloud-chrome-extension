$.getJSON("../config.json", function(data) {
  SC.initialize({
    client_id: data["soundcloud_client_id"]
  });
  SC.get("/users", {
    q: "imsteev"
  }).then(function(users) {
    console.log(users[0]);
  }, function(error) {
    console.log("Error: " + error);
  });
});

$("#testButton").on('click', function() {
  chrome.runtime.sendMessage({
    "from": "popup!!!!!!!"
  });
});
