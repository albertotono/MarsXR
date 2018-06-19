'use strict';

var app = require('./server/server');

// start server
var server = app.listen(app.get('port'), function () {
  if (process.env.FORGE_CLIENT_ID == null || process.env.FORGE_CLIENT_SECRET == null)
    console.log('*****************\nWARNING: Forge Client ID & Client Secret not defined as environment variables.\n*****************');

  console.log('Starting at ' + (new Date()).toString());
  console.log('Server listening on port ' + server.address().port);

  var io = require('socket.io').listen(server);
  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
    socket.on('join', function (room) { // Join the room in \'the Session '\Create-Join-Emit-Receive-Restore
      console.log('join: ' + room);
      socket.join(room.viewableId);// Id understand which Session we need to join
    });
    socket.on('statechanged', function (data) {
      socket.to(data.viewableId).emit('newstate', data.state);
    });
  });
});