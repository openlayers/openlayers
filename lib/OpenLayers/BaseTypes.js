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
 * 
 * Parameters:
 * object - {Object} Can be a string or a number
 * 
 * Return: 
 * {Integer} The index of the encountered object, or -1 if not found.
 */
String.indexOf = function(object) {
 for (var i = 0; i < this.length; i++)
     if (this[i] == object) return i;
 return -1;
};

/**
 * APIFunction: camelize
 * 
 * Return:
 * {String} The string, camelized
 */
String.prototype.camelize = function() {
    var oStringList = this.split('-');
    if (oStringList.length == 1) return oStringList[0];

    var camelizedString = this.indexOf('-') == 0
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
 * Works only with integer values does *not* work with floats!
 * 
 * Parameters:
 * sig - {Integer}
 * 
 * Return:
 * {Integer} The number, rounded to the specified number of significant digits.
 *           If null, 0, or negaive value passed in, returns 0
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
 * 
 * Parameters:
 * object - {Object}
 * 
 * Return:
 * {Function}
 */
Function.prototype.bind = function() {
  var __method = this, args = [], object = arguments[0];
  for (var i = 1; i < arguments.length; i++)
    args.push(arguments[i]);
  return function(moreargs) {
    for (var i = 0; i < arguments.length; i++)
      args.push(arguments[i]);
    return __method.apply(object, args);
  }
};

/**
 * APIFunction: Function.bindAsEventListener
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
  }
};