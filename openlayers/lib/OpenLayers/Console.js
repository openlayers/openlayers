/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 */

/**
 * Namespace: OpenLayers.Console
 * The OpenLayers.Console namespace is used for debugging and error logging.
 * If the Firebug Lite (../Firebug/firebug.js) is included before this script,
 * calls to OpenLayers.Console methods will get redirected to window.console.
 * This makes use of the Firebug extension where available and allows for
 * cross-browser debugging Firebug style.
 *
 * Note:
 * Note that behavior will differ with the Firebug extention and Firebug Lite.
 * Most notably, the Firebug Lite console does not currently allow for
 * hyperlinks to code or for clicking on object to explore their properties.
 * 
 */
OpenLayers.Console = {
    /**
     * Create empty functions for all console methods.  The real value of these
     * properties will be set if Firebug Lite (../Firebug/firebug.js script) is
     * included.  We explicitly require the Firebug Lite script to trigger
     * functionality of the OpenLayers.Console methods.
     */
    
    /**
     * APIFunction: log
     * Log an object in the console.  The Firebug Lite console logs string
     * representation of objects.  Given multiple arguments, they will
     * be cast to strings and logged with a space delimiter.  If the first
     * argument is a string with printf-like formatting, subsequent arguments
     * will be used in string substitution.  Any additional arguments (beyond
     * the number substituted in a format string) will be appended in a space-
     * delimited line.
     * 
     * Parameters:
     * object - {Object}
     */
    log: function() {},

    /**
     * APIFunction: debug
     * Writes a message to the console, including a hyperlink to the line
     * where it was called.
     *
     * May be called with multiple arguments as with OpenLayers.Console.log().
     * 
     * Parameters:
     * object - {Object}
     */
    debug: function() {},

    /**
     * APIFunction: info
     * Writes a message to the console with the visual "info" icon and color
     * coding and a hyperlink to the line where it was called.
     *
     * May be called with multiple arguments as with OpenLayers.Console.log().
     * 
     * Parameters:
     * object - {Object}
     */
    info: function() {},

    /**
     * APIFunction: warn
     * Writes a message to the console with the visual "warning" icon and
     * color coding and a hyperlink to the line where it was called.
     *
     * May be called with multiple arguments as with OpenLayers.Console.log().
     * 
     * Parameters:
     * object - {Object}
     */
    warn: function() {},

    /**
     * APIFunction: error
     * Writes a message to the console with the visual "error" icon and color
     * coding and a hyperlink to the line where it was called.
     *
     * May be called with multiple arguments as with OpenLayers.Console.log().
     * 
     * Parameters:
     * object - {Object}
     */
    error: function() {},
    
    /**
     * APIFunction: userError
     * A single interface for showing error messages to the user. The default
     * behavior is a Javascript alert, though this can be overridden by
     * reassigning OpenLayers.Console.userError to a different function.
     *
     * Expects a single error message
     * 
     * Parameters:
     * error - {Object}
     */
    userError: function(error) {
        alert(error);
    },

    /**
     * APIFunction: assert
     * Tests that an expression is true. If not, it will write a message to
     * the console and throw an exception.
     *
     * May be called with multiple arguments as with OpenLayers.Console.log().
     * 
     * Parameters:
     * object - {Object}
     */
    assert: function() {},

    /**
     * APIFunction: dir
     * Prints an interactive listing of all properties of the object. This
     * looks identical to the view that you would see in the DOM tab.
     * 
     * Parameters:
     * object - {Object}
     */
    dir: function() {},

    /**
     * APIFunction: dirxml
     * Prints the XML source tree of an HTML or XML element. This looks
     * identical to the view that you would see in the HTML tab. You can click
     * on any node to inspect it in the HTML tab.
     * 
     * Parameters:
     * object - {Object}
     */
    dirxml: function() {},

    /**
     * APIFunction: trace
     * Prints an interactive stack trace of JavaScript execution at the point
     * where it is called.  The stack trace details the functions on the stack,
     * as well as the values that were passed as arguments to each function.
     * You can click each function to take you to its source in the Script tab,
     * and click each argument value to inspect it in the DOM or HTML tabs.
     * 
     */
    trace: function() {},

    /**
     * APIFunction: group
     * Writes a message to the console and opens a nested block to indent all
     * future messages sent to the console. Call OpenLayers.Console.groupEnd()
     * to close the block.
     *
     * May be called with multiple arguments as with OpenLayers.Console.log().
     * 
     * Parameters:
     * object - {Object}
     */
    group: function() {},

    /**
     * APIFunction: groupEnd
     * Closes the most recently opened block created by a call to
     * OpenLayers.Console.group
     */
    groupEnd: function() {},
    
    /**
     * APIFunction: time
     * Creates a new timer under the given name. Call
     * OpenLayers.Console.timeEnd(name)
     * with the same name to stop the timer and print the time elapsed.
     *
     * Parameters:
     * name - {String}
     */
    time: function() {},

    /**
     * APIFunction: timeEnd
     * Stops a timer created by a call to OpenLayers.Console.time(name) and
     * writes the time elapsed.
     *
     * Parameters:
     * name - {String}
     */
    timeEnd: function() {},

    /**
     * APIFunction: profile
     * Turns on the JavaScript profiler. The optional argument title would
     * contain the text to be printed in the header of the profile report.
     *
     * This function is not currently implemented in Firebug Lite.
     * 
     * Parameters:
     * title - {String} Optional title for the profiler
     */
    profile: function() {},

    /**
     * APIFunction: profileEnd
     * Turns off the JavaScript profiler and prints its report.
     * 
     * This function is not currently implemented in Firebug Lite.
     */
    profileEnd: function() {},

    /**
     * APIFunction: count
     * Writes the number of times that the line of code where count was called
     * was executed. The optional argument title will print a message in
     * addition to the number of the count.
     *
     * This function is not currently implemented in Firebug Lite.
     *
     * Parameters:
     * title - {String} Optional title to be printed with count
     */
    count: function() {},

    CLASS_NAME: "OpenLayers.Console"
};

/**
 * Execute an anonymous function to extend the OpenLayers.Console namespace
 * if the firebug.js script is included.  This closure is used so that the
 * "scripts" and "i" variables don't pollute the global namespace.
 */
(function() {
    /**
     * If Firebug Lite is included (before this script), re-route all
     * OpenLayers.Console calls to the console object.
     */
    var scripts = document.getElementsByTagName("script");
    for(var i=0, len=scripts.length; i<len; ++i) {
        if(scripts[i].src.indexOf("firebug.js") != -1) {
            if(console) {
                OpenLayers.Util.extend(OpenLayers.Console, console);
                break;
            }
        }
    }
})();
