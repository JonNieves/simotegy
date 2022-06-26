

/*
MAP
	1. DECLARE ALL THE VARIABLES
	2. FIRST THINGS TO HAPPEN
	3. ALL THE SOCKET FUNCTIONALITY
	4. DEFINING ALL THE FUNCTIONS
*/

/*
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
DECLARE ALL THE VARIABLES===========================================
*/

//creates connection to server, joining the lobby space
var socket = io.connect();

//used to find name within server's arrays to find out which is this user's data
//then used to display own name under avatar
var myNameIs;
//after this user's name is found in the sea of arrays, remember the this user's index
var myGameIndex;
//this holds the name of this player's leader
var myLeader;
//prevents teleport looping
var iJustTeleported = false;

//the server will send this to the player when a game starts, letting this player know which game room they are in
//makes things much easier finding out where the server needs to broadcast this player's stuff
var myGameRoomName;

//ready status of this player
var readyStatus = false;
var gameModeSelected = 1; //1 = 1v1, 2 = 2v2,... 6 = 6v6
var mouseOverReadyButton = false;
var mouseOverGameModeButton = false;
var mouseOver1v1 = false;
var mouseOver2v2 = false;
var mouseOver3v3 = false;
var mouseOver4v4 = false;
var mouseOver5v5 = false;
var mouseOver6v6 = false;
var mouseOverHowBox = false;

//keep a local copy of the chat messages
var chatMessages = [];

//to change what buttons do depending on whether we're in game or not
var inGameYesOrNo = false;
//used in mouseMove() to help transition during the point where we're ingame but inGameYesOrNo is still false
var inPreGameYesOrNo = false;
//moment where X WINS screen is displayed
var inPostGameYesOrNo = false;

//control whether or not this player can use an ability
var usedCooldown = false;
var cooldownTime = 5;

//this will be equal to 720/playerViewSizeX. For most this will be 1.
//Commanders will have a display ratio of .2
//THIS WILL NEED TO BE UPDATED
var displayRatio;

/*
INGAME VARIABLES
*/
var players = []; //array of player objects

var playerViewSizeX; //same for all players except the Commanders
var playerViewSizeY; //same for all players except the Commanders
var playerViewX; //where is this player looking
var playerViewY; //where is this player looking

//ingame 'dynamic' objects
var spikes = []; //array of spike objects
var vacuumX = [];
var vacuumY = [];


//map dimensions and key area coordinates
var mapInitialX = -1800;
var mapInitialY = -1200;
var mapFinishX = 1800;
var mapFinishY = 1200;

//who controls what areas?
//where are the areas?
//var area = [BLUE HOME, BLUE ASSETS, FLAG, RED ASSETS, RED HOME];
var areaOwner = ["BLUE", "BLUE", "NONE", "RED", "RED"]; //[0] = BLUE HOME, [1] = blue assets, [2] = flag, [3] = red assets, [4] = RED HOME
var areaInitialX = [-1800, -360, -360, -360, 1080];
var areaInitialY = [-240, -1200, -240, 720, -240];
var areaFinishX = [-1080, 360, 360, 360, 1800];
var areaFinishY = [240, -720, 240, 1200, 240];

//time left for team to win
var bluesInFlag = 0;
var redsInFlag = 0;
var blueLeadersInFlag = 0;
var redLeadersInFlag = 0;
var blueTimeToWin;
var redTimeToWin;

//object sizes
var memberSize = 25;
var leaderSize = 50;
var spikeSize = 50;
var vacuumSize = 360;

//keeping this global so all functions can kill it
var gameInterval;

//somethings happen every interval, some happen some intervals
var intervalCount = 0;

//amount of time a team has been capturing
var blueBeenCapturing = 0;
var redBeenCapturing = 0;

//used in the transition from waiting to game
var introCount = 10;

//used for spikes activation
var spikesTimer = 0;

//how long the starting GO message is displayed for
var PUStartingGoTimer = 1; //starts at 1 while the others start at 0 cause this one should show in the begining automatically
//how long the PUBlueCapturingTimer is displayed for
var PUBlueCapturingTimer = 0;
//how long the PURedCapturingTimer is displayed for
var PURedCapturingTimer = 0;
//how long respawning message is displayed for 
var PURespawnTimer = 0;

//to keep the X TEAM WINS screen temporary
var winScreenTimer = 100;

//used in various checks
var FLAG = "FLAG";
var BLUE = "BLUE";
var RED = "RED";
var LEADER = "LEADER";
var ALIVE = "ALIVE";
var MEMBER = "MEMBER";
var COMMANDER = "COMMANDER";
var NONE = "NONE";
var UP = "UP";
var DOWN = "DOWN";
var LEFT = "LEFT";
var RIGHT = "RIGHT";

//canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

//canvas sizes
var canvasWidth;
var canvasHeight;

//to know which image to display in the how to
//used in howToPlay interval
var howToSlide = 0;

//coords for explosions
var explosionsX = [];
var explosionsY = [];
var explosionsTimer = [];

//coords for respawn animations
var despawnHoleX = [];
var despawnHoleY = [];
var despawnHoleTimer = [];
var respawnHoleX = [];
var respawnHoleY = [];
var respawnHoleTimer = [];

//array of gate objects
var gates = [];

//to cycle the flag area's colors
var contentionStage = 1;

//LOAD MUCH IMAGES

//live player avatars
var blueMemberImg = new Image(25,25);
blueMemberImg.src = './images/blueMember.png';
var blueLeaderImg = new Image(50,50);
blueLeaderImg.src = './images/blueLeader.png';
var blueMemberArmedImg = new Image(41,41);
blueMemberArmedImg.src = './images/blueMemberArmed.png';
var blueLeaderArmedImg = new Image(82,82);
blueLeaderArmedImg.src = './images/blueLeaderArmed.png';
var redMemberImg = new Image(25,25);
redMemberImg.src = './images/redMember.png';
var redLeaderImg = new Image(50,50);
redLeaderImg.src = './images/redLeader.png';
var redMemberArmedImg = new Image(41,41);
redMemberArmedImg.src = './images/redMemberArmed.png';
var redLeaderArmedImg = new Image(82,82);
redLeaderArmedImg.src = './images/redLeaderArmed.png';
var blueMemberClickedImg = new Image(55, 55);
blueMemberClickedImg.src = './images/blueMemberClicked.png';
var blueLeaderClickedImg = new Image(106, 106);
blueLeaderClickedImg.src = './images/blueLeaderClicked.png';
var redMemberClickedImg = new Image(55, 55);
redMemberClickedImg.src = './images/redMemberClicked.png';
var redLeaderClickedImg = new Image(106, 106);
redLeaderClickedImg.src = './images/redLeaderClicked.png';

//dead player avatars
var deadRedMemberImg = new Image(25,25);
deadRedMemberImg.src = './images/deadRedMember.png';
var deadRedLeaderImg = new Image(50,50);
deadRedLeaderImg.src = './images/deadRedLeader.png';
var deadRedMemberArmedImg = new Image(41,41);
deadRedMemberArmedImg.src = './images/deadRedMemberArmed.png';
var deadRedLeaderArmedImg = new Image(82,82);
deadRedLeaderArmedImg.src = './images/deadRedLeaderArmed.png';
var deadBlueMemberImg = new Image(25,25);
deadBlueMemberImg.src = './images/deadBlueMember.png';
var deadBlueLeaderImg = new Image(50,50);
deadBlueLeaderImg.src = './images/deadBlueLeader.png';
var deadBlueMemberArmedImg = new Image(41,41);
deadBlueMemberArmedImg.src = './images/deadBlueMemberArmed.png';
var deadBlueLeaderArmedImg = new Image(82,82);
deadBlueLeaderArmedImg.src = './images/deadBlueLeaderArmed.png';

//used for respawn animation
var despawnHoleImg = new Image(100,100);
despawnHoleImg.src = './images/respawnHole.png';
var respawnHoleImg = new Image(100,100);
respawnHoleImg.src = './images/respawnHole.png';

//load images different stages of spikes
var preSpikeImg0 = new Image (50, 50);
preSpikeImg0.src = './images/prespike0.png';
var preSpikeImg1 = new Image (50, 50);
preSpikeImg1.src = './images/prespike1.png';
var preSpikeImg2 = new Image (50, 50);
preSpikeImg2.src = './images/prespike2.png';
var evolvedSpikeImg = new Image (50,50);
evolvedSpikeImg.src = './images/evolvedSpike.png';

//8 images showing where flag is to guide the lost
var flagIsDImg = new Image(100, 100); //flag is down
flagIsDImg.src = './images/flagIsD.png';
var flagIsDLImg = new Image(100, 100); //flag is down left
flagIsDLImg.src = './images/flagIsDL.png';
var flagIsDRImg = new Image(100, 100); //flag is down right
flagIsDRImg.src = './images/flagIsDR.png';
var flagIsUImg = new Image(100, 100); //flag is up
flagIsUImg.src = './images/flagIsU.png';
var flagIsULImg = new Image(100, 100); //flag is up left
flagIsULImg.src = './images/flagIsUL.png';
var flagIsURImg = new Image(100, 100); //flag is up right
flagIsURImg.src = './images/flagIsUR.png';
var flagIsRImg = new Image(100, 100); //flag is right
flagIsRImg.src = './images/flagIsR.png';
var flagIsLImg = new Image(100, 100); //flag is left
flagIsLImg.src = './images/flagIsL.png';

//this image is drawn onto the map and scaled out to size
//its to show a converging point (the flag)
var backgroundGuideImg = new Image(3600, 2400);
backgroundGuideImg.src = './images/backgroundGuide.png';

//this image shows the 'explosion' of the spike
var explosionImg = new Image(100, 100);
explosionImg.src = './images/explosion.png';

//player directional pointers
var goingUpImg = new Image(200, 200);
goingUpImg.src = './images/goingUp.png';
var goingDownImg = new Image(200, 200);
goingDownImg.src = './images/goingDown.png';
var goingLeftImg = new Image(200, 200);
goingLeftImg.src = './images/goingLeft.png';
var goingRightImg = new Image(200, 200);
goingRightImg.src = './images/goingRight.png';

//spike aiming pointers
var dropSpikeLeftImg = new Image(200, 200);
dropSpikeLeftImg.src = './images/dropSpikeLeft.png';
var dropSpikeRightImg = new Image(200, 200);
dropSpikeRightImg.src = './images/dropSpikeRight.png';
var dropSpikeUpImg = new Image(200, 200);
dropSpikeUpImg.src = './images/dropSpikeUp.png';
var dropSpikeDownImg = new Image(200, 200);
dropSpikeDownImg.src = './images/dropSpikeDown.png';

var fireSpikeLeftImg = new Image(200, 200);
fireSpikeLeftImg.src = './images/fireSpikeLeft.png';
var fireSpikeRightImg = new Image(200, 200);
fireSpikeRightImg.src = './images/fireSpikeRight.png';
var fireSpikeUpImg = new Image(200, 200);
fireSpikeUpImg.src = './images/fireSpikeUp.png';
var fireSpikeDownImg = new Image(200, 200);
fireSpikeDownImg.src = './images/fireSpikeDown.png';

var fireSpikeFastLeftImg = new Image(200, 200);
fireSpikeFastLeftImg.src = './images/fireSpikeFastLeft.png';
var fireSpikeFastRightImg = new Image(200, 200);
fireSpikeFastRightImg.src = './images/fireSpikeFastRight.png';
var fireSpikeFastUpImg = new Image(200, 200);
fireSpikeFastUpImg.src = './images/fireSpikeFastUp.png';
var fireSpikeFastDownImg = new Image(200, 200);
fireSpikeFastDownImg.src = './images/fireSpikeFastDown.png';

//teleport gate
var gateImg = new Image(100, 100);
gateImg.src = './images/gate.png';

//audio
var poofSound = new Audio('poof.mp3');
var ringSound = new Audio('ring.mp3');
var whooshSound = new Audio('whoosh.mp3');
var tickTockSound = new Audio('tickTock.mp3');
var teleportSound = new Audio('teleportSound.mp3');

//keep track of touches in progress
var ongoingTouches = [];
var touchX = [];
var touchY = [];
var touchDetected = false;

//used in resizeCanvas to globalize the element height variables
var gifImageHeight = document.getElementById('simotegyGIF').clientHeight;
var chatFormHeight = document.getElementById('chatEntry').clientHeight;;

/*
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
FIRST THINGS TO HAPPEN==================
*/

//Size the canvas to the window once, and create a function to do the same later if the window gets resized
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//take away the email thing if the view shrinks to where it would shuffle downward and screw with mouse coords
//this gets done twice, once here, and again whenever the canvas gets resized (resizeCanvas)
if (canvas.width < 773){
	document.getElementById('emailAddress').style.display = "none";
}

//prompt user for a name, send to server
chooseUserName(1);

//start the interval function that displays how to play within the waiting lobby
//this interval gets cleared when a game starts
var howToPlay = setInterval(function(){
	
	displaySlideshowAndMessages();
	
	//only proceed with the auto slide show if the user is not trying to look at one slide in particular
	if (mouseOverHowBox == false){
		howToSlide++;
		if (howToSlide > 10){
			howToSlide = 0;
		}
	}
}, 3500);

//test if server is responsive
var keepAliveSent = false; //gets set to true by the client, and reverted to false by a message from the server
var timeToCheck = 0;
var checksFailed = 0;

var aliveInterval = setInterval(function(){
	
	if (keepAliveSent == false){
		if (inGameYesOrNo || inPostGameYesOrNo || inPreGameYesOrNo){
			socket.emit('keepAlive', myGameRoomName);
			keepAliveSent = true;
		}
		else {
			socket.emit('keepAlive', "lobby");
			keepAliveSent = true;
		}
	}
	else if (keepAliveSent == true){
		timeToCheck++;
		console.log('waiting for still alive...');
		if (timeToCheck > 2){
			checksFailed++;
			timeToCheck = 0;
			if (checksFailed > 1){
				alert("Server isn't responding. Sorry. :(");
				socket.disconnect();
			}
		}
	}
	
}, 5000);

/*
ALL THE SOCKET FUNCTIONALITY 
ALL THE SOCKET FUNCTIONALITY 
ALL THE SOCKET FUNCTIONALITY 
ALL THE SOCKET FUNCTIONALITY 
ALL THE SOCKET FUNCTIONALITY 
ALL THE SOCKET FUNCTIONALITY 
*/

//server says this name was taken, choose another
socket.on('retryName', function(code){
	chooseUserName(code);
});

//server replying to 
socket.on('stillAlive', function(){
	keepAliveSent = false;
});

socket.on('chatUpdate', function (messages, mode){
	writeServerLobbyBroadcasts(messages);
	if (mode == 1){
		ringSound.play();
	}
	else if (mode == 2){
		whooshSound.play();
	}
});

socket.on('someoneLeft', function(){
	//if this player was in a game, cancel it since someone left
	if (gameInterval && inPostGameYesOrNo == false){
		clearInterval(gameInterval);
		//so a new game can start fresh
		resetGameVariables();
		fromGameToLobby();
	}
});

//everyone is ready and everyone receives a bunch of arrays of information that will set up a game
socket.on('small delivery', function(pNames, pTeam, pClass, pLeaders, pX, pY, pInArea, pSpeed, pStatus, pCooldown, pDirection, bTime2Win, rTime2Win, roomName){
	//stop the How to Play slide show 
	clearInterval(howToPlay);
	
	console.log('starting game of ' + pNames.length + ' players');
	
	//load server's players datas and find this user's
	allocateGameData(pNames, pTeam, pClass, pLeaders, pX, pY, pInArea, pSpeed, pStatus, pCooldown, pDirection);
	
	myGameRoomName = roomName;
	
	//how long this game should last
	blueTimeToWin = bTime2Win;
	redTimeToWin = rTime2Win;
	
	//create the gates
	//top left gate (0)
	var newGate = {x: -415 , y: -295};
	gates.push(newGate);
	//bottom left gate (1)
	newGate = {x:-415, y: 295};
	gates.push(newGate);
	//top right gate (2)
	newGate = {x: 415, y: -295};
	gates.push(newGate);
	//bottom right gate (3)
	newGate = {x: 415, y: 295};
	gates.push(newGate);
	
	//hide the gif and chat entry area
	document.getElementById('simotegyGIF').style.display = "none";
	document.getElementById('chatEntry').style.display = "none";
	
	//inGameYesOrNo won't actually be set to true until after the pregame instruction
	//so to calm mouseMove() (looking for image heights that don't exist as of now)
	//...set this to false
	inPreGameYesOrNo = true;
	
	//resize the canvas to use the space made available from removing the gif
	var ww = window.innerWidth;
	var wh = window.innerHeight;
	
	canvas.width = ww;
	canvas.height = wh;
	document.body.style.height = wh + "px";
	
	//start game
	playSimotegy();
});

//server broadcasting playerInArea update
socket.on('captureUpdate', function(pInArea, index){
	if (inGameYesOrNo){
		players[index].inArea = pInArea;
	}
});

//server broadcasting someone's movement
//update player location
//update canvas if player is on screen
socket.on('movement', function(newX, newY, mLeft, mRight, mUp, mDown, mDir, index){
	if (inGameYesOrNo){
		players[index].x = newX;
		players[index].y = newY;
		players[index].mouseBelow = mDown;
		players[index].mouseLeft = mLeft;
		players[index].mouseRight = mRight;
		players[index].mouseAbove = mUp;
		players[index].direction = mDir;
	}
});

//server broadcasting someone's movement
//update player location
//update canvas if player is on screen
socket.on('playerTeleport', function(newX, newY, index){
	if (inGameYesOrNo){
		//create respawn and despawn holes
		createDespawnHole(players[index].x, players[index].y);
		
		//if this happens with this player's view, play the sound
		if ((players[index].x > playerViewX && 
		players[index].x - 50 < playerViewX + canvasWidth && 
		players[index].y + 50 > playerViewY && 
		players[index].y - 50 < playerViewY + canvasHeight) || 
		(newX > playerViewX && 
		newX - 50 < playerViewX + canvasWidth && 
		newY + 50 > playerViewY && 
		newY - 50 < playerViewY + canvasHeight)){
			teleportSound.play();
		}
		
		//update with new location and create respawn hole there
		players[index].x = newX;
		players[index].y = newY;
		createRespawnHole(players[index].x, players[index].y);
	}
});

