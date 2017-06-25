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
    case "display-tracks":
      var tracks = msg.content.collection;
      var nextHref = msg.content.next_href;

      // Any way to do an ajax call?
      $(".tracks").empty();

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i]
        var trackItem = createTrackItem(track);
        $(".tracks").append(trackItem);
      }
      break;
    case "display-current-track":
      $(".current-song").empty();
      if (msg.content !== undefined && msg.content !== {}) {
        console.log("mesage content");
        console.log(msg.content);
        var title = msg.content.title;
        $(".current-song").append("<h4>current song</h4><h3 id='song-name'>" + title + "</h3>");
      }
      break;
    default:
      break;
  }
});

function createCurrentTrackItem(track) {

}

function createTrackItem(track) {
    var button = $('<button>', {
      class: 'button button-rounded',
      click: function() {
        var trackId = $(this).siblings("input")[0].value;
        port.postMessage({
          "message": "play-song",
          "content": track
        })
      }
    });
    button.append($('<i>', {
      class: 'fa fa-play aria-hidden'
    }));

    var item = $("<li>");
    var title = "<h4>" + track.title + "</h4>";
    var image = $("<img>", {
      src: track.artwork_url
    });
    var trackIdInput = $('<input>', {
      type: 'hidden',
      value: track.id
    });

    $.each([title, image, button, trackIdInput], function(id, elem) {
      item.append(elem);
    });
    return item;
}
