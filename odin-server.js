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
	res.send(req.files[0].originalname.replace('.zip',''));
});

io.sockets.on('connection', function(socket) {
	socket.on('room', function(data) {
		socket.room = data.room;
		socket.join(data.room);
		socket.emit('new message', {message: ('Joined room: '+data.room)});
		console.log('Client connected: '+socket.id+' Room: '+socket.room);
	});

	socket.on('update', function(data) {
		console.log(data);
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
		console.log('Client disconnected: '+socket.id+' Room: '+socket.room);
		//io.in(currentRoom).emit('new message', {currentRoom, message: '<strong>A user has disconnected from the room.</strong>'});
	});
});

console.log("Server started on port "+port+"...");
