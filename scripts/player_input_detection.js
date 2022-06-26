

var last_WASD = null;
var last_WASD_button = null;
var speed_boost_trigger_limit = 220;

//detect if user pressed ENTER on name input
//then activate event listener for whole page
//hide name input
document.getElementById('nameInput').select();
document.getElementById('nameInput').addEventListener("keyup", (e) => {
    pick_name(e);
}, false);

document.getElementById("play_again_button").addEventListener("click", (e) => {
    player_wants_to_play_again();
});

//detect keyboard button inputs on the page in general
//control player actions
document.addEventListener("keydown", (e) => {
    if (this_player && game_data && game_data.status === "IN-PROGRESS") {
        //w = 87, a = 65, s = 83, d = 68
        if (e.keyCode === 87 || e.keyCode === 65 || e.keyCode === 83 || e.keyCode === 68) {

            var this_WASD = performance.now();

            if (last_WASD) {
                if (this_WASD - last_WASD < speed_boost_trigger_limit && last_WASD_button === e.keyCode) {
                    change_player_direction(e, true);
                } else {
                    change_player_direction(e, false);
                }
            }

            last_WASD = this_WASD;
            last_WASD_button = e.keyCode;
        }
        //left = 37, up = 38, right = 39, down = 40
        else if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40) {
            if (this_player.armed) {
                var mouse_position;

                if (e.keyCode === 37) {
                    mouse_position = {
                        x: 0,
                        y: canvas.height / 2
                    };
                } else if (e.keyCode === 38) {
                    mouse_position = {
                        x: canvas.width / 2,
                        y: 0
                    };
                } else if (e.keyCode === 39) {
                    mouse_position = {
                        x: canvas.width,
                        y: canvas.height / 2
                    };
                } else if (e.keyCode === 40) {
                    mouse_position = {
                        x: canvas.width / 2,
                        y: canvas.height
                    };
                }

                player_creating_spike(mouse_position);
            }
        }
    }

}, false);

/*
	MOUSE
*/

//when the user clicks, fire off a spike
canvas.addEventListener("click", (e) => {
    attempt_to_create_spike(e);
}, false);

/*
	TOUCH
*/

var touch_starts = [];
var ongoing_touches = [];

canvas.addEventListener("touchstart", (e) => {
    handle_touch_start(e);
}, false);

canvas.addEventListener("touchmove", (e) => {
    handle_touch_move(e);
}, false);

canvas.addEventListener("touchend", (e) => {
    handle_touch_end(e);
}, false);

canvas.addEventListener("touchcancel", (e) => {
    handle_touch_cancel(e);
}, false);


/*
	FUNCTIONS
*/

function pick_name(e) {
    if (e.keyCode === 13) {
        var player_name = nameInput.value;
        nameInput.value = "";

        if (player_name.length > 0 && typeof player_name === "string") {
            document.getElementById("loading").style.display = "none";
            document.getElementById("doneLoading").style.display = "block";
            document.getElementById("postGame").style.display = "none";
            document.getElementById("start").style.display = "none";
            socket.emit("enter_matchmaking", player_name);
        }
    }
}

function player_wants_to_play_again() {
    if (this_player_name) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("doneLoading").style.display = "none";
        document.getElementById("postGame").style.display = "none";
        document.getElementById("start").style.display = "none";
        //put filter back on
        document.getElementById("myCanvas").style.filter = "blur(2px)";
        socket.emit("enter_matchmaking", this_player_name);
    } else {
        console.log("Something wrong at play again button");
    }
}

function change_player_direction(e, boosting) {
    console.log(e.keyCode); //w = 87, a = 65, s = 83, d = 68
    if (this_player && game_data && game_data.status === "IN-PROGRESS") {
        if (e.keyCode == 87) {
            set_player_direction("UP", boosting);
        } else if (e.keyCode == 65) {
            set_player_direction("LEFT", boosting);
        } else if (e.keyCode == 83) {
            set_player_direction("DOWN", boosting);
        } else if (e.keyCode == 68) {
            set_player_direction("RIGHT", boosting);
        }
    }
}

