var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	port = 6606,
	currentRoom,
	multer = require('multer'),
    unzip = require('unzip'),
    upload = multer({dest: 'public/models/'})
	fs = require('fs');

app.use(express.static(__dirname + '/public'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

server.listen(port);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/upload', upload.any(), function(req, res, next){
    console.log('uploaded: '+req.files[0].originalname+' '+req.files[0].filename);
    fs.createReadStream(req.files[0].path).pipe(unzip.Extract({path:req.files[0].path}));
});

io.sockets.on('connection', function(socket) {
	socket.on('room', function(data) {
		var newRoom = data.newRoom;
		currentRoom = data.currentRoom;
		if(currentRoom != undefined) {
			socket.leave(currentRoom);
			console.log('New client connected: '+socket.id+' Room: '+newRoom);
			//io.in(currentRoom).emit('new message', {currentRoom, message: '<strong>A user has disconnected from the room.</strong>'});
			socket.room = newRoom;
		}
		else {
			socket.room = "Global Chat";
		}
		socket.join(newRoom);
		socket.emit('new message', {newRoom, message: ('Joined room: '+newRoom)});
	});

	socket.on('update', function(data) {
		console.log('Received update');
		socket.in(data.room).broadcast.emit('update', data);
		console.log('Sent update');
	});

	socket.on('send message', function(data) {
		var room = data.room;
		var message = data.message;
		io.in(data.room).emit('new message', {room, message});
	});

	socket.on('disconnect', function() {
		if(currentRoom === undefined) currentRoom = "Global Chat";
		console.log('Client disconnected: '+socket.id+' Room: '+newRoom);
		//io.in(currentRoom).emit('new message', {currentRoom, message: '<strong>A user has disconnected from the room.</strong>'});
	});
});

console.log("Server started on port "+port+"...");
