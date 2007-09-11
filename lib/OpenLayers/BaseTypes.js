/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
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
 * APIMethod: String.startsWith
 * Whether or not a string starts with another string. 
 * 
 * Parameters:
 * sStart - {Sring} The string we're testing for.
 *  
 * Returns:
 * {Boolean} Whether or not this string starts with the string passed in.
 */
String.prototype.startsWith = function(sStart) {
    return (this.substr(0,sStart.length) == sStart);
};

/**
 * APIMethod: String.contains
 * Whether or not a string contains another string.
 * 
 * Parameters:
 * str - {String} The string that we're testing for.
 * 
 * Returns:
 * {Boolean} Whether or not this string contains with the string passed in.
 */
String.prototype.contains = function(str) {
    return (this.indexOf(str) != -1);
};

/**
 * APIMethod: String.trim
 * Removes leading and trailing whitespace characters from a string.
 * 
 * Returns:
 * {String} A trimmed version of the string - all leading and 
 *          trailing spaces removed
 */
String.prototype.trim = function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');    
};

/**
 * APIMethod: String.indexOf
 * Index of a character in a string.
 * 
 * Parameters:
 * object - {Object} Can be a string or a number
 * 
 * Returns: 
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
 * APIMethod: camelize
 * Camel-case a hyphenated string. 
 *     Ex. "chicken-head" becomes "chickenHead", and
 *     "-chicken-head" becomes "ChickenHead".
 * 
 * Returns:
 * {String} The string, camelized
 */
String.prototype.camelize = function() {
    var oStringList = this.split('-');
    var camelizedString = oStringList[0];
    for (var i = 1; i < oStringList.length; i++) {
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
 * APIMethod: Number.limitSigDigs
 * Limit the number of significant digits on an integer. Does *not* work 
 *     with floats!
 * 
 * Parameters:
 * sig - {Integer}
 * 
 * Returns:
 * {Integer} The number, rounded to the specified number of significant digits.
 *           If null, 0, or negative value passed in, returns 0
 */
Number.prototype.limitSigDigs = function(sig) {
    var numStr = (sig > 0) ? this.toString() : "0";
    if (numStr.contains(".")) {
        var msg = "limitSigDig can not be called on a floating point number";
        OpenLayers.Console.error(msg);
        return null;
    }
    if ( (sig > 0) && (sig < numStr.length) ) {
        var exp = numStr.length - sig;
        numStr = Math.round( this / Math.pow(10, exp)) * Math.pow(10, exp);
    }
    return parseInt(numStr);
};


/*********************
 *                   *
 *      FUNCTION     * 
 *                   * 
 *********************/

/**
 * APIMethod: Function.bind
 * Bind a function to an object. 
 * Method to easily create closures with 'this' altered.
 * 
 * Parameters:
 * object - {Object} the this parameter
 * 
 * Returns:
 * {Function} A closure with 'this' altered to the first
 *            argument.
 */
Function.prototype.bind = function() {
    var __method = this;
    var args = [];
    var object = arguments[0];
    
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    
    return function(moreargs) {
        var i;
        var newArgs = [];
        for (i = 0; i < args.length; i++) {
            newArgs.push(args[i]);
        }
        for (i = 0; i < arguments.length; i++) {
            newArgs.push(arguments[i]);
        }
        return __method.apply(object, newArgs);
    };
};

/**
 * APIMethod: Function.bindAsEventListener
 * Bind a function to an object, and configure it to receive the event object
 *     as first parameter when called. 
 * 
 * Parameters:
 * object - {Object} A reference to this.
 * 
 * Returns:
 * {Function}
 */
Function.prototype.bindAsEventListener = function(object) {
    var __method = this;
    return function(event) {
        return __method.call(object, event || window.event);
    };
};
