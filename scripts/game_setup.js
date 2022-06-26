

var this_player = null;
var this_player_name = null; //remember this player's name across games
var this_players_view = null;
var game_data = null;
var last_state = null;
var game_events = []; //hold game event texts to display to players

//update game data with new data from server
function update_client_ingame_data(new_game_data) {

    //display game_events to players
    var game_event_data = {
        players: new_game_data.players,
        timers: new_game_data.timers
    };
    add_new_game_events(game_event_data);

    //update local game data
    game_data = new_game_data;

    //find out who is contesting the objective
    game_data.contestants = find_contestants(game_data.players);

    //update this player's info
    if (this_player) {

        hide_simotegy_alert();

        var team = this_player.team;
        var player_id = this_player.id;
        this_player = game_data.players[team][player_id];
    }
}

//make an array of players contesting the objective
function find_contestants(players) {
    var contestants = {
        BLUE: [],
        RED: []
    };

    for (a = 0; a < 2; a++) {
        var target_team;
        if (a == 0) {
            target_team = "BLUE";
        } else {
            target_team = "RED";
        }

        for (i = 0; i < players[target_team].IDs.length; i++) {
            var player_id = players[target_team].IDs[i];
            var player = players[target_team][player_id];

            if (player.position.x >= game_data.map.goal_area.x1 &&
                player.position.x <= game_data.map.goal_area.x2 &&
                player.position.y >= game_data.map.goal_area.y1 &&
                player.position.y <= game_data.map.goal_area.y2 &&
                player.alive) {
                contestants[target_team].push(player);
            }
        }
    }

    return contestants;
}

//keep track of game_events to players being alive or not and players changing themselves (someone joined or left)
//these game_events will be displayed on players' screen
function add_new_game_events(new_state) {

    if (last_state === null) {

        /*
        	PLAYER STATES
        */

        //say everyone joined
        for (a = 0; a < 2; a++) {

            var target_team;

            if (a == 0) {
                target_team = "BLUE";
            } else if (a == 1) {
                target_team = "RED";
            }

            for (i = 0; i < new_state.players[target_team].IDs.length; i++) {
                var player_id = new_state.players[target_team].IDs[i];
                create_new_game_event_text(target_team, new_state.players[target_team][player_id].name + " joined", 5);
            }
        }

        /*
        	(VICTORY) TIMERS
        */

        for (a = 0; a < 2; a++) {

            var target_team;

            if (a == 0) {
                target_team = "BLUE";
            } else if (a == 1) {
                target_team = "RED";
            }

            create_new_game_event_text(target_team, target_team + " team " + new_state.timers[target_team].seconds + " seconds to win!", 5);
        }

        //tell players what to do
        create_new_game_event_text("BLACK", "OBJECTIVE: Follow the YELLOW ARROW and GET INSIDE the YELLOW AREA", 30);
    } else if (last_state) {

        /*
        	CHANGES TO PLAYER STATES
        */

        for (a = 0; a < 2; a++) {
            var target_team;

            if (a == 0) {
                target_team = "BLUE";
            } else if (a == 1) {
                target_team = "RED";
            }

            for (i = 0; i < last_state.players[target_team].IDs.length; i++) {
                var player_id = last_state.players[target_team].IDs[i];

                //if player existed in the last state
                if (last_state.players[target_team][player_id]) {
                    //if player exists in the new state
                    if (new_state.players[target_team][player_id]) {
                        //if player was alive and is now dead...
                        if (last_state.players[target_team][player_id].alive !== new_state.players[target_team][player_id].alive && new_state.players[target_team][player_id].alive === false) {
                            create_new_game_event_text(target_team, new_state.players[target_team][player_id].name + " got spiked!", 5);
                            //determine volume for sound
                            var poof_volume = determine_poof_volume(new_state.players[target_team][player_id].position);
                            //play sound
                            if (poof_volume > 0) {
                                sounds.poof.volume = poof_volume;
                                sounds.poof.play();
                            }
                        }

                        //if player has changed roles (because of a leaver forcing reorganization)...
                        if (last_state.players[target_team][player_id].role !== new_state.players[target_team][player_id].role) {
                            create_new_game_event_text(target_team, "Team Reorganized; " + new_state.players[target_team][player_id].name + " is now " + last_state.players[target_team][player_id].role + " role", 5);
                        }
                    }
                    //if player existed in old state but not in the new state, they left
                    else {
                        create_new_game_event_text(target_team, last_state.players[target_team][player_id].name + " left the game", 5);
                    }
                }
            }

            //check for new players arriving
            for (i = 0; i < new_state.players[target_team].IDs.length; i++) {
                var player_id = new_state.players[target_team].IDs[i];

                //if player exists in new state but not last state, they just joined
                if (!last_state.players[target_team][player_id] && new_state.players[target_team][player_id]) {
                    //first announce who joined
                    create_new_game_event_text(target_team, new_state.players[target_team][player_id].name + " joined " + target_team + " team", 5);
                }
            }
        }

        /*
        	CHANGES TO (VICTORY) TIMERS
        */

        for (a = 0; a < 2; a++) {
            var target_team;

            if (a == 0) {
                target_team = "BLUE";
            } else if (a == 1) {
                target_team = "RED";
            }

            if (new_state.timers[target_team].seconds > last_state.timers[target_team].seconds) {
                create_new_game_event_text(target_team, target_team + " time was extended -:" + new_state.timers[target_team].seconds, 5);
            }
        }
    }

    last_state = new_state;
}

