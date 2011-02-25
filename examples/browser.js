var isEventSupported = (function(undef) {

    var TAGNAMES = {
        'select':'input',
        'change':'input',
        'submit':'form',
        'reset':'form',
        'error':'img',
        'load':'img',
        'abort':'img'
    };

    function isEventSupported(eventName, element) {
        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        var isSupported = (eventName in element);

        if (!isSupported) {
            // if it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
            if (!element.setAttribute) {
                element = document.createElement('div');
            }
            if (element.setAttribute && element.removeAttribute) {
                element.setAttribute(eventName, '');
                isSupported = typeof element[eventName] == 'function';

                // if property was created, "remove it" (by setting value to `undefined`)
                if (typeof element[eventName] != 'undefined') {
                    element[eventName] = undef;
                }
                element.removeAttribute(eventName);
            }
        }

        element = null;
        return isSupported;
    }

    return isEventSupported;
})();

function divResult(category, name, element, div) {
    div.innerHTML = div.innerHTML + category + " " + name + ": ";
    div.innerHTML = div.innerHTML + (
            isEventSupported(name, element)
                    ? '<span style="background-color:green;color:white;">true</span></td>'
                    : '<span style="background-color:red;color:white;">false</span></td>'
            );
    div.innerHTML = div.innerHTML + "<br>";
}
var counter = 1;

function log(title, detail) {
    var logDiv = document.getElementById("log");
    idString = "'id" + counter + "'";
    var newlink = document.createElement('a');
    newlink.setAttribute('href', "javascript:toggle_visibility(" + idString + ")");
    newlink.innerHTML = counter + ". " + title;
    var br1 = document.createElement('br');
    logDiv.appendChild(newlink);
    logDiv.appendChild(br1);

    var childDiv = document.createElement('div');
    childDiv.setAttribute("id", idString.replace("'", "").replace("'", ""));
    childDiv.setAttribute("style", 'display: none; margin-left : 5px;');
    childDiv.innerHTML = detail;
    var br2 = document.createElement('br');
    logDiv.appendChild(childDiv);

    counter = counter + 1;
}

function inspect(obj) {
    if (typeof obj === "undefined") {
        return "undefined";
    }
    var _props = [];

    for (var i in obj) {
        _props.push(i + " : " + obj[i]);
    }
    return " {" + _props.join(",<br>") + "} ";
}

function click(e) {
    if (document.getElementById("clickID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function dblclick(e) {
    if (document.getElementById("dblclickID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function mousedown(e) {
    if (document.getElementById("mousedownID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function mouseup(e) {
    if (document.getElementById("mouseupID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function mouseover(e) {
    if (document.getElementById("mouseoverID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function mousemove(e) {
    if (document.getElementById("mousemoveID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function mouseout(e) {
    if (document.getElementById("mouseoutID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function touchstart(e) {
    if (document.getElementById("touchstartID").checked) {
        var box = document.getElementById("box");
        var result = inspect(e);
        for (var i = 0; i < e.touches.length; i++) {
            result = result + "<br> Touches nr." + i + " <br>" + inspect(e.touches[i]);
        }
        log(e.type, result);
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function touchend(e) {
    if (document.getElementById("touchendID").checked) {
        var box = document.getElementById("box");
        var result = inspect(e);
        for (var i = 0; i < e.touches.length; i++) {
            result = result + "<br> Touches nr." + i + " <br>" + inspect(e.touches[i]);
        }
        log(e.type, result);
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function touchmove(e) {
    if (document.getElementById("touchmoveID").checked) {
        var targetEvent = e.touches.item(0);
        var box = document.getElementById("box");
        box.style.left = targetEvent.clientX + "px";
        box.style.top = targetEvent.clientY + "px";
        var result = inspect(e);
        for (var i = 0; i < e.touches.length; i++) {
            result = result + "<br> Touches nr." + i + " <br>" + inspect(e.touches[i]);
        }
        log(e.type, result);
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function touchcancel(e) {
    if (document.getElementById("touchcancelID").checked) {
        var box = document.getElementById("box");
        var result = inspect(e);
        for (var i = 0; i < e.touches.length; i++) {
            result = result + "<br> Touches nr." + i + " <br>" + inspect(e.touches[i]);
        }
        log(e.type, result);
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function gesturestart(e) {
    if (document.getElementById("gesturestartID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function gesturechange(e) {
    if (document.getElementById("gesturechangeID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function gestureend(e) {
    if (document.getElementById("gestureendID").checked) {
        var box = document.getElementById("box");
        log(e.type, inspect(e));
        if (e.preventDefault) e.preventDefault();
    }
    return false;
}

function toggle_visibility(id) {
    var e = document.getElementById(id);
    if (e.style.display == 'block') {
        e.style.display = 'none';
    } else {
        e.style.display = 'block';
    }
}



