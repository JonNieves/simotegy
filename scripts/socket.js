

var socket = io.connect(); //connect

//connection to server was cut - why?
socket.on("disconnect", (reason) => {
    disconnect_detected(reason);
});

//server rejected chosen user name
//bring back name input
socket.on("server_rejected_name", () => {
    server_rejected_name();
});

//server sent some game data
socket.on("game_data", (game_data) => {
    console.log(game_data.status);
    update_client_ingame_data(game_data);
    canvas_redraw();
});

//received this player's info and game info
//reset a few things in case this player was in a previous game
socket.on("successful_join", (data) => {
    if (audio_muted) {
        muteControl();
    }
    reset_game_variables();
    successful_join(data);
});

socket.on("GAME_COMPLETED", (game_data) => {
    var temp_game_data = game_data;
    update_client_ingame_data(game_data);
    console.log("Game completed");
    //show victory and reset everything
    show_post_game("GAME_COMPLETED", temp_game_data);
    //server reassignment
    socket.emit("my_game_ended_im_still_here");
});

socket.on("TECHNICAL_VICTORY", (game_data) => {
    var temp_game_data = game_data;
    update_client_ingame_data(game_data);
    console.log("Game completed - technical victory");
    //show victory and reset everything
    show_post_game("TECHNICAL_VICTORY", temp_game_data);
    //server reassignment
    socket.emit("my_game_ended_im_still_here");
});

/*
	FUNCTIONS
*/

function disconnect_detected(reason) {
    var html_message = '<p>Something broke :(</p><p>Connection to Simotegy was lost</p>';
    simotegy_alert(html_message);
    console.log('Connection lost', reason);
}

function server_rejected_name() {
    console.log('User name rejected by server');
    var html_message = '<p>Please pick a different name.</p><ul><li>Letters and numbers only<li>24 characters max<li>No profanity please</ul><p>Thank you</p>';
    simotegy_alert(html_message);

    document.getElementById("loading").style.display = "none";
    document.getElementById("doneLoading").style.display = "block";
    document.getElementById("postGame").style.display = "none";
    document.getElementById("start").style.display = "block";
}

function successful_join(data) {

    //modify the page

    //get rid of filter
    document.getElementById("myCanvas").style.filter = "none";
    //hide name input and show 'play again' in anticipation of possibly playing again
    document.getElementById("doneLoading").style.display = "none";
    document.getElementById("postGame").style.display = "block";
    document.getElementById('alert').style.display = "none";

    //update local data

    this_player = data.player;
    this_player_name = this_player.name; //save separately for joining new games without asking for another name
    game_data = data.game_data;

    //if this is the first person to join this game explain what is going on..
    if (game_data.status === "WAITING_FOR_PLAYERS") {
        var message_html = "<div class='loader'></div>";
        message_html += "<p>Waiting for other players...</p>";
        message_html += "<p>The game will start immediately once another player joins.</p>";
        simotegy_alert(message_html);
    }
}

function reset_game_variables() {
    this_player = null;
    game_data = null;
    this_players_view = null;
    last_state = null; //state of players
    game_events = []; //hold game event texts to display to players
    //put filter back on
    document.getElementById("myCanvas").style.filter = "blur(2px)";
}

function show_post_game(post_game_manner, temp_game_data) {

    reset_game_variables(); // this_player, game_data, this_players_view, last_state, game_events are all wiped

    //update game result elements
    document.getElementById("postGame_winning_team_proclamation").innerHTML = generate_post_game_proclamation(post_game_manner, temp_game_data);
    document.getElementById("postGame_winning_team_player_list").innerHTML = generate_post_game_player_list(temp_game_data);
    //show game result elements
    document.getElementById("loading").style.display = "none";
    document.getElementById("doneLoading").style.display = "none";
    document.getElementById("postGame").style.display = "block";
    document.getElementById("start").style.display = "block";
}

function generate_post_game_proclamation(post_game_manner, temp_game_data) {

    console.log(temp_game_data.timers);

    var post_game_proclamation = "";

    if (post_game_manner === "GAME_COMPLETED") {
        if (temp_game_data.timers.BLUE.seconds <= 0 && temp_game_data.timers.RED.seconds > 0) {
            post_game_proclamation = "BLUE TEAM WINS";
        } else if (temp_game_data.timers.RED.seconds <= 0 && temp_game_data.timers.BLUE.seconds > 0) {
            post_game_proclamation = "RED TEAM WINS";
        } else {
            console.log("Error at generate_post_game_proclamation");
        }
    } else if (post_game_manner === "TECHNICAL_VICTORY") {

        if (game_data.players.RED.IDs.length > 0 && game_data.players.BLUE.IDs.length <= 0) {
            post_game_proclamation = "RED TEAM WINS";
        } else if (game_data.players.BLUE.IDs.length > 0 && game_data.players.RED.IDs.length <= 0) {
            post_game_proclamation = "BLUE TEAM WINS";
        } else {
            console.log("Error at generate_post_game_proclamation");
        }
    }

    return post_game_proclamation;
}

function generate_post_game_player_list(temp_game_data) {
    var player_list = "";
    var target_team = null;

    if (temp_game_data.timers.BLUE.seconds <= 0 && temp_game_data.timers.RED.seconds > 0) {
        target_team = "BLUE";
    } else if (temp_game_data.timers.RED.seconds <= 0 && temp_game_data.timers.BLUE.seconds > 0) {
        target_team = "RED";
    }

    if (target_team) {
        for (i = 0; i < temp_game_data.players[target_team].IDs.length; i++) {
            var player_id = temp_game_data.players[target_team].IDs[i];
            var player_name = temp_game_data.players[target_team][player_id].name;
            player_list += "<li>" + player_name + "</li>";
        }
    } else {
        console.log("Something wrong with target_team:", target_team);
    }


    return player_list;
}

resource_load_successful("socket.js");