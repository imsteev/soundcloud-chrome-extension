var port = chrome.runtime.connect({
  name: "soundcloud query port"
});

$("#search").on("click", function() {
  var searchString = $("#search-bar").val();
  if (searchString.length > 0) {
    port.postMessage({
      message: "search",
      content: searchString
    });
  }
});

$("#search-bar").keypress(function(e) {
  if (e.which == 13) {
    $("#search").click();
  }
});

$("#show-tracks").on("click", function() {
  $(".tracks").toggle();
});

$("#song-header").on("click", function() {
  var href = $(this).attr("song-href");
  if (href === "") {
    return;
  }
  chrome.tabs.create({ url: href, active: false });
});

port.onMessage.addListener(function(msg, sender, response) {
  var message = msg.message;
  var content = msg.content;

  switch (message) {
    case "display-tracks":
      var tracks = content.collection;
      var nextHref = content.next_href;

      $("#next-tracks").off("click");
      $("#next-tracks").on("click", function() {
        port.postMessage({
          message: "next-tracks",
          content: nextHref
        });
      });

      $("#prev-tracks").off("click");
      $("#prev-tracks").on("click", function() {
        port.postMessage({
          message: "prev-tracks",
          content: nextHref
        });
      });

      // Any way to do an ajax call?
      $(".tracks").empty();

      $.each(tracks, function(i, track) {
        var trackItem = createTrackItem(port, track, i);
        $(".tracks").append(trackItem);
      });
      break;
    case "display-current-track":
      if (!!!content || content === {}) {
        break;
      }
      var track = content.track;
      var isPlaying = content.isPlaying;

      $("#song-header").attr("song-href", track.permalink_url);

      var trackHeader = $("<h4>", {
        id: "current-track-header",
        text: track.title
      });
      var image = $("<img>", {
        src: track.artwork_url
      });

      var btn = $("<button />", {
        click: function() {
          port.postMessage({
            message: "toggle",
            content: {}
          });
        },
        id: "toggle-song",
        class: "button button-tiny button-action-flat playing"
      });

      var pauseIcon = createIcon("fa-pause");
      var playIcon = createIcon("fa-play");

      // TODO: handle the case where you first click a song. It won't be
      // playing at first, but it should have the pause icon on since it
      // momentarily will
      if (isPlaying) {
        playIcon.addClass("hidden off");
        pauseIcon.addClass("on");
      } else {
        playIcon.addClass("on");
        pauseIcon.addClass("hidden off");
      }

      btn.append(pauseIcon);
      btn.append(playIcon);

      setToggleElements(btn, [pauseIcon, playIcon], "on", "off");

      var prevTrack = $("<button>", {
        click: function() {
          port.postMessage({
            message: "prev-track",
            content: {}
          });
        },
        id: "prev-track",
        class: "button button-tiny button-action-flat"
      });
      var prevIcon = createIcon("fa-chevron-left");
      prevTrack.append(prevIcon);

      var nextTrack = $("<button>", {
        click: function() {
          port.postMessage({
            message: "next-track",
            content: {}
          });
        },
        id: "next-track",
        class: "button button-tiny button-action-flat"
      });
      var nextIcon = createIcon("fa-chevron-right");
      nextTrack.append(nextIcon);

      var replayTrack = $("<button>", {
        click: function() {
          port.postMessage({
            message: "replay",
            content: {}
          });
        },
        id: "replay",
        class: "button button-tiny button-action-flat"
      });
      var replayIcon = createIcon("fa-repeat");
      replayTrack.append(replayIcon);

      var songControls = $("<div>", {
        class: "current-song-controls"
      });
      songControls.append(prevTrack);
      songControls.append(btn);
      songControls.append(nextTrack);
      songControls.append(replayTrack);

      $(".current-song").empty();
      $(".current-song").append(trackHeader);
      $(".current-song").append(image);
      $(".current-song").append(songControls);
      break;
    case "no-internet-connection": {
      $(".no-connection").removeClass("hidden");
      break;
    }
    default:
      break;
  }
});

// This function takes in a list of elements to toggle on/off. Only one
// element in this list will be visible at any given moment.
// The onClass and offClass arguments are identifiers that make it
// easy to select the elements.
function setToggleElements(button, elements, onClass, offClass) {
  button.on("click", function() {
    var onIdx = elements.findIndex(function(elem) {
      return elem.hasClass(onClass);
    });
    var curOn = elements[onIdx];
    curOn.removeClass(onClass);
    curOn.addClass(offClass + " hidden");

    var nextOn = elements[(onIdx + 1) % elements.length];
    nextOn.removeClass(offClass + " hidden");
    nextOn.addClass(onClass);
  });
}

function createIcon(fontAwesomeClass) {
  return $("<i>", {
    class: "fa " + fontAwesomeClass
  });
}

function createTrackItem(port, track, i) {
  var item = $("<li>");

  var title = $("<span>", { text: track.title });
  var titleCols = $("<div>", { class: "col-xs-9" });
  titleCols.append(title);

  var button = $("<button>", {
    class: "button button-square",
    click: function() {
      port.postMessage({
        message: "play-song",
        content: {
          track: track,
          index: i
        }
      });
    }
  });
  button.append(createIcon("fa-play"));
  var buttonCols = $("<div>", { class: "col-xs-2" });
  buttonCols.append(button);

  var row = $("<div>", { class: "row" });
  row.append(titleCols);
  row.append(buttonCols);
  item.append(row);
  item.append($("<hr>"));

  return item;
}
