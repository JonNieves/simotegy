
/*
MAP
	1. VARIABLE DECLARATIONS
	2. PREGAME CLIENT
	3. GAME CLIENT
	4. DEFINING FUNCTIONS PREGAME
	3. DEFINING FUNCTIONS GAMEPLAY
	4. PLAYER CONTROLS
*/

/*
VARIABLE DECLARATIONS===========================================
VARIABLE DECLARATIONS===========================================
VARIABLE DECLARATIONS===========================================
VARIABLE DECLARATIONS===========================================
VARIABLE DECLARATIONS===========================================
VARIABLE DECLARATIONS===========================================
VARIABLE DECLARATIONS===========================================
*/

//THIS IS SERVER SPECIFIC
//required variables for express and socket.io
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

//server listening on port 8000
server.listen(port, function(){
	console.log('server ready - listening on *:8000');
});

/*
VARIABLES
VARIABLES
VARIABLES
VARIABLES
VARIABLES
VARIABLES
VARIABLES
VARIABLES
*/

//keep track of room objects
var rooms = [];

//create the first 2 rooms, the reception and lobby
var buffer = new createRoom("buffer");
rooms.push(buffer); //first room connections join, only allowing connections that choose a name to progress to the lobby
var lobby = new createRoom("lobby");
rooms.push(lobby); //where players gather, 

//keep track of which players are ready for which game mode
//this is strictly for players still in the lobby, when they enter a game, they leave these arrays
var readyFor1v1 = [];
var readyFor2v2 = [];
var readyFor3v3 = [];
var readyFor4v4 = [];
var readyFor5v5 = [];
var readyFor6v6 = [];

//holds chat messages
var messages = [];

//remember which names have been chosen, to prevent 2 players from having the same name
var namesTaken = [];

/*
RESPONSE TO BROWSER GET REQUESTS===============================================
RESPONSE TO BROWSER GET REQUESTS===============================================
RESPONSE TO BROWSER GET REQUESTS===============================================
RESPONSE TO BROWSER GET REQUESTS===============================================
RESPONSE TO BROWSER GET REQUESTS===============================================
RESPONSE TO BROWSER GET REQUESTS===============================================
RESPONSE TO BROWSER GET REQUESTS===============================================
*/

//responses to browser file requests
//first give index.html

app.get('/', function (request, response) {
	response.sendFile(__dirname + '/index.html');
});

//in case of work needing to be done, I can use this page to tell users such
/*
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/wip.html');
});
*/

/*
app.get( '/*' , function( req, res, next ) {
	//This is the current file they have requested
	var file = req.params[0];
	//Send the requesting client the file.
	res.sendFile( __dirname + '/' + file );
});
*/

app.get( '/*' , function( req, res, next ) {
	//This is the current file they have requested
	var file = req.params[0];
	
	//do not respond to request for appjs
	var test = "app.js".localeCompare(file);
	
	if (test != 0){
		//Send the requesting client the file.
		res.sendFile( __dirname + '/' + file );
	}
	else {
		res.status(500).send('Something broke!');
	}
});

//this is called when a client connects which they do with var socket = io.connect();
io.on('connection', function (socket) {
	/*
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	PREGAME SERVER STUFF========================================================
	*/
	
	//save ID of client for use in functions
	var clientID = socket.id;
	var clientSocket = socket;
	newClientArrived(clientSocket);
	
	//receive a user's name and attach it to the corresponding array
	//at the corresponding slot. ALSO, tells clients when room is full
	socket.on('my name is', function(name){
		//if the name is of acceptable size
		if (name.length < 30){
			var check = checkIfNameTaken(name);
			if (check == false){
				attachNamesToPlayers(clientID, name);
			}
			else if (check == true){
				socket.emit('retryName', 2);
			}

		}
		//if the name is too large
		else {
			socket.emit('retryName', 3);
		}
	});
	
	//user sent a text message
	socket.on('chatMessage', function(message){
		updateChat(message, 3);
	});
	
	//user sent secret message, ready for training
	socket.on('training', function(){
		readyProcedure(clientID, 0);
	});
	
	//upon a user disconnecting, remove and broadcast removal
	socket.on('disconnect', function(){
		removeDisconnected(clientID);
	});
	
	socket.on('keepAlive', function(rName){
		socket.emit('stillAlive');
		
		//update this player's alive check
		var checkRoom;
		var checkPlayer;
		
		//check every room, but the first (the buffer room)
		for (ri = 1; ri < rooms.length; ri++){
			checkRoom = rName.localeCompare(rooms[ri].name);
			if (checkRoom == 0){
				//check every player
				for (rpi = 0; rpi < rooms[ri].players.length; rpi++){
					checkPlayer = clientID.localeCompare(rooms[ri].players[rpi].sock.id);
					//if this player sent this keep alive, refresh their alive check
					if (checkPlayer == 0){
						rooms[ri].players[rpi].aliveCheck = 0;
					}
				}
			}
		}
	});
	
	//user says they are ready to play now
	socket.on('ready', function(gameModeSelected){
		readyProcedure(clientID, gameModeSelected);
	});
	
	//user says they are not ready to play now
	socket.on('unready', function(){
		unreadyProcedure(clientID);
	});
	
	//user says they are not ready to play now
	socket.on('iHaveReturnedToLobby', function(name){
		updateChat(name + " returned from a game.", 2);
	});
	
	/*
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	INGAME SERVER STUFF====================================================
	*/

	//someone created a spike
	//socket.on('spikeCreated', function(spX, spY, spDir, spIndex, pIndex, roomName){
	//socket.on('spikeCreated', function(spX, spY, spDir, pIndex, roomName){
	socket.on('spikeCreated', function(spikeOb, pIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('spikeCreated', spikeOb, pIndex);
			console.log('BROADCAST: spike creation');
		}
	});

	//someone created a vacuum
	socket.on('vacuumCreated', function(vX, vY, vIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('vacuumCreated', vX, vY, vIndex);
			console.log('BROADCAST: vacuum creation at X: ' + vX + ' Y: ' + vY);
		}
	});

	//spike remove
	socket.on('spikeRemoved', function(spikeID, pIndex, roomName){	
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('spikeRemoved', spikeID, pIndex);
		}
	});

	//vacuum remove
	socket.on('vacuumRemoved', function(vX, vY, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('vacuumRemoved', vX, vY);
		}
	});

	socket.on('pvpCollideKill', function(pIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('pvpCollideKill', pIndex);
		}
	});

	//someone moved
	socket.on('movement', function(newX, newY, mLeft, mRight, mUp, mDown, mDir, pIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('movement', newX, newY, mLeft, mRight, mUp, mDown, mDir, pIndex);
			console.log('BROADCAST: movement by ' + socket.id + ' to ' + rooms[index].name);
		}
	});
	
	//someone teleported
	socket.on('playerTeleport', function(newX, newY, pIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('playerTeleport', newX, newY, pIndex);
			console.log('BROADCAST: movement by ' + socket.id + ' to ' + rooms[index].name);
		}
	});
	
	//tell everyone where someone respawned
	socket.on('playerRespawned', function(pX, pY, pIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('playerRespawned', pX, pY, pIndex);
		}
	});

	//update clients on # of players on flag area
	socket.on('captureUpdate', function(pInArea, pIndex, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			socket.broadcast.to(rooms[index].name).emit('captureUpdate', pInArea, pIndex);
		}
	});
	
	//announce blue victory
	socket.on('BLUE WINS', function(roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			io.to(rooms[index].name).emit('BLUE WINS', messages);
			returnPlayersToLobby(index); //give the function this room's index
		}
	});

	//announce red victory
	socket.on('RED WINS', function(roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		if (check == 0 && rooms[index].players.length > 0){
			io.to(rooms[index].name).emit('RED WINS', messages);
			returnPlayersToLobby(index); //give the function this room's index
		}
	});

	//accept a player's reading of how long there is left til game over
	socket.on('winningCheck', function(blueTime, redTime, roomName){
		//find the room using the room name to identify
		var check;
		var index = 0;
		while (check != 0 && index < rooms.length){
			check = roomName.localeCompare(rooms[index].name);
			//if the room hasn't been found, check the next
			if (check != 0){
				index++;
			}
		}
		//to stop winningchecks from people who haven't quite realized the game is over
		if (check == 0 && rooms[index].players.length > 0){
			rooms[index].howManyIndex++;
		
			if (blueTime < rooms[index].leastTimeLeftBlue){
				rooms[index].leastTimeLeftBlue = blueTime;
			}
			if (redTime < rooms[index].leastTimeLeftRed){
				rooms[index].leastTimeLeftRed = redTime;
			}
			
			if (rooms[index].howManyIndex == rooms[index].players.length){
				io.to(rooms[index].name).emit('winningUpdate', rooms[index].leastTimeLeftBlue, rooms[index].leastTimeLeftRed);
				//io.sockets.emit('winningUpdate', leastTimeLeftBlue, leastTimeLeftRed);
				//reset the index for the next check
				rooms[index].howManyIndex = 0;
				console.log('sent winning update - blue: ' + rooms[index].leastTimeLeftBlue + ' red: ' + rooms[index].leastTimeLeftRed);
			}
		}
	});
});