function attempt_to_create_spike(e) {
    if (this_player && this_player.armed && game_data && game_data.status === "IN-PROGRESS") {
        var mouse_position = {
            x: e.clientX,
            y: e.clientY
        };

        player_creating_spike(mouse_position);
    }
}

function handle_touch_start(e) {
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        touch_starts.push(touches[i]);
        ongoing_touches.push(touches[i]);
    }
}

function handle_touch_move(e) {
    e.preventDefault();

    if (this_player && game_data && game_data.status === "IN-PROGRESS") {

        var touches = e.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var ongoing_touch_index = find_index_of_matching_ongoing_touch(touches[i].identifier);

            if (ongoing_touch_index >= 0) {
                var diffY = touches[i].clientY - ongoing_touches[ongoing_touch_index].clientY;
                var diffX = touches[i].clientX - ongoing_touches[ongoing_touch_index].clientX;
                var absDiffX = Math.abs(diffX);
                var absDiffY = Math.abs(diffY);
                var which = absDiffX - absDiffY;

                //first check which axis the move is going to be on
                //if the move over X axis is greater then check for right or left
                if (which > 0) {
                    if (diffX > 0) {
                        set_player_direction("RIGHT", false);
                    } else if (diffX < 0) {
                        set_player_direction("LEFT", false);
                    }
                }
                //if the move over Y axis is greater then check for up or down
                else if (which < 0) {
                    if (diffY > 0) {
                        set_player_direction("DOWN", false);
                    } else if (diffY < 0) {
                        set_player_direction("UP", false);
                    }
                }

                //disqualify touch becoming a "spike creating action"
                var touch = touches[i];
                touch.disqualified = true;

                // swap in the new touch record
                ongoing_touches.splice(ongoing_touch_index, 1, touch);
            }
        }
    }
}

function handle_touch_end(e) {
    e.preventDefault();

    if (this_player && game_data && game_data.status === "IN-PROGRESS") {
        var touches = e.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var starting_touch_index = find_index_of_matching_touch_start(touches[i].identifier);
            var ongoing_touch_index = find_index_of_matching_ongoing_touch(touches[i].identifier);

            if (starting_touch_index >= 0 && ongoing_touch_index >= 0) {
                if (ongoing_touches[ongoing_touch_index].disqualified) {
                    console.log("Touch disqualified from creating spike");
                } else {

                    if (this_player && this_player.armed && game_data && game_data.status === "IN-PROGRESS") {
                        var touch_offset = {
                            x: Math.abs(ongoing_touches[ongoing_touch_index].clientX - touch_starts[starting_touch_index].clientX),
                            y: Math.abs(ongoing_touches[ongoing_touch_index].clientY - touch_starts[starting_touch_index].clientY),
                        };

                        if (touch_offset.x <= 1 && touch_offset.y <= 1) {
                            var mouse_position = {
                                x: ongoing_touches[ongoing_touch_index].clientX,
                                y: ongoing_touches[ongoing_touch_index].clientY
                            };

                            player_creating_spike(mouse_position);
                        }
                    }
                }

                touch_starts.splice(starting_touch_index, 1);
                ongoing_touches.splice(ongoing_touch_index, 1);
            }
        }
    }
}

function handle_touch_cancel(e) {
    e.preventDefault();
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        var ongoing_touch_index = find_index_of_matching_ongoing_touch(touches[i].identifier);
        if (ongoing_touch_index >= 0) {
            ongoing_touches.splice(ongoing_touch_index, 1);
        }

        var starting_touch_index = find_index_of_matching_touch_start(touches[i].identifier);
        if (starting_touch_index >= 0) {
            touch_starts.splice(starting_touch_index, 1);
        }
    }
}

function find_index_of_matching_ongoing_touch(touch_id) {
    for (i = 0; i < ongoing_touches.length; i++) {
        var ongoing_id = ongoing_touches[i].identifier;
        if (ongoing_id === touch_id) {
            return i;
        }
    }

    return -1;
}

function find_index_of_matching_touch_start(touch_id) {
    for (i = 0; i < touch_starts.length; i++) {
        var ongoing_id = touch_starts[i].identifier;
        if (ongoing_id === touch_id) {
            return i;
        }
    }

    return -1;
}

resource_load_successful("player_player_input_detection.js");