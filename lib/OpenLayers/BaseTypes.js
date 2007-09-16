/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Header: OpenLayers Base Types
 * OpenLayers custom string, number and function functions are described here.
 */

/*********************
 *                   *
 *      STRING       * 
 *                   * 
 *********************/

OpenLayers.String = {
    /**
     * APIMethod: OpenLayers.String.startsWith
     * Whether or not a string starts with another string. 
     * 
     * Parameters:
     * str - {String} The string to test.
     * sub - {Sring} The substring to look for.
     *  
     * Returns:
     * {Boolean} The first string starts with the second.
     */
    startsWith: function(str, sub) {
        return (str.indexOf(sub) == 0);
    },

    /**
     * APIMethod: OpenLayers.String.contains
     * Whether or not a string contains another string.
     * 
     * Parameters:
     * str - {String} The string to test.
     * sub - {String} The substring to look for.
     * 
     * Returns:
     * {Boolean} The first string contains the second.
     */
    contains: function(str, sub) {
        return (str.indexOf(sub) != -1);
    },
    
    /**
     * APIMethod: OpenLayers.String.trim
     * Removes leading and trailing whitespace characters from a string.
     * 
     * Parameters:
     * str - {String} The (potentially) space padded string.  This string is not
     *     modified.
     * 
     * Returns:
     * {String} A trimmed version of the string - all leading and 
     *     trailing spaces removed.
     */
    trim: function(str) {
        return str.replace(/^\s*(.*?)\s*$/, "$1");    
    },
    
    /**
     * APIMethod: OpenLayers.String.camelize
     * Camel-case a hyphenated string. 
     *     Ex. "chicken-head" becomes "chickenHead", and
     *     "-chicken-head" becomes "ChickenHead".
     *
     * Parameters:
     * str - {String} The string to be camelized.  The original is not modified.
     * 
     * Returns:
     * {String} The string, camelized
     */
    camelize: function(str) {
        var oStringList = str.split('-');
        var camelizedString = oStringList[0];
        for (var i = 1; i < oStringList.length; i++) {
            var s = oStringList[i];
            camelizedString += s.charAt(0).toUpperCase() + s.substring(1);
        }
        return camelizedString;
    }
};

if (!String.prototype.startsWith) {
    /**
     * APIMethod: String.startsWith
     * Deprecated. Whether or not a string starts with another string. 
     * 
     * Parameters:
     * sStart - {Sring} The string we're testing for.
     *  
     * Returns:
     * {Boolean} Whether or not this string starts with the string passed in.
     */
    String.prototype.startsWith = function(sStart) {
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.String.startsWith instead"
        );
        return OpenLayers.String.startsWith(this, sStart);
    };
}

if (!String.prototype.contains) {
    /**
     * APIMethod: String.contains
     * Deprecated. Whether or not a string contains another string.
     * 
     * Parameters:
     * str - {String} The string that we're testing for.
     * 
     * Returns:
     * {Boolean} Whether or not this string contains with the string passed in.
     */
    String.prototype.contains = function(str) {
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.String.contains instead"
        );
        return OpenLayers.String.contains(this, str);
    };
}

if (!String.prototype.trim) {
    /**
     * APIMethod: String.trim
     * Deprecated. Removes leading and trailing whitespace characters from a string.
     * 
     * Returns:
     * {String} A trimmed version of the string - all leading and 
     *          trailing spaces removed
     */
    String.prototype.trim = function() {
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.String.trim instead"
        );
        return OpenLayers.String.trim(this);
    };
}

if (!String.prototype.camelize) {
    /**
     * APIMethod: camelize
     * Deprecated. Camel-case a hyphenated string. 
     *     Ex. "chicken-head" becomes "chickenHead", and
     *     "-chicken-head" becomes "ChickenHead".
     * 
     * Returns:
     * {String} The string, camelized
     */
    String.prototype.camelize = function() {
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.String.camelize instead"
        );
        return OpenLayers.String.camelize(this);
    };
}

/*********************
 *                   *
 *      NUMBER       * 
 *                   * 
 *********************/

OpenLayers.Number = {
    /**
     * APIMethod: OpenLayers.Number.limitSigDigs
     * Limit the number of significant digits on an integer.
     * 
     * Parameters:
     * num - {Integer}
     * sig - {Integer}
     * 
     * Returns:
     * {Integer} The number, rounded to the specified number of significant
     *     digits.
     */
    limitSigDigs: function(num, sig) {
        var fig;
        if(sig > 0) {
            fig = parseFloat(num.toPrecision(sig));
        } else {
            fig = 0;
        }
        return fig;
    }
};

if (!Number.prototype.limitSigDigs) {
    /**
     * APIMethod: Number.limitSigDigs
     * Deprecated. Limit the number of significant digits on an integer. Does *not*
     *     work with floats!
     * 
     * Parameters:
     * sig - {Integer}
     * 
     * Returns:
     * {Integer} The number, rounded to the specified number of significant digits.
     *           If null, 0, or negative value passed in, returns 0
     */
    Number.prototype.limitSigDigs = function(sig) {
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.Number.limitSigDigs instead"
        );
        return OpenLayers.Number.limitSigDigs(this, sig);
    };
}

/*********************
 *                   *
 *      FUNCTION     * 
 *                   * 
 *********************/

OpenLayers.Function = {
    /**
     * APIMethod: OpenLayers.Function.bind
     * Bind a function to an object.  Method to easily create closures with
     *     'this' altered.
     * 
     * Parameters:
     * func - {Function} Input function.
     * object - {Object} The object to bind to the input function (as this).
     * 
     * Returns:
     * {Function} A closure with 'this' set to the passed in object.
     */
    bind: function(func, object) {
        // create a reference to all arguments past the second one
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function() {
            // Push on any additional arguments from the actual function call.
            // These will come after those sent to the bind call.
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    },
    
    /**
     * APIMethod: OpenLayers.Function.bindAsEventListener
     * Bind a function to an object, and configure it to receive the event
     *     object as first parameter when called. 
     * 
     * Parameters:
     * func - {Function} Input function to serve as an event listener.
     * object - {Object} A reference to this.
     * 
     * Returns:
     * {Function}
     */
    bindAsEventListener: function(func, object) {
        return function(event) {
            return func.call(object, event || window.event);
        };
    }
};

if (!Function.prototype.bind) {
    /**
     * APIMethod: Function.bind
     * Deprecated. Bind a function to an object. 
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
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.Function.bind instead"
        );
        // new function takes the same arguments with this function up front
        Array.prototype.unshift.apply(arguments, [this]);
        return OpenLayers.Function.bind.apply(null, arguments);
    };
}

if (!Function.prototype.bindAsEventListener) {
    /**
     * APIMethod: Function.bindAsEventListener
     * Deprecated. Bind a function to an object, and configure it to receive the
     *     event object as first parameter when called. 
     * 
     * Parameters:
     * object - {Object} A reference to this.
     * 
     * Returns:
     * {Function}
     */
    Function.prototype.bindAsEventListener = function(object) {
        OpenLayers.Console.warn(
            "This method has been deprecated and will be removed in 3.0. " +
            "Please use OpenLayers.Function.bindAsEventListener instead"
        );
        return OpenLayers.Function.bindAsEventListener(this, object);
    };
}
