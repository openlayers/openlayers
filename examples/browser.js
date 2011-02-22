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