//someone created a spike
socket.on('spikeCreated', function(spikeOb, pIndex){
	if (inGameYesOrNo){
		spikes.push(spikeOb);
		
 		players[pIndex].cooldown = 5;
		players[pIndex].clicked = 3;
		players[pIndex].speed = 2.25;
	}
});

//someone created a vacuum
socket.on('vacuumCreated', function(vX, vY, index){
	if (inGameYesOrNo){
		vacuumX[index] = vX;
		vacuumY[index] = vY;
	}
});

//server broadcasting spike removal
socket.on('spikeRemoved', function(spID, pIndex){
	if (inGameYesOrNo){
		
		var i = 0;
		
		//check for the removed spike's id to remove the correct spike
		while(i < spikes.length){
			if (spID == spikes[i].id){
				createExplosion(spikes[i].x, spikes[i].y);
				spikes.splice(i, 1);
			}
			i++;
		}
		
		//label the player dead
		players[pIndex].status = "DEAD";
		players[pIndex].speed = 3;
	}	
});

//server broadcasting vacuum removal
socket.on('vacuumRemoved', function(vX, vY){
	if (inGameYesOrNo){
		vacuumX = vX;
		vacuumY = vY;
	}
})

//server broadcasting player respawn
socket.on('playerRespawned', function(pX, pY, index){
	if (inGameYesOrNo){
		//first put a respawn hole where the player was
		createDespawnHole(players[index].x, players[index].y);
		//then update with where he is
		players[index].x = pX;
		players[index].y = pY;
		players[index].status = "ALIVE";
		//then create respawn hole where he is
		createRespawnHole(players[index].x, players[index].y);
	}
	
});

//server announcing blue victory
socket.on('BLUE WINS', function(messages){
	blueTimeToWin = 0;
	chatMessages = messages;	
});
//server announcing red victory
socket.on('RED WINS', function(messages){
	redTimeToWin = 0;
	chatMessages = messages;
});

//server updating everyone's time til game over to keep everyone more in sync
socket.on('winningUpdate', function(blueTime, redTime){
	if (blueTime < blueTimeToWin){
		blueTimeToWin = blueTime;
	}
	if (redTime < redTimeToWin){
		redTimeToWin = redTime;
	}
});

//server announcing this player died in a pvp collision
socket.on('pvpCollideKill', function(index){
	if (inGameYesOrNo){
		players[index].status = "DEAD";
		createExplosion(players[index].x, players[index].y);
	}
});

/* 
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
DEFINING ALL THE FUNCTIONS=============================================
*/

//create a new player object
function createPlayerObject(pName, pTeam, plClass, pLeader, pX, pY, pInArea, pSpeed, pStatus, pCooldown, pDirection){
	this.name = pName; //player's own name 
	this.team = pTeam; //red or blue
	this.pClass = plClass; //member, leader, or commander 
	this.leader = pLeader; //who is the leader of this player if any 
	this.x = 0 + pX; // locational x 
	this.y = 0 + pY; //locational y 
	this.inArea = pInArea; //what area is this player in 
	this.speed = pSpeed; //how fast this player moves 
	this.status = pStatus; //alive or dead 
	this.cooldown = pCooldown; //limit spike spamming
	this.clicked = 0; //anything above 0 shows the player's spikes detached
	this.direction = pDirection;
	//mouse position in relation to this player
	this.mouseAbove = false;
	this.mouseBelow = false;
	this.mouseLeft = false;
	this.mouseRight = false;
	
	console.log(this.name + ', ' + this.team + ', ' + this.pClass + ', ' + this.leader + ', ' + this.x + ', ' + this.y + ', ' + this.inArea + ', ' + this.speed + ', ' + this.direction + ', ' + this.status + ', ' + this.cooldown + ', ' + this.clicked);
}

//create a spike object
function createSpikeObject(locX, locY, dir, sp){
	this.id = Math.floor((Math.random() * 1000000) + 1);
	this.x = locX;
	this.y = locY;
	this.direction = dir;
	this.active = 0;
	this.activationTimer = 2;
	this.justTeleported = false;
	this.speed = 2.25*sp;
}

//gets called in the html
//resize the canvas to the size of window when and should it change
function resizeCanvas(){	
	document.body.style.height = window.innerHeight + "px";
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;						  
	//if a game is being played in the canvas, then move the player's resized view to the correct location
	//but only if not the commander
	if (inGameYesOrNo == true || inPreGameYesOrNo == true){		
		playerViewSizeX = canvas.width;
		playerViewSizeY = canvas.height;
		playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
		playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
	}													
}
//as user initially enters site, ask user to choose a user name
function chooseUserName(nameStatus){
	//use random number as temporary name while the user makes one up
	var tempName = Math.floor((Math.random() * 1000000) + 1); 
	
	if (nameStatus == 1){
		var userName = window.prompt("Choose a user name", "");
	}
	else if (nameStatus == 2){
		var userName = window.prompt("Name taken! Choose another", "");
	}
	else if (nameStatus == 3){
		var userName = window.prompt("Name too large! Choose another", "");
	}
	
	var blank = "";
	
	//if no name somehow happens, make one up
	if (userName == null || blank.localeCompare(userName) == 0){
		userName = Math.floor((Math.random() * 1000000) + 1);
	}
	
	//needs to compare with server to avoid having two people with the same name
	myNameIs = "" + userName;

	//user name picked, send to server
	socket.emit('my name is', myNameIs);
}

//function for writing server's messages to canvas during the time BEFORE a game starts
function writeServerLobbyBroadcasts(messages){
	chatMessages = messages;
	if (inGameYesOrNo == false && inPreGameYesOrNo == false && inPostGameYesOrNo == false){
		displaySlideshowAndMessages();
	}
}

function displayPregameInstructs(){
	//once for introCount = 10 ... and = 1, and finally = 0
	//this where the player sees what the controls are and the 10s countdown til the game starts
	//if (intervalCount == 0 || intervalCount == 25 || intervalCount == 50 || intervalCount == 75 || intervalCount == 100 || intervalCount == 125 || intervalCount == 150 || intervalCount == 175 || intervalCount == 200 || intervalCount == 225 || intervalCount == 250){
	if (intervalCount == 0*4 || intervalCount == 25*4 || intervalCount == 50*4 || intervalCount == 75*4 || intervalCount == 100*4 || intervalCount == 125*4 || intervalCount == 150*4 || intervalCount == 175*4 || intervalCount == 200*4 || intervalCount == 225*4 || intervalCount == 250*4){
		//show the countdown to the game starting
		canvasWidth = window.innerWidth;
		canvasHeight = window.innerHeight;
		
		var scale;
		var instructWidth = 695;
		var instructHeight = 394;
	
		//100% size
		if (canvasWidth/695 >= 1){
			scale = 1;
		}
		//90%
		else if (1 > canvasWidth/695 && canvasWidth/695 >= 0.9){
			scale = 0.9;
		}
		//80%
		else if (0.9 > canvasWidth/695 && canvasWidth/695 >= 0.8){
			scale = 0.8;
		}
		//70%
		else if (0.8 > canvasWidth/695 && canvasWidth/695 >= 0.7){
			scale = 0.7;
		}
		//60%
		else if (0.7 > canvasWidth/695 && canvasWidth/695 >= 0.6){
			scale = 0.6;
		}
		//50%
		else if (0.6 > canvasWidth/695 && canvasWidth/695 >= 0.5){
			scale = 0.5;
		}
		//40%
		else if (0.5 > canvasWidth/695 && canvasWidth/695 >= 0.4){
			scale = 0.4;
		}
		//30%
		else if (0.4 > canvasWidth/695 && canvasWidth/695 >= 0.3){
			scale = 0.3;
		}
		//20%
		else if (0.3 > canvasWidth/695 && canvasWidth/695 >= 0.2){
			scale = 0.2;
		}
			
		ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear canvas in prep for redraw
		
		//draw black text and display image showing game controls
		ctx.fillStyle = "#000000";
		
		if (scale == 1){
			ctx.font = "bold 40px Arial";
		}
		else if (scale == 0.9){
			ctx.font = "bold 36px Arial";
		}
		else if (scale == 0.8){
			ctx.font = "bold 32px Arial";
		}
		else if (scale == 0.7){
			ctx.font = "bold 28px Arial";
		}
		else if (scale == 0.6){
			ctx.font = "bold 24px Arial";
		}
		else if (scale == 0.5){
			ctx.font = "bold 20px Arial";
		}
		else if (scale == 0.4){
			ctx.font = "bold 16px Arial";
		}
		else if (scale == 0.3){
			ctx.font = "bold 12px Arial";
		}
		else if (scale == 0.2){
			ctx.font = "bold 8px Arial";
		}
		
		//say when the game is starting and specify which mode
		if (gameModeSelected == 0){
			ctx.fillText("TRAINING SOLO IN ... " + introCount, 10, 50);
		}
		else if (gameModeSelected == 1){
			ctx.fillText("1v1 GAME STARTING IN ... " + introCount, 10, 50);
		}
		else if (gameModeSelected == 2){
			ctx.fillText("2v2 GAME STARTING IN ... " + introCount, 10, 50);
		}
		else if (gameModeSelected == 3){
			ctx.fillText("3v3 GAME STARTING IN ... " + introCount, 10, 50);
		}
		else if (gameModeSelected == 4){
			ctx.fillText("4v4 GAME STARTING IN ... " + introCount, 10, 50);
		}
		else if (gameModeSelected == 5){
			ctx.fillText("5v5 GAME STARTING IN ... " + introCount, 10, 50);
		}
		else if (gameModeSelected == 6){
			ctx.fillText("6v6 GAME STARTING IN ... " + introCount, 10, 50);
		}
		ctx.fillText("_______________", 10, 55);
		
		//draw image showing game controls
		if (!touchDetected){
			ctx.drawImage(instructImage1, 10, 100, instructWidth*scale, instructHeight*scale);
		}
		else if (touchDetected){
			ctx.drawImage(instructImage2, 10, 100, instructWidth*scale, instructHeight*scale);
		}
		
		introCount--;
		
		//reset it so the rest of this interval isn't fucked
		if (intervalCount == 250*4){
			intervalCount = 0;
		}
	}			
	//every 25 of these means 1 second passed
	intervalCount++;
}


//function for sending user-created text messages
function emitChatEntryToServer(){
	//save text entry as temp value
	var textEntry = document.getElementById("userText").value;
	
	var message = myNameIs + ' says: ' + textEntry;
	
	//send temp value to server
	socket.emit('chatMessage', message);
	
	//when done with using the text entry box, reset it
	document.getElementById("chatEntry").reset();
}

//assimilate server data and draw to screen
function allocateGameData(pNames, pTeam, pClass, pLeaders, pX, pY, pInArea, pSpeed, pStatus, pCooldown, pDirection){
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	
	//we're going in game now, so reset what is needed to get back into a game later
	readyStatus = false;
	
	//assimilation
	for (a = 0; a < pNames.length; a++){
		var newPlayer = new createPlayerObject(pNames[a], pTeam[a], pClass[a], pLeaders[a], pX[a], pY[a], pInArea[a], pSpeed[a], pStatus[a], pCooldown[a], pDirection[a]);
		players.push(newPlayer);
	}
	
	playerViewSizeX = canvasWidth; 
	playerViewSizeY = canvasHeight;
	
	//in case something retarded happened, stick all the game's variables to starting values again
	stopTheRetardedWinBeforeWinningCrap();
	
	//player objects have been created, now to find THIS player's data among them
	
	//find this user's name then remember the index it was found in
	var check;
	var index = 0;
	
	//while there are still players to check and we haven't found the right one
	while (index < players.length && check != 0){
		//localeCompare will result in 0 if strings are equal
		check = myNameIs.localeCompare(players[index].name);
		if (check == 0){
			//save server's index pertaining to this player
			myGameIndex = index;
		}
		index++;
	}
	
	//having found our name, give playerViewX and playerViewY values
	//there are 2 possibilities; either this player is commander or not
	check = COMMANDER.localeCompare(players[myGameIndex].pClass);
	//if this player is NOT commander, designate view coords dependent on player's location
	if (check != 0){
		playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
		playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		displayRatio = 1;
	}
	//if this player IS commander, then easy peasy, commander's view = whole map
	else {
		playerViewX = 0;
		playerViewY = 0;
		displayRatio = 1/5;
	}
	
	myLeader = players[myGameIndex].leader;
}

//draw the bases, flag, assets
function drawMap(){	
	
	var t0 = performance.now();
	
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	
	ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear canvas in prep for redraw
	
	//DRAW MAP BACKGROUND
	if (playerViewX < mapFinishX && playerViewY < mapFinishY && playerViewX > mapInitialX-canvasWidth && playerViewY > mapInitialY-canvasHeight){
		//inner white rectangle
		var wx = mapInitialX - playerViewX;
		var wy = mapInitialY - playerViewY;
		
		//draw the image and scale it out to size
		//ctx.drawImage(backgroundGuideImg, wx*displayRatio, wy*displayRatio, mapFinishX*2*displayRatio, mapFinishY*2*displayRatio);
		ctx.drawImage(backgroundGuideImg, wx*displayRatio, wy*displayRatio);
	}
	
	//HEX COLORS 
	//#0000FF = blue
	//#FF0000 = red
	//#FFFF00 = yellow
	//#000066 = darker blue
	//#660000 = darker red
	//#808080 = gray
	//#FFFFFF = white
	//#000000 = black
	
	var index = 2;
	var check;
	
	//DRAW AREAS
	//draw flag area
	//other areas were drawn before but were simply added to background image
	if (playerViewX < areaFinishX[index] && playerViewY < areaFinishY[index] && playerViewX > areaInitialX[index]-canvasWidth && playerViewY > areaInitialY[index]-canvasHeight){
		//string.localeCompare(string) returns 0 if strings are equal
		if (BLUE.localeCompare(areaOwner[index]) == 0){
			//drawing 2 rectangles, one colored, then another smaller white one on top
			var rx = areaInitialX[index] - playerViewX;
			var ry = areaInitialY[index] - playerViewY;
			
			var wx = rx + 15;
			var wy = ry + 15;
			
			//draw blue area
			ctx.fillStyle = "#000066";
			ctx.fillRect(rx*displayRatio, ry*displayRatio, 720*displayRatio, 480*displayRatio);
			
			//draw white innard of blue area
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(wx*displayRatio, wy*displayRatio, 690*displayRatio, 450*displayRatio);
			
			//draw unique area stuff, like flag in flag area, correct labels, power sources in asset areas
			//index 0 and 4 are bases
			if ((index == 0 || index == 4) && displayRatio == 1){
				var tx = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 275;
				var ty = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY + 25;
				ctx.fillStyle = "#000066"; //bring back the blue
				ctx.font = "100px Arial";
				ctx.fillText("BLUE HOME", tx, ty);
			}
			//index 1 and 3 are assets
			else if ((index == 1 || index == 3) && displayRatio == 1){
				var ix = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 100;
				var iy = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY - 55;
				ctx.font = "100px Arial";//bring back the blue
				ctx.fillText("BLUE ASSETS", ix, iy);
			}
			//index 2 is the flag area
			else {
				var ix = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 150;
				var iy = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY - 50;
				ctx.fillStyle = "#000066"; //bring back the blue
				//draw the flag
				//staff
				ctx.fillRect(ix*displayRatio, iy*displayRatio, 10*displayRatio, 300*displayRatio);
				//flag
				ctx.fillRect(ix*displayRatio, iy*displayRatio, 100*displayRatio, 60*displayRatio);
				
			}
		}
		else if (RED.localeCompare(areaOwner[index]) == 0){
			//drawing 2 rectangles, one colored, then another smaller white one on top
			var rx = areaInitialX[index] - playerViewX;
			var ry = areaInitialY[index] - playerViewY;
			
			var wx = rx + 15;
			var wy = ry + 15;
			
			//draw red area
			ctx.fillStyle = "#660000";
			ctx.fillRect(rx*displayRatio, ry*displayRatio, 720*displayRatio, 480*displayRatio);
			
			//draw white innard of red area
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(wx*displayRatio, wy*displayRatio, 690*displayRatio, 450*displayRatio);
			
			//draw unique area stuff, like flag in flag area, correct labels, power sources in asset areas
			//index 0 and 4 are bases
			if ((index == 0 || index == 4) && displayRatio == 1){
				var tx = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 225;
				var ty = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY + 25;
				ctx.fillStyle = "#660000"; //bring back the red
				ctx.font = "100px Arial";
				ctx.fillText("RED HOME", tx, ty);
			}
			//index 1 and 3 are assets
			else if ((index == 1 || index == 3) && displayRatio == 1){
				var ix = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 100;
				var iy = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY - 55;
				ctx.font = "100px Arial";
				ctx.fillText("RED ASSETS", ix, iy);
			}
			//index 2 is the flag area
			else{
				var ix = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 150;
				var iy = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY - 50;
				ctx.fillStyle = "#660000"; //bring back the red
				//draw the flag
				//staff
				ctx.fillRect(ix*displayRatio, iy*displayRatio, 10*displayRatio, 300*displayRatio);
				//flag
				ctx.fillRect(ix*displayRatio, iy*displayRatio, 100*displayRatio, 60*displayRatio);
			}
		}
		else {
			//drawing 2 rectangles, one colored, then another smaller white one on top
			var rx = areaInitialX[index] - playerViewX;
			var ry = areaInitialY[index] - playerViewY;
			
			var wx = areaInitialX[index] + 15 - playerViewX;
			var wy = areaInitialY[index] + 15 - playerViewY;
			
			//draw flag AREA, changing its color depending on who is capturing
			if (bluesInFlag > redsInFlag){
				ctx.fillStyle = "#000066"; //blue
			}
			else if (redsInFlag > bluesInFlag){
				ctx.fillStyle = "#660000"; //red
			}
			//if the flag is under contention, blink red and blue
			else if (redsInFlag > 0 && bluesInFlag > 0 && redsInFlag == bluesInFlag){
				contentionStage += 1;
				
				if (contentionStage <= 15*4){
					ctx.fillStyle = "#000066"; //blue
				}
				else if (contentionStage > 15*4 && contentionStage <= 30*4){
					ctx.fillStyle = "#660000"; //red
					if (contentionStage == 30*4){
						contentionStage = 0;
					}
				}
			}
			else if (redsInFlag == 0 && bluesInFlag == 0){
				ctx.fillStyle = "#FFFF00"; //yellow
			}
			ctx.fillRect(rx*displayRatio, ry*displayRatio, 720*displayRatio, 480*displayRatio);
			
			//draw white inside area
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(wx*displayRatio, wy*displayRatio, 690*displayRatio, 450*displayRatio);
			
			var ix = (areaInitialX[index]+areaFinishX[index])/2 - playerViewX - 90;
			var iy = (areaInitialY[index]+areaFinishY[index])/2 - playerViewY - 120;

			//draw the flag ITSELF
			if (bluesInFlag > redsInFlag){
				ctx.fillStyle = "#000066"; //blue
			}
			else if (redsInFlag > bluesInFlag){
				ctx.fillStyle = "#660000"; //red
			}
			//if the flag is under contention, blink red and blue
			else if (redsInFlag > 0 && bluesInFlag > 0 && redsInFlag == bluesInFlag){
				contentionStage += 1;
				
				if (contentionStage <= 15*4){
					ctx.fillStyle = "#000066"; //blue
				}
				else if (contentionStage > 15*4 && contentionStage <= 30*4){
					ctx.fillStyle = "#660000"; //red
					if (contentionStage == 30*4){
						contentionStage = 0;
					}
				}
			}
			else if (redsInFlag == 0 && bluesInFlag == 0){
				ctx.fillStyle = "#FFFF00"; //yellow
			}
			//staff
			ctx.fillRect(ix*displayRatio, iy*displayRatio, 20*displayRatio, 275*displayRatio);
			//flag
			ctx.fillRect(ix*displayRatio, iy*displayRatio, 175*displayRatio, 100*displayRatio);
		} 
	}
	
	var t1 = performance.now();
	
	console.log('draw map: ' + (t1 - t0));
}

