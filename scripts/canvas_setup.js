
//create canvas functions (resize, clear, redraw, etc)

/*			
	HEX COLORS 
	#0000FF = blue
	#FF0000 = red
	#FFFF00 = yellow
	#000066 = darker blue
	#660000 = darker red
	#808080 = gray
	#FFFFFF = white
	#000000 = black
*/


var canvas = document.getElementById("myCanvas");
//set sizes manually because default behavior is screwy and messes with resolution
var ctx = canvas.getContext("2d");
canvas_resize();

//to refresh canvas
function canvas_clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//used to keep the canvas filling the page when the browser resizes
function canvas_resize() {
    //note to self, notice this is not css styling
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas_redraw();
}

//if drawing canvas for a player, offset view based on this player's location
//otherwise focus on the middle of the map
function determine_view() {
    //if player
    if (game_data && this_player) {
        this_players_view = {
            x: this_player.position.x - canvas.width / 2,
            y: this_player.position.y - canvas.height / 2
        };
    }
    //if spectator
    else if (game_data && this_player === null) {

        var goal_area_center = {
            x: (game_data.map.goal_area.x1 + game_data.map.goal_area.x2) / 2,
            y: (game_data.map.goal_area.y1 + game_data.map.goal_area.y2) / 2
        };

        this_players_view = {
            x: goal_area_center.x - canvas.width / 2,
            y: goal_area_center.y - canvas.height / 2
        };
    } else {
        console.log("No view could be determined");
    }
}

//redraw everything displayed in game.. background, areas, objects, players
function canvas_redraw() {
    determine_view();
    canvas_clear();
    if (game_data && game_data.status === "IN-PROGRESS" && game_data.map && loaded_all_resources) {
        draw_map();
        draw_objects();
        draw_players();
        draw_explosions();
        draw_pointers();
        draw_game_events();
        draw_time_left();
    }
}

