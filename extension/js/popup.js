var port = chrome.runtime.connect({
  "name": "soundcloud query port"
});

$("#search").on('click', function() {
  var searchString = $("#search-bar").val();
  if (searchString.length > 0) {
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

$("#show-tracks").on('click', function () {
  $(".tracks").toggle();
});

port.onMessage.addListener(function(msg, sender, response) {
  switch (msg.message) {
    case "display-tracks":
      var tracks = msg.content.collection;
      var nextHref = msg.content.next_href;

      $("#next-tracks").off('click');
      $("#next-tracks").on('click', function() {
        port.postMessage({
          message: "next-tracks",
          content: nextHref
        });        
      });

      $("#prev-tracks").off('click');
      $("#prev-tracks").on('click', function() {
        port.postMessage({
          message: "prev-tracks",
          content: nextHref
        });        
      });

      // Any way to do an ajax call?
      $(".tracks").empty();

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i]
        var prevTrack = i > 0 ? tracks[i-1] : tracks[tracks.length-1];
        var nextTrack = i < tracks.length - 1 ? tracks[i+1] : tracks[0];

        var trackItem = createTrackItem(port,track,prevTrack,nextTrack);
        $(".tracks").append(trackItem);
      }
      break;
    case "display-current-track":
      $(".current-song").empty();
      if (msg.content !== undefined && msg.content !== {}) {
        console.log("mesage content");
        console.log(msg.content);
        var track = msg.content;
        var trackHeader = $("<h4>", {
          id : 'current-track-header',
          text : track.title
        });
        $(".current-song").append(trackHeader);
        $(".current-song").append($("<img>", {
          src: track.artwork_url
        }));
      }
      break;
    default:
      break;
  }
});

function createCurrentTrackItem(track) {

}

function createTrackItem(port, track,prevTrack, nextTrack) {
    var button = $('<button>', {
      class: 'button button-square',
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
    var title = "<span>" + track.title + "</span>";
    var trackIdInput = $('<input>', {
      type: 'hidden',
      name: 'track-id',
      value: track.id
    });

    var prevTrackIdInput = $('<input>', {
      type: 'hidden',
      name: 'prev-track-id',
      value: prevTrack.id
    });

    var nextTrackIdInput = $('<input>', {
      type: 'hidden',
      name: 'next-track-id',
      value: nextTrack.id
    });

    $.each([title, button, trackIdInput, prevTrackIdInput, nextTrackIdInput], function(id, elem) {
      item.append(elem);
    });
    return item;
}
