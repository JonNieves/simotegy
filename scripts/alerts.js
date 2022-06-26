

//sort of pop-up alert - the default alert screws with javascript code running - which would kill the socket processes -_-

function simotegy_alert(message) {
    var alert_element = document.getElementById('alert');
    alert_element.children[0].innerHTML = message;
    alert_element.style.display = "block";
}

function hide_simotegy_alert() {
    document.getElementById('alert').style.display = "none";
}

resource_load_successful("alerts.js");