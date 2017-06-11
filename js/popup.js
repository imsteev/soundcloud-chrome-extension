SC.initialize({
  client_id: "YOUR_CLIENT_ID"
});

SC.get("/users", {
  q: "imsteev"
}).then(function(users) {
  console.log(users[0]);
}, function(error) {
  console.log("Error: " + error);
});
