
//it's nice to not have the browser UI in the way

//going to try to rewrite these ES6 style

//make page fullscreen (to hide the browser)
const open_fullscreen = () => {

    document.body.requestFullscreen ? document.body.requestFullscreen() :
        document.body.mozRequestFullScreen ? document.body.mozRequestFullScreen() :
        document.body.webkitRequestFullscreen ? document.body.webkitRequestFullscreen() :
        document.body.msRequestFullscreen && document.body.msRequestFullscreen();

    //change image and change function
    var btn = document.getElementById("fullscreenControl");
    btn.src = "./images/UI/unfull.png";
    btn.onclick = () => { close_fullscreen(); };

    //resize canvas
    canvas_resize();
}

// undo fullscreen
function close_fullscreen() {

    document.exitFullscreen ? document.exitFullscreen() :
        document.mozCancelFullScreen ? document.mozCancelFullScreen() :
        document.webkitExitFullscreen ? document.webkitExitFullscreen() :
        document.msExitFullscreen && document.msExitFullscreen();

    //change image and change function
    var btn = document.getElementById("fullscreenControl");
    btn.src = "./images/UI/full.png";
    btn.onclick = () => { open_fullscreen(); };

    canvas_resize();
}

/*
//make page fullscreen (to hide the browser)
function open_fullscreen() {
	
	if (document.body.requestFullscreen) {
		document.body.requestFullscreen();
	} 
	else if (document.body.mozRequestFullScreen) { // Firefox
		document.body.mozRequestFullScreen();
	} 
	else if (document.body.webkitRequestFullscreen) { // Chrome, Safari and Opera
		document.body.webkitRequestFullscreen();
	} 
	else if (document.body.msRequestFullscreen) { // IE/Edge
		document.body.msRequestFullscreen();
	}
	
	//change image and change function
	var btn = document.getElementById("fullscreenControl");
	btn.src = "./images/UI/unfull.png";
	btn.onclick = () => { close_fullscreen(); };
	
	//resize canvas
	canvas_resize();
}

// undo fullscreen
function close_fullscreen() {
	
	if (document.exitFullscreen) {
		document.exitFullscreen();
	}
	else if (document.mozCancelFullScreen) { // Firefox
		document.mozCancelFullScreen();
	}
	else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
		document.webkitExitFullscreen();
	}
	else if (document.msExitFullscreen) { // IE/Edge
		document.msExitFullscreen();
	}
	
	//change image and change function
	var btn = document.getElementById("fullscreenControl");
	btn.src = "./images/UI/full.png";
	btn.onclick = () => { open_fullscreen(); };
	
	canvas_resize();
}
*/


resource_load_successful("fullscreen_control.js");