//draw spikes and vacuums
function drawObjects(){
	
	var t0 = performance.now();
	
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	
	//draw vacuums first
	//then draw spikes
	
	/*
	//vacuums
	for (index = 0; index < vacuumX.length; index++){
		if (vacuumX[index] > playerViewX && vacuumY[index] > playerViewY && vacuumX[index] < playerViewX+canvasWidth && vacuumY[index] < playerViewY+canvasHeight){
			//there are 6 squares to draw per vacuum
			
			ctx.fillStyle = "#808080";
			ctx.fillRect((vacuumX[index] - vacuumSize/2 - playerViewX)*displayRatio, (vacuumY[index] - vacuumSize/2 - playerViewY)*displayRatio, vacuumSize*displayRatio, vacuumSize*displayRatio);
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect((vacuumX[index] - vacuumSize/2 + 20 - playerViewX)*displayRatio, (vacuumY[index] - vacuumSize/2 + 20 - playerViewY)*displayRatio, (vacuumSize - 40)*displayRatio, (vacuumSize - 40)*displayRatio);
			
			ctx.fillStyle = "#808080";
			ctx.fillRect((vacuumX[index] - vacuumSize/4 - playerViewX)*displayRatio, (vacuumY[index] - vacuumSize/4 - playerViewY)*displayRatio, (vacuumSize/2)*displayRatio, (vacuumSize/2)*displayRatio);
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect((vacuumX[index] - vacuumSize/4 + 20 - playerViewX)*displayRatio, (vacuumY[index] - vacuumSize/4 + 20 - playerViewY)*displayRatio, (vacuumSize/2 - 40)*displayRatio, (vacuumSize/2 - 40)*displayRatio);
			
			ctx.fillStyle = "#808080";
			ctx.fillRect((vacuumX[index] - vacuumSize/8 - playerViewX)*displayRatio, (vacuumY[index] - vacuumSize/8 - playerViewY)*displayRatio, (vacuumSize/4)*displayRatio, (vacuumSize/4)*displayRatio);
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect((vacuumX[index] - vacuumSize/8 + 20 - playerViewX)*displayRatio, (vacuumY[index] - vacuumSize/8 + 20 - playerViewY)*displayRatio, (vacuumSize/4 - 40)*displayRatio, (vacuumSize/4 - 40)*displayRatio);
		}
	}
	*/
	
	//gates
	for (index = 0; index < gates.length; index++){
		//if the gate is in view, draw it
		if (gates[index].x + 50 > playerViewX && gates[index].x - 50 < playerViewX + canvasWidth && gates[index].y + 50 > playerViewY && gates[index].y - 50 < playerViewY + canvasHeight){
			ctx.drawImage(gateImg, gates[index].x - playerViewX - 50, gates[index].y - playerViewY - 50);
		}
	}
	
	//spikes
	for (index = 0; index < spikes.length; index++){
		//if the spike is within view, draw it
		if (spikes[index].x + 25 > playerViewX && spikes[index].x - 25 < playerViewX + canvasWidth && spikes[index].y + 25 > playerViewY && spikes[index].y - 25 < playerViewY + canvasHeight){
			//if the spike is active draw the spike, if it is not, draw the 'prespike'
			//if the spike IS NOT active (0)
			if (spikes[index].active == 0){
				//check if activation timer is at 1 or 2, then draw appropriate image
				if (spikes[index].activationTimer == 2){
					ctx.drawImage(preSpikeImg0, spikes[index].x - playerViewX - 25, spikes[index].y - playerViewY - 25);
				}
				else if (spikes[index].activationTimer == 1){
					ctx.drawImage(preSpikeImg1, spikes[index].x - playerViewX - 25, spikes[index].y - playerViewY - 25);
				}
				else if (spikes[index].activationTimer == 0){
					ctx.drawImage(preSpikeImg2, spikes[index].x - playerViewX - 25, spikes[index].y - playerViewY - 25);
				}
			}
			//if the spike IS active (1)
			else if (spikes[index].active == 1){
				ctx.drawImage(evolvedSpikeImg, spikes[index].x - playerViewX - 25, spikes[index].y - playerViewY - 25);
			}	
		}
	}
	
	var t1 = performance.now();
	
	console.log('draw objects: ' + (t1 - t0));
}

