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
  console.log(msg);
  var tracks = msg.SC_response.collection;
  var nextHref = msg.SC_response.next_href;

  console.log(tracks);
  console.log(nextHref);
  for (var i = 0; i < tracks.length; i++) {
    $(".tracks").append("<p>" + tracks[i].title + "</p></br>");
  }
});

//TODO: maintain current set of tracks searched, playing song, etc.
