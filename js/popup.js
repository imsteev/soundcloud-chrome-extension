var port = chrome.runtime.connect({
  "name": "soundcloud query port"
});

$("#search").on('click', function() {
  var searchString = $("#search-bar").val();
  if (searchString.length > 0) {
    port.postMessage(searchString);
  }
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
      var title = msg.content.title;
      var name =
        $(".current-song").append("<h3>current song</h3>" + "<h2 id='song-name'>" + title + "</h2>");
      break;
    default:
      break;
  }
});

//TODO: maintain current set of tracks searched, playing song, etc.
