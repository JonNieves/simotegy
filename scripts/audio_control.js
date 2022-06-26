/*
audio_control.js
AUTHOR: JONATHAN M. NIEVES

UPDATED: 11/2/2018Looking for a job!

*/

//thanks to changes to autoplay audio/video behavior restrictions, the user must manually control the audio


var audio_muted = false;
muteControl(); //run once to turn all audio off

function muteControl(){
	if (audio_muted) {
		//change image
		document.getElementById('muteControl').src = "./images/UI/unmute.png";
		
		//change audio mute settings for audio files
		audio_muted = false;
		sounds.poof.muted = false;
		sounds.ring.muted = false;
		sounds.whoosh.muted = false;
		sounds.ticktock.muted = false;
		sounds.teleport.muted = false;
		
		//sounds.ring.play();
		
		console.log('Audio unmuted');
	}
	else { 
		//change image
		document.getElementById('muteControl').src = "./images/UI/mute.png";
		
		//change audio mute settings for audio files
		audio_muted = true;
		sounds.poof.muted = true;
		sounds.ring.muted = true;
		sounds.whoosh.muted = true;
		sounds.ticktock.muted = true;
		sounds.teleport.muted = true;
		
		console.log('Audio muted');
	}
}

resource_load_successful("audio_control.js");