/*
FUNCTIONS
FUNCTIONS
FUNCTIONS
FUNCTIONS
FUNCTIONS
FUNCTIONS
FUNCTIONS
*/

//create a new room object
function createRoom(n){
	this.name = n; //name of the room
	this.players = []; //this array holds player objects
	this.howManyIndex = 0;
	this.leastTimeLeftBlue = 40;
	this.leastTimeLeftRed = 40;
}

//delete a room object
function deleteRoom(removeThisOne){
	rooms.splice(removeThisOne, 1);
}

//called upon initial io connection
//create a new client and add client to buffer room's players array
function newClientArrived(cSocket){
	//create a new player object
	//the only thing this player really has to be identified with so far is the socket id
	var newGuy = new createPlayer(cSocket, null, false, "buffer");
	
	//add new player to buffer's players array
	rooms[0].players.push(newGuy);
	
	console.log('new client ID: ' + cSocket.id);
}

function createPlayer(s, un, rs, ir){
	this.sock = s;
	this.userName = un;
	this.readyStatus = rs;
	this.inRoom = ir;
	this.prefMode = null; //makes removal from readyFor arrays much easier
	this.aliveCheck = null;
}

//called at socket event 'my name is'
//save the userName the player has chosen in the correct player object
//then add this new player to the lobby room
function attachNamesToPlayers(clientID, name){	
	var checkID;
	var index = 0;
	
	console.log('name attach: starting');
	
	//while the ID in the buffer room hasnt been found
	while (index < rooms[0].players.length && checkID != 0){
		console.log('name attach: searching..');
		//localeCompare will result in 0 if strings are equal
		checkID = clientID.localeCompare(rooms[0].players[index].sock.id);

		//if the ID is a match (equals 0) 
		if (checkID == 0){
			console.log('name attach: id match');
			//save userName to player object, update inRoom
			rooms[0].players[index].aliveCheck = 0;
			rooms[0].players[index].userName = name;
			rooms[0].players[index].inRoom = rooms[1].name;
			//add to lobby
			rooms[1].players.push(rooms[0].players[index]);
			//add to lobby channel
			rooms[0].players[index].sock.join(rooms[1].name);
			//remove from buffer room
			rooms[0].players.splice(index, 1);
			//tell everyone who it is that just arrived
			updateChat(rooms[1].players[rooms[1].players.length-1].userName + " joined lobby.", 1);
			//console log so i'm not flying blind
			console.log('name attach: saving ' + rooms[1].players[rooms[1].players.length-1].userName);
			//add this player's name to namesTaken
			namesTaken.push(name);
		}
		else {
			index++;
		}
	}
}

//add new chat message and broadcast
function updateChat(newMessage, mode){
	
	//the mode alerts the client what sound to play upon a chat update
	
	console.log('updateChat: starting..');
	
	messages[0] = rooms[1].players.length + " player(s) in " + rooms[1].name;
	messages[1] = "Ready for 1v1: " + readyFor1v1.length + "/2";
	messages[2] = "Ready for 2v2: " + readyFor2v2.length + "/4";
	messages[3] = "Ready for 3v3: " + readyFor3v3.length + "/6";
	messages[4] = "Ready for 4v4: " + readyFor4v4.length + "/8";
	messages[5] = "Ready for 5v5: " + readyFor5v5.length + "/10";
	messages[6] = "Ready for 6v6: " + readyFor6v6.length + "/12";
	
	var mindex = messages.length;
	
	console.log('updateChat: messages.length = ' + messages.length);
	
	//to keep the messages fitting within the canvas 
	//the # of messages must be limited so older ones
	//are replaced
	if (messages.length > 20){
		console.log('updateChat: messages too big');
		for (i = 7; i < 19; i++){
			console.log('updateChat: in For loop');
			messages[i] = messages[i+1];
		}
		mindex = 19;
		messages[mindex] = newMessage;
	}
	else {
		messages[mindex] = newMessage;
	}
	
	console.log('updateChat: messages updated');
	
	//messages array updated, send to clients in lobby
	io.to(rooms[1].name).emit('chatUpdate', messages, mode);

	console.log('updateChat: broadcasting - ' + newMessage);
}


