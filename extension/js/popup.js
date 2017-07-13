var port = chrome.runtime.connect({
  name: "soundcloud query port"
});

$(document).ready(function() {
  console.log($("#search-bar"));
  $("#search-bar").get(0).focus();
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

port.onMessage.addListener(function(msg, sender, response) {
  switch (msg.message) {
    case "display-tracks":
      var tracks = msg.content.collection;
      var nextHref = msg.content.next_href;

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
      if (msg.content === undefined && msg.content === {}) {
        break;
      }
      var track = msg.content.track;
      var isPlaying = msg.content.isPlaying;

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
          var off = $(this).children(".off");
          var on = $(this).children(".on");

          on.removeClass("on");
          on.addClass("hidden off");

          off.removeClass("hidden off");
          off.addClass("on");
        },
        id: "toggle-song",
        class: "button button-tiny button-action-flat playing"
      });
      var pauseIcon = createIcon("fa-pause");
      var playIcon = createIcon("fa-play");

      console.log("isPlaying is: " + isPlaying);
      console.log(
        "currentSong children is: " + $(".current-song").children().length
      );

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

      $(".current-song").empty();
      $(".current-song").append(trackHeader);
      $(".current-song").append(image);
      $(".current-song").append(btn);
      break;
    default:
      break;
  }
});

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