function player_creating_spike(mouse_position) {
    var spike_direction = determine_spike_direction(mouse_position);

    var player_action = {
        game_id: game_data.id,
        player_id: this_player.id,
        player_team: this_player.team,
        action_type: "CREATE_SPIKE",
        action_object: {
            player: {
                direction: this_player.direction
            },
            spike: {
                direction: spike_direction
            }
        }
    };

    socket.emit("player_ingame_action", player_action);
}

//player clicks mouse (or does something with touch) to initiate creating a spike
function determine_spike_direction(mouse_position) {
    var spike_direction;

    var center_point = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    var abs_difference = {
        x: Math.abs(mouse_position.x - center_point.x),
        y: Math.abs(mouse_position.y - center_point.y)
    };

    if (mouse_position.y < center_point.y && abs_difference.y > abs_difference.x) { spike_direction = "UP"; } else if (mouse_position.y > center_point.y && abs_difference.y > abs_difference.x) { spike_direction = "DOWN" } else if (mouse_position.x > center_point.x && abs_difference.x > abs_difference.y) { spike_direction = "RIGHT" } else if (mouse_position.x < center_point.x && abs_difference.x > abs_difference.y) { spike_direction = "LEFT" }

    return spike_direction;
}

function set_player_direction(player_direction, speed_boosting) {
    var player_action;

    if (speed_boosting && this_player.speedy === false) {
        player_action = {
            game_id: game_data.id,
            player_id: this_player.id,
            player_team: this_player.team,
            action_type: "MAKE_SPEEDY",
            action_object: {
                direction: player_direction
            }
        };
    } else {
        player_action = {
            game_id: game_data.id,
            player_id: this_player.id,
            player_team: this_player.team,
            action_type: "CHANGE_DIRECTION",
            action_object: {
                direction: player_direction
            }
        };
    }

    socket.emit("player_ingame_action", player_action);
}

function create_new_game_event_text(team, event_text, seconds) {
    var game_event = {
        team: team,
        text: event_text,
        duration: seconds * 45
    };
    game_events.push(game_event);
}

//given this player's position and the spiked player's position, come up with a value between 0-1 for poof sound volume
function determine_poof_volume(dead_player_position) {

    if (this_player.position.x == dead_player_position.x && this_player.position.y == dead_player_position.y) {
        return 1;
    } else {
        var difference = {
            x: Math.abs(this_player.position.x - dead_player_position.x),
            y: Math.abs(this_player.position.y - dead_player_position.y)
        };

        var pythagoras = Math.sqrt((difference.x * difference.x) + (difference.y * difference.y));

        var distance_of_max_volume = 400;

        if (pythagoras <= distance_of_max_volume) {
            return 1;
        } else if (pythagoras > distance_of_max_volume && pythagoras <= 2 * distance_of_max_volume) {
            return 0.2;
        } else {
            return 0;
        }
    }
}

resource_load_successful("game_setup.js");