function removeDisconnected(cID){
	//first, discover the index of the leaver
	//second, discover which room the leaver is in
	//third, announce this person has left
	//fourth, remove player and migrate other players if necessary
	
	console.log('removeDC: starting');
	
	var roomIndex = 0;
	var playerIndex = 0;
	var idCheck;
	
	//go through the rooms
	while (idCheck != 0 && roomIndex < rooms.length){
		console.log('removeDC: checking room ' + roomIndex + '..');

		//go through the players array of each room
		while(idCheck != 0 && playerIndex < rooms[roomIndex].players.length){
			console.log('removeDC: checking players in room ' + roomIndex + '..');
			
			idCheck = cID.localeCompare(rooms[roomIndex].players[playerIndex].sock.id);
			
			//when the player is found, remove their name from namesTaken, remove them from any readyFor tables, and remove them from whatever room they're in
			if (idCheck == 0){
				console.log('removeDC: leaver found');
				
				console.log('removeDC: removing their name..');
				
				var nameCheck;
				var thisName = rooms[roomIndex].players[playerIndex].userName;
				var nameIndex = 0;
				
				while (nameIndex < namesTaken.length && nameCheck != 0){
					nameCheck = thisName.localeCompare(namesTaken[nameIndex]);
					if (nameCheck == 0){
						namesTaken.splice(nameIndex, 1);
					}
					nameIndex++;
				}
				
				console.log('removeDC: name removed');
				
				//3 possibilities; in buffer room, in lobby, in game
				
				//if in buffer room
				if (roomIndex == 0){
					console.log('removeDC: leaver was in buffer room..');
					//remove player
					rooms[roomIndex].players.splice(playerIndex, 1);
					console.log('removeDC: phantom connection removed');
				}
				//if in lobby
				//special for lobby, check/remove if in a readyFor array
				else if (roomIndex == 1){
					console.log('removeDC: leaver was in lobby.. detouring to remove from readyFor arrays..');
					
					//removing from readyFor array
					
					var readyCheck;
					var readyIndex = 0;
					
					if (rooms[roomIndex].players[playerIndex].prefMode == 1){
						while (readyCheck != 0 && readyIndex < readyFor1v1.length){
							console.log('removeDC: searching for leaver in readyFor1v1 array..');
							//compare IDs
							readyCheck = rooms[roomIndex].players[playerIndex].sock.id.localeCompare(readyFor1v1[readyIndex]);
							if (readyCheck == 0){
								console.log('removeDC: removed from readyFor1v1');
								readyFor1v1.splice(readyIndex, 1);
							}
							else {
								readyIndex++;
								if (readyIndex >= readyFor1v1.length){
									console.log('removeDC: never found the leaver');
								}
							}
						}
					}
					else if (rooms[roomIndex].players[playerIndex].prefMode == 2){
						while (readyCheck != 0 && readyIndex < readyFor2v2.length){
							console.log('removeDC: searching for leaver in readyFor array..');
							//compare IDs
							readyCheck = rooms[roomIndex].players[playerIndex].sock.id.localeCompare(readyFor2v2[readyIndex]);
							if (readyCheck == 0){
								console.log('removeDC: removed from readyFor2v2');
								readyFor2v2.splice(readyIndex, 1);
							}
							else {
								readyIndex++;
								if (readyIndex >= readyFor2v2.length){
									console.log('removeDC: never found the leaver');
								}
							}
						}
					}
					else if (rooms[roomIndex].players[playerIndex].prefMode == 3){
						while (readyCheck != 0 && readyIndex < readyFor3v3.length){
							console.log('removeDC: searching for leaver in readyFor array..');
							//compare IDs
							readyCheck = rooms[roomIndex].players[playerIndex].sock.id.localeCompare(readyFor3v3[readyIndex]);
							if (readyCheck == 0){
								console.log('removeDC: removed from readyFor3v3');
								readyFor3v3.splice(readyIndex, 1);
							}
							else {
								readyIndex++;
								if (readyIndex >= readyFor3v3.length){
									console.log('removeDC: never found the leaver');
								}
							}
						}
					}
					else if (rooms[roomIndex].players[playerIndex].prefMode == 4){
						while (readyCheck != 0 && readyIndex < readyFor4v4.length){
							console.log('removeDC: searching for leaver in readyFor array..');
							//compare IDs
							readyCheck = rooms[roomIndex].players[playerIndex].sock.id.localeCompare(readyFor4v4[readyIndex]);
							if (readyCheck == 0){
								console.log('removeDC: removed from readyFor4v4');
								readyFor4v4.splice(readyIndex, 1);
							}
							else {
								readyIndex++;
								if (readyIndex >= readyFor4v4.length){
									console.log('removeDC: never found the leaver');
								}
							}
						}
					}
					else if (rooms[roomIndex].players[playerIndex].prefMode == 5){
						while (readyCheck != 0 && readyIndex < readyFor5v5.length){
							console.log('removeDC: searching for leaver in readyFor array..');
							//compare IDs
							readyCheck = rooms[roomIndex].players[playerIndex].sock.id.localeCompare(readyFor5v5[readyIndex]);
							if (readyCheck == 0){
								console.log('removeDC: removed from readyFor5v5');
								readyFor5v5.splice(readyIndex, 1);
							}
							else {
								readyIndex++;
								if (readyIndex >= readyFor5v5.length){
									console.log('removeDC: never found the leaver');
								}
							}
						}
					}
					else if (rooms[roomIndex].players[playerIndex].prefMode == 6){
						while (readyCheck != 0 && readyIndex < readyFor6v6.length){
							console.log('removeDC: searching for leaver in readyFor array..');
							//compare IDs
							readyCheck = rooms[roomIndex].players[playerIndex].sock.id.localeCompare(readyFor6v6[readyIndex]);
							if (readyCheck == 0){
								console.log('removeDC: removed from readyFor6v6');
								readyFor6v6.splice(readyIndex, 1);
							}
							else {
								readyIndex++;
								if (readyIndex >= readyFor6v6.length){
									console.log('removeDC: never found the leaver');
								}
							}
						}
					}
					
					var tempName = rooms[roomIndex].players[playerIndex].userName
					
					//removed from readyFor array
					
					//remove player
					rooms[roomIndex].players.splice(playerIndex, 1);
					
					//announce to lobby that this player left
					updateChat(tempName + " has left the lobby.", 2);
					
					console.log('removeDC: player removed from lobby');
				}
				//if in some game room
				//special for game room, migrate all players in this room back to the lobby
				else {
					console.log('removeDC: player disconnecting from a game');
					//remember this player's name to make the announcement later
					//if announced now, the players in this room wouldnt know who left because chat updates go to the lobby, which these players are not in yet
					var rememberThisName = rooms[roomIndex].players[playerIndex].userName;
					
					//tell everyone in this game room that someone left thus starting their return to lobby on the client side
					io.to(rooms[roomIndex].name).emit('someoneLeft');
					
					//if the leaver is found, ignore them
					//copy other players to the lobby
					//then delete this room, with the only player object referring to the leaver, thus deleting the player
					for (index = 0; index < rooms[roomIndex].players.length; index++){
						//if this player is not the leaver, add this player to the lobby room
						if (index != playerIndex){
							rooms[roomIndex].players[index].sock.leave(rooms[roomIndex].name);//leave game channel
							rooms[1].players.push(rooms[roomIndex].players[index]);//join room object 
							rooms[roomIndex].players[index].sock.join(rooms[1].name);//join socketio room
						}
					}
					
					//everyone that hasn't left has been copied over to the lobby
					//so delete this game room
					deleteRoom(roomIndex);
					
					updateChat(rememberThisName + " left, cancelling a game.", 2);
				}
			}
			else {
				playerIndex++;
			}
		}

		roomIndex++;
		console.log('removeDC: roomIndex = ' + roomIndex);
	}
	
	console.log('removeDC: complete');

	//in case no one is connected
	if (rooms.length == 2 && rooms[0].players.length == 0 && rooms[1].players.length == 0){
		console.log('NO GAME ROOMS AND NO ONE IN LOBBY');
	}
}

