var port = chrome.runtime.connect({
  "name": "soundcloud query port"
});

$("#search").on('click', function() {
  var searchString = $("#search-bar").val();
  if (searchString.length > 0) {
    port.postMessage(searchString);
  }
});

//TODO: on clicking the button, un-focus

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
        $(".current-song").append("<h4>current song</h4>" + "<h3 id='song-name'>" + title + "</h3>");
      break;
    default:
      break;
  }
});

//TODO: maintain current set of tracks searched, playing song, etc.