function draw_map() {
    //DRAW MAP BACKGROUND
    var bg_x = -1 * this_players_view.x;
    var bg_y = -1 * this_players_view.y;
    ctx.drawImage(game_images.background, bg_x, bg_y, game_data.map.width, game_data.map.height); //backdrop for the whole map

    //DRAW BASES
    //get base sizes (they are both size identical)
    var base_size = {
        width: game_data.map.bases.BLUE.x2 - game_data.map.bases.BLUE.x1,
        height: game_data.map.bases.BLUE.y2 - game_data.map.bases.BLUE.y1,
        border: 40
    };

    //BLUE BASE
    var blue_base = {
        x: game_data.map.bases.BLUE.x1 - this_players_view.x,
        y: game_data.map.bases.BLUE.y1 - this_players_view.y
    };

    ctx.fillStyle = "#0088FF";
    ctx.fillRect(blue_base.x, blue_base.y, base_size.width, base_size.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(blue_base.x + base_size.border, blue_base.y + base_size.border, base_size.width - base_size.border * 2, base_size.height - base_size.border * 2);

    //RED BASE
    var red_base = {
        x: game_data.map.bases.RED.x1 - this_players_view.x,
        y: game_data.map.bases.RED.y1 - this_players_view.y
    };

    ctx.fillStyle = "#C12B2B";
    ctx.fillRect(red_base.x, red_base.y, base_size.width, base_size.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(red_base.x + base_size.border, red_base.y + base_size.border, base_size.width - base_size.border * 2, base_size.height - base_size.border * 2);

    //GOAL AREA
    var goal_area = {
        x: game_data.map.goal_area.x1 - this_players_view.x,
        y: game_data.map.goal_area.y1 - this_players_view.y
    };

    //choosing a color to display the goal area
    //picking between a gradient and the color yellow
    var gradient = ctx.createRadialGradient(goal_area.x + base_size.width / 2, goal_area.y + base_size.height / 2, 0, goal_area.x + base_size.width / 2, goal_area.y + base_size.height / 2, 360);

    if (game_data.contestants.BLUE.length > 0 && game_data.contestants.BLUE.length > game_data.contestants.RED.length) {

        var gradient_stop = (game_data.players.BLUE.IDs.length * 20 - game_data.timers.BLUE.seconds) / (game_data.players.BLUE.IDs.length * 20);

        gradient.addColorStop(gradient_stop, "#0088FF");
        gradient.addColorStop(1, "yellow");

        ctx.fillStyle = gradient;
    } else if (game_data.contestants.RED.length > 0 && game_data.contestants.RED.length > game_data.contestants.BLUE.length) {

        var gradient_stop = (game_data.players.RED.IDs.length * 20 - game_data.timers.RED.seconds) / (game_data.players.RED.IDs.length * 20);

        gradient.addColorStop(gradient_stop, "#C12B2B");
        gradient.addColorStop(1, "yellow");

        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = "#FFFF00";
    }

    ctx.fillRect(goal_area.x, goal_area.y, base_size.width, base_size.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(goal_area.x + base_size.border, goal_area.y + base_size.border, base_size.width - base_size.border * 2, base_size.height - base_size.border * 2);
}

function draw_objects() {
    //draw spikes
    if (game_data.objects.spikes && game_data.objects.spikes.IDs.length > 0) {
        for (i = 0; i < game_data.objects.spikes.IDs.length; i++) {
            var spike_id = game_data.objects.spikes.IDs[i];

            var spike = game_data.objects.spikes[spike_id];

            var spike_location = {
                x: spike.position.x - this_players_view.x - spike.radius,
                y: spike.position.y - this_players_view.y - spike.radius
            };

            var spike_image = game_images.spike;

            if (spike.destroyed === false) {
                ctx.drawImage(spike_image, spike_location.x, spike_location.y, spike.radius * 2, spike.radius * 2);

                if (spike.speed === 20) {
                    draw_speedy_trails(2 * spike.radius / 3, spike.direction, spike_location);
                }
            }
        }
    }
}

function draw_players() {
    if (game_data.players) {
        for (a = 0; a < 2; a++) {
            var target_team = null;
            if (a == 0) {
                target_team = "RED";
                ctx.fillStyle = "#FF0000";
            } else if (a == 1) {
                target_team = "BLUE";
                ctx.fillStyle = "#0000FF";
            }

            for (i = 0; i < game_data.players[target_team].IDs.length; i++) {
                var player_id = game_data.players[target_team].IDs[i];
                var player = game_data.players[target_team][player_id];

                //determine where to show this player
                var player_location = {
                    x: player.position.x - this_players_view.x - player.radius,
                    y: player.position.y - this_players_view.y - player.radius
                };
                //determine what image to represent this player
                var player_image = determine_player_image(target_team, player_id);
                //player name
                var player_name = game_data.players[target_team][player_id].name;

                //'armed player' images are larger than 'unarmed player' images, that must be accounted for
                //unarmed = 50x50
                //armed = 82x82

                var armed_adjustment = 0;

                if (player.armed) {
                    armed_adjustment = (82 - 50) / 2;

                    if (player.role === "MEMBER") {
                        armed_adjustment = armed_adjustment / 2;
                    }
                }

                var image_size = player.radius * 2 + armed_adjustment * 2;

                //draw player
                ctx.drawImage(player_image, player_location.x - armed_adjustment, player_location.y - armed_adjustment, image_size, image_size);
                //draw player name
                ctx.font = "20px Arial";
                ctx.fillText(player_name, player_location.x, player_location.y + 2 * player.radius + 35);

                //draw speed trails
                if (player.speedy && player.alive) {
                    draw_speedy_trails(player.radius, player.direction, player_location);
                }
            }
        }

        var center = {
            x: canvas.width / 2 - 5,
            y: canvas.height / 2 - 5
        };
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(center.x, center.y, 10, 10);
    }
}


function draw_speedy_trails(object_radius, object_direction, object_location) {

    ctx.save();

    ctx.translate(object_location.x + object_radius, object_location.y + object_radius);

    var degrees;
    var x = object_radius + 5;
    var y = -1 * object_radius;


    if (object_direction === "RIGHT") {
        degrees = 180;
    } else if (object_direction === "DOWN") {
        degrees = 270;
    } else if (object_direction === "LEFT") {
        degrees = 0;
    } else if (object_direction === "UP") {
        degrees = 90;
    }

    ctx.rotate(degrees * Math.PI / 180);

    ctx.drawImage(game_images.speed_trail, x, y, object_radius * 2, object_radius * 2);

    ctx.restore();
}

//draw explosions over recently spiked players
function draw_explosions() {
    for (i = 0; i < game_data.objects.explosions.length; i++) {
        var explosion = game_data.objects.explosions[i];

        var explosion_image = game_images.explosion;

        console.log(explosion_image);
        console.log(typeof explosion_image);

        //determine where to show this explosion
        var draw_at = {
            x: explosion.position.x - this_players_view.x - explosion.radius,
            y: explosion.position.y - this_players_view.y - explosion.radius
        };

        ctx.drawImage(explosion_image, draw_at.x, draw_at.y, explosion.radius * 2, explosion.radius * 2);
    }
}

//point to the objective area if far away
function draw_pointers() {

    if (this_player && this_player.alive) {

        var player_position = this_player.position;
        var goal_area = game_data.map.goal_area;

        var player_is = {
            above: Boolean(player_position.y < goal_area.y1 - canvas.height / 4),
            below: Boolean(player_position.y > goal_area.y2 + canvas.height / 4),
            right: Boolean(player_position.x > goal_area.x2 + canvas.width / 4),
            left: Boolean(player_position.x < goal_area.x1 - canvas.width / 4)
        };


        if (player_is.above || player_is.below || player_is.right || player_is.left) {

            ctx.save();

            ctx.translate(canvas.width / 2, canvas.height / 2);

            var half_image_size = 25 / 2;
            var degrees;
            var x = this_player.radius * 2;
            var y = -1 * half_image_size;


            //all compound checks before simple checks
            if (player_is.right && player_is.below) {
                degrees = 180 + 45;
            } else if (player_is.right && player_is.above) {
                degrees = 180 - 45;
            } else if (player_is.left && player_is.below) {
                degrees = 0 - 45;
            } else if (player_is.left && player_is.above) {
                degrees = 0 + 45;
            } else if (player_is.right) {
                degrees = 180;
            } else if (player_is.below) {
                degrees = 270;
            } else if (player_is.left) {
                degrees = 0;
            } else if (player_is.above) {
                degrees = 90;
            }

            ctx.rotate(degrees * Math.PI / 180);

            ctx.drawImage(game_images.pointer, x, y, half_image_size * 2, half_image_size * 2);

            ctx.restore();
        }
    }
}

//player can be alive, dead, armed, unarmed...
//choose the right image
function determine_player_image(target_team, player_id) {

    var player_image = null;

    if (game_data.players[target_team][player_id].alive === true) {
        if (game_data.players[target_team][player_id].armed === true) {
            player_image = game_images.player[target_team].alive.armed;
        } else if (game_data.players[target_team][player_id].armed === false) {
            player_image = game_images.player[target_team].alive.unarmed;
        }
    } else if (game_data.players[target_team][player_id].alive === false) {
        if (game_data.players[target_team][player_id].armed === true) {
            player_image = game_images.player[target_team].dead.armed;
        } else if (game_data.players[target_team][player_id].armed === false) {
            player_image = game_images.player[target_team].dead.unarmed;
        }
    }

    return player_image;
}

function draw_game_events() {

    if (game_events.length > 0) {

        //update the duration of the messages
        //remove messages that have expired
        for (i = 0; i < game_events.length; i++) {
            game_events[i].duration = game_events[i].duration - 1; //ffs, i dont know why double minus signs dont work here

            if (game_events[i].duration <= 0) {
                game_events.splice(i, 1);
            }
        }
        //draw the messages "upward"
        for (i = game_events.length - 1; i > -1; i--) {
            if (game_events[i].team === "BLUE") {
                ctx.fillStyle = "#000066";
            } else if (game_events[i].team === "RED") {
                ctx.fillStyle = "#660000";
            } else if (game_events[i].team === "BLACK") {
                ctx.fillStyle = "#000000";
            }

            ctx.font = "20px Arial";

            var margin = 20;
            var reverse_reverse_i = game_events.length - 1 - i;
            var x = margin;
            var y = canvas.height - margin - (20 * reverse_reverse_i);

            ctx.fillText(game_events[i].text, x, y);
        }
    }
}

function draw_time_left() {

    var margin = 5;
    var x = canvas.width / 2;
    var y = margin;
    var bar_piece_length = canvas.width / 300;
    var line_height = ctx.measureText('M').width;

    var blue_bar_length = -1 * bar_piece_length * game_data.timers.BLUE.seconds;
    var red_bar_length = bar_piece_length * game_data.timers.RED.seconds;
    var bar_height = 30;

    var blue_timer_text = "" + game_data.timers.BLUE.seconds;
    var red_timer_text = "" + game_data.timers.RED.seconds;

    //blue timer
    ctx.fillStyle = "#0000FF";
    ctx.fillRect(x, y, blue_bar_length, bar_height);

    //red timer
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(x, y, red_bar_length, bar_height);

    //draw timer blocks
    ctx.fillStyle = "#000000";
    ctx.fillText(blue_timer_text, x - Math.abs(blue_bar_length) - 5 - ctx.measureText(blue_timer_text).width, y + (bar_height / 2) + (line_height / 2));
    ctx.fillText(red_timer_text, x + red_bar_length + 5, y + (bar_height / 2) + (line_height / 2));

    //write text saying which team is capturing if any
    if ((game_data.contestants.BLUE.length > 0 && game_data.contestants.BLUE.length > game_data.contestants.RED.length) || (game_data.contestants.RED.length > 0 && game_data.contestants.RED.length > game_data.contestants.BLUE.length)) {
        var capture_text;

        if (game_data.contestants.BLUE.length > 0 && game_data.contestants.BLUE.length > game_data.contestants.RED.length) {
            ctx.fillStyle = "#0000FF";
            var difference = game_data.contestants.BLUE.length - game_data.contestants.RED.length;
            capture_text = "BLUE TEAM CAPTURING (x" + difference + ")";
        } else if (game_data.contestants.RED.length > 0 && game_data.contestants.RED.length > game_data.contestants.BLUE.length) {
            ctx.fillStyle = "#FF0000";
            var difference = game_data.contestants.RED.length - game_data.contestants.BLUE.length;
            capture_text = "RED TEAM CAPTURING (x" + difference + ")";
        } else if (game_data.contestants.RED.length > 0 && game_data.contestants.BLUE.length > 0 && game_data.contestants.BLUE.length == game_data.contestants.RED.length) {
            ctx.fillStyle = "#000000";
            capture_text = "CONTESTATION";
        }

        ctx.fillText(capture_text, x - (ctx.measureText(capture_text).width / 2), y + bar_height + line_height + 5);
    }
}

resource_load_successful("canvas_setup.js");