//when people announce they are ready, change the readyStatus
//also start a game if enough people are ready for the same game mode
function readyProcedure(cID, mode){
	var check; //compare ID with players in the lobby's player array
	var index = 0; //index to sequence through lobby's player array
	
	console.log('readyProc: start');
	
	while (index < rooms[1].players.length && check != 0){
		console.log('readyProc: searching..');
		//localeCompare will result in 0 if equal
		check = cID.localeCompare(rooms[1].players[index].sock.id);
		
		if (check == 0 && rooms[1].players[index].readyStatus == false){
			console.log('readyProc: found the player in lobby');
			//change this player's readyStatus to true
			rooms[1].players[index].readyStatus = true;
			//change this player's prefMode
			rooms[1].players[index].prefMode = mode;
			console.log('readyProc: player status changed');
			
			//add this player to the readyFor array corresponding to the mode they chose
			//also announce that this player is ready
			//set up to check to start a match (thats not a typo)
			var readySize = 0;
	
			if (mode == 0){
				updateChat(rooms[1].players[index].userName + " is ready for training!", 3);
				console.log('readyProc: sufficient population for training mode');
				//create the game room
				var x = Math.random() * 1000000;
				var newRoom = new createRoom("gameRoom" + x);
				rooms.push(newRoom);
				//create a very temporary array of players' names to use -after- all the room migration is done
				var playerNames = [];
				//using readyFor to compare IDs, migrate these players from lobby to game room
				var compare;
				
				var lobbyIndex = 0;
				while (lobbyIndex < rooms[1].players.length && compare != 0){
					console.log('readyProc: searching for players..');
					compare = cID.localeCompare(rooms[1].players[lobbyIndex].sock.id);
					if (compare == 0){
						console.log('readyProc: found player');
						//add this player's name to that very temporary player name array
						playerNames.push(rooms[1].players[lobbyIndex].userName);
						//add this player to the game room object 
						rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
						//add this player to the game room channel
						rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
						//update what player's personal tag of which room they are in
						rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
						//update this player's ready status
						rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
						
						//remove this player from the lobby channel
						rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
						//remove from lobby room object
						rooms[1].players.splice(lobbyIndex, 1);
						//reset compare variable to find the next player
						compare = 10;
						console.log('readyProc: player transferred');
					}
					else {
						lobbyIndex++;
					}
				}
				console.log('readyProc: game created and players all transferred');
				
				//with everyone settled in the new game room, start them off in their match with the small delivery
				sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
				console.log('readyProc: small delivery sent');
				updateChat("Some players started training", 2);
			}
			
			else if (mode == 1){
			//if (mode == 1){
				readyFor1v1.push(rooms[1].players[index].sock.id);
				updateChat(rooms[1].players[index].userName + " is ready for a 1v1!", 3);
				//if this player was the last one needed to start a game mode, start it
				readySize = readyFor1v1.length;
				if (readySize == 2){
					console.log('readyProc: sufficient population');
					//create the game room
					var x = Math.random() * 1000000;
					var newRoom = new createRoom("gameRoom" + x);
					rooms.push(newRoom);
					//create a very temporary array of players' names to use -after- all the room migration is done
					var playerNames = [];
					//using readyFor to compare IDs, migrate these players from lobby to game room
					var compare;
					
					for (readyForIndex = 0; readyForIndex < readyFor1v1.length; readyForIndex++){
						console.log('readyProc: starting transfer to game room');
						var lobbyIndex = 0;
						
						while (lobbyIndex < rooms[1].players.length && compare != 0){
							console.log('readyProc: searching for players..');
							compare = readyFor1v1[readyForIndex].localeCompare(rooms[1].players[lobbyIndex].sock.id);
							if (compare == 0){
								console.log('readyProc: found player');
								//add this player's name to that very temporary player name array
								playerNames.push(rooms[1].players[lobbyIndex].userName);
								//add this player to the game room object 
								rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
								//add this player to the game room channel
								rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
								//update what player's personal tag of which room they are in
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
								//update this player's ready status
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
								//remove this player from the lobby channel
								rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
								//remove from lobby room object
								rooms[1].players.splice(lobbyIndex, 1);
								//reset compare variable to find the next player
								compare = 10;
								console.log('readyProc: player transferred');
							}
							else {
								lobbyIndex++;
							}
						}
					}
					console.log('readyProc: game created and players all transferred');
					//reset this table since everyone in it is now in the new game room
					readyFor1v1 = [];
					
					//with everyone settled in the new game room, start them off in their match with the small delivery
					sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
					console.log('readyProc: small delivery sent');
					updateChat("Some players started a 1v1 game", 2);
				}
			}
			else if (mode == 2){
				readyFor2v2.push(rooms[1].players[index].sock.id);
				updateChat(rooms[1].players[index].userName + " is ready for a 2v2!", 3);
				//if this player was the last one needed to start a game mode, start it
				readySize = readyFor2v2.length;
				if (readySize == 4){
					console.log('readyProc: sufficient population');
					
					//create the game room
					var x = Math.random() * 1000000;
					var newRoom = new createRoom("gameRoom" + x);
					rooms.push(newRoom);
					//using readyFor to compare IDs, change these players from lobby to game room
					var compare;
					//create a very temporary array of players' names to use -after- all the room migration is done
					var playerNames = [];
					
					for (readyForIndex = 0; readyForIndex < readyFor2v2.length; readyForIndex++){
						console.log('readyProc: starting transfer to game room');
						var lobbyIndex = 0;
						while (lobbyIndex < rooms[1].players.length && compare != 0){
							console.log('readyProc: searching for players..');
							compare = readyFor2v2[readyForIndex].localeCompare(rooms[1].players[lobbyIndex].sock.id);
							if (compare == 0){
								console.log('readyProc: found player');
								//add this player's name to that very temporary player name array
								playerNames.push(rooms[1].players[lobbyIndex].userName);
								//add this player to the game room object 
								rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
								//add this player to the game room channel
								rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
								//update what player's personal tag of which room they are in
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
								//update this player's ready status
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
								//remove this player from the lobby channel
								rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
								//remove from lobby room object
								rooms[1].players.splice(lobbyIndex, 1);
								//reset
								compare = 10;
								console.log('readyProc: player transferred');
							}
							else {
								lobbyIndex++;
							}
						}
					}
					console.log('readyProc: game created and players all transferred');
					//reset this table since everyone in it is now in the new game room
					readyFor2v2 = [];
					
					//with everyone settled in the new game room, start them off in their match with the small delivery
					sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
					console.log('readyProc: small delivery sent');
					
					updateChat("Some players started a 2v2 game", 2);
				}
			}
			else if (mode == 3){
				readyFor3v3.push(rooms[1].players[index].sock.id);
				updateChat(rooms[1].players[index].userName + " is ready for a 3v3!", 3);
				//if this player was the last one needed to start a game mode, start it
				readySize = readyFor3v3.length;
				if (readySize == 6){
					console.log('readyProc: sufficient population');
					
					//create the game room
					var x = Math.random() * 1000000;
					var newRoom = new createRoom("gameRoom" + x);
					rooms.push(newRoom);
					//using readyFor to compare IDs, change these players from lobby to game room
					var compare;
					//create a very temporary array of players' names to use -after- all the room migration is done
					var playerNames = [];
					
					for (readyForIndex = 0; readyForIndex < readyFor3v3.length; readyForIndex++){
						console.log('readyProc: starting transfer to game room');
						var lobbyIndex = 0;
						while (lobbyIndex < rooms[1].players.length && compare != 0){
							console.log('readyProc: searching for players..');
							compare = readyFor3v3[readyForIndex].localeCompare(rooms[1].players[lobbyIndex].sock.id);
							if (compare == 0){
								console.log('readyProc: found player');
								//add this player's name to that very temporary player name array
								playerNames.push(rooms[1].players[lobbyIndex].userName);
								//add this player to the game room object 
								rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
								//add this player to the game room channel
								rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
								//update what player's personal tag of which room they are in
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
								//update this player's ready status
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
								//remove this player from the lobby channel
								rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
								//remove from lobby room object
								rooms[1].players.splice(lobbyIndex, 1);
								//reset
								compare = 10;
								console.log('readyProc: player transferred');
							}
							else {
								lobbyIndex++;
							}
						}
					}
					console.log('readyProc: game created and players all transferred');
					//reset this table since everyone in it is now in the new game room
					readyFor3v3 = [];
					
					//with everyone settled in the new game room, start them off in their match with the small delivery
					sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
					console.log('readyProc: small delivery sent');
					
					updateChat("Some players started a 3v3 game", 2);
				}
			}
			else if (mode == 4){
				readyFor4v4.push(rooms[1].players[index].sock.id);
				updateChat(rooms[1].players[index].userName + " is ready for a 4v4!", 3);
				//if this player was the last one needed to start a game mode, start it
				readySize = readyFor4v4.length;
				if (readySize == 8){
					console.log('readyProc: sufficient population');
					
					//create the game room
					var x = Math.random() * 1000000;
					var newRoom = new createRoom("gameRoom" + x);
					rooms.push(newRoom);
					//using readyFor to compare IDs, change these players from lobby to game room
					var compare;
					//create a very temporary array of players' names to use -after- all the room migration is done
					var playerNames = [];
					
					for (readyForIndex = 0; readyForIndex < readyFor4v4.length; readyForIndex++){
						console.log('readyProc: starting transfer to game room');
						var lobbyIndex = 0;
						while (lobbyIndex < rooms[1].players.length && compare != 0){
							console.log('readyProc: searching for players..');
							compare = readyFor4v4[readyForIndex].localeCompare(rooms[1].players[lobbyIndex].sock.id);
							if (compare == 0){
								console.log('readyProc: found player');
								//add this player's name to that very temporary player name array
								playerNames.push(rooms[1].players[lobbyIndex].userName);
								//add this player to the game room object 
								rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
								//add this player to the game room channel
								rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
								//update what player's personal tag of which room they are in
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
								//update this player's ready status
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
								//remove this player from the lobby channel
								rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
								//remove from lobby room object
								rooms[1].players.splice(lobbyIndex, 1);
								//reset
								compare = 10;
								console.log('readyProc: player transferred');
							}
							else {
								lobbyIndex++;
							}
						}
					}
					console.log('readyProc: game created and players all transferred');
					//reset this table since everyone in it is now in the new game room
					readyFor4v4 = [];
					
					//with everyone settled in the new game room, start them off in their match with the small delivery
					sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
					console.log('readyProc: small delivery sent');
					
					updateChat("Some players started a 4v4 game", 2);
				}
			}
			else if (mode == 5){
				readyFor5v5.push(rooms[1].players[index].sock.id);
				updateChat(rooms[1].players[index].userName + " is ready for a 5v5!", 3);
				//if this player was the last one needed to start a game mode, start it
				readySize = readyFor5v5.length;
				if (readySize == 10){
					console.log('readyProc: sufficient population');
					
					//create the game room
					var x = Math.random() * 1000000;
					var newRoom = new createRoom("gameRoom" + x);
					rooms.push(newRoom);
					//using readyFor to compare IDs, change these players from lobby to game room
					var compare;
					//create a very temporary array of players' names to use -after- all the room migration is done
					var playerNames = [];
					
					for (readyForIndex = 0; readyForIndex < readyFor5v5.length; readyForIndex++){
						console.log('readyProc: starting transfer to game room');
						var lobbyIndex = 0;
						while (lobbyIndex < rooms[1].players.length && compare != 0){
							console.log('readyProc: searching for players..');
							compare = readyFor5v5[readyForIndex].localeCompare(rooms[1].players[lobbyIndex].sock.id);
							if (compare == 0){
								console.log('readyProc: found player');
								//add this player's name to that very temporary player name array
								playerNames.push(rooms[1].players[lobbyIndex].userName);
								//add this player to the game room object 
								rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
								//add this player to the game room channel
								rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
								//update what player's personal tag of which room they are in
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
								//update this player's ready status
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
								//remove this player from the lobby channel
								rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
								//remove from lobby room object
								rooms[1].players.splice(lobbyIndex, 1);
								//reset
								compare = 10;
								console.log('readyProc: player transferred');
							}
							else {
								lobbyIndex++;
							}
						}
					}
					console.log('readyProc: game created and players all transferred');
					//reset this table since everyone in it is now in the new game room
					readyFor5v5 = [];
					
					//with everyone settled in the new game room, start them off in their match with the small delivery
					sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
					console.log('readyProc: small delivery sent');
					
					updateChat("Some players started a 5v5 game", 2);
				}
			}
			else if (mode == 6){
				readyFor6v6.push(rooms[1].players[index].sock.id);
				updateChat(rooms[1].players[index].userName + " is ready for a 6v6!", 3);
				//if this player was the last one needed to start a game mode, start it
				readySize = readyFor6v6.length;
				if (readySize == 12){
					console.log('readyProc: sufficient population');
					
					//create the game room
					var x = Math.random() * 1000000;
					var newRoom = new createRoom("gameRoom" + x);
					rooms.push(newRoom);
					//using readyFor to compare IDs, change these players from lobby to game room
					var compare;
					//create a very temporary array of players' names to use -after- all the room migration is done
					var playerNames = [];
					
					for (readyForIndex = 0; readyForIndex < readyFor6v6.length; readyForIndex++){
						console.log('readyProc: starting transfer to game room');
						var lobbyIndex = 0;
						while (lobbyIndex < rooms[1].players.length && compare != 0){
							console.log('readyProc: searching for players..');
							compare = readyFor6v6[readyForIndex].localeCompare(rooms[1].players[lobbyIndex].sock.id);
							if (compare == 0){
								console.log('readyProc: found player');
								//add this player's name to that very temporary player name array
								playerNames.push(rooms[1].players[lobbyIndex].userName);
								//add this player to the game room object 
								rooms[rooms.length-1].players.push(rooms[1].players[lobbyIndex]);
								//add this player to the game room channel
								rooms[1].players[lobbyIndex].sock.join(rooms[rooms.length-1].name);
								//update what player's personal tag of which room they are in
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].inRoom = rooms[rooms.length-1].name;
								//update this player's ready status
								rooms[rooms.length-1].players[rooms[rooms.length-1].players.length-1].readyStatus = false;
								//remove this player from the lobby channel
								rooms[1].players[lobbyIndex].sock.leave(rooms[1].name);
								//remove from lobby room object
								rooms[1].players.splice(lobbyIndex, 1);
								//reset
								compare = 10;
								console.log('readyProc: player transferred');
							}
							else {
								lobbyIndex++;
							}
						}
					}
					console.log('readyProc: game created and players all transferred');
					//reset this table since everyone in it is now in the new game room
					readyFor6v6 = [];
					
					//with everyone settled in the new game room, start them off in their match with the small delivery
					sendSmallDelivery(rooms[rooms.length-1].players.length, rooms[rooms.length-1].name, playerNames);
					console.log('readyProc: small delivery sent');
					
					updateChat("Some players started a 6v6 game", 2);
				}
			}
		}
		index++;
	}
	console.log('readyProc: complete');
}

