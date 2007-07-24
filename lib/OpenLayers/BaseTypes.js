/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Header: OpenLayers Base Types
 * Modifications to standard JavaScript types are described here.
 */

/*********************
 *                   *
 *      STRING       * 
 *                   * 
 *********************/


/**
 * APIFunction: String.startsWith
 * Whether or not a string starts with another string. 
 * 
 * Parameters:
 * sStart - {Sring}
 *  
 * Return:
 * {Boolean} Whether or not this string starts with the string passed in.
 */
String.prototype.startsWith = function(sStart) {
    return (this.substr(0,sStart.length) == sStart);
};

/**
 * APIFunction: String.contains
 * Whether or not a string contains another string.
 * 
 * Parameters:
 * str - {String}
 * 
 * Return:
 * {Boolean} Whether or not this string contains with the string passed in.
 */
String.prototype.contains = function(str) {
    return (this.indexOf(str) != -1);
};

/**
 * APIMethod: String.trim
 * Removes leading and trailing whitespace characters from a string.
 * 
 * Return:
 * {String} A trimmed version of the string - all leading and 
 *          trailing spaces removed
 */
String.prototype.trim = function() {
    
    var b = 0;
    while(this.substr(b,1) == " ") {
        b++;
    }
    
    var e = this.length - 1;
    while(this.substr(e,1) == " ") {
        e--;
    }
    
    return this.substring(b, e+1);
};

/**
 * APIFunction: String.indexOf
 * Index of a character in a string.
 * 
 * Parameters:
 * object - {Object} Can be a string or a number
 * 
 * Return: 
 * {Integer} The index of the encountered object, or -1 if not found.
 */
String.indexOf = function(object) {
    var index = -1;
    for (var i = 0; i < this.length; i++) {
        if (this[i] == object) {
            index = i;
            break;
        }
    }
    return index;
};

/**
 * APIFunction: camelize
 * Camel-case a hyphenated string. 
 *     Ex. "chicken-head" becomes "chickenHead", and
 *     "-chicken-head" becomes "ChickenHead".
 * 
 * Return:
 * {String} The string, camelized
 */
String.prototype.camelize = function() {
    var oStringList = this.split('-');
    if (oStringList.length == 1) {
        return oStringList[0];
    }
    
    var camelizedString = (this.indexOf('-') == 0)
        ? oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1)
        : oStringList[0];

    for (var i = 1, len = oStringList.length; i < len; i++) {
        var s = oStringList[i];
        camelizedString += s.charAt(0).toUpperCase() + s.substring(1);
    }

    return camelizedString;
};


/*********************
 *                   *
 *      NUMBER       * 
 *                   * 
 *********************/

/**
 * APIFunction: Number.limitSigDigs
 * Limit the number of significant digits on an integer. Does *not* work 
 *     with floats!
 * 
 * Parameters:
 * sig - {Integer}
 * 
 * Return:
 * {Integer} The number, rounded to the specified number of significant digits.
 *           If null, 0, or negative value passed in, returns 0
 */
Number.prototype.limitSigDigs = function(sig) {
    var number = (sig > 0) ? this.toString() : 0;
    if (sig < number.length) {
        var exp = number.length - sig;
        number = Math.round( this / Math.pow(10, exp)) * Math.pow(10, exp);
    }
    return parseInt(number);
}


/*********************
 *                   *
 *      FUNCTION     * 
 *                   * 
 *********************/

/**
 * APIFunction: Function.bind
 * Bind a function to an object. 
 * 
 * Parameters:
 * object - {Object}
 * 
 * Return:
 * {Function}
 */
Function.prototype.bind = function() {
    var __method = this;
    var args = [];
    var object = arguments[0];
    
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    
    return function(moreargs) {
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return __method.apply(object, args);
    };
};

/**
 * APIFunction: Function.bindAsEventListener
 * Bind a function to an object, and configure it to receive the event object
 *     as first parameter when called. 
 * 
 * Parameters:
 * object - {Object}
 * 
 * Return:
 * {Function}
 */
Function.prototype.bindAsEventListener = function(object) {
    var __method = this;
    return function(event) {
        return __method.call(object, event || window.event);
    };
};