function getPopupSearch() {
  return {
    "general": $("#general").val(),
    "artist": $("#artist").val(),
    "genre": $("#genre").val()
  }
}

var port = chrome.runtime.connect({
  "name": "soundcloud query port"
});

$("#search").on('click', function() {
  port.postMessage(getPopupSearch());
});

port.onMessage.addListener(function(msg, sender, response) {
  switch (msg.message) {
    case "search":
      var tracks = msg.content.collection;
      var nextHref = msg.content.next_href;
      console.log(tracks);
      console.log(nextHref);

      $(".tracks").empty();
      for (var i = 0; i < tracks.length; i++) {
        $(".tracks").append("<p>" + tracks[i].title + "</p></br>");
      }
      break;
    case "current song":
      $(".current-song").append("<h1>Current song</h1>" + "<p>" + msg.content.title + "</p>");
      break;
    default:
      break;
  }
});

//TODO: maintain current set of tracks searched, playing song, etc.