//when a player sends the signal they are not ready, remove them from any readyFor array
function unreadyProcedure(cID){
	var check;
	var whichTable = 1;
	
	console.log('unreadyProc: start');
	
	//check through all 6 readyFor arrays if need be
	while (check != 0 && whichTable < 7){
		console.log('unreadyProc: searching..');
		//check readyFor1v1
		if (whichTable == 1){
			var index = 0;
			while (check != 0 && index < readyFor1v1.length){
				console.log('unreadyProc: looking in readyFor1v1..');
				check = cID.localeCompare(readyFor1v1[index]);
				//if the player is found in this readyFor array
				if (check == 0){
					console.log('unreadyProc: found in 1v1 array');
					//remove
					readyFor1v1.splice(index, 1);
					console.log('unreadyProc: removed from 1v1 array');
					
					//announce in chat that this player is now not ready for any game mode
					//and change their readyStatus back to false
					
					//find this player in the lobby to find out their name
					var index2 = 0;
					var check2;
					while (check2 != 0 && index2 < rooms[1].players.length){
						check2 = cID.localeCompare(rooms[1].players[index2].sock.id);
						
						//player found
						if (check2 == 0){
							//formally announce that this player, by name, is not ready to play
							updateChat(rooms[1].players[index2].userName + " is not ready to play.", 3);
							//and change their readyStatus to false 
							rooms[1].players[index2].readyStatus = false;
							//and change their prefMode back to null
							rooms[1].players[index2].prefMode = null;
							console.log('unreadyProc: player status and prefMode changed');
						}
						else {
							index2++;
						}
					}
				}
				//otherwise keep looking
				else {
					index++;
				}
			}
		}
		//check readyFor2v2
		else if (whichTable == 2){
			var index = 0;
			while (check != 0 && index < readyFor2v2.length){
				console.log('unreadyProc: looking in readyFor2v2..');
				check = cID.localeCompare(readyFor2v2[index]);
				//if the player is found in this readyFor array
				if (check == 0){
					console.log('unreadyProc: found in 2v2 array');
					//remove
					readyFor2v2.splice(index, 1);
					console.log('unreadyProc: removed from 2v2 array');
					
					//announce in chat that this player is now not ready for any game mode
					//and change their readyStatus back to false
					
					//find this player in the lobby to find out their name
					var index2 = 0;
					var check2;
					while (check2 != 0 && index2 < rooms[1].players.length){
						check2 = cID.localeCompare(rooms[1].players[index2].sock.id);
						
						//player found
						if (check2 == 0){
							//formally announce that this player, by name, is not ready to play
							updateChat(rooms[1].players[index2].userName + " is not ready to play.", 3);
							//and change their readyStatus to false 
							rooms[1].players[index2].readyStatus = false;
							//and change their prefMode back to null
							rooms[1].players[index2].prefMode = null;
							console.log('unreadyProc: player status and prefMode changed');
						}
						else {
							index2++;
						}
					}
				}
				//otherwise keep looking
				else {
					index++;
				}
			}
		}
		//check readyFor3v3
		else if (whichTable == 3){
			var index = 0;
			while (check != 0 && index < readyFor3v3.length){
				console.log('unreadyProc: looking in readyFor3v3..');
				check = cID.localeCompare(readyFor3v3[index]);
				//if the player is found in this readyFor array
				if (check == 0){
					console.log('unreadyProc: found in 3v3 array');
					//remove
					readyFor3v3.splice(index, 1);
					console.log('unreadyProc: removed from 3v3 array');
					
					//announce in chat that this player is now not ready for any game mode
					//and change their readyStatus back to false
					
					//find this player in the lobby to find out their name
					var index2 = 0;
					var check2;
					while (check2 != 0 && index2 < rooms[1].players.length){
						check2 = cID.localeCompare(rooms[1].players[index2].sock.id);
						
						//player found
						if (check2 == 0){
							//formally announce that this player, by name, is not ready to play
							updateChat(rooms[1].players[index2].userName + " is not ready to play.", 3);
							//and change their readyStatus to false 
							rooms[1].players[index2].readyStatus = false;
							//and change their prefMode back to null
							rooms[1].players[index2].prefMode = null;
							console.log('unreadyProc: player status and prefMode changed');
						}
						else {
							index2++;
						}
					}
				}
				//otherwise keep looking
				else {
					index++;
				}
			}
		}
		//check readyFor4v4
		else if (whichTable == 4){
			var index = 0;
			while (check != 0 && index < readyFor4v4.length){
				console.log('unreadyProc: looking in readyFor4v4..');
				check = cID.localeCompare(readyFor4v4[index]);
				//if the player is found in this readyFor array
				if (check == 0){
					console.log('unreadyProc: found in 4v4 array');
					//remove
					readyFor4v4.splice(index, 1);
					console.log('unreadyProc: removed from 4v4 array');
					
					//announce in chat that this player is now not ready for any game mode
					//and change their readyStatus back to false
					
					//find this player in the lobby to find out their name
					var index2 = 0;
					var check2;
					while (check2 != 0 && index2 < rooms[1].players.length){
						check2 = cID.localeCompare(rooms[1].players[index2].sock.id);
						
						//player found
						if (check2 == 0){
							//formally announce that this player, by name, is not ready to play
							updateChat(rooms[1].players[index2].userName + " is not ready to play.", 3);
							//and change their readyStatus to false 
							rooms[1].players[index2].readyStatus = false;
							//and change their prefMode back to null
							rooms[1].players[index2].prefMode = null;
							console.log('unreadyProc: player status and prefMode changed');
						}
						else {
							index2++;
						}
					}
				}
				//otherwise keep looking
				else {
					index++;
				}
			}
		}
		//check readyFor5v5
		else if (whichTable == 5){
			var index = 0;
			while (check != 0 && index < readyFor5v5.length){
				console.log('unreadyProc: looking in readyFor5v5..');
				check = cID.localeCompare(readyFor5v5[index]);
				//if the player is found in this readyFor array
				if (check == 0){
					console.log('unreadyProc: found in 5v5 array');
					//remove
					readyFor5v5.splice(index, 1);
					console.log('unreadyProc: removed from 5v5 array');
					
					//announce in chat that this player is now not ready for any game mode
					//and change their readyStatus back to false
					
					//find this player in the lobby to find out their name
					var index2 = 0;
					var check2;
					while (check2 != 0 && index2 < rooms[1].players.length){
						check2 = cID.localeCompare(rooms[1].players[index2].sock.id);
						
						//player found
						if (check2 == 0){
							//formally announce that this player, by name, is not ready to play
							updateChat(rooms[1].players[index2].userName + " is not ready to play.", 3);
							//and change their readyStatus to false 
							rooms[1].players[index2].readyStatus = false;
							//and change their prefMode back to null
							rooms[1].players[index2].prefMode = null;
							console.log('unreadyProc: player status and prefMode changed');
						}
						else {
							index2++;
						}
					}
				}
				//otherwise keep looking
				else {
					index++;
				}
			}
		}
		//check readyFor6v6
		else if (whichTable == 6){
			var index = 0;
			while (check != 0 && index < readyFor6v6.length){
				console.log('unreadyProc: looking in readyFor6v6..');
				check = cID.localeCompare(readyFor6v6[index]);
				//if the player is found in this readyFor array
				if (check == 0){
					console.log('unreadyProc: found in 6v6 array');
					//remove
					readyFor6v6.splice(index, 1);
					console.log('unreadyProc: removed from 6v6 array');
					
					//announce in chat that this player is now not ready for any game mode
					//and change their readyStatus back to false
					
					//find this player in the lobby to find out their name
					var index2 = 0;
					var check2;
					while (check2 != 0 && index2 < rooms[1].players.length){
						check2 = cID.localeCompare(rooms[1].players[index2].sock.id);
						
						//player found
						if (check2 == 0){
							//formally announce that this player, by name, is not ready to play
							updateChat( rooms[1].players[index2].userName + " is not ready to play.", 3);
							//and change their readyStatus to false 
							rooms[1].players[index2].readyStatus = false;
							//and change their prefMode back to null
							rooms[1].players[index2].prefMode = null;
							console.log('unreadyProc: player status and prefMode changed');
						}
						else {
							index2++;
						}
					}
				}
				//otherwise keep looking
				else {
					index++;
				}
			}
		}
		whichTable++;
	}
	console.log('unreadyProc: complete');
}

