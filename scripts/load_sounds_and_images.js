

/*
	1. LOAD IMAGES
	2. LOAD AUDIO
*/

//LOAD IMAGES

var game_images = {
	background: new Image(1800, 1200),
	spike: new Image (50, 50),
	spawn_hole: new Image(100,100),
	gate: new Image(100, 100),
	pointer: new Image(25, 25),
	explosion: new Image(100, 100),
	speed_trail: new Image(50, 50),
	player:{
		BLUE: {
			alive: {
				unarmed: new Image(50, 50),
				armed: new Image(82, 82)
			},
			dead: {
				unarmed: new Image(50, 50),
				armed: new Image(82, 82)
			}
		},
		RED: {
			alive: {
				unarmed: new Image(50, 50),
				armed: new Image(82, 82)
			},
			dead: {
				unarmed: new Image(50, 50),
				armed: new Image(82, 82)
			}
		}
	}
};
game_images.background.src = './images/ingame/background_image.png';
game_images.spike.src = './images/ingame/spike.png';
game_images.spawn_hole.src = './images/ingame/respawnHole.png';
game_images.gate.src = './images/ingame/gate.png';
game_images.pointer.src = './images/ingame/pointer.png';
game_images.explosion.src = './images/ingame/explosion.png';
game_images.speed_trail.src = './images/ingame/speed_trail.png';
game_images.player.BLUE.alive.unarmed.src = './images/ingame/blue.png';
game_images.player.BLUE.alive.armed.src = './images/ingame/blueArmed.png';
game_images.player.BLUE.dead.unarmed.src = './images/ingame/deadBlue.png';
game_images.player.BLUE.dead.armed.src = './images/ingame/deadBlueArmed.png';
game_images.player.RED.alive.unarmed.src = './images/ingame/red.png';
game_images.player.RED.alive.armed.src = './images/ingame/redArmed.png';
game_images.player.RED.dead.unarmed.src = './images/ingame/deadRed.png';
game_images.player.RED.dead.armed.src = './images/ingame/deadRedArmed.png';

game_images.background.onload = resource_load_successful("background_image");
game_images.spike.onload = resource_load_successful("spike");
game_images.spawn_hole.onload = resource_load_successful("respawnHoleImg");
game_images.gate.onload = resource_load_successful("gate_img");
game_images.pointer.onload = resource_load_successful("pointer.png");
game_images.explosion.onload = resource_load_successful("explosion_img");
game_images.speed_trail.onload = resource_load_successful("./images/ingame/speed_trail.png");
game_images.player.BLUE.alive.unarmed.onload = resource_load_successful("blue.png");
game_images.player.BLUE.alive.armed.onload = resource_load_successful("blueArmed.png");
game_images.player.BLUE.dead.unarmed.onload = resource_load_successful("deadBlue.png");
game_images.player.BLUE.dead.armed.onload = resource_load_successful("deadBlueArmed.png");
game_images.player.RED.alive.unarmed.onload = resource_load_successful("red.png");
game_images.player.RED.alive.armed.onload = resource_load_successful("redArmed.png");
game_images.player.RED.dead.unarmed.onload = resource_load_successful("deadRed.png");
game_images.player.RED.dead.armed.onload = resource_load_successful("deadRedArmed.png");


//LOAD AUDIO

var sounds = {
	poof: new Audio('./sounds/poof.mp3'),
	ring: new Audio('./sounds/ring.mp3'),
	whoosh: new Audio('./sounds/whoosh.mp3'),
	ticktock: new Audio('./sounds/tickTock.mp3'),
	teleport: new Audio('./sounds/teleport.mp3')
};

sounds.poof.oncanplaythrough = resource_load_successful("poof_sound");
sounds.ring.oncanplaythrough = resource_load_successful("ring_sound");
sounds.whoosh.oncanplaythrough = resource_load_successful("whoosh_sound");
sounds.ticktock.oncanplaythrough = resource_load_successful("ticktock_sound");
sounds.teleport.oncanplaythrough = resource_load_successful("teleport_sound");

resource_load_successful("load_sounds_and_images.js");