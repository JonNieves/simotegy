

//track resource load


var loaded_all_resources = false;
var resources_to_load = 29; //js files + (audio + image files in load_sounds_and_images.js)
var resources_loaded = 0;

//"plugged in" at the end of all scripts to track resource load progress
//also used in load_sounds_and_images.js, for img.onload and audio.oncanplaythrough to keep track of resource loading progress
function resource_load_successful(resourceName){
	
	//track resources
	resources_loaded++;
	var progressString = resources_loaded + "/" + resources_to_load;
	
	console.log('Loaded', progressString, resourceName);
	
	//once this user has everything and is ready to go
	if (resources_loaded == resources_to_load){
		console.log('Loading completed');
		loaded_all_resources = true;
		//allow player to choose a name
		document.getElementById("loading").style.display = "none";
		document.getElementById("doneLoading").style.display = "block";
		document.getElementById('nameInput').select();
	}
}

resource_load_successful("game_loading_tracker.js");