//called in readyProcedure()
//sends all players in a channel (game room) initial game values, officially starting their game
function sendSmallDelivery(howManyPlayers, whichChannel, playerNames){
	console.log('sendSmallDelivery: setting up..');
	var blueStartX = -1440;
	var blueStartY = 0;
	var redStartX = 1440;
	var redStartY = 0;
	
	//somebody entering 'training' mode
	if (howManyPlayers == 1){
		var playerTeam = ["RED"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = ["NONE"]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX]; //all players' starting locational X value
		var playerY = [redStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME"]; //what area is the player currently in
		var playerSpeed = [2.25]; //players' movement speed.
		var playerStatus = ["ALIVE"];
		var playerCooldown = [0];
		var playerDirection = ["LEFT"];
		var blueTimeToWin = 15;
		var redTimeToWin = 15;
	}
	else if (howManyPlayers == 2){
		var playerTeam = ["RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = ["NONE", "NONE"]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE"];
		var playerCooldown = [0, 0];
		var playerDirection = ["LEFT", "RIGHT"];
		var blueTimeToWin = 20;
		var redTimeToWin = 20;
	}
	else if (howManyPlayers == 4){
		var playerTeam = ["RED", "BLUE", "RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER", "MEMBER", "MEMBER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = ["NONE", "NONE", "NONE", "NONE"]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX, redStartX, blueStartX]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY, redStartY, blueStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25, 2.25, 2.25]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE", "ALIVE", "ALIVE"];
		var playerCooldown = [0, 0, 0, 0];
		var playerDirection = ["LEFT", "RIGHT", "LEFT", "RIGHT"];
		var blueTimeToWin = 25;
		var redTimeToWin = 25;
	}
	else if (howManyPlayers == 6){
		var playerTeam = ["RED", "BLUE", "RED", "BLUE", "RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = [playerNames[4], playerNames[5], playerNames[4], playerNames[5], "NONE", "NONE"]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25, 2.25, 2.25, 2.25, 2.25]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE"];
		var playerCooldown = [0, 0, 0, 0, 0, 0];
		var playerDirection = ["LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT"];
		var blueTimeToWin = 30;
		var redTimeToWin = 30;
	}
	else if (howManyPlayers == 8){
		var playerTeam = ["RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER", "MEMBER", "MEMBER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = [playerNames[4], playerNames[5], playerNames[4], playerNames[5], "NONE", "NONE", playerNames[4], playerNames[5]]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE"];
		var playerCooldown = [0, 0, 0, 0, 0, 0, 0, 0];
		var playerDirection = ["LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT"];
		var blueTimeToWin = 40;
		var redTimeToWin = 40;
	}
	else if (howManyPlayers == 10){
		var playerTeam = ["RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER", "MEMBER", "MEMBER", "MEMBER", "MEMBER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = [playerNames[4], playerNames[5], playerNames[4], playerNames[5], "NONE", "NONE", playerNames[4], playerNames[5], playerNames[4], playerNames[5]]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE"];
		var playerCooldown = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var playerDirection = ["LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT"];
		var blueTimeToWin = 40;
		var redTimeToWin = 40;
	}
	else if (howManyPlayers == 12){
		var playerTeam = ["RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER", "MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = [playerNames[4], playerNames[5], playerNames[4], playerNames[5], "NONE", "NONE", playerNames[10], playerNames[11], playerNames[10], playerNames[11], "NONE", "NONE"]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE"];
		var playerCooldown = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var playerDirection = ["LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT"];
		var blueTimeToWin = 40;
		var redTimeToWin = 40;
	}
	else if (howManyPlayers == 14){
		var playerTeam = ["RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE", "RED", "BLUE"]; //which team is a player on, "BLUE" or "RED"
		var playerClass = ["MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER", "MEMBER", "MEMBER", "MEMBER", "MEMBER", "LEADER", "LEADER", "COMMANDER", "COMMANDER"]; //values here will be "Commander", "Leader" or "Member"
		var playerLeaders = [playerNames[4], playerNames[5], playerNames[4], playerNames[5], playerNames[2.25], playerNames[13], playerNames[10], playerNames[11], playerNames[10], playerNames[11], playerNames[2.25], playerNames[13], "NONE", "NONE"]; //array of chosen names pertaining to index-players' superior officer
		var playerX = [redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, redStartX, blueStartX, 0, 0]; //all players' starting locational X value
		var playerY = [redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, redStartY, blueStartY, 0, 0]; //all players' starting locational Y value
		var playerInArea = ["RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "RED HOME", "BLUE HOME", "NONE", "NONE"]; //what area is the player currently in
		var playerSpeed = [2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 0, 0]; //players' movement speed.
		var playerStatus = ["ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "ALIVE", "IMMORTAL", "IMMORTAL"];
		var playerCooldown = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var playerDirection = ["LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT", "NONE", "NONE"];
		var blueTimeToWin = 40;
		var redTimeToWin = 40;
	}
	
	//send everyone in game room everything
	io.to(whichChannel).emit('small delivery', playerNames, playerTeam, playerClass, playerLeaders, playerX, playerY, playerInArea, playerSpeed, playerStatus, playerCooldown, playerDirection, blueTimeToWin, redTimeToWin, whichChannel);
	console.log('sendSmallDelivery: sent everyone everything');
}

function returnPlayersToLobby(roomIndex){
	//first find the game room in the rooms array of the game that has ended
	//once found, copy all of its players over to the lobby room
	//then delete this room
	
	console.log('returnPlayersToLobby: starting..');
	
	for (index = 0; index < rooms[roomIndex].players.length; index++){
		//change this player's channel
		rooms[roomIndex].players[index].sock.leave(rooms[roomIndex].name); //leave ended game's channel
		rooms[roomIndex].players[index].sock.join(rooms[1].name); //join lobby channel
		//update player's personal tag inRoom
		rooms[roomIndex].players[index].inRoom = rooms[1].name;
		//reset this player's prefMode
		rooms[roomIndex].players[index].prefMode = null;
		//copy this player over to the lobby room
		rooms[1].players.push(rooms[roomIndex].players[index]);
		
		//the game room itself will be deleted later
		//so no need to remove player from the room
		console.log('returnPlayersToLobby: returned a player..');
	}
	console.log('returnPlayersToLobby: done returning players');
	rooms.splice(roomIndex, 1);
	console.log('returnPlayersToLobby: game room deleted');
	console.log('returnPlayersToLobby: complete');
}

//check namesTaken to see if a new user's chosen name has already been taken
function checkIfNameTaken(name){
	var verdict = false;
	var index = 0;
	var check;
	while (index < namesTaken.length && verdict == false){
		check = name.localeCompare(namesTaken[index]);
		if (check == 0){
			verdict = true;
		}
		index++;
	}	
	return verdict;
}