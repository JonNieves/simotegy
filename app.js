
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
//var io = require('socket.io')(server);
var io = require('socket.io')(server, { 'pingTimeout': 3000, 'pingInterval': 10000 });
var port = process.env.PORT || 8000;


//server listening on port 8000
server.listen(port, function() {
    console.log('server ready - listening on *:8000');
});

//regular expressions
var my_reg_exp = {
    special_chars: /\`|\~|\@|\#|\%|\^|\&|\*|\(|\)|\+|\=|\[|\]|\{|\}|\||\\|\'|\<|\>|\/|\"|[\s]{2,}/igm,
    really_not_nice: /fuck|cunt|nigger|niger|twat|cum|shit|cuck|bitch|cock|dick|arse|jizz|piss|fag|faggot|choad|schlong|prick|butt|Trump|deport|penis/igm
};

//game objects are added here as properties named by the games' ids and into an array of said properties' names
var game = {
    IDs: []
};

/*
	example
	
	var game = {
		IDs: [ 1, 2, 3, ....],
		1: [game object],
		2: [game object],
		3: [game object],
		...,
		...
	}
*/

//keep track of socket ids and their game ids for quick easy adjustments
//this only applies to people
//AI players do not get a socket id pair
var id_pair = {
    socket_ids: []
};

/*
	example
	
	var id_pair = {
		socket_ids: [player_1_socket_id, player_2_socket_id, player_3_socket_id, ....],
		[player_1_socket_id]: {game_id: [game_id], name: "aaa"},
		[player_2_socket_id]: "NONE",
		[player_3_socket_id]: {game_id: [game_id], name: "aaa2"},
		....,
		....
	};
	
*/

var game_server = {
    operation_interval: null, //global interval variable for broadcasting all games' datas to their respective players
    operation_status: "UPDATING", //prevent server operation interval overlapping
    busy: false, //prevent server operation interval overlapping
    operation: function() {

        if (this.operation_status === "UPDATING" && this.busy === false) {
            this.busy = true;
            update_game.data(); //"game_server.operation_status" changes back to "BROADCASTING" in this function
            this.busy = false;
        } else if (this.operation_status === "BROADCASTING" && this.busy === false) {
            this.busy = true;
            broadcast.all_games(); //"game_server.operation_status" changes back to "UPDATING" in this function
            this.busy = false;
        }

        //if there are no games, stop broadcasting to no one
        if (game.IDs.length == 0) {
            broadcast.end();
        }
    }
}

//bases for player and object sizes
//sizes for players and objects would some multiple of this number
var base_ingame_object_size = 50;

/*
	RESPONSE TO BROWSER GET REQUESTS===============================================
*/

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});

app.get('/*', function(request, response, next) {

    //This is the current file they have requested
    var file = request.params[0];

    //do not respond to some requests
    var passed = true;
    var test = ["app.js", "package.json", "package-lock.json", "oldapp.js"];
    var i = 0;

    while (i < test.length && passed) {
        if (test[i] === file) {
            passed = false;
        }
        i++;
    }

    if (passed) {
        //Send the client the file.
        response.sendFile(__dirname + '/' + file);
    } else {
        response.status(500).send('Something broke!');
    }
});

/*
	SOCKET.IO STUFF===============================================
*/

//this is called when a client connects which they do with var socket = io.connect();
io.on('connection', (socket) => {

    //i want newcomers to see a game going on 'in the background' while they choose a name
    //so have them join a spectator channel
    socket.join('sneakPeek');

    //add to socket_id/game_id record
    id_pair.socket_ids.push(socket.id);
    id_pair[socket.id] = {
        game_id: "NONE",
        player_name: null
    };
    console.log('New user connected:', id_pair.socket_ids[id_pair.socket_ids.length - 1], id_pair[socket.id]);

    //idk some error
    socket.on('error', (error) => {
        console.log(error);
    });

    //person left
    socket.on('disconnect', (reason) => {
        console.log('Disconnection - Leaver id:', socket.id, 'Reason:', reason);
        remove.human_leaver(socket.id);
    });

    //player chose a name
    socket.on('enter_matchmaking', (name) => {
        if (check_name_validity(name)) {

            //add player to a game
            //(create a game if there isn't one to join)
            //update socket_id/game_id relationship

            var assimilation_data = matchmake(name, socket.id);

            //join game channel
            socket.join(assimilation_data.game_data.id);
            //leave peek channel
            try {
                socket.leave('sneakPeek');
            } catch (error) {
                console.log(error);
            }
            //update socket_id/game_id relationship
            try {
                id_pair[socket.id].game_id = assimilation_data.game_data.id;
                id_pair[socket.id].player_name = name;
            } catch (error) {
                console.log('CRITICAL ERROR - id_pair update failed');
                console.log(error);
            }

            //send game initial data like map, orientation, etc.
            socket.emit("successful_join", assimilation_data);
        } else {
            socket.emit("server_rejected_name");
        }
    });

    //player took an ingame action - like changing direction or creating a spike
    socket.on("player_ingame_action", (player_action) => {
        process_player_action(socket.id, player_action);
    });

    //player's game ended and they will need reassigning
    socket.on("my_game_ended_im_still_here", () => {
        //leave old game channel
        socket.leave(id_pair[socket.id].game_id);
        //rejoin spectator channel
        socket.join('sneakPeek');
        //this player is no longer in a game
        id_pair[socket.id].game_id = "NONE";
        console.log('Player returning from ended game:', id_pair.socket_ids[id_pair.socket_ids.length - 1], id_pair[socket.id]);
    });

});

/*
	FUNCTIONS
*/

//receive a team (array of player objects) that had a player removed
//return a team after setting new roles
//update players' role and leader
function reorganize_team(old_team) {

    var new_team = old_team;

    //leader, member, member, leader, member, member ....

    var leader_identity; //players becoming members will be tied to this leader
    var i = 0;

    while (i < new_team.IDs.length) {
        var roleDecider = i % 3;
        //this player will become a leader
        if (roleDecider == 0) {
            new_team[new_team.IDs[i]].role = "LEADER";
            new_team[new_team.IDs[i]].leader = null;
            new_team[new_team.IDs[i]].radius = determine.player_radius("LEADER");
            //save this player's details as this will be the leader for following players
            leader_identity = {
                id: new_team[new_team.IDs[i]].id,
                name: new_team[new_team.IDs[i]].name
            };
        }
        //this player will become a member
        else if (roleDecider == 1 || roleDecider == 2) {
            new_team[new_team.IDs[i]].role = "MEMBER";
            new_team[new_team.IDs[i]].leader = leader_identity;
            new_team[new_team.IDs[i]].radius = determine.player_radius("MEMBER");
        }
        i++;
    }

    return new_team;
}

//user came up with a user name, try to add as player to game
function matchmake(name, socket_id) {

    //determine what game to add them to
    //create player object
    //add player to chosen game
    //tie player's socket id to game id for easier future adjusting

    var game_determined = determine.game(); // returns game id and AI and human players
    var game_id = game_determined.game_id;

    //only want to increase timer for generating players, not substituting
    var situation = null; //"GENERATION"/"SUBSTITUTION" - this goes for AI players too


    /*
        FOR NOW, JUST
            create 1 AI player
            create the joining human player
            create 4 more AI players
    */

    //create one new AI player ahead of adding the human player
    situation = "GENERATION";
    create.new_AI_player(game_id, "RANDOM/FILL", situation);

    /*

    THIS NEEDS WORK

    //there are no players, this must be a new game
    if (game_determined.AI_players === null && game_determined.human_players === null) {

        //create one new AI player ahead of adding the human player
        situation = "GENERATION";
        create.new_AI_player(game_id, "RANDOM/FILL", situation);

    }
    //there are players, may need to replace AI players
    else {
        if (game_determined.human_players.RED.length > game_determined.human_players.RED.length) {

        }
        if (game_determined.AI_players) {
            situation = "SUBSTITUTION";
            remove.AI_player_from_game(game_determined.AI_players);
        }
    }
    */

    var team = determine.team(game_id); //returns a string, "RED" or "BLUE"
    var role = determine.player_role(game_id, team); //returns string, "LEADER" OR "MEMBER"

    //new player object
    var new_player = {
        game_id: game_id,
        name: name,
        id: socket_id,
        team: team, //"BLUE" or "RED"
        position: determine.player_position(game_id, team), //returns a position object, { x, y }
        view_scale: 1,
        role: role, // "LEADER", "MEMBER"
        leader: determine.leader(game_id, team, role), //returns a portion of a player object, including name and id, or null if this player is a leader
        armed: true,
        speedy: false,
        alive: true,
        ticks: {
            spike_cooldown: 2 * 45, //2 seconds
            respawn: 2 * 45, //2 seconds
            speedy_cooldown: 2 * 45
        },
        speed: 5,
        radius: determine.player_radius(role),
        direction: determine.player_direction(game_id, team),
        AI_player: false
    };

    //add id, add to game, and update timers
    game[game_id].players[team].IDs.push(new_player.id);
    game[game_id].players[team][new_player.id] = new_player;

    if (situation === "GENERATION") {
        update_game.add_seconds_to_a_teams_timer(game_id, team);
    }

    //update the status of this game
    var this_games_population = get_game.population(game_id);
    var this_games_status = get_game.status(game_id);
    if (this_games_population.total >= 2 && this_games_population.BLUE > 0 && this_games_population.RED > 0 && this_games_status === "WAITING_FOR_PLAYERS") {
        update_game.status(game_id, "IN-PROGRESS");
    }

    /*
        Add 4 more AI players after adding a human player
        This should result in 2 Leader players (1 AI/1 human)
        and 4 members players (2 for each team)
    */
    if (situation === "GENERATION") {
        create.new_AI_player(game_id, "RANDOM/FILL", situation);
        create.new_AI_player(game_id, "RANDOM/FILL", situation);
        create.new_AI_player(game_id, "RANDOM/FILL", situation);
        create.new_AI_player(game_id, "RANDOM/FILL", situation);
    }

    //create/update this player's socket_id/game_id relationship
    id_pair[socket_id].game_id = game_id;
    id_pair[socket_id].player_name = name;

    //return this room's name, this player's id, and map data

    var assimilation_data = {
        player: new_player,
        game_data: get_game.data(game_id)
    };

    return assimilation_data;
}

//make sure what the user sent for a name is on the up and up
function check_name_validity(name) {
    console.log("Checking if name is valid:", name);
    if (typeof name !== typeof "string" || my_reg_exp.really_not_nice.test(name) || my_reg_exp.special_chars.test(name) || name.length > 24) {
        console.log("Name invalid");
        return false;
    } else {
        console.log("Name valid");
        return true;
    }
}

function process_player_action(id, player_action) {
    try {
        /*
            var player_action = {
                game_id: aaa,
                player_id: aaa, //actually socket_id
                player_team: aaa, //"BLUE", "RED"
                action_type: aaa, //"CHANGE_DIRECTION", "CREATE_SPIKE", "MAKE_SPEEDY"
                action_object: {}
            };
            
            //CHANGE DIRECTION/MAKE SPEEDY action object
            {
                direction: "aaa" // "UP", "DOWN", "LEFT", "RIGHT"
            }
            
            //CREATE SPIKE action object
            {
                player: {
                    direction: "aaa", // "UP", "DOWN", "LEFT", "RIGHT"
                }
                spike: {
                    direction: "aaa" // "UP", "DOWN", "LEFT", "RIGHT"
                }
            }
        */

        var game_id = player_action.game_id;
        var target_team = player_action.player_team;
        var player_id = player_action.player_id;
        var this_games_status = get_game.status(game_id);

        if (id === player_id) {
            if (game[game_id] && this_games_status === "IN-PROGRESS") {
                if (player_action.action_type === "CHANGE_DIRECTION") {
                    if (player_action.action_object.direction === "UP" || player_action.action_object.direction === "DOWN" || player_action.action_object.direction === "LEFT" || player_action.action_object.direction === "RIGHT") {
                        game[game_id].players[target_team][player_id].direction = player_action.action_object.direction;
                    }
                } else if (player_action.action_type === "CREATE_SPIKE") {
                    create.new_spike(player_action);
                } else if (player_action.action_type === "MAKE_SPEEDY") {
                    if (player_action.action_object.direction === "UP" || player_action.action_object.direction === "DOWN" || player_action.action_object.direction === "LEFT" || player_action.action_object.direction === "RIGHT") {
                        game[game_id].players[target_team][player_id].direction = player_action.action_object.direction;
                        make_player_speedy(player_action);
                    }
                }
            } else {
                console.log("Player action received for non-playable game..");
            }
        } else {
            console.log("A player action was taken by a different person than the player...");
        }
    } catch (error) {
        console.log(error);
    }
}

function make_player_speedy(player_action) {
    var game_id = player_action.game_id;
    var player_id = player_action.player_id;
    var team = player_action.player_team;
    var player_alive = game[game_id].players[team][player_id].alive;
    var player_speedy = game[game_id].players[team][player_id].speedy;

    if (player_action.action_type === "MAKE_SPEEDY" && player_alive === true && player_speedy === false) {
        game[game_id].players[team][player_id].speedy = true;
        game[game_id].players[team][player_id].speed = game[game_id].players[team][player_id].speed * 2;
    }
}

//retrieve data values from games
var get_game = {
    data: function(game_id) {
        if (game[game_id]) {
            var game_data = game[game_id];
            return game_data;
        } else {
            console.log('Cannot get static game data because game does not exist');
        }
    },
    status: function(game_id) {
        try {
            if (game[game_id]) {
                return game[game_id].status;
            }
        } catch (error) {
            console.log(error);
        }
    },
    population: function(game_id) {
        try {
            if (game[game_id]) {
                var population = {
                    total: game[game_id].players.BLUE.IDs.length + game[game_id].players.RED.IDs.length,
                    BLUE: game[game_id].players.BLUE.IDs.length,
                    RED: game[game_id].players.RED.IDs.length
                };
                return population;
            }
        } catch (error) {
            console.log(error);
        }
    },
    team_players: function(game_id, team) {
        try {
            var t = game[game_id].players[team];
            return t;
        } catch (error) {
            console.log(error);
        }
    },
    //return AI players from a single game
    AI_players: function(game_id) {
        if (game[game_id]) {
            var population = get_game.population(game_id);
            var a = 0;
            var results = {
                BLUE: [],
                RED: [],
                total: 0
            }; //arrays of player objects, should only be AI players

            while (a < 2) {
                var target_team;

                if (a == 0) {
                    target_team = "BLUE";
                } else if (a == 1) {
                    target_team = "RED";
                }

                var i = 0;

                while (i < population[target_team]) {
                    var player_id = game[game_id].players[target_team].IDs[i];

                    if (game[game_id].players[target_team][player_id].AI_player === true) {
                        results[target_team].push(game[game_id].players[target_team][player_id]);
                        results.total++;
                    }

                    i++;
                }

                a++;
            }

            return results;
        }
    },
    //return human players from a single game
    human_players: function(game_id) {
        try {
            if (game[game_id]) {
                var population = get_game.population(game_id);
                var a = 0;
                var results = {
                    BLUE: [],
                    RED: [],
                    total: 0
                }; //arrays of player objects, should only be human players

                while (a < 2) {
                    var target_team;

                    if (a == 0) {
                        target_team = "BLUE";
                    } else if (a == 1) {
                        target_team = "RED";
                    }

                    var i = 0;

                    while (i < population[target_team]) {
                        var player_id = game[game_id].players[target_team].IDs[i];

                        if (game[game_id].players[target_team][player_id].AI_player === false) {
                            results[target_team].push(game[game_id].players[target_team][player_id]);
                            results.total++;
                        }

                        i++;
                    }

                    a++;
                }

                return results;
            }
        } catch (error) {
            console.log(error);
        }
    },
    timers: function(game_id) {
        try {
            return game[game_id].timers;
        } catch (error) {
            console.log(error);
        }
    }
}

var determine = {
    //either have the player join a current game or create a new one
    game: function() {

        var results = {
            game_id: null,
            AI_players: null,
            human_players: null
        };

        if (game.IDs.length > 0) {

            for (i = 0; i < game.IDs.length; i++) {

                var game_id = game.IDs[i];

                var game_status = get_game.status(game_id);
                var game_AI_players = get_game.AI_players(game_id);
                var human_players = get_game.human_players(game_id);
                var game_timers = get_game.timers(game_id);

                var limitations = {
                    max_human_players: 2,
                    minimum_time_left: 30
                };

                var game_is_joinable = Boolean((game_status === "WAITING_FOR_PLAYERS" || game_status === "IN-PROGRESS") && human_players.total < limitations.max_human_players && game_timers.BLUE.seconds > limitations.minimum_time_left && game_timers.RED.seconds > limitations.minimum_time_left);
                var game_is_NOT_joinable = Boolean(game_is_joinable === false || human_players.total >= limitations.max_human_players || game_timers.BLUE.seconds <= limitations.minimum_time_left || game_timers.RED.seconds <= limitations.minimum_time_left);

                if (game_is_joinable) {
                    results.game_id = game_id;
                    results.AI_players = game_AI_players;
                    results.human_players = human_players;
                    return results;
                }
                //but if all games are unjoinable, make a new one
                else if (i == game.IDs.length - 1 && game_is_NOT_joinable) {
                    var new_game_id = create.new_game();
                    results.game_id = new_game_id;
                    return results;
                }
            }
        }
        //if there isn't any game to join make a new one
        //also start a timed interval function to broadcast game info to players
        else {
            var new_game_id = create.new_game();
            results.game_id = new_game_id;
            broadcast.start();
            return results;
        }
    },
    player_radius: function(role) {
        if (role === "LEADER") {
            return base_ingame_object_size / 2;
        } else if (role === "MEMBER") {
            return base_ingame_object_size / 4;
        }
    },
    //given the game this player is going into and what they are on, determine initial direction
    player_direction: function(game_id, team) {
        return game[game_id].initial_direction[team];
    },
    //used when a player is created and added to the game
    //their initial location is determined by what team they're in
    player_position: function(game_id, team) {
        //initial 'blank' position object
        var position = {
            x: 0,
            y: 0
        };

        //starting coords for specified team
        var starting_x = (game[game_id].map.bases[team].x1 + game[game_id].map.bases[team].x2) / 2;
        var starting_y = (game[game_id].map.bases[team].y1 + game[game_id].map.bases[team].y2) / 2;

        position.x = starting_x;
        position.y = starting_y;

        return position;
    },
    leader: function(game_id, team, role) {
        //player IS a leader
        if (role == "LEADER") {
            return null;
        }
        //player is a member, find a leader for them
        else if (role === "MEMBER") {
            //first find team
            var t = get_game.team_players(game_id, team);

            //find last added leader
            var i = t.IDs.length - 1;
            while (i > -1) {
                if (t[t.IDs[i]].role === "LEADER") {
                    var leaderIdentity = {
                        id: t[t.IDs[i]].id,
                        name: t[t.IDs[i]].name
                    }
                    return leaderIdentity;
                }
                i--;
            }
            console.log('If I see this, a leader could not be found for this member');
            return null;
        }
    },
    player_role: function(game_id, team) {
        //team heirarchy
        //leader, member, member, leader, member, member, etc...

        //evaluate team for this player's placement
        var roleDecider;
        var t = get_game.team_players(game_id, team);
        roleDecider = t.IDs.length % 3;

        //given the heirarchy...

        //this player will become a leader
        if (roleDecider == 0) {
            return "LEADER";
        }
        //this player will become a member
        else if (roleDecider == 1 || roleDecider == 2) {
            return "MEMBER";
        }
    },
    team: function(game_id) {
        try {
            //add player to which side has less people
            //random if equal team sizes

            //join red team
            if (game[game_id].players.BLUE.IDs.length > game[game_id].players.RED.IDs.length) {
                return "RED";
            }
            //join blue team
            else if (game[game_id].players.BLUE.IDs.length < game[game_id].players.RED.IDs.length) {
                return "BLUE";
            } else {
                console.log('Even teams...inserting randomly....');
                var coinFlip = Math.round(Math.random()) + 1; //gives 1 or 2
                if (coinFlip == 1) {
                    return "RED"
                } else {
                    return "BLUE"
                }
            }
        } catch (error) {
            console.log(error);
        }

    },
    spike: {
        speed: function(player_direction, speedy, spike_direction) {

            return 10;

            /*
            if (speedy) {
                return 20;
            } else {
                return 10;
            }
            */

            /*
            if (player_direction === spike_direction) {
                if (speedy) {
                    return 20;
                } else {
                    return 10;
                }
            } else if (
                (player_direction === "UP" && spike_direction === "DOWN") ||
                (player_direction === "LEFT" && spike_direction === "RIGHT") ||
                (player_direction === "DOWN" && spike_direction === "UP") ||
                (player_direction === "RIGHT" && spike_direction === "LEFT")) {
                return 0;
            } else {
                if (speedy) {
                    return 20;
                } else {
                    return 10;
                }
            }
            */
        },
        position: function(player_position, player_radius, spike_direction, spike_radius) {
            var spike_position;
            var leeway = 5;

            if (spike_direction === "LEFT") {
                spike_position = {
                    x: player_position.x - player_radius - spike_radius - leeway,
                    y: player_position.y
                };
            } else if (spike_direction === "RIGHT") {
                spike_position = {
                    x: player_position.x + player_radius + spike_radius + leeway,
                    y: player_position.y
                };
            } else if (spike_direction === "UP") {
                spike_position = {
                    x: player_position.x,
                    y: player_position.y - player_radius - spike_radius - leeway
                };
            } else if (spike_direction === "DOWN") {
                spike_position = {
                    x: player_position.x,
                    y: player_position.y + player_radius + spike_radius + leeway
                };
            }
            return spike_position;
        }
    }
};

var create = {
    new_game: function() {
        var game_id = this.new_ID();

        var game_object = {
            id: game_id,
            players: {
                BLUE: {
                    IDs: []
                },
                RED: {
                    IDs: []
                }
            },
            map: {
                width: 3600,
                height: 2400,
                bases: {
                    BLUE: {
                        x1: 0,
                        y1: 0,
                        x2: 720,
                        y2: 480
                    },
                    RED: {
                        x1: (3600 - 720),
                        y1: (2400 - 480),
                        x2: 3600,
                        y2: 2400
                    }
                },
                goal_area: {
                    x1: 3600 / 2 - 720 / 2,
                    y1: 2400 / 2 - 480 / 2,
                    x2: 3600 / 2 + 720 / 2,
                    y2: 2400 / 2 + 480 / 2
                }
            },
            timers: {
                BLUE: {
                    seconds: 0,
                    ticks: 45
                },
                RED: {
                    seconds: 0,
                    ticks: 45
                }
            },
            respawn_location: {},
            status: "WAITING_FOR_PLAYERS", //"WAITING_FOR_PLAYERS "IN-PROGRESS" "ENDED" "TO_BE_DESTROYED"
            objects: {
                spikes: {
                    IDs: []
                },
                explosions: []
            },
            initial_direction: {
                BLUE: "RIGHT",
                RED: "LEFT"
            }
        };

        //create un-rewritable respawn locations BECAUSE ITS GETTING FUCKING REWRITTEN SOME FUCKING HOW
        Object.defineProperty(game_object.respawn_location, "BLUE", {
            value: {
                x: 720 / 2,
                y: 480 / 2
            },
            writeable: false,
            configurable: false,
            enumerable: false
        });
        Object.defineProperty(game_object.respawn_location, "RED", {
            value: {
                x: (3600 + (3600 - 720)) / 2,
                y: (2400 + (2400 - 480)) / 2
            },
            writeable: false,
            configurable: false,
            enumerable: false
        });

        //add to game OBJECT
        game[game_id] = game_object;
        //add game game_id to game_id array
        game.IDs.push(game_id);

        console.log("New game created");

        //return game_id so player can join
        return game_id;
    },
    new_AI_player: function(game_id, team, situation) {
        try {
            //team = "RANDOM/FILL"/"BLUE"/"RED"

            //create a new AI player and add it to a game
            if (game[game_id]) {

                console.log("Creating an AI player...");

                var target_team = null;

                if (team === "RANDOM/FILL") {
                    target_team = determine.team(game_id);
                } else if (team === "RED" || team === "BLUE") {
                    target_team = team;
                }

                var role = determine.player_role(game_id, target_team); //returns string, "LEADER" OR "MEMBER"

                //new player object
                var new_AI_player = {
                    game_id: game_id,
                    name: this.new_AI_name(),
                    id: this.new_ID(),
                    team: target_team, //"BLUE" or "RED"
                    position: determine.player_position(game_id, target_team), //returns a position object, { x, y }
                    view_scale: 1,
                    role: role, // "LEADER", "MEMBER"
                    leader: determine.leader(game_id, target_team, role), //returns a portion of a player object, including name and id, or null if this player is a leader
                    armed: true,
                    speedy: false,
                    alive: true,
                    ticks: {
                        spike_cooldown: 2 * 45, //2 seconds
                        respawn: 2 * 45, //2 seconds
                        speedy_cooldown: 2 * 45
                    },
                    speed: 5,
                    radius: determine.player_radius(role),
                    direction: determine.player_direction(game_id, target_team),
                    AI_player: true
                };

                //add to game and update timers
                game[game_id].players[target_team].IDs.push(new_AI_player.id);
                game[game_id].players[target_team][new_AI_player.id] = new_AI_player;

                if (situation === "GENERATION") {
                    update_game.add_seconds_to_a_teams_timer(game_id, target_team);
                } else if (situation === "SUBSTITUTION") {
                    console.log("AI substitution... not adding more time to the game...");
                }

                console.log("DONE! Added AI player to game");
            }
        } catch (error) {
            console.log(error);
        }

    },
    //create new spike and add it to specified game's spikes, but only if the game is IN-PROGRESS and the player is armed and the player is alive
    new_spike: function(player_action) {
        try {
            var game_id = player_action.game_id;
            var player_team = player_action.player_team;
            var player_id = player_action.player_id;

            if (game[game_id].status === "IN-PROGRESS" && game[game_id].players[player_team][player_id].armed && game[game_id].players[player_team][player_id].alive) {
                var player_direction = player_action.action_object.player.direction;
                var player_position = game[game_id].players[player_team][player_id].position;
                var player_radius = game[game_id].players[player_team][player_id].radius;
                var spike_direction = player_action.action_object.spike.direction;
                var speedy = game[game_id].players[player_team][player_id].speedy;

                var spike_radius = base_ingame_object_size / 4;

                var spike = {
                    id: this.new_ID(),
                    position: determine.spike.position(player_position, player_radius, spike_direction, spike_radius),
                    direction: spike_direction, //"UP", "DOWN", "LEFT", "RIGHT"
                    speed: determine.spike.speed(player_direction, speedy, spike_direction),
                    radius: spike_radius,
                    destroyed: false
                };

                //add spike to game
                game[game_id].objects.spikes.IDs.push(spike.id);
                game[game_id].objects.spikes[spike.id] = spike;
                //modify player armed setting
                game[game_id].players[player_team][player_id].armed = false;
            }
        } catch (error) {
            console.log(error);
        }
    },
    //generate a name for AI players
    new_AI_name: function() {
        var animals = ["Aardvark", "Abyssinian", "Adelie Penguin", "Affenpinscher", "Afghan Hound", "African Bush Elephant",
            "African Civet", "African Clawed Frog", "African Forest Elephant", "African Palm Civet", "African Penguin",
            "African Tree Toad", "African Wild Dog", "Ainu Dog", "Airedale Terrier", "Akbash", "Akita",
            "Alaskan Malamute", "Albatross", "Aldabra Giant Tortoise", "Alligator", "Alpine Dachsbracke",
            "American Bulldog", "American Cocker Spaniel", "American Coonhound", "American Eskimo Dog",
            "American Foxhound", "American Pit Bull Terrier", "American Staffordshire Terrier", "American Water Spaniel",
            "Anatolian Shepherd Dog", "Angelfish", "Ant", "Anteater", "Antelope", "Appenzeller Dog", "Arctic Fox", "Arctic Hare",
            "Arctic Wolf", "Armadillo", "Asian Elephant", "Asian Giant Hornet", "Asian Palm Civet", "Asiatic Black Bear",
            "Australian Cattle Dog", "Australian Kelpie Dog", "Australian Mist", "Australian Shepherd", "Australian Terrier",
            "Avocet", "Axolotl", "Aye Aye", "Baboon", "Bactrian Camel", "Badger", "Balinese", "Banded Palm Civet", "Bandicoot",
            "Barb", "Barn Owl", "Barnacle", "Barracuda", "Basenji Dog", "Basking Shark", "Basset Hound", "Bat", "Bavarian Mountain Hound",
            "Beagle", "Bear", "Bearded Collie", "Bearded Dragon", "Beaver", "Bedlington Terrier", "Beetle", "Bengal Tiger",
            "Bernese Mountain Dog", "Bichon Frise", "Binturong", "Bird", "Birds Of Paradise", "Birman", "Bison", "Black Bear",
            "Black Rhinoceros", "Black Russian Terrier", "Black Widow Spider", "Bloodhound", "Blue Lacy Dog", "Blue Whale",
            "Bluetick Coonhound", "Bobcat", "Bolognese Dog", "Bombay", "Bongo", "Bonobo", "Booby", "Border Collie", "Border Terrier",
            "Bornean Orang-utan", "Borneo Elephant", "Boston Terrier", "Bottle Nosed Dolphin", "Boxer Dog", "Boykin Spaniel",
            "Brazilian Terrier", "Brown Bear", "Budgerigar", "Buffalo", "Bull Mastiff", "Bull Shark", "Bull Terrier", "Bulldog",
            "Bullfrog", "Bumble Bee", "Burmese", "Burrowing Frog", "Butterfly", "Butterfly Fish", "Caiman", "Caiman Lizard", "Cairn Terrier",
            "Camel", "Canaan Dog", "Capybara", "Caracal", "Carolina Dog", "Cassowary", "Cat", "Caterpillar", "Catfish",
            "Cavalier King Charles Spaniel", "Centipede", "Cesky Fousek", "Chameleon", "Chamois", "Cheetah", "Chesapeake Bay Retriever",
            "Chicken", "Chihuahua", "Chimpanzee", "Chinchilla", "Chinese Crested Dog", "Chinook", "Chinstrap Penguin", "Chipmunk",
            "Chow Chow", "Cichlid", "Clouded Leopard", "Clown Fish", "Clumber Spaniel", "Coati", "Cockroach", "Collared Peccary",
            "Collie", "Common Buzzard", "Common Frog", "Common Loon", "Common Toad", "Coral", "Cottontop Tamarin", "Cougar", "Cow",
            "Coyote", "Crab", "Crab-Eating Macaque", "Crane", "Crested Penguin", "Crocodile", "Cross River Gorilla", "Curly Coated Retriever",
            "Cuscus", "Cuttlefish", "Dachshund", "Dalmatian", "Darwin's Frog", "Deer", "Desert Tortoise", "Deutsche Bracke", "Dhole", "Dingo",
            "Discus", "Doberman Pinscher", "Dodo", "Dog", "Dogo Argentino", "Dogue De Bordeaux", "Dolphin", "Donkey", "Dormouse", "Dragonfly",
            "Drever", "Duck", "Dugong", "Dunker", "Dusky Dolphin", "Dwarf Crocodile", "Eagle", "Earwig", "Eastern Gorilla",
            "Eastern Lowland Gorilla", "Echidna", "Edible Frog", "Egyptian Mau", "Electric Eel", "Elephant", "Elephant Seal", "Elephant Shrew",
            "Emperor Penguin", "Emperor Tamarin", "Emu", "English Cocker Spaniel", "English Shepherd", "English Springer Spaniel",
            "Entlebucher Mountain Dog", "Epagneul Pont Audemer", "Eskimo Dog", "Estrela Mountain Dog", "Falcon", "Fennec Fox", "Ferret",
            "Field Spaniel", "Fin Whale", "Finnish Spitz", "Fire-Bellied Toad", "Fish", "Fishing Cat", "Flamingo", "Flat Coat Retriever",
            "Flounder", "Fly", "Flying Squirrel", "Fossa", "Fox", "Fox Terrier", "French Bulldog", "Frigatebird", "Frilled Lizard", "Frog",
            "Fur Seal", "Galapagos Penguin", "Galapagos Tortoise", "Gar", "Gecko", "Gentoo Penguin", "Geoffroys Tamarin", "Gerbil",
            "German Pinscher", "German Shepherd", "Gharial", "Giant African Land Snail", "Giant Clam", "Giant Panda Bear", "Giant Schnauzer",
            "Gibbon", "Gila Monster", "Giraffe", "Glass Lizard", "Glow Worm", "Goat", "Golden Lion Tamarin", "Golden Oriole",
            "Golden Retriever", "Goose", "Gopher", "Gorilla", "Grasshopper", "Great Dane", "Great White Shark", "Greater Swiss Mountain Dog",
            "Green Bee-Eater", "Greenland Dog", "Grey Mouse Lemur", "Grey Reef Shark", "Grey Seal", "Greyhound", "Grizzly Bear", "Grouse",
            "Guinea Fowl", "Guinea Pig", "Guppy", "Hammerhead Shark", "Hamster", "Hare", "Harrier", "Havanese", "Hedgehog", "Hercules Beetle",
            "Hermit Crab", "Heron", "Highland Cattle", "Himalayan", "Hippopotamus", "Honey Bee", "Horn Shark", "Horned Frog", "Horse",
            "Horseshoe Crab", "Howler Monkey", "Human", "Humboldt Penguin", "Hummingbird", "Humpback Whale", "Hyena", "Ibis", "Ibizan Hound",
            "Iguana", "Impala", "Indian Elephant", "Indian Palm Squirrel", "Indian Rhinoceros", "Indian Star Tortoise", "Indochinese Tiger",
            "Indri", "Insect", "Irish Setter", "Irish WolfHound", "Jack Russel", "Jackal", "Jaguar", "Japanese Chin", "Japanese Macaque",
            "Javan Rhinoceros", "Javanese", "Jellyfish", "Kakapo", "Kangaroo", "Keel Billed Toucan", "Killer Whale", "King Crab",
            "King Penguin", "Kingfisher", "Kiwi", "Koala", "Komodo Dragon", "Kudu", "Labradoodle", "Labrador Retriever", "Ladybird",
            "Leaf-Tailed Gecko", "Lemming", "Lemur", "Leopard", "Leopard Cat", "Leopard Seal", "Leopard Tortoise", "Liger", "Lion", "Lionfish",
            "Little Penguin", "Lizard", "Llama", "Lobster", "Long-Eared Owl", "Lynx", "Macaroni Penguin", "Macaw", "Magellanic Penguin",
            "Magpie", "Maine Coon", "Malayan Civet", "Malayan Tiger", "Maltese", "Manatee", "Mandrill", "Manta Ray", "Marine Toad", "Markhor",
            "Marsh Frog", "Masked Palm Civet", "Mastiff", "Mayfly", "Meerkat", "Millipede", "Minke Whale", "Mole", "Molly", "Mongoose",
            "Mongrel", "Monitor Lizard", "Monkey", "Monte Iberia Eleuth", "Moorhen", "Moose", "Moray Eel", "Moth", "Mountain Gorilla",
            "Mountain Lion", "Mouse", "Mule", "Neanderthal", "Neapolitan Mastiff", "Newfoundland", "Newt", "Nightingale", "Norfolk Terrier",
            "Norwegian Forest", "Numbat", "Nurse Shark", "Ocelot", "Octopus", "Okapi", "Old English Sheepdog", "Olm", "Opossum", "Orang-utan",
            "Ostrich", "Otter", "Oyster", "Pademelon", "Panther", "Parrot", "Patas Monkey", "Peacock", "Pekingese", "Pelican", "Penguin",
            "Persian", "Pheasant", "Pied Tamarin", "Pig", "Pika", "Pike", "Pink Fairy Armadillo", "Piranha", "Platypus", "Pointer",
            "Poison Dart Frog", "Polar Bear", "Pond Skater", "Poodle", "Pool Frog", "Porcupine", "Possum", "Prawn", "Proboscis Monkey",
            "Puffer Fish", "Puffin", "Pug", "Puma", "Purple Emperor", "Puss Moth", "Pygmy Hippopotamus", "Pygmy Marmoset", "Quail", "Quetzal",
            "Quokka", "Quoll", "Rabbit", "Raccoon", "Raccoon Dog", "Radiated Tortoise", "Ragdoll", "Rat", "Rattlesnake", "Red Knee Tarantula",
            "Red Panda", "Red Wolf", "Red-handed Tamarin", "Reindeer", "Rhinoceros", "River Dolphin", "River Turtle", "Robin", "Rock Hyrax",
            "Rockhopper Penguin", "Roseate Spoonbill", "Rottweiler", "Royal Penguin", "Russian Blue", "Sabre-Toothed Tiger", "Saint Bernard",
            "Salamander", "Sand Lizard", "Saola", "Scorpion", "Scorpion Fish", "Sea Dragon", "Sea Lion", "Sea Otter", "Sea Slug", "Sea Squirt",
            "Sea Turtle", "Sea Urchin", "Seahorse", "Seal", "Serval", "Sheep", "Shih Tzu", "Shrimp", "Siamese", "Siamese Fighting Fish",
            "Siberian", "Siberian Husky", "Siberian Tiger", "Silver Dollar", "Skunk", "Sloth", "Slow Worm", "Snail", "Snake", "Snapping Turtle",
            "Snowshoe", "Snowy Owl", "Somali", "South China Tiger", "Spadefoot Toad", "Sparrow", "Spectacled Bear", "Sperm Whale",
            "Spider Monkey", "Spiny Dogfish", "Sponge", "Squid", "Squirrel", "Squirrel Monkey", "Sri Lankan Elephant",
            "Staffordshire Bull Terrier", "Stag Beetle", "Starfish", "Stellers Sea Cow", "Stick Insect", "Stingray", "Stoat",
            "Striped Rocket Frog", "Sumatran Elephant", "Sumatran Orang-utan", "Sumatran Rhinoceros", "Sumatran Tiger", "Sun Bear", "Swan",
            "Tang", "Tapanuli Orang-utan", "Tapir", "Tarsier", "Tasmanian Devil", "Tawny Owl", "Termite", "Tetra", "Thorny Devil",
            "Tibetan Mastiff", "Tiffany", "Tiger", "Tiger Salamander", "Tiger Shark", "Tortoise", "Toucan", "Tree Frog", "Tropicbird",
            "Tuatara", "Turkey", "Turkish Angora", "Uakari", "Uguisu", "Umbrellabird", "Vampire Bat", "Vervet Monkey", "Vulture", "Wallaby",
            "Walrus", "Warthog", "Wasp", "Water Buffalo", "Water Dragon", "Water Vole", "Weasel", "Welsh Corgi", "West Highland Terrier",
            "Western Gorilla", "Western Lowland Gorilla", "Whale Shark", "Whippet", "White Faced Capuchin", "White Rhinoceros", "White Tiger",
            "Wild Boar", "Wildebeest", "Wolf", "Wolverine", "Wombat", "Woodlouse", "Woodpecker", "Woolly Mammoth", "Woolly Monkey", "Wrasse",
            "X-Ray Tetra", "Yak", "Yellow-Eyed Penguin", "Yorkshire Terrier", "Zebra", "Zebra Shark", "Zebu", "Zonkey", "Zorse"
        ];
        var num = Math.round(Math.random() * animals.length);
        var AI_name = "[AI] " + animals[num];
        return AI_name;
    },
    //generate new ID for objects
    new_ID: function() {
        var id = "";
        for (i = 0; i < 32; i++) {
            var num = Math.floor(Math.random() * 16);
            if (num == 10) { num = "a" } else if (num == 11) { num = "b" } else if (num == 12) { num = "c" } else if (num == 13) { num = "d" } else if (num == 14) { num = "e" } else if (num == 15) { num = "f" }
            id += num;
        }
        return id;
    },
    new_explosion: function(game_id, position) {
        var new_explosion = {
            position: position,
            ticks_left: 6,
            radius: base_ingame_object_size
        };
        game[game_id].objects.explosions.push(new_explosion);
    }
};

var update_game = {
    //execute 'a move' in all "IN-PROGRESS" games - update player positions, statuses, objects, timers, etc..
    data: function() {
        try {
            //console.log("Updating game data");
            for (i = 0; i < game.IDs.length; i++) {
                //update players' statuses and locations and objects and stuff
                var game_id = game.IDs[i];
                var human_players = get_game.human_players(game_id);
                var game_status = get_game.status(game_id);

                if (human_players.total > 0) {
                    if (game_status === "IN-PROGRESS") {
                        //console.log("Removing destroyed objects...");
                        this.remove_destroyed_objects(game_id);
                        //console.log("Processing AI actions...");
                        this.process_AI_actions(game_id);
                        //console.log("Moving Players...");
                        this.player_movement(game_id); //move players, tick respawns, stuff like that
                        //console.log("Moving Objects...");
                        this.object_movement(game_id); //move spikes, tick "evolutions"
                        //console.log("Processing collisions...");
                        this.collisions(game_id); //collide players, spike players, keep players and objects within the map, etc.
                        //console.log("Updating timers...");
                        this.capture_timers(game_id); //count players inside the capture area
                    } else if (game_status === "ENDED") {
                        //console.log("Removing ended game");
                        remove.game(game_id);
                    }
                } else {
                    remove.game(game_id);
                }
            }

            //updates are done, set flag to broadcast
            game_server.operation_status = "BROADCASTING";

            //console.log("Game data updated");
        } catch (error) {
            console.log(error);
        }
    },
    //removes all spikes that were destroyed in a game
    //other objects may come later...
    remove_destroyed_objects: function(game_id) {
        try {
            //remove destroyed spikes
            for (i = 0; i < game[game_id].objects.spikes.IDs.length; i++) {
                var spike_id = game[game_id].objects.spikes.IDs[i];
                if (game[game_id].objects.spikes[spike_id].destroyed) {
                    delete game[game_id].objects.spikes[spike_id];
                    game[game_id].objects.spikes.IDs.splice(i, 1);
                }
            }
            //remove expired explosions
            for (i = 0; i < game[game_id].objects.explosions.length; i++) {
                if (game[game_id].objects.explosions[i].ticks_left <= 0) {
                    game[game_id].objects.explosions.splice(i, 1);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },
    player_movement: function(game_id) {
        for (a = 0; a < 2; a++) {

            var target_team;
            var other_team;
            if (a == 0) {
                target_team = "BLUE";
                other_team = "RED";
            } else {
                target_team = "RED";
                other_team = "BLUE";
            }

            for (i = 0; i < game[game_id].players[target_team].IDs.length; i++) {

                //get player id
                var player_id = game[game_id].players[target_team].IDs[i];

                //if player is alive
                if (game[game_id].players[target_team][player_id].alive) {
                    if (game[game_id].players[target_team][player_id].direction === "LEFT") {
                        game[game_id].players[target_team][player_id].position.x -= game[game_id].players[target_team][player_id].speed;
                    } else if (game[game_id].players[target_team][player_id].direction === "RIGHT") {
                        game[game_id].players[target_team][player_id].position.x += game[game_id].players[target_team][player_id].speed;
                    } else if (game[game_id].players[target_team][player_id].direction === "UP") {
                        game[game_id].players[target_team][player_id].position.y -= game[game_id].players[target_team][player_id].speed;
                    } else if (game[game_id].players[target_team][player_id].direction === "DOWN") {
                        game[game_id].players[target_team][player_id].position.y += game[game_id].players[target_team][player_id].speed;
                    }
                }
                //if player is dead
                else {
                    //tick
                    game[game_id].players[target_team][player_id].ticks.respawn--;
                    //change player status to alive and move player to their respawn location after all ticks
                    if (game[game_id].players[target_team][player_id].ticks.respawn <= 0) {

                        //make alive
                        game[game_id].players[target_team][player_id].alive = true;
                        //reset ticker
                        game[game_id].players[target_team][player_id].ticks.respawn = 45;

                        //there are 2 respawn location options
                        //1) to this player's leader or 2) to the team base

                        //get leader
                        var leader_id = null;
                        if (game[game_id].players[target_team][player_id].leader && game[game_id].players[target_team][player_id].leader.id) {
                            var leader_id = game[game_id].players[target_team][player_id].leader.id;
                        }
                        if (leader_id) {
                            //if there is a leader and they are alive, respawn on them
                            if (game[game_id].players[target_team][leader_id].alive) {
                                var x = game[game_id].players[target_team][leader_id].position.x;
                                var y = game[game_id].players[target_team][leader_id].position.y;
                                game[game_id].players[target_team][player_id].position.x = x;
                                game[game_id].players[target_team][player_id].position.y = y;
                            }
                            //respawn at base
                            else {
                                var x = game[game_id].respawn_location[target_team].x;
                                var y = game[game_id].respawn_location[target_team].y;
                                game[game_id].players[target_team][player_id].position.x = x;
                                game[game_id].players[target_team][player_id].position.y = y;
                            }
                        }
                        //respawn at base
                        else {
                            var x = game[game_id].respawn_location[target_team].x;
                            var y = game[game_id].respawn_location[target_team].y;
                            game[game_id].players[target_team][player_id].position.x = x;
                            game[game_id].players[target_team][player_id].position.y = y;
                        }
                    }
                }

                //tick armed cooldowns if unarmed
                if (game[game_id].players[target_team][player_id].armed === false) {
                    game[game_id].players[target_team][player_id].ticks.spike_cooldown--;

                    //if this player waited long enough, rearm
                    if (game[game_id].players[target_team][player_id].ticks.spike_cooldown <= 0) {
                        game[game_id].players[target_team][player_id].ticks.spike_cooldown = 2 * 45;
                        game[game_id].players[target_team][player_id].armed = true;
                    }
                }

                //tick speedy cooldowns
                if (game[game_id].players[target_team][player_id].speedy === true) {
                    game[game_id].players[target_team][player_id].ticks.speedy_cooldown--;

                    if (game[game_id].players[target_team][player_id].ticks.speedy_cooldown <= 0) {
                        game[game_id].players[target_team][player_id].ticks.speedy_cooldown = 2 * 45;
                        game[game_id].players[target_team][player_id].speedy = false;
                        game[game_id].players[target_team][player_id].speed = game[game_id].players[target_team][player_id].speed / 2;
                    }
                }
            }
        }
    },
    //move objects and update ticks
    object_movement: function(game_id) {

        //move spikes
        for (i = 0; i < game[game_id].objects.spikes.IDs.length; i++) {
            var spike_id = game[game_id].objects.spikes.IDs[i];

            if (game[game_id].objects.spikes[spike_id].direction === "LEFT") {
                game[game_id].objects.spikes[spike_id].position.x -= game[game_id].objects.spikes[spike_id].speed;
            } else if (game[game_id].objects.spikes[spike_id].direction === "RIGHT") {
                game[game_id].objects.spikes[spike_id].position.x += game[game_id].objects.spikes[spike_id].speed;
            } else if (game[game_id].objects.spikes[spike_id].direction === "UP") {
                game[game_id].objects.spikes[spike_id].position.y -= game[game_id].objects.spikes[spike_id].speed;
            } else if (game[game_id].objects.spikes[spike_id].direction === "DOWN") {
                game[game_id].objects.spikes[spike_id].position.y += game[game_id].objects.spikes[spike_id].speed;
            }
        }

        //tick explosions and update radius
        for (i = 0; i < game[game_id].objects.explosions.length; i++) {
            game[game_id].objects.explosions[i].ticks_left--;
            game[game_id].objects.explosions[i].radius = (game[game_id].objects.explosions[i].ticks_left / 6) * base_ingame_object_size;
        }
    },
    //if players got spiked, change their status, etc etc.
    //or if players run into each other..
    collisions: function(game_id) {
        //player on map collisions
        //player on player collisions
        //player on object collisions
        //object on map collisions

        //first deal with all things player related
        //then deal with objects colliding with edge of map

        for (a = 0; a < 2; a++) {

            var target_team;
            var other_team;
            if (a == 0) {
                target_team = "BLUE";
                other_team = "RED";
            } else {
                target_team = "RED";
                other_team = "BLUE";
            }

            for (i = 0; i < game[game_id].players[target_team].IDs.length; i++) {
                var player_id = game[game_id].players[target_team].IDs[i];
                var player = game[game_id].players[target_team][player_id];

                //only bother with collision for this player if this player is alive
                if (player.alive) {

                    /*
                        PLAYER ON MAP COLLISIONS
                    */

                    if (player.position.x - player.radius < 0) {
                        game[game_id].players[target_team][player_id].position.x = 0 + player.radius;
                    }
                    if (player.position.x + player.radius > game[game_id].map.width) {
                        game[game_id].players[target_team][player_id].position.x = game[game_id].map.width - player.radius;
                    }
                    if (player.position.y - player.radius < 0) {
                        game[game_id].players[target_team][player_id].position.y = 0 + player.radius;
                    }
                    if (player.position.y + player.radius > game[game_id].map.height) {
                        game[game_id].players[target_team][player_id].position.y = game[game_id].map.height - player.radius;
                    }

                    /*
                        PLAYER ON PLAYER COLLISIONS
                    */

                    var i2 = 0;
                    var list_of_collision_responses = [];

                    while (i2 < game[game_id].players[other_team].IDs.length) {

                        var player_on_player_collision_detected = false;

                        var other_player_id = game[game_id].players[other_team].IDs[i2];
                        var other_player = game[game_id].players[other_team][other_player_id];

                        if (player.position.x >= other_player.position.x - other_player.radius - player.radius &&
                            player.position.x <= other_player.position.x + other_player.radius + player.radius &&
                            player.position.y >= other_player.position.y - other_player.radius - player.radius &&
                            player.position.y <= other_player.position.y + other_player.radius + player.radius) {
                            //collision with a player detected
                            player_on_player_collision_detected = true;
                        }

                        if (player_on_player_collision_detected) {

                            var collision_response = {
                                game_id: game_id,
                                target_team: target_team,
                                player_id: player_id,
                                axis: null,
                                change: null
                            };

                            //find where the other player is (above, below...)
                            //ex. if this player is going right, and the other player is not in front, don't push
                            var positional_difference = {
                                x: player.position.x - other_player.position.x,
                                y: player.position.y - other_player.position.y
                            };

                            var other_player_is_right = Boolean(positional_difference.x < 0 && Math.abs(positional_difference.x) > Math.abs(positional_difference.y));
                            var other_player_is_left = Boolean(positional_difference.x > 0 && Math.abs(positional_difference.x) > Math.abs(positional_difference.y));
                            var other_player_is_below = Boolean(positional_difference.y < 0 && Math.abs(positional_difference.y) > Math.abs(positional_difference.x));
                            var other_player_is_above = Boolean(positional_difference.y > 0 && Math.abs(positional_difference.y) > Math.abs(positional_difference.x));

                            if (player.direction === "LEFT") {
                                if (other_player_is_left) {
                                    if (other_player.direction === "RIGHT") {
                                        //push this player back according to other player's movement
                                        collision_response.axis = "x";
                                        collision_response.change = other_player.speed;
                                    } else if (other_player.direction === "LEFT") {
                                        //cancel this player's move
                                        collision_response.axis = "x";
                                        collision_response.change = player.speed;
                                    }
                                }
                                /*
                                else if (other_player_is_right) {
                                    if (other_player.direction === "LEFT"){
                                        //cancel this player's move
                                        collision_response.axis = "x";
                                        collision_response.change = player.speed;
                                    }
                                }
                                */
                                else if (other_player_is_above) {
                                    if (other_player.direction === "DOWN") {
                                        //push this player down
                                        collision_response.axis = "y";
                                        collision_response.change = other_player.speed;
                                    }
                                } else if (other_player_is_below) {
                                    if (other_player.direction === "UP") {
                                        //push this player up
                                        collision_response.axis = "y";
                                        collision_response.change = -1 * other_player.speed;
                                    }
                                }
                            } else if (player.direction === "RIGHT") {
                                if (other_player_is_right) {
                                    if (other_player.direction === "LEFT") {
                                        //push this player back according to other player's movement
                                        collision_response.axis = "x";
                                        collision_response.change = -1 * other_player.speed;
                                    } else if (other_player.direction === "RIGHT") {
                                        //cancel this player's move
                                        collision_response.axis = "x";
                                        collision_response.change = -1 * player.speed;
                                    }
                                }
                                /*
                                else if (other_player_is_left){
                                    if (other_player.direction === "RIGHT"){
                                        //cancel this player's move
                                        collision_response.axis = "x";
                                        collision_response.change = -1 * player.speed;
                                    }
                                }
                                */
                                else if (other_player_is_above) {
                                    if (other_player.direction === "DOWN") {
                                        //push this player down
                                        collision_response.axis = "y";
                                        collision_response.change = other_player.speed;
                                    }
                                } else if (other_player_is_below) {
                                    if (other_player.direction === "UP") {
                                        //push this player up
                                        collision_response.axis = "y";
                                        collision_response.change = -1 * other_player.speed;
                                    }
                                }
                            } else if (player.direction === "UP") {
                                if (other_player_is_above) {
                                    if (other_player.direction === "DOWN") {
                                        //push this player back according to other player's movement
                                        collision_response.axis = "y";
                                        collision_response.change = other_player.speed;
                                    } else if (other_player.direction === "UP") {
                                        //cancel this player's move
                                        collision_response.axis = "y";
                                        collision_response.change = player.speed;
                                    }
                                }
                                /*
                                else if (other_player_is_below && other_player.direction === "UP"){
                                    //cancel this player's move
                                    collision_response.axis = "y";
                                    collision_response.change = player.speed;
                                }
                                */
                                else if (other_player_is_left) {
                                    if (other_player.direction === "RIGHT") {
                                        //push this player right
                                        collision_response.axis = "x";
                                        collision_response.change = other_player.speed;
                                    }
                                } else if (other_player_is_right) {
                                    if (other_player.direction === "LEFT") {
                                        //push this player left
                                        collision_response.axis = "x";
                                        collision_response.change = -1 * other_player.speed;
                                    }
                                }
                            } else if (player.direction === "DOWN") {
                                if (other_player_is_below) {
                                    if (other_player.direction === "UP") {
                                        //push this player back according to other player's movement
                                        collision_response.axis = "y";
                                        collision_response.change = -1 * other_player.speed;
                                    } else if (other_player.direction === "DOWN") {
                                        //cancel this player's move
                                        collision_response.axis = "y";
                                        collision_response.change = -1 * player.speed;
                                    }
                                }
                                /*
                                else if (other_player_is_above && other_player.direction === "DOWN"){
                                    //cancel this player's move
                                    collision_response.axis = "y";
                                    collision_response.change = -1 * player.speed;
                                }
                                */
                                else if (other_player_is_left) {
                                    if (other_player.direction === "RIGHT") {
                                        //push this player right
                                        collision_response.axis = "x";
                                        collision_response.change = other_player.speed;
                                    }
                                } else if (other_player_is_right) {
                                    if (other_player.direction === "LEFT") {
                                        //push this player left
                                        collision_response.axis = "x";
                                        collision_response.change = -1 * other_player.speed;
                                    }
                                }
                            }

                            list_of_collision_responses.push(collision_response);
                        }

                        i2++;
                    }

                    //now actually undo movements from collisions (FAIRLY)
                    for (let col_index of list_of_collision_responses) {
                        game[col_index.game_id].players[col_index.target_team][col_index.player_id].position[col_index.axis] += col_index.change;
                    }


                    /*
                        PLAYER ON SPIKE COLLISIONS
                    */

                    for (index = 0; index < game[game_id].objects.spikes.IDs.length; index++) {
                        var spike_id = game[game_id].objects.spikes.IDs[index];

                        var spike = game[game_id].objects.spikes[spike_id];

                        if (player.position.x >= spike.position.x - spike.radius - player.radius &&
                            player.position.x <= spike.position.x + spike.radius + player.radius &&
                            player.position.y >= spike.position.y - spike.radius - player.radius &&
                            player.position.y <= spike.position.y + spike.radius + player.radius) {

                            var player_in_their_base = Boolean(
                                player.position.x >= game[game_id].map.bases[target_team].x1 &&
                                player.position.x <= game[game_id].map.bases[target_team].x2 &&
                                player.position.y >= game[game_id].map.bases[target_team].y1 &&
                                player.position.y <= game[game_id].map.bases[target_team].y2);

                            if (player_in_their_base === false) {
                                //mark spike for deletion and mark player as dead and create a new explosion
                                game[game_id].players[target_team][player_id].alive = false;
                                game[game_id].objects.spikes[spike_id].destroyed = true;
                                create.new_explosion(game_id, game[game_id].players[target_team][player_id].position);
                            }
                        }
                    }
                }
            }
        }

        /*
            OBJECT ON MAP COLLISIONS
        */

        for (i = 0; i < game[game_id].objects.spikes.IDs.length; i++) {
            var spike_id = game[game_id].objects.spikes.IDs[i];

            var spike = game[game_id].objects.spikes[spike_id];

            //only bother with collision for this spike if this spike wasn't destroyed
            if (spike.destroyed === false) {

                var bases = game[game_id].map.bases;
                var too_many = 50;

                //kill spikes that enter bases
                if ((spike.position.x >= bases.BLUE.x1 && spike.position.x <= bases.BLUE.x2 && spike.position.y >= bases.BLUE.y1 && spike.position.y <= bases.BLUE.y2) ||
                    (spike.position.x >= bases.RED.x1 && spike.position.x <= bases.RED.x2 && spike.position.y >= bases.RED.y1 && spike.position.y <= bases.RED.y2)) {
                    spike.destroyed = true;
                }
                //bounce back spikes from edge of map
                //or destroy them if there are just plain "too many" spikes around
                else if (spike.direction === "LEFT" && spike.position.x <= 0) {
                    if (game[game_id].objects.spikes.IDs.length > too_many) {
                        spike.destroyed = true;
                    } else {
                        spike.direction = "RIGHT";
                    }
                } else if (spike.direction === "RIGHT" && spike.position.x >= game[game_id].map.width) {
                    if (game[game_id].objects.spikes.IDs.length > too_many) {
                        spike.destroyed = true;
                    } else {
                        spike.direction = "LEFT";
                    }
                } else if (spike.direction === "UP" && spike.position.y <= 0) {
                    if (game[game_id].objects.spikes.IDs.length > too_many) {
                        spike.destroyed = true;
                    } else {
                        spike.direction = "DOWN";
                    }
                } else if (spike.direction === "DOWN" && spike.position.y >= game[game_id].map.height) {
                    if (game[game_id].objects.spikes.IDs.length > too_many) {
                        spike.destroyed = true;
                    } else {
                        spike.direction = "UP";
                    }
                }
            }
        }
    },
    capture_timers: function(game_id) {
        //go through all games
        for (i = 0; i < game.IDs.length; i++) {

            var game_id = game.IDs[i];

            //count how many players on each team are capturing
            var capturers = {
                BLUE: 0,
                RED: 0
            };

            //go through both teams
            for (a = 0; a < 2; a++) {

                var target_team;
                if (a == 0) {
                    target_team = "BLUE";
                } else {
                    target_team = "RED";
                }

                //go through team roster
                for (i2 = 0; i2 < game[game_id].players[target_team].IDs.length; i2++) {
                    //get player id
                    var player_id = game[game_id].players[target_team].IDs[i2];
                    var player = game[game_id].players[target_team][player_id];
                    //get goal area
                    var goal_area = game[game_id].map.goal_area;
                    //if within goal area, count as capturer
                    if (player.position.x >= goal_area.x1 && player.position.x <= goal_area.x2 && player.position.y >= goal_area.y1 && player.position.y <= goal_area.y2 && player.alive) {
                        capturers[target_team]++;
                    }
                }
            }

            //done counting capturers

            //update timer of team with more capturers

            if (capturers.BLUE > capturers.RED) {
                game[game_id].timers.BLUE.ticks--;

                if (game[game_id].timers.BLUE.ticks === 0) {
                    //the more occupiers means quicker capping
                    var difference = capturers.BLUE - capturers.RED;

                    game[game_id].timers.BLUE.seconds = game[game_id].timers.BLUE.seconds - difference;
                    game[game_id].timers.BLUE.ticks = 45;
                }
            } else if (capturers.RED > capturers.BLUE) {
                game[game_id].timers.RED.ticks--;

                if (game[game_id].timers.RED.ticks === 0) {
                    //the more occupiers means quicker capping
                    var difference = capturers.RED - capturers.BLUE;

                    game[game_id].timers.RED.seconds = game[game_id].timers.RED.seconds - difference;
                    game[game_id].timers.RED.ticks = 45;
                }
            }

            if (game[game_id].timers.BLUE.seconds <= 0 || game[game_id].timers.RED.seconds <= 0) {
                console.log('ENDING GAME because somebody beat the timer');
                update_game.status(game_id, "ENDED");
            }
        }
    },
    status: function(game_id, new_status) {
        if (game[game_id]) {
            game[game_id].status = new_status;
        } else {
            console.log('Game status cannot be updated because game does not exist');
        }
    },
    //add 15 seconds to a team's victory condition timer
    add_seconds_to_a_teams_timer: function(game_id, team) {
        if (game[game_id]) {
            game[game_id].timers[team].seconds += 20;
        } else {
            console.log('Game timer cannot be updated because game does not exist');
        }
    },
    process_AI_actions: function(game_id) {
        try {
            AI_decision_making.decision_spacer--;
            if (AI_decision_making.decision_spacer <= 0) {
                AI_decision_making.decision_spacer = 20; // reset

                var AI_players = get_game.AI_players(game_id);

                var target_team = null;

                for (a = 0; a < 2; a++) {
                    if (a == 0) {
                        target_team = "BLUE";
                    } else if (a == 1) {
                        target_team = "RED";
                    }

                    for (i = 0; i < AI_players[target_team].length; i++) {
                        if (AI_players[target_team][i].alive) { // only bother if this AI player is alive
                            var AI_player_id = AI_players[target_team][i].id;
                            var objects = game[game_id].objects;
                            var players = game[game_id].players;
                            var goal_area = game[game_id].map.goal_area;
                            var AI_player_action = AI_decision_making.determine_AI_action(AI_players[target_team][i], objects, players, goal_area);
                            if (AI_player_action) {
                                /*
                                    var player_action = {
                                        game_id: aaa,
                                        player_id: aaa, //actually socket_id
                                        player_team: aaa, //"BLUE", "RED"
                                        action_type: aaa, //"CHANGE_DIRECTION", "CREATE_SPIKE", "MAKE_SPEEDY"
                                        action_object: {}
                                    };
                                    
                                    //CHANGE DIRECTION/MAKE SPEEDY action object
                                    {
                                        direction: "aaa" // "UP", "DOWN", "LEFT", "RIGHT"
                                    }
                                    
                                    //CREATE SPIKE action object
                                    {
                                        player: {
                                            direction: "aaa", // "UP", "DOWN", "LEFT", "RIGHT"
                                        }
                                        spike: {
                                            direction: "aaa" // "UP", "DOWN", "LEFT", "RIGHT"
                                        }
                                    }
                                */

                                if (AI_player_action.action_type === "CREATE_SPIKE") {
                                    create.new_spike(AI_player_action);
                                } else if (AI_player_action.action_type === "MAKE_SPEEDY") {
                                    if (AI_player_action.action_object.direction === "UP" || AI_player_action.action_object.direction === "DOWN" || AI_player_action.action_object.direction === "LEFT" || AI_player_action.action_object.direction === "RIGHT") {
                                        game[game_id].players[target_team][AI_player_id].direction = AI_player_action.action_object.direction;
                                        make_player_speedy(AI_player_action);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
};

var AI_decision_making = {
    decision_spacer: 15, //this "ticks down" and once it reaches 0, THEN these functions can execute so AI aren't so damn twitchy
    determine_AI_action: function(AI_player, objects, players, goal_area) {
        try {
            /* 
                AI concerns
                    Avoid objects
                    KO opposing players
                    Occupy goal area
            */

            var AI_player_action = null;
            var i = 0;

            while (AI_player_action === null && i < 3) {

                if (i == 0) {
                    AI_player_action = this.consider_nearby_objects(AI_player, objects);
                } else if (i == 1) {
                    AI_player_action = this.consider_nearby_opponents(AI_player, players);
                } else if (i == 2) {
                    AI_player_action = this.consider_goal(AI_player, goal_area);
                }

                i++;
            }

            return AI_player_action;

        } catch (error) {
            console.log(error);
        }
    },
    consider_nearby_objects: function(AI_player, game_objects) {

        try {

            var AI_player_action = null;

            var pythagoras_spikes_array = []; // will contain spike objects with modified to account for proximity to this AI player
            var detection_range = 1000; // look for spikes with pythagorean theorem results below this value

            for (i = 0; i < game_objects.spikes.IDs.length; i++) {
                var spike_id = game_objects.spikes.IDs[i];
                var pythagoras_spike = this.get_pythagoras(AI_player, game_objects.spikes[spike_id]);
                if (pythagoras_spike.pythagoras < detection_range) {
                    pythagoras_spikes_array.push(pythagoras_spike);
                }
            }

            //sort by closest to furthest
            pythagoras_spikes_array.sort(function(a, b) {
                return a.pythagoras - b.pythagoras;
            });

            //look for spikes along the "axis" of this AI player
            //they may be near but not in line to collide with

            var i = 0;
            var found = false;

            while (i < pythagoras_spikes_array.length && found === false) {

                var spike = pythagoras_spikes_array[i];

                if (spike.speed > 0) {
                    if (Math.abs(AI_player.position.x - spike.position.x) < 50) {
                        if (spike.position.y < AI_player.position.y && spike.direction === "DOWN") {
                            AI_player_action = {
                                game_id: AI_player.game_id,
                                player_id: AI_player.id,
                                player_team: AI_player.team,
                                action_type: "MAKE_SPEEDY",
                                action_object: {
                                    direction: this.determine_lateral_direction("DOWN")
                                }
                            };
                            found = true;
                        } else if (spike.position.y > AI_player.position.y && spike.direction === "UP") {
                            AI_player_action = {
                                game_id: AI_player.game_id,
                                player_id: AI_player.id,
                                player_team: AI_player.team,
                                action_type: "MAKE_SPEEDY",
                                action_object: {
                                    direction: this.determine_lateral_direction("UP")
                                }
                            };
                            found = true;
                        }
                    } else if (Math.abs(AI_player.position.y - spike.position.y) < 50) {
                        if (spike.position.x < AI_player.position.x && spike.direction === "RIGHT") {
                            AI_player_action = {
                                game_id: AI_player.game_id,
                                player_id: AI_player.id,
                                player_team: AI_player.team,
                                action_type: "MAKE_SPEEDY",
                                action_object: {
                                    direction: this.determine_lateral_direction("RIGHT")
                                }
                            };
                            found = true;
                        } else if (spike.position.x > AI_player.position.x && spike.direction === "LEFT") {
                            AI_player_action = {
                                game_id: AI_player.game_id,
                                player_id: AI_player.id,
                                player_team: AI_player.team,
                                action_type: "MAKE_SPEEDY",
                                action_object: {
                                    direction: this.determine_lateral_direction("LEFT")
                                }
                            };
                            found = true;
                        }
                    }
                }

                i++;
            }

            return AI_player_action;

        } catch (error) {
            console.log(error);
        }
    },
    consider_nearby_opponents: function(AI_player, all_players) {
        try {

            //the AI will always fire off a spike if it can
            //only question is whether there is a "valid" target to aim for or just fire aimlessly

            var AI_player_action = null;

            if (AI_player.armed) { //don't bother if not armed
                var opposing_players = []; // will contain player objects with modified to account for proximity to this AI player
                var detection_range = 1000; // look for players with pythagorean theorem results below this value
                var target_team = null; // look to firing spikes at the opposing team

                if (AI_player.team === "RED") {
                    target_team = "BLUE";
                } else if (AI_player.team === "BLUE") {
                    target_team = "RED";
                }

                //go through opposing team and calculate pythagoras
                for (i = 0; i < all_players[target_team].IDs.length; i++) {
                    var player_id = all_players[target_team].IDs[i];
                    var other_player = this.get_pythagoras(AI_player, all_players[target_team][player_id]);
                    if (other_player.pythagoras < detection_range) {
                        opposing_players.push(other_player);
                    }
                }

                //sort by closest to furthest
                opposing_players.sort(function(a, b) {
                    return a.pythagoras - b.pythagoras;
                });

                var i = 0;
                var found = false;

                while (i < opposing_players.length && found === false) {

                    var other_player = opposing_players[i];

                    if (other_player.alive) {
                        if (Math.abs(AI_player.position.x - other_player.position.x) < 50) {
                            if (other_player.position.y < AI_player.position.y) {
                                AI_player_action = {
                                    game_id: AI_player.game_id,
                                    player_id: AI_player.id,
                                    player_team: AI_player.team,
                                    action_type: "CREATE_SPIKE",
                                    action_object: {
                                        player: {
                                            direction: AI_player.direction
                                        },
                                        spike: {
                                            direction: "UP"
                                        }
                                    }
                                };
                                found = true;
                            } else if (other_player.position.y > AI_player.position.y) {
                                AI_player_action = {
                                    game_id: AI_player.game_id,
                                    player_id: AI_player.id,
                                    player_team: AI_player.team,
                                    action_type: "CREATE_SPIKE",
                                    action_object: {
                                        player: {
                                            direction: AI_player.direction
                                        },
                                        spike: {
                                            direction: "DOWN"
                                        }
                                    }
                                };
                                found = true;
                            }
                        } else if (Math.abs(AI_player.position.y - other_player.position.y) < 50) {
                            if (other_player.position.x < AI_player.position.x) {
                                AI_player_action = {
                                    game_id: AI_player.game_id,
                                    player_id: AI_player.id,
                                    player_team: AI_player.team,
                                    action_type: "CREATE_SPIKE",
                                    action_object: {
                                        player: {
                                            direction: AI_player.direction
                                        },
                                        spike: {
                                            direction: "LEFT"
                                        }
                                    }
                                };
                                found = true;
                            } else if (other_player.position.x > AI_player.position.x) {
                                AI_player_action = {
                                    game_id: AI_player.game_id,
                                    player_id: AI_player.id,
                                    player_team: AI_player.team,
                                    action_type: "CREATE_SPIKE",
                                    action_object: {
                                        player: {
                                            direction: AI_player.direction
                                        },
                                        spike: {
                                            direction: "RIGHT"
                                        }
                                    }
                                };
                                found = true;
                            }
                        }
                    }
                    i++;
                }
            }

            return AI_player_action;

        } catch (error) {
            console.log(error);
        }

    },
    consider_goal: function(AI_player, goal_area) {
        try {

            var AI_player_action = {
                game_id: AI_player.game_id,
                player_id: AI_player.id,
                player_team: AI_player.team,
                action_type: "MAKE_SPEEDY",
                action_object: {
                    direction: null
                }
            };

            var goal_space = {
                x: Math.abs(goal_area.x1 - goal_area.x2),
                y: Math.abs(goal_area.y1 - goal_area.y2)
            }

            var generate_random_point_in_goal = {
                x: goal_area.x1 + (Math.random() * goal_space.x),
                y: goal_area.y1 + (Math.random() * goal_space.y)
            }

            var abs_difference = {
                x: Math.abs(AI_player.position.x - generate_random_point_in_goal.x),
                y: Math.abs(AI_player.position.y - generate_random_point_in_goal.y)
            }

            if (abs_difference.x > abs_difference.y) {
                if (AI_player.position.x < generate_random_point_in_goal.x) {
                    AI_player_action.action_object.direction = "RIGHT";
                } else if (AI_player.position.x > generate_random_point_in_goal.x) {
                    AI_player_action.action_object.direction = "LEFT";
                }
            } else if (abs_difference.x < abs_difference.y) {
                if (AI_player.position.y < generate_random_point_in_goal.y) {
                    AI_player_action.action_object.direction = "DOWN";
                } else if (AI_player.position.y > generate_random_point_in_goal.y) {
                    AI_player_action.action_object.direction = "UP";
                }
            } else {
                var random = Math.round(Math.random());

                if (random == 0) {
                    random = Math.round(Math.random());

                    if (random == 0) {
                        AI_player_action.action_object.direction = "RIGHT";
                    } else if (random == 1) {
                        AI_player_action.action_object.direction = "LEFT";
                    }
                } else if (random == 1) {
                    random = Math.round(Math.random());

                    if (random == 0) {
                        AI_player_action.action_object.direction = "DOWN";
                    } else if (random == 1) {
                        AI_player_action.action_object.direction = "UP";
                    }
                }
            }

            return AI_player_action;

        } catch (error) {
            console.log(error);
        }
    },
    get_pythagoras: function(AI_player, object) {
        try {
            var dummy_object = {
                position: {
                    x: object.position.x,
                    y: object.position.y
                },
                direction: object.direction,
                speed: object.speed
            };

            if (object.alive) {
                dummy_object.alive = object.alive;
            }

            var difference = {
                x: dummy_object.position.x - AI_player.position.x,
                y: dummy_object.position.y - AI_player.position.y
            };

            dummy_object.pythagoras = Math.sqrt((difference.x * difference.x) + (difference.y * difference.y));

            return dummy_object;

        } catch (error) {
            console.log(error);
        }
    },
    //pick a direction perpendicular to the received one
    determine_lateral_direction: function(direction) {
        try {

            var random = Math.round(Math.random());

            if (direction === "RIGHT") {
                if (random == 0) {
                    return "UP";
                } else if (random == 1) {
                    return "DOWN";
                }
            } else if (direction === "LEFT") {
                if (random == 0) {
                    return "UP";
                } else if (random == 1) {
                    return "DOWN";
                }
            } else if (direction === "UP") {
                if (random == 0) {
                    return "LEFT";
                } else if (random == 1) {
                    return "RIGHT";
                }
            } else if (direction === "DOWN") {
                if (random == 0) {
                    return "LEFT";
                } else if (random == 1) {
                    return "RIGHT";
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
};

//handle broadcasts to all players across all games
var broadcast = {
    start: function() {
        var times_per_second = 2 * 45;
        game_server.operation_interval = setInterval(function() {
            game_server.operation();
        }, 1000 / times_per_second);
    },
    end: function() {
        clearInterval(game_server.operation_interval);
        //destroy all games for good measure
        for (i = 0; i < game.IDs.length; i++) {
            var game_id = game.IDs[i];
            remove.game(game_id);
        }
        //reset server status flags
        game_server.operation_status = "UPDATING";
        game_server.busy = false;
    },
    all_games: function() {

        try {
            //console.log("Broadcast STARTING");

            //broadcast game data to their respective players
            //though do it if there are only enough players for this game to be played
            //also take into account game status

            var peek_game_chosen = false;

            for (i = 0; i < game.IDs.length; i++) {

                //console.log("Broadcasting game", i);

                var game_id = game.IDs[i];
                var population = get_game.human_players(game_id); //returns an object { total: #, BLUE: [], RED: []}
                var this_games_status = get_game.status(game_id); //returns string
                var game_data = get_game.data(game_id);

                var there_are_players_in_game = Boolean(population.total > 0);

                if (there_are_players_in_game) {
                    if (this_games_status === "IN-PROGRESS") {
                        //send data to players
                        io.to(game_id).emit('game_data', game_data);

                        //send something for new arrivals to see
                        if (peek_game_chosen === false && i === game.IDs.length - 1) {
                            peek_game_chosen = true;
                            io.to('sneakPeek').emit('game_data', game_data);
                        }
                    }
                    //the game ended with enough players to play - means a team completed the requirement for winning
                    else if (this_games_status === "ENDED") {
                        //legit victory
                        io.to(game_id).emit('GAME_COMPLETED', game_data);
                        //console.log("This game ended in victory and players were made aware");
                    }
                } else if (population.total <= 0) {
                    //console.log("Removing empty game");
                    remove.game(game_id);
                }
            }

            //broadcasts are done, set flag to updating
            game_server.operation_status = "UPDATING";

            //console.log("Broadcast ENDED");
        } catch (error) {
            console.log(error);
        }
    }
};

//functions for removing stuff
var remove = {
    game: function(game_id) {
        try {
            if (game[game_id]) {
                var found = false;
                var i = 0;
                while (found === false && i < game.IDs.length) {
                    if (game.IDs[i] === game_id) {
                        delete game[game_id];
                        game.IDs.splice(i, 1);
                        console.log('Game destroyed');
                    }
                    i++;
                }
            } else {
                console.log('No game by that id to destroy...');
            }
        } catch (error) {
            console.log(error);
        }
    },
    //given AI player(s), remove one from their game
    AI_player_from_game(AI_players) {
        try {
            var target_team = null;

            if (AI_players.BLUE.length > 0) {
                target_team = "BLUE";
            } else if (AI_players.RED.length > 0) {
                target_team = "RED";
            }

            if (target_team) {
                var game_id = AI_players[target_team][0].game_id;
                var AI_player_id = AI_players[target_team][0].id;
                var team = AI_players[target_team][0].team;

                this.player_from_team(game_id, AI_player_id, team);
            }
        } catch (error) {
            console.log(error);
        }
    },
    player_from_team: function(game_id, player_id, team) {
        var found = false;
        var index = 0;

        try {
            //delete player property from team object
            delete game[game_id].players[team][player_id];
            //find and splice out this player's id from id array
            while (index < game[game_id].players[team].IDs.length && found === false) {
                if (player_id === game[game_id].players[team].IDs[index]) {
                    game[game_id].players[team].IDs.splice(index, 1);
                    found = true;
                }
                index++;
            }

            //reorganize team
            game[game_id].players[team] = reorganize_team(get_game.team_players(game_id, team));
        } catch (error) {
            console.log(error);
        }
    },
    socket_id_pair: function(socket_id) {
        //id_pair has an array of socket ids as well a property pertaining to that id that holds this player's game's id (what a mouthful)
        //remove both
        try {
            delete id_pair[socket_id];
            var found = false;
            var i = 0;
            while (i < id_pair.socket_ids.length && found === false) {
                if (id_pair.socket_ids[i] === socket_id) {
                    id_pair.socket_ids.splice(i, 1);
                    found = true;
                }
                i++;
            }
        } catch (error) {
            console.log(error);
        }
    },
    //someone disconnected
    //remove from game, reorganize their team, if they were in a game
    human_leaver: function(socket_id) {
        try {
            //check if this person was in a game with the id_pair object (THE PAY OFF OF ITS EXISTENCE)
            //if found in game, remove from game first
            //if not, do nothing
            //THEN remove this socket from id_pair

            if (id_pair[socket_id]) {

                console.log("Removing person from server");

                //if this person leaving was NOT a player in a game..
                if (id_pair[socket_id].game_id === "NONE") {
                    console.log('Person that left was not in a game. No hard feelings.');
                    //the actual removal is at the end of this function, remove.socket_id_pair(socket_id);
                }
                //if this person leaving was a player in a game..
                else if (id_pair[socket_id].game_id !== "NONE" && game[id_pair[socket_id].game_id]) {

                    console.log('Person that left was in a game. Working on it...');

                    //direct to game id thanks to socket id / game id relationship
                    var game_id = id_pair[socket_id].game_id;

                    //it is possible that this was the last player in the game
                    //kill the game if so, otherwise go on

                    var human_players_left = get_game.human_players(game_id);

                    if (human_players_left.total <= 1) {
                        //well there you have it, the last player left, just kill that game entirely
                        this.game(game_id);
                    } else {

                        //there are more players in this game
                        //add AI to fill uneven gaps if necessary

                        //remove player from either red or blue team
                        var target_team = null;

                        if (game[game_id].players.BLUE[socket_id]) {
                            target_team = "BLUE";
                        } else if (game[game_id].players.RED[socket_id]) {
                            target_team = "RED";
                        }

                        if (target_team) {
                            //remove player from team
                            this.player_from_team(game_id, socket_id, target_team);
                        }

                        //now that a player was removed, find out how many people/AI are still playing
                        var population = get_game.population(game_id);

                        //if teams are uneven, fill the gap with AI
                        if (population.BLUE != population.RED) {

                            console.log("Uneven teams. AI substitutes required...");
                            var gap = Math.abs(population.BLUE - population.RED);
                            console.log("Gap is ", gap, " players");

                            for (i = 0; i < gap; i++) {
                                create.new_AI_player(game_id, "RANDOM/FILL", "SUBSTITUTION");
                            }
                        }
                    }
                }

                //remove socket id / game id relationship
                this.socket_id_pair(socket_id);
            }

            //if there are no games, stop broadcasting to no one
            if (game.IDs.length == 0) {
                broadcast.end();
            }
        } catch (error) {
            console.log(error);
        }
    }
};