//DRAW ALL IN-VIEW PLAYERS
//always draws self 
//draws other players only if they are within this player's view
function drawPlayers(){	

	var t0 = performance.now();
	
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	
	var index = 0;
	var checkClass;
	var checkTeam;
	var checkStatus;
	
	//HEX COLORS #0000FF = blue, #FF0000 = red, #FFFF00 = yellow
	
	//first draw all leaders, then the members, so no one is hidden
	for (index = 0; index < players.length; index++){
		//+50/-50 to account for the player sizes
		if (players[index].x + 50 > playerViewX && players[index].y + 50 > playerViewY && players[index].x - 50 < playerViewX+canvasWidth && players[index].y - 50 < playerViewY+canvasHeight){
			//check status of this player
			checkStatus = ALIVE.localeCompare(players[index].status);
			
			//draw like this if this player is a LEADER
			checkClass = LEADER.localeCompare(players[index].pClass);
			if (checkClass == 0){
				//check what team this player is in
				checkTeam = BLUE.localeCompare(players[index].team);
				
				//if on blue team
				if (checkTeam == 0){
					//if player is dead and armed
					if (checkStatus != 0 && players[index].cooldown == 0){
						//draw player black
						ctx.drawImage(deadBlueLeaderArmedImg, (players[index].x - 82/2 - playerViewX)*displayRatio, (players[index].y - 82/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000";
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
					}
					//if player is dead and not armed
					else if (checkStatus != 0 && players[index].cooldown != 0){
						//draw player black
						ctx.drawImage(deadBlueLeaderImg, (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000";
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - 3 - playerViewY)*displayRatio);
					}
					//if player is alive and is armed
					else if (checkStatus == 0 && players[index].cooldown == 0){
						ctx.drawImage(blueLeaderArmedImg, (players[index].x - 82/2 - playerViewX)*displayRatio, (players[index].y - 82/2 - playerViewY)*displayRatio);
						ctx.fillStyle = "#0000FF";
						ctx.font = "12px Arial";
						//if this player is in the flag area, note it
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag > redsInFlag){
							ctx.fillText("CAPTURING", (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - 3 - playerViewY)*displayRatio);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag == redsInFlag){
							ctx.fillText("CONTESTING", (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - 3 - playerViewY)*displayRatio);
						}
					}
					//if player is alive and not armed
					else if (checkStatus == 0 && players[index].cooldown != 0){
						
						//either the player just clicked to place a spike *now*, or did sometime before
						if (players[index].clicked > 0){
							players[index].clicked--;
							ctx.drawImage(blueLeaderClickedImg, (players[index].x - 106/2 - playerViewX)*displayRatio, (players[index].y - 106/2 - playerViewY)*displayRatio);
						}
						else if (players[index].clicked == 0){
							ctx.drawImage(blueLeaderImg, (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - playerViewY)*displayRatio);
						}
						ctx.fillStyle = "#0000FF";
						ctx.font = "12px Arial";
						//if this player is in the flag area, note it
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag > redsInFlag){
							ctx.fillText("CAPTURING", (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - 3 - playerViewY)*displayRatio);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag == redsInFlag){
							ctx.fillText("CONTESTING", (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - 3 - playerViewY)*displayRatio);
						}
					}

					//draw player's name BLUE
					ctx.fillStyle = "#0000FF";
					ctx.font = "12px Arial";
					ctx.fillText(players[index].name, players[index].x - leaderSize/2 - playerViewX, players[index].y + leaderSize/2 + 13 - playerViewY);						
				}
				
				//if not on blue team, must be on red
				else {
					if (checkStatus != 0 && players[index].cooldown == 0){
						//draw player black
						ctx.drawImage(deadRedLeaderArmedImg, (players[index].x - 82/2 - playerViewX)*displayRatio, (players[index].y - 82/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000";
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
					}
					//if player is dead and not armed
					else if (checkStatus != 0 && players[index].cooldown != 0){
						//draw player black
						ctx.drawImage(deadRedLeaderImg, (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000";
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
					}
					//if player is alive and is armed
					else if (checkStatus == 0 && players[index].cooldown == 0){
						ctx.drawImage(redLeaderArmedImg, (players[index].x - 82/2 - playerViewX)*displayRatio, (players[index].y - 82/2 - playerViewY)*displayRatio);
						ctx.fillStyle = "#FF0000";
						ctx.font = "12px Arial";
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag > bluesInFlag){
							ctx.fillText("CAPTURING", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag == bluesInFlag){
							ctx.fillText("CONTESTING", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
						}
					}
					//if player is alive and not armed
					else if (checkStatus == 0 && players[index].cooldown != 0){
						//either the player just clicked to place a spike *now*, or did sometime before
						if (players[index].clicked > 0){
							players[index].clicked--;
							ctx.drawImage(redLeaderClickedImg, (players[index].x - 106/2 - playerViewX)*displayRatio, (players[index].y - 106/2 - playerViewY)*displayRatio);
						}
						else if (players[index].clicked == 0){
							ctx.drawImage(redLeaderImg, (players[index].x - leaderSize/2 - playerViewX)*displayRatio, (players[index].y - leaderSize/2 - playerViewY)*displayRatio);
						}
						
						ctx.fillStyle = "#FF0000";
						ctx.font = "12px Arial";
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag > bluesInFlag){
							ctx.fillText("CAPTURING", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag == bluesInFlag){
							ctx.fillText("CONTESTING", players[index].x - leaderSize/2 - playerViewX, players[index].y - leaderSize/2 - 3 - playerViewY);
						}
					}
					
					//draw player's name RED
					ctx.fillStyle = "#FF0000";
					ctx.font = "12px Arial";
					ctx.fillText(players[index].name, players[index].x - leaderSize/2 - playerViewX, players[index].y + leaderSize/2 + 13 - playerViewY);
				}
			}
		}	
	}
	//second draw all members, so no one is hidden behind larger players
	for (index = 0; index < players.length; index++){
		//+50/-50 to account for the player sizes
		if (players[index].x + 50 > playerViewX && players[index].y + 50 > playerViewY && players[index].x - 50 < playerViewX+canvasWidth && players[index].y - 50 < playerViewY+canvasHeight){
			//check status of this player
			checkStatus = ALIVE.localeCompare(players[index].status);
			
			checkClass = MEMBER.localeCompare(players[index].pClass);
			if (checkClass == 0){
				//check what team this player is in
				checkTeam = BLUE.localeCompare(players[index].team);
				
				//if on blue team
				if (checkTeam == 0){
					//if player is dead and armed
					if (checkStatus != 0 && players[index].cooldown == 0){
						//draw player black
						ctx.drawImage(deadBlueMemberArmedImg, (players[index].x - 41/2 - playerViewX)*displayRatio, (players[index].y - 41/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000";
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
					}
					//if player is dead and not armed
					else if (checkStatus != 0 && players[index].cooldown != 0){
						//draw player black
						ctx.drawImage(deadBlueMemberImg, (players[index].x - memberSize/2 - playerViewX)*displayRatio, (players[index].y - memberSize/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000";
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
					}
					//if player is alive and is armed
					else if (checkStatus == 0 && players[index].cooldown == 0){
						ctx.drawImage(blueMemberArmedImg, (players[index].x - 41/2 - playerViewX)*displayRatio, (players[index].y - 41/2 - playerViewY)*displayRatio);
						ctx.fillStyle = "#0000FF";
						ctx.font = "12px Arial";
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag > redsInFlag){
							ctx.fillText("CAPTURING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag == redsInFlag){
							ctx.fillText("CONTESTING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
					}
					//if player is alive and not armed
					else if (checkStatus == 0 && players[index].cooldown != 0){
						
						
						//either the player just clicked to place a spike *now*, or did sometime before
						if (players[index].clicked > 0){
							players[index].clicked--;
							ctx.drawImage(blueMemberClickedImg, (players[index].x - 55/2 - playerViewX)*displayRatio, (players[index].y - 55/2 - playerViewY)*displayRatio);
						}
						else if (players[index].clicked == 0){
							ctx.drawImage(blueMemberImg, (players[index].x - memberSize/2 - playerViewX)*displayRatio, (players[index].y - memberSize/2 - playerViewY)*displayRatio);
						}
						ctx.fillStyle = "#0000FF";
						ctx.font = "12px Arial";
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag > redsInFlag){
							ctx.fillText("CAPTURING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && bluesInFlag == redsInFlag){
							ctx.fillText("CONTESTING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
					}
					
					//draw player's name BLUE
					ctx.fillStyle = "#0000FF";
					ctx.font = "12px Arial";
					ctx.fillText(players[index].name, players[index].x - memberSize/2 - playerViewX, players[index].y + memberSize/2 + 13 - playerViewY);
				}
				//if not on blue team, must be red
				else {
					//if player is dead and is armed
					if (checkStatus != 0 && players[index].cooldown == 0){
						//draw player black
						ctx.drawImage(deadRedMemberArmedImg, (players[index].x - 41/2 - playerViewX)*displayRatio, (players[index].y - 41/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000"
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
					}
					//if player is dead and not armed
					else if (checkStatus != 0 && players[index].cooldown != 0){
						//draw player black
						ctx.drawImage(deadRedMemberImg, (players[index].x - memberSize/2 - playerViewX)*displayRatio, (players[index].y - memberSize/2 - playerViewY)*displayRatio);
						//write POPPED over this player
						//black
						ctx.fillStyle = "#000000"
						ctx.font = "12px Arial";
						ctx.fillText("POPPED", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
					}
					//if player is alive and is armed
					else if (checkStatus == 0 && players[index].cooldown == 0){
						ctx.fillStyle = "#FF0000";
						ctx.font = "12px Arial";
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag > bluesInFlag){
							ctx.fillText("CAPTURING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag == bluesInFlag){
							ctx.fillText("CONTESTING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
						ctx.drawImage(redMemberArmedImg, (players[index].x - 41/2 - playerViewX)*displayRatio, (players[index].y - 41/2 - playerViewY)*displayRatio);
					}
					//if player is alive and not armed
					else if (checkStatus == 0 && players[index].cooldown != 0){
						
						
						//either the player just clicked to place a spike *now*, or did sometime before
						if (players[index].clicked > 0){
							players[index].clicked--;
							ctx.drawImage(redMemberClickedImg, (players[index].x - 55/2 - playerViewX)*displayRatio, (players[index].y - 55/2 - playerViewY)*displayRatio);
						}
						else if (players[index].clicked == 0){
							ctx.drawImage(redMemberImg, (players[index].x - memberSize/2 - playerViewX)*displayRatio, (players[index].y - memberSize/2 - playerViewY)*displayRatio);
						}
						ctx.fillStyle = "#FF0000";
						ctx.font = "12px Arial";
						if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag > bluesInFlag){
							ctx.fillText("CAPTURING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
						else if (players[index].x >= -360 && players[index].x <= 360 && players[index].y >= -240 && players[index].y <= 240 && redsInFlag == bluesInFlag){
							ctx.fillText("CONTESTING", players[index].x - memberSize/2 - playerViewX, players[index].y - memberSize/2 - 3 - playerViewY);
						}
					}
					
					//draw player's name RED
					ctx.fillStyle = "#FF0000";
					ctx.font = "12px Arial";
					ctx.fillText(players[index].name, players[index].x - memberSize/2 - playerViewX, players[index].y + memberSize/2 + 13 - playerViewY);
				}
			}
		}	
	}
	//draw all players' "aiming pointers"
	for (index = 0; index < players.length; index++){
		if (players[index].x + 60 > playerViewX && players[index].y + 60 > playerViewY && players[index].x - 60 < playerViewX+canvasWidth && players[index].y - 60 < playerViewY+canvasHeight){
			
			var checkLeft = LEFT.localeCompare(players[index].direction);
			var checkRight = RIGHT.localeCompare(players[index].direction);
			var checkUp = UP.localeCompare(players[index].direction);
			var checkDown = DOWN.localeCompare(players[index].direction);
			
			//draw where they are going and where they are aiming
			//if this player is going left
			if (checkLeft == 0){
				ctx.drawImage(goingLeftImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
			
				//draw where they are aiming
				if (players[index].mouseLeft){
					ctx.drawImage(fireSpikeFastLeftImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseRight){
					ctx.drawImage(dropSpikeRightImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseAbove){
					ctx.drawImage(fireSpikeUpImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseBelow){
					ctx.drawImage(fireSpikeDownImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
			}
			//if this player is going right
			else if (checkRight == 0){
				ctx.drawImage(goingRightImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
			
				//draw where they are aiming
				if (players[index].mouseLeft){
					ctx.drawImage(dropSpikeLeftImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseRight){
					ctx.drawImage(fireSpikeFastRightImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseAbove){
					ctx.drawImage(fireSpikeUpImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseBelow){
					ctx.drawImage(fireSpikeDownImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
			}
			//if this player is going up
			else if (checkUp == 0){
				ctx.drawImage(goingUpImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
			
				//draw where they are aiming
				if (players[index].mouseLeft){
					ctx.drawImage(fireSpikeLeftImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseRight){
					ctx.drawImage(fireSpikeRightImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseAbove){
					ctx.drawImage(fireSpikeFastUpImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseBelow){
					ctx.drawImage(dropSpikeDownImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
			}
			//if this player is going down
			else if (checkDown == 0){
				ctx.drawImage(goingDownImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
			
				//draw where they are aiming
				if (players[index].mouseLeft){
					ctx.drawImage(fireSpikeLeftImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseRight){
					ctx.drawImage(fireSpikeRightImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseAbove){
					ctx.drawImage(dropSpikeUpImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
				else if (players[index].mouseBelow){
					ctx.drawImage(fireSpikeFastDownImg, (players[index].x - 100) - playerViewX, (players[index].y - 100) - playerViewY);
				}
			}
		}	
	}
	
	/*
	EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS 
	EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS EXCEPTIONAL OBJECT DRAWS
	*/
	
	//explosions
	//explosions appear on top of players
	for (index = 0; index < explosionsX.length; index++){
		ctx.drawImage(explosionImg, explosionsX[index] - 50 - playerViewX, explosionsY[index] - 50 - playerViewY);
	}
	
	//despawn holes and respawn holes
	//despawn holes appear on top of players that died
	for (index = 0; index < despawnHoleX.length; index++){
		if (despawnHoleTimer[index] >= 3*4){
			ctx.drawImage(respawnHoleImg, despawnHoleX[index] - 50 - playerViewX, despawnHoleY[index] - 50 - playerViewY);
		}
		else if (despawnHoleTimer[index] >= 2*4){
			ctx.drawImage(respawnHoleImg, despawnHoleX[index] - 40 - playerViewX, despawnHoleY[index] - 40 - playerViewY, 80, 80);
		}
		else if (despawnHoleTimer[index] >= 1*4){
			ctx.drawImage(respawnHoleImg, despawnHoleX[index] - 30 - playerViewX, despawnHoleY[index] - 30 - playerViewY, 60, 60);
		}
	}
	
	//respawn holes appear on top of players that revived
	for (index = 0; index < respawnHoleX.length; index++){
		if (respawnHoleTimer[index] >= 1*4){
			ctx.drawImage(respawnHoleImg, respawnHoleX[index] - 50 - playerViewX, respawnHoleY[index] - 50 - playerViewY);
		}
		else if (respawnHoleTimer[index] >= 2*4){
			ctx.drawImage(respawnHoleImg, respawnHoleX[index] - 40 - playerViewX, respawnHoleY[index] - 40 - playerViewY, 80, 80);
		}
		else if (respawnHoleTimer[index] >= 3*4){
			ctx.drawImage(respawnHoleImg, respawnHoleX[index] - 30 - playerViewX, respawnHoleY[index] - 30 - playerViewY, 60, 60);
		}
	}
	
	var t1 = performance.now();
	
	console.log('draw players: ' + (t1 - t0));
}

function drawGUI(){
	
	var t0 = performance.now();
	
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	
	//draw the image showing ability range limit
	//drawGUIRangeIndicator();
	
	//draw the guiding images that tell players where the flag is
	drawGUIFlagPointers();
	
	//draw player info area
	drawGUIPlayerInfoBox();
	
	//write the time left to capture, using team colors for corresponding times
	drawGUIVictoryInfo();
	
	//draw a message below the countdown to victory if the time for this message to be displayed is more than 0
	//the respawn pop up message takes priority
	
	var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
	
	if (PUStartingGoTimer > 0 && checkStatus == 0){
		drawGUIPopUpMessages(1);	
	}
	else if (bluesInFlag > redsInFlag && checkStatus == 0){
		drawGUIPopUpMessages(2);
	}
	else if (redsInFlag > bluesInFlag && checkStatus == 0){
		drawGUIPopUpMessages(3);
	}
	else if (redsInFlag == bluesInFlag && redsInFlag > 0 && checkStatus == 0){
		drawGUIPopUpMessages(4);
	}
	else if (checkStatus != 0){
		drawGUIPopUpMessages(5);
	}
	
	var t1 = performance.now();
	
	console.log('draw GUI: ' + (t1 - t0));
}

function drawGUIFlagPointers(){
	//areaWhateverWhatever[2], index 2, is the flag area
	
	//there are 8 cases where the player's screen does not see the flag area
	//for each, an image saying where the flag is in relation to the player will be displayed
	
	//case one: player is up left of the flag 
	if (players[myGameIndex].x < areaInitialX[2] - 240 && 
		players[myGameIndex].y < areaInitialY[2] - 240){
		ctx.drawImage(flagIsDRImg, canvasWidth/2 + 140, canvasHeight/2 + 140);
	}
	//case two: player is above the flag
	else if (players[myGameIndex].x >= areaInitialX[2] - 240 && 
		players[myGameIndex].y < areaInitialY[2] - 240 && 
		players[myGameIndex].x <= areaFinishX[2] + 240){
		ctx.drawImage(flagIsDImg, canvasWidth/2 - 50, canvasHeight/2 + 140);
	}
	//case three: player is up right from the flag
	else if (players[myGameIndex].y < areaInitialY[2] - 240 && 
		players[myGameIndex].x > areaFinishX[2] + 240){
		ctx.drawImage(flagIsDLImg, canvasWidth/2 - 240, canvasHeight/2 + 140);
	}
	//case four: player is left of the flag
	else if (players[myGameIndex].x < areaInitialX[2] - 240 && 
		players[myGameIndex].y >= areaInitialY[2] - 240 &&
		players[myGameIndex].y <= areaFinishY[2] + 240){
		ctx.drawImage(flagIsRImg, canvasWidth/2 + 140, canvasHeight/2 - 50);
	}
	//case five: player is right of the flag
	else if (players[myGameIndex].y >= areaInitialY[2] - 240 && 
		players[myGameIndex].x > areaFinishX[2] + 240 && 
		players[myGameIndex].y <= areaFinishY[2] + 240){
		ctx.drawImage(flagIsLImg, canvasWidth/2 - 240, canvasHeight/2 - 50);
	}
	//case six: player is down left of the flag
	else if (players[myGameIndex].x < areaInitialX[2] - 240 && 
		players[myGameIndex].y > areaFinishY[2] + 240){
		ctx.drawImage(flagIsURImg, canvasWidth/2 + 140, canvasHeight/2 - 240);
	}
	//case seven: player is below the flag
	else if (players[myGameIndex].x >= areaInitialX[2] - 240 && 
		players[myGameIndex].x <= areaFinishX[2] + 240 && 
		players[myGameIndex].y > areaFinishY[2] + 240){
		ctx.drawImage(flagIsUImg, canvasWidth/2 - 50, canvasHeight/2 - 240);
	}
	//case eight: player is down right from the flag
	else if (players[myGameIndex].x > areaFinishX[2] + 240 && 
		players[myGameIndex].y > areaFinishY[2] + 240){
		ctx.drawImage(flagIsULImg, canvasWidth/2 - 240, canvasHeight/2 - 240);
	}
}

//show ability range on player
function drawGUIRangeIndicator(){
	//if this player is not the commander, dont show a range limit to ability
	var check = COMMANDER.localeCompare(players[myGameIndex].pClass);
	if (check != 0){
		//also, only show it if this player CAN even use ability now
		if (players[myGameIndex].cooldown == 0){
			ctx.drawImage(rangeImage, canvasWidth/2 - 250, canvasHeight/2 - 250);
		}
	}
}

function drawGUIVictoryInfo(){
	//#000066 = darker blue
	//#660000 = darker red
	//draw text at top of screen saying how long each team has til victory
	//also say how many on each team are capturing
	//and scale if the screen is small
	
	var encImgWidth = 650;
	var encImgHeight = 75;
	var scale;
	
	//100% size
	if (canvasWidth/1366 >= 1){
		//scale = 1;
		//ctx.font = "bold 80px Arial";
		scale = 0.75;
		ctx.font = "bold 60px Arial";
	}
	//90%
	else if (1 > canvasWidth/1366 && canvasWidth/1366 >= 0.9){
		//scale = 0.9;
		//ctx.font = "bold 72px Arial";
		scale = 0.675;
		ctx.font = "bold 45px Arial";
	}
	//80%
	else if (0.9 > canvasWidth/1366 && canvasWidth/1366 >= 0.8){
		//scale = 0.8;
		//ctx.font = "bold 64px Arial";
		scale = 0.6;
		ctx.font = "bold 45px Arial";
	}
	//70%
	else if (0.8 > canvasWidth/1366 && canvasWidth/1366 >= 0.7){
		//scale = 0.7;
		//ctx.font = "bold 56px Arial";
		scale = 0.525;
		ctx.font = "bold 42px Arial";
	}
	//60%
	else if (0.7 > canvasWidth/1366 && canvasWidth/1366 >= 0.6){
		//scale = 0.6;
		//ctx.font = "bold 48px Arial";
		scale = 0.45;
		ctx.font = "bold 36px Arial";
	}
	//50%
	else if (0.6 > canvasWidth/1366 && canvasWidth/1366 >= 0.5){
		//scale = 0.5;
		//ctx.font = "bold 40px Arial";
		scale = 0.375;
		ctx.font = "bold 30px Arial";
	}
	//40%
	else if (0.5 > canvasWidth/1366 && canvasWidth/1366 >= 0.4){
		//scale = 0.4;
		//ctx.font = "bold 32px Arial";	
		scale = 0.3;
		ctx.font = "bold 24px Arial";
	}
	//30%
	else if (0.4 > canvasWidth/1366 && canvasWidth/1366 >= 0.3){
		//scale = 0.3;
		//ctx.font = "bold 24px Arial";
		scale = 0.225;
		ctx.font = "bold 18px Arial";
	}
	//20%
	else if (0.3 > canvasWidth/1366 && canvasWidth/1366 >= 0.2){
		//scale = 0.2;
		//ctx.font = "bold 16px Arial";
		scale = 0.15;
		ctx.font = "bold 12px Arial";
	}
	
	//draw the enclosure box
	ctx.drawImage(counterEnclosureImg, canvasWidth/2 - (encImgWidth/2)*scale, 10, encImgWidth*scale, encImgHeight*scale);
	
	//draw blue side info
	if (bluesInFlag <= redsInFlag){
		ctx.fillStyle = "#000066";
		ctx.fillText(blueTimeToWin + "s", canvasWidth/2 - (encImgWidth/2)*scale + 8*scale, 10+(encImgHeight-8)*scale);
	}
	else if (bluesInFlag > redsInFlag){
		ctx.fillStyle = "#000066";
		ctx.fillText(blueTimeToWin + "s <<<", canvasWidth/2 - (encImgWidth/2)*scale + 8*scale, 10+(encImgHeight-8)*scale);
	}
	
	//draw red side info
	if (redsInFlag <= bluesInFlag){
		ctx.fillStyle = "#660000";
		ctx.fillText(redTimeToWin + "s", canvasWidth/2 + 8*scale, 10+(encImgHeight-8)*scale);
	}
	else if (redsInFlag > bluesInFlag){
		ctx.fillStyle = "#660000";
		ctx.fillText(redTimeToWin + "s <<<", canvasWidth/2 + 8*scale, 10+(encImgHeight-8)*scale);
	}
}

function drawGUIPlayerInfoBox(){
	//scale to width of canvas
	var scale;
	//100% size
	if (canvasWidth/1366 >= 1){
		scale = 1;
		ctx.font = "bold 15px Arial";
	}
	//90%
	else if (1 > canvasWidth/1366 && canvasWidth/1366 >= 0.9){
		scale = 0.9;
		ctx.font = "bold 14px Arial";
	}
	//80%
	else if (0.9 > canvasWidth/1366 && canvasWidth/1366 >= 0.8){
		scale = 0.8;
		ctx.font = "bold 12px Arial";
	}
	//70%
	else if (0.8 > canvasWidth/1366 && canvasWidth/1366 >= 0.7){
		scale = 0.7;
		ctx.font = "bold 11px Arial";
	}
	//60%
	else if (0.7 > canvasWidth/1366 && canvasWidth/1366 >= 0.6){
		scale = 0.6;
		ctx.font = "bold 9px Arial";
	}
	
	//100%
	if (scale >= 1){
		ctx.font = "bold 50px Arial";
	}
	//90%
	else if (1 > scale && scale >= 0.9){
		ctx.font = "bold 45px Arial";
	}
	//80%
	else if (0.9 > scale && scale >= 0.8){
		ctx.font = "bold 40px Arial";
	}
	//70%
	else if (0.8 > scale && scale >= 0.7){
		ctx.font = "bold 35px Arial";
	}
	//60%
	else if (0.7 > scale && scale >= 0.6){
		ctx.font = "bold 30px Arial";
	}
	
	//display this player's ability cooldown
	
	//draw spike
	ctx.drawImage(evolvedSpikeImg, 20*scale, 20*scale, 50*scale, 40*scale + 10);
	//draw time left to use
	ctx.fillStyle = "#000000";	
	if (players[myGameIndex].cooldown > 0){
		ctx.fillText(players[myGameIndex].cooldown + 's', 80*scale, 50*scale + 10);	
	}
	else if (players[myGameIndex].cooldown == 0){
		ctx.fillText('!!', 80*scale, 50*scale + 10);	
	}
}

function drawGUIPopUpMessages(PUMessage){
	//PUMessage Codes
	//1 = the starting GO!!!
	//2 = Blues Capturing
	//3 = Reds Capturing
	//4 = respawning
	
	var scale = (canvasWidth/1366)*0.75;
	var encImgWidth = 650;
	var encImgHeight = 80;
	
	//100%
	if (scale >= 1){
		ctx.font = "bold 65px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//90%
	else if (1 > scale && scale >= 0.9){
		ctx.font = "bold 59px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//80%
	else if (0.9 > scale && scale >= 0.8){
		ctx.font = "bold 52px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//70%
	else if (0.8 > scale && scale >= 0.7){
		ctx.font = "bold 46px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//60%
	else if (0.7 > scale && scale >= 0.6){
		ctx.font = "bold 39px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//50%
	else if (0.6 > scale && scale >= 0.5){
		ctx.font = "bold 33px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//40%
	else if (0.5 > scale && scale >= 0.4){
		ctx.font = "bold 26px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//30%
	else if (0.4 > scale && scale >= 0.3){
		ctx.font = "bold 20px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	//20%
	else if (0.3 > scale && scale >= 0.2){
		ctx.font = "bold 13px Arial";
		ctx.drawImage(popUpEnclosureImg, canvasWidth/2 - encImgWidth*scale/2, canvasHeight - 10 - 80*scale, encImgWidth*scale, encImgHeight*scale);
	}
	
	if (PUMessage == 1){
		ctx.fillStyle = "#000000";
		ctx.fillText("GO!!!", canvasWidth/2 - encImgWidth*scale/2 + 10, canvasHeight - 10 - 80*scale + encImgHeight*scale - 20*scale);
	}
	else if (PUMessage == 2){
		ctx.fillStyle = "#000066";
		ctx.fillText("BLUE CAPTURING!!!", canvasWidth/2 - encImgWidth*scale/2 + 10, canvasHeight - 10 - 80*scale + encImgHeight*scale - 20*scale);
	}
	else if (PUMessage == 3){
		ctx.fillStyle = "#660000";
		ctx.fillText("RED CAPTURING!!!", canvasWidth/2 - encImgWidth*scale/2 + 10, canvasHeight - 10 - 80*scale + encImgHeight*scale - 20*scale);
	}
	else if (PUMessage == 4){
		
		//same snippet as in drawMap()
		if (contentionStage <= 15){
			ctx.fillStyle = "#000066"; //blue
		}
		else if (contentionStage > 15 && contentionStage <= 30){
			ctx.fillStyle = "#660000"; //red
			if (contentionStage == 30){
				contentionStage = 0;
			}
		}
		
		ctx.fillText("CONTENTION", canvasWidth/2 - encImgWidth*scale/2 + 10, canvasHeight - 10 - 80*scale + encImgHeight*scale - 20*scale);
	}
	else if (PUMessage == 5){
		ctx.fillStyle = "#000000";
		ctx.fillText("Respawning..", canvasWidth/2 - encImgWidth*scale/2 + 10, canvasHeight - 10 - 80*scale + encImgHeight*scale - 20*scale);
	}
}

//draw victory screen and announce
function drawWinScreen(){	
	if (blueTimeToWin < 1){
		canvasWidth = window.innerWidth;
		canvasHeight = window.innerHeight;
		
		ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear canvas in prep for redraw
		ctx.fillStyle = "#000066";
		ctx.font = "bold 100px Arial";
		ctx.fillText("BLUE WINS", canvasWidth/2 - 200, canvasHeight/2);
	}
	else if (redTimeToWin < 1){		
		canvasWidth = window.innerWidth;
		canvasHeight = window.innerHeight;
		
		ctx.clearRect(0, 0, canvasWidth, canvasWidth); //clear canvas in prep for redraw
		ctx.fillStyle = "#660000";
		ctx.font = "bold 100px Arial";
		ctx.fillText("RED WINS", canvasWidth/2 - 200, canvasHeight/2);
	}
	
	//stop this from showing for forever
	winScreenTimer--;
}

function updatePlayerInArea(){
	var check;
	
	//if THIS player steps into flag area, increase count of his team's color in area
	if (players[myGameIndex].x > areaInitialX[2] && players[myGameIndex].x < areaFinishX[2] && players[myGameIndex].y > areaInitialY[2] && players[myGameIndex].y < areaFinishY[2]){
		
		check = FLAG.localeCompare(players[myGameIndex].inArea);
		
		//if this player "wasn't already in flag before", now they are
		if (check != 0){
			players[myGameIndex].inArea = "FLAG";
		}
	}	
	else{
		check = NONE.localeCompare(players[myGameIndex].inArea);
		
		//if this player 'was in the flag', now they aren't
		if (check != 0){
			players[myGameIndex].inArea = "NONE";
		}
	}
	
	//update all players with whether or not this player is in the flag area
	socket.emit('captureUpdate', players[myGameIndex].inArea, myGameIndex, myGameRoomName);
}

//most important function in the game
//it is the game
function playSimotegy() {
	gameInterval = setInterval(function(){ 
		//show STARTING IN # bit and how the controls work and which team this person is on, etc.
		if (introCount > -1){
			displayPregameInstructs();
			
			if (introCount == 0){
				inGameYesOrNo = true;
				inPreGameYesOrNo = false;
			}
		}
		//get to the game
		else{	
		
			var t0 = performance.now();
		
			//evolve the spikes and remove explosions
			if (spikesTimer == 6*4){
				spikeEvolution();
			}
			
			//To keep ability cooldowns in check too, the intervalCount gets reset at 5x25 (125) intervals
			//And to keep ingame messages from displaying forever, tick away the pop up message timers
			if (intervalCount >= 25*4){
				//the cooldown for abilities gets ticked down
				cooldownCountdown();
				
				//reset intervalCount
				intervalCount = 0;
				
				//tick down GO!! pop up message timer
				if (PUStartingGoTimer > 0){
					PUStartingGoTimer--;
				}
			}

			//if the game is still going on, draw it
			if (blueTimeToWin > 0 && redTimeToWin > 0){
				
				//update player's location
				checkDirectionAndMove();
				
				//update spikes' locations
				moveSpikes();
			
				//check how many players on each team is in the flag area
				countPlayersInFlagArea();
				
				//redraw the game screen
				drawMap();
				
				drawObjects();
				
				drawPlayers();
				
				drawGUI();
				
				//check for this players' collisions with objects
				objectCollisionDetection();
			}
			else if ((blueTimeToWin <= 0 || redTimeToWin <= 0) && winScreenTimer > 0){
				inPostGameYesOrNo = true;
				//draw either RED WINS or BLUE WINS
				drawWinScreen();
			}
			//if someone has won and the time for letting everyone know the game is over has past OR people simply aren't in the game anymore, go to lobby
			else if (((blueTimeToWin <= 0 || redTimeToWin <= 0) && winScreenTimer <= 0) || (inGameYesOrNo == false && inPostGameYesOrNo == true)){
				//stop the game's clock ticking and just go to the waiting room again
				clearInterval(gameInterval);
				
				//so a new game can start fresh
				resetGameVariables();
				
				//load the back into view
				fromGameToLobby();
			}
			
			//update interval
			intervalCount++;
			
			//update spikesTimer 
			spikesTimer++;
			
			//these should be done after updating player movements and the screen so people SEE they've hit something
			
			//update explosion timers and remove expired explosions
			updateExplosions();
			
			//update respawn holes
			updateDespawnHoles();
			
			updateRespawnHoles();
			
			var t1 = performance.now();
	
			console.log('simotegy: ' + (t1 - t0));
		}
	}, 10);
}

function fromGameToLobby(){	

	document.getElementById('simotegyGIF').style.display = "block";
	document.getElementById('chatEntry').style.display = "block";
	
	//get the how to slide show going again
	howToPlay = setInterval(function(){
		displaySlideshowAndMessages();
		
		//only proceed with the auto slide show if the user is not trying to look at one slide in particular
		if (mouseOverHowBox == false){
			howToSlide++;
			if (howToSlide > 10){
				howToSlide = 0;
			}
		}
		
	}, 3500);
	
	socket.emit('iHaveReturnedToLobby', myNameIs);
}

function countPlayersInFlagArea(){
	var check1;
	var check2;
	var check3;
	
	//reset
	bluesInFlag = 0;
	redsInFlag = 0;
	
	//check how many players are in the flag area for each team
	for (i=0; i < players.length; i++){			
		check1 = FLAG.localeCompare(players[i].inArea);
		check2 = BLUE.localeCompare(players[i].team);
		check3 = ALIVE.localeCompare(players[i].status);
		
		//if player is blue and on the flag area and alive
		if (check1 == 0 && check2 == 0 && check3 == 0){
			bluesInFlag++;
		}
		//if player is red and on the flag area and alive
		else if (check1 == 0 && check2 != 0 && check3 == 0){
			redsInFlag++;
		}
	}
	
	//first reset beenCapturings if no one was capturing for a moment
	//like if someone is hopping in and out, capturing should reset each time
	
	if (redsInFlag == 0){
		redBeenCapturing = 0;
	}
	
	if (bluesInFlag == 0){
		blueBeenCapturing = 0;
	}
	
	//this gets called in playSimotegy which goes off every 40ms
	//so 25 x 40ms = 1 second
	//so if a team has had the number adv for 1 second, 1s gets ticked off
	if (bluesInFlag > redsInFlag && 25*4 > blueBeenCapturing){
		blueBeenCapturing++;
		
		//if red was capturing before, reset cause now they aren't
		if (redBeenCapturing > 0){
			redBeenCapturing = 0;
		}
	}
	else if (redsInFlag > bluesInFlag && 25*4 > redBeenCapturing){
		redBeenCapturing++;
		
		//if blue was capturing before, reset cause now they aren't
		if (blueBeenCapturing > 0){
			blueBeenCapturing = 0;
		}
	}
	//if either has been capturing for 1s, update time to win
	else if (blueBeenCapturing >= 25*4 || redBeenCapturing >= 25*4){
		updateTimeToWin();
		
		blueBeenCapturing = 0;
		redBeenCapturing = 0;
	}
}

function updateTimeToWin(){
	//if there are more reds, tick 1 second off for red win
	if (redsInFlag > bluesInFlag && redTimeToWin > 0){
		redTimeToWin--;
		
		//have the pop up message show that red is capturing
		PURedCapturingTimer = 2;
		
		//play a sound every time the time ticks when the game is near end
		if (redTimeToWin < 5){
			
			tickTockSound.play();
			
			if (redTimeToWin < 1){
				socket.emit('RED WINS', myGameRoomName);
			}

		}
	}
	//if there are more blues, tick 1 second off for blue win
	else if (bluesInFlag > redsInFlag && blueTimeToWin > 0){
		blueTimeToWin--;

		//have the pop up message show that red is capturing
		PUBlueCapturingTimer = 2;
		
		//play a sound every time the time ticks when the game is near end
		if (blueTimeToWin < 5){
			
			tickTockSound.play();
			
			if (blueTimeToWin < 1){
				socket.emit('BLUE WINS', myGameRoomName);
			}
		}	
	}
	
	//tell server how long we see left on the clock
	//soon the server will tell all clients who sees least time left
	//everyone will adopt that time left til game over
	socket.emit('winningCheck', blueTimeToWin, redTimeToWin, myGameRoomName);
}

//manages player cooldown timers and modifies move speed
function cooldownCountdown(){
	var cdIndex;				
	for (cdIndex = 0; cdIndex < players.length; cdIndex++){
		if (players[cdIndex].cooldown > 0){
			players[cdIndex].cooldown--;
			
			if (players[cdIndex].cooldown <= 0){
				players[cdIndex].speed = 2.25;
			}
		}
	}
}

function checkDirectionAndMove(){
	var check1 = UP.localeCompare(players[myGameIndex].direction);
	var check2 = DOWN.localeCompare(players[myGameIndex].direction);
	var check3 = LEFT.localeCompare(players[myGameIndex].direction);
	var check4 = RIGHT.localeCompare(players[myGameIndex].direction);
	
	if (check1 == 0){
		moveUp();
	}
	else if (check2 == 0){
		moveDown();
	}
	else if (check3 == 0){
		moveLeft();
	}
	else if (check4 == 0){
		moveRight();
	}
	
	//update iJustTeleported if this player moves off the teleport
	if (iJustTeleported && 
	(players[myGameIndex].x <= gates[0].x - 40 || 
	players[myGameIndex].x >= gates[0].x + 40 || 
	players[myGameIndex].y <= gates[0].y - 40 || 
	players[myGameIndex].y >= gates[0].y + 40) && 
	(players[myGameIndex].x <= gates[1].x - 40 || 
	players[myGameIndex].x >= gates[1].x + 40 || 
	players[myGameIndex].y <= gates[1].y - 40 || 
	players[myGameIndex].y >= gates[1].y + 40) && 
	(players[myGameIndex].x <= gates[2].x - 40 || 
	players[myGameIndex].x >= gates[2].x + 40 || 
	players[myGameIndex].y <= gates[2].y - 40 || 
	players[myGameIndex].y >= gates[2].y + 40) && 
	(players[myGameIndex].x <= gates[3].x - 40 || 
	players[myGameIndex].x >= gates[3].x + 40 || 
	players[myGameIndex].y <= gates[3].y - 40 || 
	players[myGameIndex].y >= gates[3].y + 40)){
		iJustTeleported = false;
	}
	
	//send server this player's location and their mouse orientation
	socket.emit('movement', players[myGameIndex].x, players[myGameIndex].y, players[myGameIndex].mouseLeft, players[myGameIndex].mouseRight, players[myGameIndex].mouseAbove, players[myGameIndex].mouseBelow, players[myGameIndex].direction, myGameIndex, myGameRoomName);
}

function thisPlayerDied(){
	//set this player's status to dead
	players[myGameIndex].status = "DEAD";
	
	//set the respawn pop up timer for 1s
	PURespawnTimer = 1;
	
	//in 1 second - despawnHole lifetime, make a despawnHole
	setTimeout(function(){
		createDespawnHole(players[myGameIndex].x, players[myGameIndex].y);
	}, 880);
	
	//in 1 second, revive this player
	setTimeout(function(){
		//respawn player and notify other players of respawned location
		respawnPlayer();
		socket.emit('playerRespawned', players[myGameIndex].x, players[myGameIndex].y, myGameIndex, myGameRoomName);
	}, 1000);	
}

//remove a spike that was collided with
function removeSpike(i){
	//remember the ID to tell other clients which is the correct spike to remove
	var idToRemove = spikes[i].id;
	
	//remove from this client's spike list
	spikes.splice(i, 1);
	
	socket.emit('spikeRemoved', idToRemove, myGameIndex, myGameRoomName);
}

function removeVacuum(){
	setTimeout(function(){
		var tempVacuumX = [];
		var tempVacuumY = [];
		
		vacuumX = tempVacuumX;
		vacuumY = tempVacuumY;
		
		socket.emit('vacuumRemoved', vacuumX, vacuumY, myGameRoomName);
	}, 2000);
}

function respawnPlayer(){
	//check if this player is a LEADER
	check = LEADER.localeCompare(players[myGameIndex].pClass);
	
	//if this is a leader, check for team color, then spawn (move to) at appropriate base
	if (check == 0){
		check = BLUE.localeCompare(players[myGameIndex].team);
		
		//if blue, spawn at BLUE HOME
		if (check == 0){
			players[myGameIndex].x = -1440;
			players[myGameIndex].y = 0;
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		}
		//if red, spawn at RED HOME
		else{
			players[myGameIndex].x = 1440;
			players[myGameIndex].y = 0;
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		}
		
	}
	//must check if leaders exist in this game. If not, respawn at base.
	else{
		var NONE = "NONE";
		
		check = NONE.localeCompare(myLeader);
		
		//if leader is NONE, spawn at appropriate base
		if (check == 0){
			check = BLUE.localeCompare(players[myGameIndex].team);
			//if blue, spawn at BLUE HOME
			if (check == 0){
				players[myGameIndex].x = -1440;
				players[myGameIndex].y = 0;
				playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
				playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
			}
			//if red, spawn at RED HOME
			else{
				players[myGameIndex].x = 1440;
				players[myGameIndex].y = 0;
				playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
				playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
			}
		}
		//otherwise, find the leader, then spawn on them
		else{
			for(i = 0; i < players.length; i++){
				check = myLeader.localeCompare(players[i].name);
				//when we find our leader, spawn at their location
				if (check == 0){
					players[myGameIndex].x = players[i].x;
					players[myGameIndex].y = players[i].y;
					playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
					playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
				}
			}
		}
	}
	
	//set player to alive again
	players[myGameIndex].status = "ALIVE";
	createRespawnHole(players[myGameIndex].x, players[myGameIndex].y);
}

function moveUp(){
	var check = COMMANDER.localeCompare(players[myGameIndex].pClass);
	var checkMember = MEMBER.localeCompare(players[myGameIndex].pClass);
	var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
	
	if (inGameYesOrNo && check != 0 && checkStatus == 0){
		//change location
		players[myGameIndex].y -= players[myGameIndex].speed;
		playerViewY -= players[myGameIndex].speed;
		
		//if player goes past map border, keep inside
		if (players[myGameIndex].y < mapInitialY){
			players[myGameIndex].y = -1200;
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		}

		//check if this player is standing on the flag
		//update playerInArea
		//tell server
		updatePlayerInArea();
	}
}

function moveDown(){
	var check = COMMANDER.localeCompare(players[myGameIndex].pClass);
	var checkMember = MEMBER.localeCompare(players[myGameIndex].pClass);
	var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
	
	if (inGameYesOrNo && check != 0 && checkStatus == 0){
		//change location
		players[myGameIndex].y += players[myGameIndex].speed;
		playerViewY += players[myGameIndex].speed;
		
		//if player goes past map border, keep inside
		if (players[myGameIndex].y > mapFinishY){
			players[myGameIndex].y = 1200;
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		}
		
		//check if this player is standing on the flag
		//update playerInArea
		//tell server
		updatePlayerInArea();
	}
}

function moveLeft(){
	var check = COMMANDER.localeCompare(players[myGameIndex].pClass);
	var checkMember = MEMBER.localeCompare(players[myGameIndex].pClass);
	var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
	
	if (inGameYesOrNo && check != 0 && checkStatus == 0){
		//change location
		players[myGameIndex].x -= players[myGameIndex].speed;
		playerViewX -= players[myGameIndex].speed;
		
		//if player goes past map border, keep inside
		if (players[myGameIndex].x < mapInitialX){
			players[myGameIndex].x = -1800;
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
		}
		
		//check if this player is standing on the flag
		//update playerInArea
		//tell server
		updatePlayerInArea();
	}
}

function moveRight(){
	var check = COMMANDER.localeCompare(players[myGameIndex].pClass);
	var checkMember = MEMBER.localeCompare(players[myGameIndex].pClass);
	var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
	
	if (inGameYesOrNo && check != 0 && checkStatus == 0){
		//change location
		players[myGameIndex].x += players[myGameIndex].speed;
		playerViewX += players[myGameIndex].speed;
		
		//if player goes past map border, keep inside
		if (players[myGameIndex].x > mapFinishX){
			players[myGameIndex].x = 1800;
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
		}
		
		//check if this player is standing on the flag
		//update playerInArea
		//tell server
		updatePlayerInArea();
	}
}

function objectCollisionDetection(){
	var checkMember = MEMBER.localeCompare(players[myGameIndex].pClass);
	var checkLeader = LEADER.localeCompare(players[myGameIndex].pClass);
	var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
	var checkOtherMember;
	var checkOtherLeader;
	var checkOtherStatus;
	var checkOtherTeam;
	
	/*
	//if player collides with vacuum, get sucked in
	for (i = 0; i < vacuumX.length; i++){
		//if member
		if (checkStatus == 0 && checkMember == 0 && players[myGameIndex].x + 12 > vacuumX[i] - vacuumSize/2 && players[myGameIndex].x - 12 < vacuumX[i] + vacuumSize/2 && players[myGameIndex].y + 12 > vacuumY[i] - vacuumSize/2 && players[myGameIndex].y - 12 < vacuumY[i] + vacuumSize/2){
			players[myGameIndex].x = vacuumX[i];
			players[myGameIndex].y = vacuumY[i];
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		}
		//if leader
		else if (checkStatus == 0 && checkLeader == 0 && players[myGameIndex].x + 25 > vacuumX[i] - vacuumSize/2 && players[myGameIndex].x - 25 < vacuumX[i] + vacuumSize/2 && players[myGameIndex].y + 25 > vacuumY[i] - vacuumSize/2 && players[myGameIndex].y - 25 < vacuumY[i] + vacuumSize/2){
			players[myGameIndex].x = vacuumX[i];
			players[myGameIndex].y = vacuumY[i];
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
		}
	}
	*/
	
	//if player hits an ACTIVE spike and is a LEADER, send back to base. 
	//If player hits spike and is a MEMBER send back to LEADER.
	for (i = 0; i < spikes.length; i++){
		if (checkStatus == 0 && checkMember == 0 && players[myGameIndex].x + 12 > spikes[i].x - spikeSize/2 && players[myGameIndex].x - 12 < spikes[i].x + spikeSize/2 && players[myGameIndex].y + 12 > spikes[i].y - spikeSize/2 && players[myGameIndex].y - 12 < spikes[i].y + spikeSize/2 && spikes[i].active == 1){
			var numX = (0 + spikes[i].x + players[myGameIndex].x)/2;
			var numY = (0 + spikes[i].y + players[myGameIndex].y)/2;
			createExplosion(numX, numY);
			removeSpike(i);
			thisPlayerDied();
		}
		else if (checkStatus == 0 && checkLeader == 0 && players[myGameIndex].x + 25 > spikes[i].x - spikeSize/2 && players[myGameIndex].x - 25 < spikes[i].x + spikeSize/2 && players[myGameIndex].y + 25 > spikes[i].y - spikeSize/2 && players[myGameIndex].y - 25 < spikes[i].y + spikeSize/2 && spikes[i].active == 1){
			var numX = (0 + spikes[i].x + players[myGameIndex].x)/2;
			var numY = (0 + spikes[i].y + players[myGameIndex].y)/2;
			createExplosion(numX, numY);
			removeSpike(i);
			thisPlayerDied();
		}
	}
	
	//if this player collides into another player that is armed, pop this player
	for (i = 0; i < players.length; i++){
		checkOtherMember = MEMBER.localeCompare(players[i].pClass);
		checkOtherLeader = LEADER.localeCompare(players[i].pClass);
		
		//don't count self and only bother if self IS alive
		if (checkStatus == 0 && i != myGameIndex){
			//if THIS player is a member
			if (checkMember == 0){
				//if OTHER player is a member and not on the same team
				if (checkOtherMember == 0 && players[myGameIndex].team.localeCompare(players[i].team) != 0){
					//and that player's cooldown is 0 (they are spikey), kill this player
					if (players[myGameIndex].x + 12 > players[i].x - memberSize/2 && players[myGameIndex].x - 12 < players[i].x + memberSize/2 && players[myGameIndex].y + 12 > players[i].y - memberSize/2 && players[myGameIndex].y - 12 < players[i].y + memberSize/2 && players[i].cooldown == 0){
						var numX = (0 + players[myGameIndex].x + players[i].x)/2;
						var numY = (0 + players[myGameIndex].y + players[i].y)/2;
						createExplosion(numX, numY);
						//sure I could have this function out just once, but I want to have it done before thisPlayerDieD()
						socket.emit('pvpCollideKill', myGameIndex, myGameRoomName);
						thisPlayerDied();
					}
				}
				//if OTHER player is a leader and not on the same team
				else if (checkOtherLeader == 0&& players[myGameIndex].team.localeCompare(players[i].team) != 0){
					//and that player's cooldown is 0 (they are spikey), kill this player
					if (players[myGameIndex].x + 12 > players[i].x - leaderSize/2 && players[myGameIndex].x - 12 < players[i].x + leaderSize/2 && players[myGameIndex].y + 12 > players[i].y - leaderSize/2 && players[myGameIndex].y - 12 < players[i].y + leaderSize/2 && players[i].cooldown == 0){
						var numX = (0 + players[myGameIndex].x + players[i].x)/2;
						var numY = (0 + players[myGameIndex].y + players[i].y)/2;
						createExplosion(numX, numY);
						//sure I could have this function out just once, but I want to have it done before thisPlayerDieD()
						socket.emit('pvpCollideKill', myGameIndex, myGameRoomName);
						thisPlayerDied();
					}
				}
			}
			//if THIS player is a leader
			else if (checkLeader == 0){					
				//if OTHER player is a member
				if (checkOtherMember == 0 && players[myGameIndex].team.localeCompare(players[i].team) != 0){
					//and that player's cooldown is 0 (they are spikey), kill this player
					if (players[myGameIndex].x + 24 > players[i].x - memberSize/2 && players[myGameIndex].x - 24 < players[i].x + memberSize/2 && players[myGameIndex].y + 24 > players[i].y - memberSize/2 && players[myGameIndex].y - 24 < players[i].y + memberSize/2 && players[i].cooldown == 0){
						var numX = (0 + players[myGameIndex].x + players[i].x)/2;
						var numY = (0 + players[myGameIndex].y + players[i].y)/2;
						createExplosion(numX, numY);
						//sure I could have this function out just once, but I want to have it done before thisPlayerDieD()
						socket.emit('pvpCollideKill', myGameIndex, myGameRoomName);
						thisPlayerDied();
					}
				}
				//if OTHER player is a leader
				else if (checkOtherLeader == 0 && players[myGameIndex].team.localeCompare(players[i].team) != 0){
					//and that player's cooldown is 0 (they are spikey), kill this player
					if (players[myGameIndex].x + 24 > players[i].x - leaderSize/2 && players[myGameIndex].x - 24 < players[i].x + leaderSize/2 && players[myGameIndex].y + 24 > players[i].y - leaderSize/2 && players[myGameIndex].y - 24 < players[i].y + leaderSize/2 && players[i].cooldown == 0){
						var numX = (0 + players[myGameIndex].x + players[i].x)/2;
						var numY = (0 + players[myGameIndex].y + players[i].y)/2;
						createExplosion(numX, numY);
						//sure I could have this function out just once, but I want to have it done before thisPlayerDieD()
						socket.emit('pvpCollideKill', myGameIndex, myGameRoomName);
						thisPlayerDied();
					}
				}
			}
		}
	}
	
	//check for collision with a gate
	for (i = 0; i < gates.length; i++){
		
		//if THIS player enters a gate and is alive, teleport to other gate
		if (checkStatus == 0 && !iJustTeleported && players[myGameIndex].x > gates[i].x - 40 && players[myGameIndex].x < gates[i].x + 40 && players[myGameIndex].y > gates[i].y - 40 && players[myGameIndex].y < gates[i].y + 40){
			
			//create a despawn hole where the player is
			createDespawnHole(players[myGameIndex].x, players[myGameIndex].y);
			
			//play the teleport sound
			teleportSound.play();
			
			//change location to other random gate
				
			var rand = Math.floor(4*Math.random());
			
			players[myGameIndex].x = gates[rand].x;
			players[myGameIndex].y = gates[rand].y;
			
			//update player's view
			playerViewX = players[myGameIndex].x - (playerViewSizeX/2);
			playerViewY = players[myGameIndex].y - (playerViewSizeY/2);
			
			//tell server
			socket.emit('playerTeleport', players[myGameIndex].x, players[myGameIndex].y, myGameIndex, myGameRoomName);
			
			//prevent teleport looping
			iJustTeleported = true;
			
			//create a respawn hole where the player will be
			createRespawnHole(players[myGameIndex].x, players[myGameIndex].y);
		}
		
		//also teleport spikes that enter the gate and change their direction if they would be heading towards player spawn points
		for (z = 0; z < spikes.length; z++){
			if (spikes[z].x > gates[i].x - 30 && spikes[z].x < gates[i].x + 30 && spikes[z].y > gates[i].y - 30 && spikes[z].y < gates[i].y + 30 && spikes[z].justTeleported == false){
				
				//create a despawn hole where the spike is
				createDespawnHole(spikes[z].x, spikes[z].y);
				
				if (gates[i].x + 50 > playerViewX && gates[i].x - 50 < playerViewX + canvasWidth && gates[i].y + 50 > playerViewY && gates[i].y - 50 < playerViewY + canvasHeight){
					teleportSound.play();
				}
				
				//change location to other random gate
				
				var rand = Math.floor(4*Math.random());
				
				spikes[z].x = gates[rand].x;
				spikes[z].y = gates[rand].y;
				
				//if the spike pops up in the top left gate
				if (rand == 0){
					rand2 = Math.random();
					if (rand2 >= 0.5){
						spikes[z].direction = RIGHT;
					}
					else if (rand2 < 0.5){
						spikes[z].direction = DOWN;
					}
				}
				//if the spike pops up in the bottom left gate
				else if (rand == 1){
					rand2 = Math.random();
					if (rand2 >= 0.5){
						spikes[z].direction = RIGHT;
					}
					else if (rand2 < 0.5){
						spikes[z].direction = UP;
					}
				}
				//if the spike pops up in the top right gate
				else if (rand == 2){
					rand2 = Math.random();
					if (rand2 >= 0.5){
						spikes[z].direction = LEFT;
					}
					else if (rand2 < 0.5){
						spikes[z].direction = DOWN;
					}
				}
				//if the spike pops up in the bottom right gate
				else if (rand == 3){
					rand2 = Math.random();
					if (rand2 >= 0.5){
						spikes[z].direction = LEFT;
					}
					else if (rand2 < 0.5){
						spikes[z].direction = UP;
					}
				}
				
				//prevent teleport loop
				spikes[z].justTeleported = true;
				
				//create a despawn hole where the spike is
				createRespawnHole(spikes[z].x, spikes[z].y);
			}
		}
	}
}

function resetGameVariables(){
	inGameYesOrNo = false;
	inPreGameYesOrNo = false;
	inPostGameYesOrNo = false;
	myGameRoomName = "lobby";
	gameModeSelected = 1;

	/*
	INGAME VARIABLES
	*/
	players = [];
	playerViewSizeX; //same for all players except the Commanders
	playerViewSizeY; //same for all players except the Commanders
	playerViewX; //where is this player looking
	playerViewY; //where is this player looking
	usedCooldown = false;
	cooldownTime = 5;
	spikesTimer = 0;

	//ingame 'dynamic' objects
	spikes = [];
	gates = [];
	vacuumX = [];
	vacuumY = [];

	//map dimensions and key area coordinates
	mapInitialX = -1800;
	mapInitialY = -1200;
	mapFinishX = 1800;
	mapFinishY = 1200;

	//who controls what areas?
	//where are the areas?
	//area = [BLUE HOME, BLUE ASSETS, FLAG, RED ASSETS, RED HOME];
	areaOwner = ["BLUE", "BLUE", "NONE", "RED", "RED"]; //[0] = BLUE HOME, [1] = blue assets, [2] = flag, [3] = red assets, [4] = RED HOME
	var areaInitialX = [-1800, -360, -360, -360, 1080];
	var areaInitialY = [-240, -1200, -240, 720, -240];
	var areaFinishX = [-1080, 360, 360, 360, 1800];
	var areaFinishY = [240, -720, 240, 1200, 240];

	//time left for team to win
	bluesInFlag = 0;
	redsInFlag = 0;
	blueLeadersInFlag = 0; //if a leader is capturing, capture faster
	redLeadersInFlag = 0; //if a leader is capturing, capture faster
	blueTimeToWin = 0;
	redTimeToWin = 0;

	//somethings happen every interval, some happen some intervals
	intervalCount = 0;

	//used in the transition from waiting to game
	introCount = 10;

	//how long the starting GO message is displayed for
	PUStartingGoTimer = 1; //starts at 1 while the others start at 0 cause this one should show in the begining automatically

	//to keep the X TEAM WINS screen temporary
	winScreenTimer = 100;
}

function stopTheRetardedWinBeforeWinningCrap(){
	//time left for team to win
	bluesInFlag = 0;
	redsInFlag = 0;
	blueLeadersInFlag = 0; //if a leader is capturing, capture faster
	redLeadersInFlag = 0; //if a leader is capturing, capture faster
	blueTimeToWin = 40;
	redTimeToWin = 40;
}

function displaySlideshowAndMessages(){
	if (inGameYesOrNo == false && inPreGameYesOrNo == false && inPostGameYesOrNo == false){
		//refresh the lobby screen
		canvasWidth = window.innerWidth;
		canvasHeight = window.innerHeight;

		//clear what was on canvas before
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		//write the chat messages
		var index = 0;
		ctx.fillStyle = "#000000";		
		
		while(index < chatMessages.length){
			if (index == 0){
				ctx.font = "16px Arial";
				ctx.fillText("logged in as: " + myNameIs, 15, 10+15*(index+1));
				ctx.fillText(chatMessages[index], 190, 246+15*(index)+10);
				ctx.font = "12px Arial";
				ctx.fillText("__________________________________________", 15, 27);
			}
			else if (index >= 1 && index <= 6) {
				ctx.font = "12px Arial";
				ctx.fillText(chatMessages[index], 190, 246+15*(index)+10);
			}
			else if (index > 6 && index <= 19){
				ctx.font = "12px Arial";
				ctx.fillText(chatMessages[index], 15, 13+15*(index-5));
			}
			index++;
		}
		
		//line encasing the bottom of chat
		ctx.fillText("__________________________________________", 15, 226);

		var rBY;
		
		//display game mode button and determine where to display the ready button
		if (gameModeSelected == 1){
			ctx.drawImage(oneVone3, 15, 246+38*0, 72, 36);
			ctx.drawImage(twoVtwo1, 15, 246+38*1, 72, 36);
			ctx.drawImage(threeVthree1, 15, 246+38*2, 72, 36);
			ctx.drawImage(fourVfour1, 15, 246+38*3, 72, 36);
			ctx.drawImage(fiveVfive1, 15, 246+38*4, 72, 36);
			ctx.drawImage(sixVsix1, 15, 246+38*5, 72, 36);

			rBY = 246+38*0;
		}
		else if (gameModeSelected == 2){
			ctx.drawImage(oneVone1, 15, 246+38*0, 72, 36);
			ctx.drawImage(twoVtwo3, 15, 246+38*1, 72, 36);
			ctx.drawImage(threeVthree1, 15, 246+38*2, 72, 36);
			ctx.drawImage(fourVfour1, 15, 246+38*3, 72, 36);
			ctx.drawImage(fiveVfive1, 15, 246+38*4, 72, 36);
			ctx.drawImage(sixVsix1, 15, 246+38*5, 72, 36);

			rBY = 246+38*1;
		}
		else if (gameModeSelected == 3){
			ctx.drawImage(oneVone1, 15, 246+38*0, 72, 36);
			ctx.drawImage(twoVtwo1, 15, 246+38*1, 72, 36);
			ctx.drawImage(threeVthree3, 15, 246+38*2, 72, 36);
			ctx.drawImage(fourVfour1, 15, 246+38*3, 72, 36);
			ctx.drawImage(fiveVfive1, 15, 246+38*4, 72, 36);
			ctx.drawImage(sixVsix1, 15, 246+38*5, 72, 36);

			rBY = 246+38*2;	
		}
		else if (gameModeSelected == 4){
			ctx.drawImage(oneVone1, 15, 246+38*0, 72, 36);
			ctx.drawImage(twoVtwo1, 15, 246+38*1, 72, 36);
			ctx.drawImage(threeVthree1, 15, 246+38*2, 72, 36);
			ctx.drawImage(fourVfour3, 15, 246+38*3, 72, 36);
			ctx.drawImage(fiveVfive1, 15, 246+38*4, 72, 36);
			ctx.drawImage(sixVsix1, 15, 246+38*5, 72, 36);

			rBY = 246+38*3;	
		}
		else if (gameModeSelected == 5){
			ctx.drawImage(oneVone1, 15, 246+38*0, 72, 36);
			ctx.drawImage(twoVtwo1, 15, 246+38*1, 72, 36);
			ctx.drawImage(threeVthree1, 15, 246+38*2, 72, 36);
			ctx.drawImage(fourVfour1, 15, 246+38*3, 72, 36);
			ctx.drawImage(fiveVfive3, 15, 246+38*4, 72, 36);
			ctx.drawImage(sixVsix1, 15, 246+38*5, 72, 36);

			rBY = 246+38*4;	
		}
		else if (gameModeSelected == 6){
			ctx.drawImage(oneVone1, 15, 246+38*0, 72, 36);
			ctx.drawImage(twoVtwo1, 15, 246+38*1, 72, 36);
			ctx.drawImage(threeVthree1, 15, 246+38*2, 72, 36);
			ctx.drawImage(fourVfour1, 15, 246+38*3, 72, 36);
			ctx.drawImage(fiveVfive1, 15, 246+38*4, 72, 36);
			ctx.drawImage(sixVsix3, 15, 246+38*5, 72, 36);

			rBY = 246+38*5;	
		}
		
		//draw the 'hovered over' image if the button is hovered over
		if (mouseOver1v1 == true && gameModeSelected != 1){
			ctx.drawImage(oneVone2, 15, 246+38*0, 72, 36);
		}
		else if (mouseOver2v2 == true && gameModeSelected != 2){
			ctx.drawImage(twoVtwo2, 15, 246+38*1, 72, 36);
		}
		else if (mouseOver3v3 == true && gameModeSelected != 3){
			ctx.drawImage(threeVthree2, 15, 246+38*2, 72, 36);
		}
		else if (mouseOver4v4 == true && gameModeSelected != 4){
			ctx.drawImage(fourVfour2, 15, 246+38*3, 72, 36);
		}
		else if (mouseOver5v5 == true && gameModeSelected != 5){
			ctx.drawImage(fiveVfive2, 15, 246+38*4, 72, 36);
		}
		else if (mouseOver6v6 == true && gameModeSelected != 6){
			ctx.drawImage(sixVsix2, 15, 246+38*5, 72, 36);
		}
		
		//display ready button beside the selected game mode
		if (readyStatus == false){
			if (mouseOverReadyButton == false){
				ctx.drawImage(ready1Img, 97, rBY, 72, 36);
			}
			else if (mouseOverReadyButton == true){
				ctx.drawImage(ready2Img, 97, rBY, 72, 36);
			}
		}
		else if (readyStatus == true){
			if (mouseOverReadyButton == false){
				ctx.drawImage(unready1Img, 97, rBY, 72, 36);
			}
			else if (mouseOverReadyButton == true){
				ctx.drawImage(unready2Img, 97, rBY, 72, 36);
			}
		}


		//display slideshow or text

		//in testing, 1067 was the size that allowed the slideshow images to display fully
		if (canvasWidth >= 1067){
			//display how to play slideshow
			if (howToSlide == 0){
				ctx.drawImage(howTo0Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 0){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 1){
				ctx.drawImage(howTo1Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 1){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 2){
				ctx.drawImage(howTo2Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 2){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 3){
				ctx.drawImage(howTo3Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 3){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 4){
				ctx.drawImage(howTo4Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 4){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 5){
				ctx.drawImage(howTo5Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 5){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 6){
				ctx.drawImage(howTo6Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 6){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 7){
				ctx.drawImage(howTo7Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 7){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 8){
				ctx.drawImage(howTo8Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 8){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 9){
				ctx.drawImage(howTo9Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 9){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
			else if (howToSlide == 10){
				ctx.drawImage(howTo10Img, 375, 27);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10, 10);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 10){
						ctx.fillRect(379, 38+index*15, 8, 8);
					}
				}
			}
		}
		else if (canvasWidth < 1067){
			//so the canvaswidth is shrunken somewhat, so scale the image + control boxes
			var diff = 1067 - canvasWidth;
			var scale = (683 - diff)/683; //683 is the width size of the slide show
			
			 //display how to play slideshow
			if (howToSlide == 0){
				ctx.drawImage(howTo0Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 0){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 1){
				ctx.drawImage(howTo1Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 1){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 2){
				ctx.drawImage(howTo2Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 2){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 3){
				ctx.drawImage(howTo3Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 3){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 4){
				ctx.drawImage(howTo4Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 4){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 5){
				ctx.drawImage(howTo5Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 5){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 6){
				ctx.drawImage(howTo6Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 6){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 7){
				ctx.drawImage(howTo7Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 7){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 8){
				ctx.drawImage(howTo8Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 8){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 9){
				ctx.drawImage(howTo9Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 9){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
			else if (howToSlide == 10){
				ctx.drawImage(howTo10Img, 375, 27, 683*scale, 405*scale);
				//draw black boxes
				ctx.fillStyle = "#000000";
				for (index = 0; index < 11; index++){
					ctx.fillRect(378, 37+index*15, 10*scale, 10*scale);
				}
				//draw white boxes
				ctx.fillStyle = "#FFFFFF";
				for (index = 0; index < 11; index++){
					if (index != 10){
						ctx.fillRect(379, 38+index*15, 8*scale, 8*scale);
					}
				}
			}
		}
	}	
}

function spikeEvolution(){
	for (i = 0; i < spikes.length; i++){
		//if the spike was just placed, set spike to active when done evolving
		//otherwise show that the spike popped
		if (spikes[i].active == 0){
			if (spikes[i].activationTimer > 0){
				spikes[i].activationTimer--;
			}
			else if (spikes[i].activationTimer == 0){
				spikes[i].active = 1;
			}
		}
	}
	
	//reset
	spikesTimer = 0;
}

//move spikes in the direction they are going
function moveSpikes(){
	for (i = 0; i < spikes.length; i++){
		var checkLeft = LEFT.localeCompare(spikes[i].direction);
		var checkRight = RIGHT.localeCompare(spikes[i].direction);
		var checkUp = UP.localeCompare(spikes[i].direction);
		var checkDown = DOWN.localeCompare(spikes[i].direction);
		
		if (checkLeft == 0){
			spikes[i].x -= spikes[i].speed;
			
			//check if this spike past the map border
			//if it did, make go the opposite direction
			if (spikes[i].x < -1800){
				spikes[i].direction = RIGHT;
			}
		}
		else if (checkRight == 0){
			spikes[i].x += spikes[i].speed;
			
			//check if this spike past the map border
			//if it did, make go the opposite direction
			if (spikes[i].x > 1800){
				spikes[i].direction = LEFT;
			}
		}
		else if (checkUp == 0){
			spikes[i].y -= spikes[i].speed;
			
			//check if this spike past the map border
			//if it did, make go the opposite direction
			if (spikes[i].y < -1200){
				spikes[i].direction = DOWN;
			}
		}
		else if (checkDown == 0){
			spikes[i].y += spikes[i].speed;
			
			//check if this spike past the map border
			//if it did, make go the opposite direction
			if (spikes[i].y > 1200){
				spikes[i].direction = UP;
			}
		}
		
		//justTeleported if this spike moves off the teleport
		if (spikes[i].justTeleported && 
		(spikes[i].x <= gates[0].x - 40 || 
		spikes[i].x >= gates[0].x + 40 || 
		spikes[i].y <= gates[0].y - 40 || 
		spikes[i].y >= gates[0].y + 40) && 
		(spikes[i].x <= gates[1].x - 40 || 
		spikes[i].x >= gates[1].x + 40 || 
		spikes[i].y <= gates[1].y - 40 || 
		spikes[i].y >= gates[1].y + 40) && 
		(spikes[i].x <= gates[2].x - 40 || 
		spikes[i].x >= gates[2].x + 40 || 
		spikes[i].y <= gates[2].y - 40 || 
		spikes[i].y >= gates[2].y + 40) && 
		(spikes[i].x <= gates[3].x - 40 || 
		spikes[i].x >= gates[3].x + 40 || 
		spikes[i].y <= gates[3].y - 40 || 
		spikes[i].y >= gates[3].y + 40)){
			spikes[i].justTeleported = false;
		}
	}
}

function createExplosion(x, y){
	var index = explosionsX.length;
	
	explosionsX[index] = x;
	explosionsY[index] = y;
	explosionsTimer[index] = 2*4;	
	poofSound.play();
}

function updateExplosions(){
	for (i = 0; i < explosionsTimer.length; i++){
		explosionsTimer[i]--;
		
		//if expired, keep only unexpired
		if (explosionsTimer[i] <= 0){
			
			explosionsTimer.splice(i, 1);
			explosionsX.splice(i, 1);
			explosionsY.splice(i, 1);
			
			/*
			var tempX = [];
			var tempY = [];
			var tempTimer = [];
			var tempIndex = 0;
			
			for (index = 0; index < explosionsTimer.length; index++){
				if (index != i){
					tempX[tempIndex] = explosionsX[index];
					tempY[tempIndex] = explosionsY[index];
					tempTimer[tempIndex] = explosionsTimer[index];
					tempIndex++;
				}
			}
			
			explosionsX = tempX;
			explosionsY = tempY;
			explosionsTimer = tempTimer;
			*/
		}
	}
}

function createDespawnHole(x,y){
	var index = despawnHoleX.length;
	
	despawnHoleX[index] = x;
	despawnHoleY[index] = y;
	despawnHoleTimer[index] = 3*4;
}

function updateDespawnHoles(){
	for (i = 0; i < despawnHoleTimer.length; i++){
		despawnHoleTimer[i]--;
		
		//if expired, keep only unexpired
		if (despawnHoleTimer[i] <= 0){
			
			despawnHoleTimer.splice(i, 1);
			despawnHoleX.splice(i, 1);
			despawnHoleY.splice(i, 1);
			
			/*
			var tempX = [];
			var tempY = [];
			var tempTimer = [];
			var tempIndex = 0;
			
			for (index = 0; index < explosionsTimer.length; index++){
				if (index != i){
					tempX[tempIndex] = despawnHoleX[index];
					tempY[tempIndex] = despawnHoleY[index];
					tempTimer[tempIndex] = despawnHoleTimer[index];
					tempIndex++;
				}
			}
			
			despawnHoleX = tempX;
			despawnHoleY = tempY;
			despawnHoleTimer = tempTimer;
			*/
		}
	}
}

function createRespawnHole(x,y){
	var index = respawnHoleX.length;
	
	respawnHoleX[index] = x;
	respawnHoleY[index] = y;
	respawnHoleTimer[index] = 3*4;
}

function updateRespawnHoles(){
	for (i = 0; i < respawnHoleTimer.length; i++){
		respawnHoleTimer[i]--;
		
		//if expired, keep only unexpired
		if (respawnHoleTimer[i] <= 0){
			
			respawnHoleTimer.splice(i, 1);
			respawnHoleX.splice(i, 1);
			respawnHoleY.splice(i, 1);
			
			/*
			var tempX = [];
			var tempY = [];
			var tempTimer = [];
			var tempIndex = 0;
			
			for (index = 0; index < explosionsTimer.length; index++){
				if (index != i){
					tempX[tempIndex] = respawnHoleX[index];
					tempY[tempIndex] = respawnHoleY[index];
					tempTimer[tempIndex] = respawnHoleTimer[index];
					tempIndex++;
				}
			}
			
			respawnHoleX = tempX;
			respawnHoleY = tempY;
			respawnHoleTimer = tempTimer;
			*/
		}
	}
}

/*
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
PLAYER CONTROLS==============================================================
*/

//1) controls for movement, using W, A, S and D
//2) check for collisions with objects
//3) check for entering within key areas

//move player up and tell server and prevent if S or DOWN is pressed
//Commanders cannot move
Mousetrap.bind('w', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "UP";
	}
});
Mousetrap.bind('up', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "UP";
	}
});
//move player right and tell server and prevent if D or LEFT is pressed
//Commanders cannot move
Mousetrap.bind('a', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "LEFT";
	}
});
Mousetrap.bind('left', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "LEFT";
	}
});
//move player down and tell server and prevent if W or UP is pressed
//Commanders cannot move
Mousetrap.bind('s', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "DOWN";
	}
});
Mousetrap.bind('down', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "DOWN";
	}
});
//move player left and tell server and prevent if A or RIGHT is pressed
//Commanders cannot move
Mousetrap.bind('d', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "RIGHT";
	}
});
Mousetrap.bind('right', function(){
	if (inGameYesOrNo == true){
		players[myGameIndex].direction = "RIGHT";
	}
});

Mousetrap.bind('enter enter enter', function(){
	if (inGameYesOrNo == false && inPostGameYesOrNo == false && inPreGameYesOrNo == false){
		socket.emit('training');
		gameModeSelected = 0;
		console.log('told server ready for training');
	}
});

//this function is called in index.html
//this is what occurs when a game is in progress and the mouse is left-clicked on the map
function mouseClick(event){
	if (inGameYesOrNo == true && inPostGameYesOrNo == false && inPreGameYesOrNo == false){
		//check what class player this is to know what object to place
		var check = COMMANDER.localeCompare(players[myGameIndex].pClass);
		var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
		//-2 to account for the distance in pixels of the canvas edge to where the mouse coords actually start counting
		var mouseX = event.clientX - 2;
		var mouseY = event.clientY - 2;
		
		if (players[myGameIndex].cooldown == 0 && checkStatus == 0){
			//if this is a MEMBER or LEADER
			if (check != 0){
				
				//determine direction in which to send the spike
				var spikeDirection;
				var spikeSpeedModifier = 1;
				
				//compare with player's own movement direction to determine spike's speed
				var checkMoveUp = UP.localeCompare(players[myGameIndex].direction);
				var checkMoveDown = DOWN.localeCompare(players[myGameIndex].direction);
				var checkMoveRight = RIGHT.localeCompare(players[myGameIndex].direction);
				var checkMoveLeft = LEFT.localeCompare(players[myGameIndex].direction);
				
				//first check which axis the click position is going to be on
				//if the click position over X axis is greater then check for right or left
				if (players[myGameIndex].mouseRight){
					spikeDirection = "RIGHT";
					
					if (checkMoveRight == 0){
						spikeSpeedModifier = 2;
					}
					else if (checkMoveLeft == 0){
						spikeSpeedModifier = 0;
					}
				}
				else if (players[myGameIndex].mouseLeft){
					spikeDirection = "LEFT";
					
					if (checkMoveRight == 0){
						spikeSpeedModifier = 0;
					}
					else if (checkMoveLeft == 0){
						spikeSpeedModifier = 2;
					}
				}
				else if (players[myGameIndex].mouseBelow){
					spikeDirection = "DOWN";
					
					if (checkMoveDown == 0){
						spikeSpeedModifier = 2;
					}
					else if (checkMoveUp == 0){
						spikeSpeedModifier = 0;
					}
				}
				else if (players[myGameIndex].mouseAbove){
					spikeDirection = "UP";
					
					if (checkMoveDown == 0){
						spikeSpeedModifier = 0;
					}
					else if (checkMoveUp == 0){
						spikeSpeedModifier = 2;
					}
				}
				//if the click position is equally distanced on both axises then default to player's own direction
				else if (!players[myGameIndex].mouseAbove && !players[myGameIndex].mouseBelow && !players[myGameIndex].mouseLeft && !players[myGameIndex].mouseRight){
					spikeDirection = players[myGameIndex].direction;
					spikeSpeedModifier = 5;
				}
				
				var newSpike = new createSpikeObject(players[myGameIndex].x, players[myGameIndex].y, spikeDirection, spikeSpeedModifier);
				spikes.push(newSpike);
			
				//set this player's cooldown timer to 5 and increase their speed
				players[myGameIndex].cooldown = 5;
				players[myGameIndex].speed = 3;
				players[myGameIndex].clicked = 3;
				
				//emit the creation of a spike
				socket.emit('spikeCreated', newSpike, myGameIndex, myGameRoomName);
			}
			//if this is not a MEMBER or LEADER, must be a COMMANDER
			else {
				var index = vacuumX.length;
				
				vacuumX[index] = mouseX + playerViewX;
				vacuumY[index] = mouseY + playerViewY;
				
				//remove the vacuum in 2 seconds
				removeVacuum();

				//set this player's cooldown timer to 5
				players[myGameIndex].cooldown = 5;
				
				socket.emit('vacuumCreated', vacuumX[index], vacuumY[index], index, myGameRoomName);
			}
		}
	}
	//if not ingame, then clicking where button is will tell the server this player is ready
	else if (inGameYesOrNo == false && inPostGameYesOrNo == false && inPreGameYesOrNo == false){
		//-2 to account for the distance in pixels of the canvas edge to where the mouse coords actually start counting
		var mouseX = event.clientX - 2;
		var mouseY = event.clientY - 2;
		
		//if the mouse was clicked over the game mode button, change the game mode
		//also if this player was just ready for a game in another mode, unready them
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*0 + gifImageHeight + chatFormHeight && mouseY <= 246+38*0+36 + gifImageHeight + chatFormHeight){
			//if this player were ready before, they will not be upon changing game modes
			if (readyStatus == true && gameModeSelected != 1){
				socket.emit('unready');
				readyStatus = false;
			}
			gameModeSelected = 1;
		}
		else if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*1 + gifImageHeight + chatFormHeight && mouseY <= 246+38*1+36 + gifImageHeight + chatFormHeight){
			//if this player were ready before, they will not be upon changing game modes
			if (readyStatus == true && gameModeSelected != 2){
				socket.emit('unready');
				readyStatus = false;
			}
			gameModeSelected = 2;
		}
		else if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*2 + gifImageHeight + chatFormHeight && mouseY <= 246+38*2+36 + gifImageHeight + chatFormHeight){
			//if this player were ready before, they will not be upon changing game modes
			if (readyStatus == true && gameModeSelected != 3){
				socket.emit('unready');
				readyStatus = false;
			}
			gameModeSelected = 3;
		}
		else if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*3 + gifImageHeight + chatFormHeight && mouseY <= 246+38*3+36 + gifImageHeight + chatFormHeight){
			//if this player were ready before, they will not be upon changing game modes
			if (readyStatus == true && gameModeSelected != 4){
				socket.emit('unready');
				readyStatus = false;
			}
			gameModeSelected = 4;
		}
		else if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*4 + gifImageHeight + chatFormHeight && mouseY <= 246+38*4+36 + gifImageHeight + chatFormHeight){
			//if this player were ready before, they will not be upon changing game modes
			if (readyStatus == true && gameModeSelected != 5){
				socket.emit('unready');
				readyStatus = false;
			}
			gameModeSelected = 5;
		}
		else if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*5 + gifImageHeight + chatFormHeight && mouseY <= 246+38*5+36 + gifImageHeight + chatFormHeight){
			//if this player were ready before, they will not be upon changing game modes
			if (readyStatus == true && gameModeSelected != 6){
				socket.emit('unready');
				readyStatus = false;
			}
			gameModeSelected = 6;
		}
		
		//if the mouse was clicked over the ready button image, set to ready or unready and mirror this on server
		if (mouseX >= 97 && mouseX <= 169 && mouseY >= 246+(38*(gameModeSelected-1)) + gifImageHeight + chatFormHeight && mouseY <= 246+(38*(gameModeSelected-1))+36 + gifImageHeight + chatFormHeight){
			if (readyStatus == false){
				socket.emit('ready', gameModeSelected);
				readyStatus = true;
			}
			else if (readyStatus == true){
				socket.emit('unready');
				readyStatus = false;
			}
		}
	}
}

function mouseMove(event){
	//if not in game
	if (!inGameYesOrNo && !inPreGameYesOrNo && !inPostGameYesOrNo){
		var mouseX = event.clientX - 2;
		var mouseY = event.clientY - 2;
		var temp = 246+38*(gameModeSelected-1) + gifImageHeight + chatFormHeight;
		
		//hover over 1v1 game mode
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*0 + gifImageHeight + chatFormHeight && mouseY <= 246+38*0+36 + gifImageHeight + chatFormHeight){
			mouseOver1v1 = true;
		}
		else if ((mouseX < 15 || mouseX > 87 || mouseY - gifImageHeight - chatFormHeight < 246+38*0 || mouseY - gifImageHeight - chatFormHeight > 246+38*0+36)){
			mouseOver1v1 = false;
		}
		//hover over 2v2 game mode
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*1 + gifImageHeight + chatFormHeight && mouseY <= 246+38*1+36 + gifImageHeight + chatFormHeight){
			mouseOver2v2 = true;
		}
		else if ((mouseX < 15 || mouseX > 87 || mouseY - gifImageHeight - chatFormHeight < 246+38*1 || mouseY - gifImageHeight - chatFormHeight > 246+38*1+36)){
			mouseOver2v2 = false;
		}
		//hover over 3v3 game mode
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*2 + gifImageHeight + chatFormHeight && mouseY <= 246+38*2+36 + gifImageHeight + chatFormHeight){
			mouseOver3v3 = true;
		}
		else if ((mouseX < 15 || mouseX > 87 || mouseY - gifImageHeight - chatFormHeight < 246+38*2 || mouseY - gifImageHeight - chatFormHeight > 246+38*2+36)){
			mouseOver3v3 = false;
		}
		//hover over 4v4 game mode
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*3 + gifImageHeight + chatFormHeight && mouseY <= 246+38*3+36 + gifImageHeight + chatFormHeight){
			mouseOver4v4 = true;
		}
		else if ((mouseX < 15 || mouseX > 87 || mouseY - gifImageHeight - chatFormHeight < 246+38*3 || mouseY - gifImageHeight - chatFormHeight > 246+38*3+36)){
			mouseOver4v4 = false;
		}
		//hover over 5v5 game mode
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*4 + gifImageHeight + chatFormHeight && mouseY <= 246+38*4+36 + gifImageHeight + chatFormHeight){
			mouseOver5v5 = true;
		}
		else if ((mouseX < 15 || mouseX > 87 || mouseY - gifImageHeight - chatFormHeight < 246+38*4 || mouseY - gifImageHeight - chatFormHeight > 246+38*4+36)){
			mouseOver5v5 = false;
		}
		//hover over 6v6 game mode
		if (mouseX >= 15 && mouseX <= 87 && mouseY >= 246+38*5 + gifImageHeight + chatFormHeight && mouseY <= 246+38*5+36 + gifImageHeight + chatFormHeight){
			mouseOver6v6 = true;
		}
		else if ((mouseX < 15 || mouseX > 87 || mouseY - gifImageHeight - chatFormHeight < 246+38*5 || mouseY - gifImageHeight - chatFormHeight > 246+38*5+36)){
			mouseOver6v6 = false;
		}
		
		//hover over ready button
		if (mouseX >= 97 && mouseX <= 169 && mouseY >= 246+38*(gameModeSelected-1) + gifImageHeight + chatFormHeight && mouseY <= 246+38*(gameModeSelected-1)+36 + gifImageHeight + chatFormHeight){
			mouseOverReadyButton = true;
		}
		else if ((mouseX < 97 || mouseX > 169 || mouseY - gifImageHeight - chatFormHeight < 246+38*(gameModeSelected-1) || mouseY - gifImageHeight - chatFormHeight > 246+38*(gameModeSelected-1)+36)){
			mouseOverReadyButton = false;
		}
		
		//hover over how-to control-boxes
		
		//0/7
		if (mouseX >= 378 && mouseX <= 388 && mouseY >= 37 + gifImageHeight + chatFormHeight && mouseY <= 47 + gifImageHeight + chatFormHeight){
			howToSlide = 0;
			mouseOverHowBox = true;
		}
		//1/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 52 + gifImageHeight + chatFormHeight && mouseY <= 62 + gifImageHeight + chatFormHeight){
			howToSlide = 1;
			mouseOverHowBox = true;
		}
		//2/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 67 + gifImageHeight + chatFormHeight && mouseY <= 77 + gifImageHeight + chatFormHeight){
			howToSlide = 2;
			mouseOverHowBox = true;
		}
		//3/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 82 + gifImageHeight + chatFormHeight && mouseY <= 92 + gifImageHeight + chatFormHeight){
			howToSlide = 3;
			mouseOverHowBox = true;
		}
		//4/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 97 + gifImageHeight + chatFormHeight && mouseY <= 107 + gifImageHeight + chatFormHeight){
			howToSlide = 4;
			mouseOverHowBox = true;
		}
		//5/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 112 + gifImageHeight + chatFormHeight && mouseY <= 122 + gifImageHeight + chatFormHeight){
			howToSlide = 5;
			mouseOverHowBox = true;
		}
		//6/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 127 + gifImageHeight + chatFormHeight && mouseY <= 137 + gifImageHeight + chatFormHeight){
			howToSlide = 6;
			mouseOverHowBox = true;
		}
		//7/7
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 142 + gifImageHeight + chatFormHeight && mouseY <= 152 + gifImageHeight + chatFormHeight){
			howToSlide = 7;
			mouseOverHowBox = true;
		}
		//8/11
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 157 + gifImageHeight + chatFormHeight && mouseY <= 167 + gifImageHeight + chatFormHeight){
			howToSlide = 8;
			mouseOverHowBox = true;
		}
		//9/11
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 172 + gifImageHeight + chatFormHeight && mouseY <= 182 + gifImageHeight + chatFormHeight){
			howToSlide = 9;
			mouseOverHowBox = true;
		}
		//10/10
		else if (mouseX >= 378 && mouseX <= 388 && mouseY >= 187 + gifImageHeight + chatFormHeight && mouseY <= 197 + gifImageHeight + chatFormHeight){
			howToSlide = 10;
			mouseOverHowBox = true;
		}
		else {
			mouseOverHowBox = false;
		}
		
		displaySlideshowAndMessages();
	}
	else if (inGameYesOrNo && players.length > 0){
		var mouseX = event.clientX - 2;
		var mouseY = event.clientY - 2;
		
		var diffX =  mouseX - canvasWidth/2;
		var diffY =  mouseY - canvasHeight/2;
		var absDiffX = Math.abs(diffX);
		var absDiffY = Math.abs(diffY);
		var which = absDiffX - absDiffY;
		
		//first check which axis the click position is going to be on
		//if the click position over X axis is greater then check for right or left
		if (which > 0){
			if (diffX > 0){
				players[myGameIndex].mouseAbove = false;
				players[myGameIndex].mouseBelow = false;
				players[myGameIndex].mouseLeft = false;
				players[myGameIndex].mouseRight = true;
			}
			else if (diffX < 0){
				players[myGameIndex].mouseAbove = false;
				players[myGameIndex].mouseBelow = false;
				players[myGameIndex].mouseLeft = true;
				players[myGameIndex].mouseRight = false;
			}
		}
		//if the click position over Y axis is greater then check for up or down
		else if (which < 0){
			if (diffY > 0){
				players[myGameIndex].mouseAbove = false;
				players[myGameIndex].mouseBelow = true;
				players[myGameIndex].mouseLeft = false;
				players[myGameIndex].mouseRight = false;
			}
			else if (diffY < 0){
				players[myGameIndex].mouseAbove = true;
				players[myGameIndex].mouseBelow = false;
				players[myGameIndex].mouseLeft = false;
				players[myGameIndex].mouseRight = false;
			}
		}
		//if the click position is equally distanced on both axises then default to player's own direction
		else if (which == 0){
			players[myGameIndex].mouseAbove = false;
			players[myGameIndex].mouseBelow = false;
			players[myGameIndex].mouseLeft = false;
			players[myGameIndex].mouseRight = false;
		}
	}
}

//initialize touch event detection
function touchListen(){
	touchDetected = true;
	canvas.addEventListener("touchstart", handleStart, false);
	canvas.addEventListener("touchend", handleEnd, false);
	canvas.addEventListener("touchcancel", handleCancel, false);
	canvas.addEventListener("touchmove", handleMove, false);
}

//add touch event to array of touches
function handleStart(event){
	//event.preventDefault();
	//touchstart
	var touches = event.changedTouches;

	for (var i = 0; i < touches.length; i++) {
		//touchstart: i + ...
		ongoingTouches.push(copyTouch(touches[i]));
		//touchstart: i + .
		
		//if not in game, and a touch over the ready button end, press it
		if (inGameYesOrNo == false && inPreGameYesOrNo == false && inPostGameYesOrNo == false){
			
			//if the mouse was clicked over the game mode button, change the game mode
			//also if this player was just ready for a game in another mode, unready them
			if (touches[i].clientX >= 15 && touches[i].clientX <= 87 && touches[i].clientY >= 246+38*0 + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+38*0+36 + gifImageHeight + chatFormHeight){
				gameModeSelected = 1;
				//if this player were ready before, they will not be upon changing game modes
				if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			else if (touches[i].clientX >= 15 && touches[i].clientX <= 87 && touches[i].clientY >= 246+38*1 + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+38*1+36 + gifImageHeight + chatFormHeight){
				gameModeSelected = 2;
				//if this player were ready before, they will not be upon changing game modes
				if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			else if (touches[i].clientX >= 15 && touches[i].clientX <= 87 && touches[i].clientY >= 246+38*2 + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+38*2+36 + gifImageHeight + chatFormHeight){
				gameModeSelected = 3;
				//if this player were ready before, they will not be upon changing game modes
				if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			else if (touches[i].clientX >= 15 && touches[i].clientX <= 87 && touches[i].clientY >= 246+38*3 + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+38*3+36 + gifImageHeight + chatFormHeight){
				gameModeSelected = 4;
				//if this player were ready before, they will not be upon changing game modes
				if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			else if (touches[i].clientX >= 15 && touches[i].clientX <= 87 && touches[i].clientY >= 246+38*4 + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+38*4+36 + gifImageHeight + chatFormHeight){
				gameModeSelected = 5;
				//if this player were ready before, they will not be upon changing game modes
				if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			else if (touches[i].clientX >= 15 && touches[i].clientX <= 87 && touches[i].clientY >= 246+38*5 + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+38*5+36 + gifImageHeight + chatFormHeight){
				gameModeSelected = 6;
				//if this player were ready before, they will not be upon changing game modes
				if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			
			//if the mouse was clicked over the ready button image, set to ready or unready and mirror this on server
			if (touches[i].clientX >= 97 && touches[i].clientX <= 169 && touches[i].clientY >= 246+(38*(gameModeSelected-1)) + gifImageHeight + chatFormHeight && touches[i].clientY <= 246+(38*(gameModeSelected-1))+36 + gifImageHeight + chatFormHeight){
				if (readyStatus == false){
					socket.emit('ready', gameModeSelected);
					readyStatus = true;
				}
				else if (readyStatus == true){
					socket.emit('unready');
					readyStatus = false;
				}
			}
			
			
			//if the user touches a how-to control-box, select that box
			//hover over how-to control-boxes
		
			//0/11
			if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 37 + gifImageHeight + chatFormHeight && touches[i].clientY <= 47 + gifImageHeight + chatFormHeight){
				howToSlide = 0;
				mouseOverHowBox = true;
			}
			//1/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 52 + gifImageHeight + chatFormHeight && touches[i].clientY <= 62 + gifImageHeight + chatFormHeight){
				howToSlide = 1;
				mouseOverHowBox = true;
			}
			//2/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 67 + gifImageHeight + chatFormHeight && touches[i].clientY <= 77 + gifImageHeight + chatFormHeight){
				howToSlide = 2;
				mouseOverHowBox = true;
			}
			//3/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 82 + gifImageHeight + chatFormHeight && touches[i].clientY <= 92 + gifImageHeight + chatFormHeight){
				howToSlide = 3;
				mouseOverHowBox = true;
			}
			//4/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 97 + gifImageHeight + chatFormHeight && touches[i].clientY <= 107 + gifImageHeight + chatFormHeight){
				howToSlide = 4;
				mouseOverHowBox = true;
			}
			//5/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 112 + gifImageHeight + chatFormHeight && touches[i].clientY <= 122 + gifImageHeight + chatFormHeight){
				howToSlide = 5;
				mouseOverHowBox = true;
			}
			//6/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 127 + gifImageHeight + chatFormHeight && touches[i].clientY <= 137 + gifImageHeight + chatFormHeight){
				howToSlide = 6;
				mouseOverHowBox = true;
			}
			//7/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 142 + gifImageHeight + chatFormHeight && touches[i].clientY <= 152 + gifImageHeight + chatFormHeight){
				howToSlide = 7;
				mouseOverHowBox = true;
			}
			//8/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 157 + gifImageHeight + chatFormHeight && touches[i].clientY <= 167 + gifImageHeight + chatFormHeight){
				howToSlide = 8;
				mouseOverHowBox = true;
			}
			//9/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 172 + gifImageHeight + chatFormHeight && touches[i].clientY <= 182 + gifImageHeight + chatFormHeight){
				howToSlide = 9;
				mouseOverHowBox = true;
			}
			//10/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 187 + gifImageHeight + chatFormHeight && touches[i].clientY <= 197 + gifImageHeight + chatFormHeight){
				howToSlide = 10;
				mouseOverHowBox = true;
			}
			//11/11
			else if (touches[i].clientX >= 378 && touches[i].clientX <= 388 && touches[i].clientY >= 202 + gifImageHeight + chatFormHeight && touches[i].clientY <= 212 + gifImageHeight + chatFormHeight){
				howToSlide = 11;
				mouseOverHowBox = true;
			}
			else {
				mouseOverHowBox = false;
			}
			
			displaySlideshowAndMessages();
		}
		//if ingame, keep an eye on this touch's starting position
		else if (inGameYesOrNo == true && inPreGameYesOrNo == false && inPostGameYesOrNo == false){
			touchX.push(touches[i].clientX);
			touchY.push(touches[i].clientY);
		}
	}
}

//update location of touches
function handleMove(event){
	event.preventDefault();
	var touches = event.changedTouches;

	for (var i = 0; i < touches.length; i++) {
		var idx = ongoingTouchIndexById(touches[i].identifier);

		if (idx >= 0) {
			//if ingame, check for greatest change in touch position 
			if (inGameYesOrNo){
				var diffY =  touches[i].clientY - ongoingTouches[idx].clientY;
				var diffX =  touches[i].clientX - ongoingTouches[idx].clientX;
				var absDiffX = Math.abs(diffX);
				var absDiffY = Math.abs(diffY);
				var which = absDiffX - absDiffY;
				
				//first check which axis the move is going to be on
				//if the move over X axis is greater then check for right or left
				if (which > 0){
					if (diffX > 0){
						players[myGameIndex].direction = "RIGHT";
					}
					else if (diffX < 0){
						players[myGameIndex].direction = "LEFT";
					}
				}
				//if the move over Y axis is greater then check for up or down
				else if (which < 0){
					if (diffY > 0){
						players[myGameIndex].direction = "DOWN";
					}
					else if (diffY < 0){
						players[myGameIndex].direction = "UP";
					}
				}
			}
			
			// swap in the new touch record
			ongoingTouches.splice(idx, 1, copyTouch(touches[i]));
		}
		else {
			log("cant figure out which touch to continue");
		}
	}
}

//remove touches
function handleEnd(event) {
	event.preventDefault();
	var touches = event.changedTouches;

	for (var i = 0; i < touches.length; i++) {
		var idx = ongoingTouchIndexById(touches[i].identifier);
		
		if (idx >= 0) {			
			//check for the difference in location between this touch's starting point and ending point
			//if it is close, assume it to be a tap and place a spike/mine if cooldown allows
			if (inGameYesOrNo){
				var checkStatus = ALIVE.localeCompare(players[myGameIndex].status);
				var checkX = Math.abs(ongoingTouches[idx].clientX - touchX[idx]);
				var checkY = Math.abs(ongoingTouches[idx].clientY - touchY[idx]);
		
				if (players[myGameIndex].cooldown == 0 && checkStatus == 0 && checkX < 7 && checkY < 7){
					
					//if the spike is spawned past the range limit, then scale that location down to a point within the limit
					//check and modify the X
					if (ongoingTouches[idx].clientX < canvasWidth/2 - 250){
						ongoingTouches[idx].clientX = canvasWidth/2 - 250;
					}
					else if (ongoingTouches[idx].clientX > canvasWidth/2 + 250){
						ongoingTouches[idx].clientX = canvasWidth/2 + 250;
					}
					//check and modify the Y
					if (ongoingTouches[idx].clientY < canvasHeight/2 - 250){
						ongoingTouches[idx].clientY = canvasHeight/2 - 250;
					}
					else if (ongoingTouches[idx].clientY > canvasHeight/2 + 250){
						ongoingTouches[idx].clientY = canvasHeight/2 + 250;
					}
					
					//determine direction in which to send the spike
					var spikeDirection;
					var spikeSpeedModifier = 1;
					var diffX =  ongoingTouches[idx].clientX - canvasWidth/2;
					var diffY =  ongoingTouches[idx].clientY - canvasHeight/2;
					var absDiffX = Math.abs(diffX);
					var absDiffY = Math.abs(diffY);
					var which = absDiffX - absDiffY;
					
					//compare with player's own movement direction to determine spike's speed
					var checkMoveUp = UP.localeCompare(players[myGameIndex].direction);
					var checkMoveDown = DOWN.localeCompare(players[myGameIndex].direction);
					var checkMoveRight = RIGHT.localeCompare(players[myGameIndex].direction);
					var checkMoveLeft = LEFT.localeCompare(players[myGameIndex].direction);
					
					//first check which axis the click position is going to be on
					//if the click position over X axis is greater then check for right or left
					if (which > 0){
						if (diffX > 0){
							spikeDirection = "RIGHT";
							
							if (checkMoveRight == 0){
								spikeSpeedModifier = 2;
							}
							else if (checkMoveLeft == 0){
								spikeSpeedModifier = 0;
							}
						}
						else if (diffX < 0){
							spikeDirection = "LEFT";
							
							if (checkMoveRight == 0){
								spikeSpeedModifier = 0;
							}
							else if (checkMoveLeft == 0){
								spikeSpeedModifier = 2;
							}
						}
					}
					//if the click position over Y axis is greater then check for up or down
					else if (which < 0){
						if (diffY > 0){
							spikeDirection = "DOWN";
							
							if (checkMoveDown == 0){
								spikeSpeedModifier = 2;
							}
							else if (checkMoveUp == 0){
								spikeSpeedModifier = 0;
							}
						}
						else if (diffY < 0){
							spikeDirection = "UP";
							
							if (checkMoveDown == 0){
								spikeSpeedModifier = 0;
							}
							else if (checkMoveUp == 0){
								spikeSpeedModifier = 2;
							}
						}
					}
					//if the click position is equally distanced on both axises then default to player's own direction
					else if (which == 0){
						spikeDirection = players[myGameIndex].direction;
						spikeSpeedModifier = 5;
					}
					
					var newSpike = new createSpikeObject(players[myGameIndex].x, players[myGameIndex].y, spikeDirection, spikeSpeedModifier);
					spikes.push(newSpike);
				
					//set this player's cooldown timer to 5 and lower their speed
					players[myGameIndex].cooldown = 5;
					players[myGameIndex].speed = 3;
					players[myGameIndex].clicked = 3;
					
					//emit the creation of a spike
					socket.emit('spikeCreated', newSpike, myGameIndex, myGameRoomName);
				}
				
				//the touch is getting removed, so remove this starting point
				touchX.splice(idx, 1);
				touchY.splice(idx, 1);
			}
			
			// remove the touch; we're done
			ongoingTouches.splice(idx, 1);
		} else {
			log("can't figure out which touch to end");
		}
	}
}

function handleCancel(event) {
	event.preventDefault();
	var touches = event.changedTouches;

	for (var i = 0; i < touches.length; i++) {		
		// remove it; we're done
		ongoingTouches.splice(i, 1);
	}
}

function copyTouch(touch) {
	return { identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY };
}

function ongoingTouchIndexById(idToFind) {
	for (var i = 0; i < ongoingTouches.length; i++) {
		var id = ongoingTouches[i].identifier;

		if (id == idToFind) {
			return i;
		}
	}
	return -1;    // not found
}