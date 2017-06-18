var port = chrome.runtime.connect({
  "name": "soundcloud query port"
});

$("#search").on('click', function() {
  var searchString = $("#search-bar").val();
  if (searchString.length > 0) {
    console.log(searchString);
    port.postMessage({
      "message": "search",
      "content": searchString
    });
  }
});

$("#search-bar").keypress(function(e) {
  if (e.which == 13) {
    $("#search").click();
  }
});

//TODO: on clicking the button, un-focus
port.onMessage.addListener(function(msg, sender, response) {
  switch (msg.message) {
    case "search-results":
      var tracks = msg.content.collection;
      var nextHref = msg.content.next_href;
      console.log(tracks);
      console.log(nextHref);

      $(".tracks").empty();
      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i]
        $(".tracks").append("<div><p>" + track.title + "</p></div>");
        $(".tracks").append(playButton(track.permalink_url));
      }
      break;
    case "current-song":
      var title = msg.content.title;
      $(".current-song").append("<h4>current song</h4><h3 id='song-name'>" + title + "</h3>");
      break;
    default:
      break;
  }
});

function playButton(url) {
  var btn = $('<button/>', {
    text: 'play',
    click: function() {
      chrome.tabs.create({
        url: url,
        active: false,
        pinned: true
      });
    }
  });
  return btn
}
//TODO: maintain current set of tracks searched, playing song, etc.
