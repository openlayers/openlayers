/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * The OpenLayers.Console namespace is used for debugging and error logging.
 * If the Firebug Lite (../Firebug/firebug.js) is included before this script,
 * calls to OpenLayers.Console methods will get redirected to window.console.
 * This makes use of the Firebug extension where available and allows for
 * cross-browser debugging Firebug style.
 */
OpenLayers.Console = {};
(function() {
    /**
     * Create empty functions for all console methods.  The real value of these
     * properties will be set if Firebug Lite (../Firebug/firebug.js script) is
     * included.  We explicitly require the Firebug Lite script to trigger
     * functionality of the OpenLayers.Console methods.
     */
    var methods = ['log', 'debug', 'info', 'warn', 'error', 'assert',
                   'dir', 'dirxml', 'trace', 'group', 'groupEnd', 'time',
                   'timeEnd', 'profile', 'profileEnd', 'count'];
    for(var i=0; i<methods.length; ++i) {
        OpenLayers.Console[methods[i]] = function() {};
    }
    /**
     * If Firebug Lite is included (before this script), re-route all
     * OpenLayers.Console calls to the console object.
     */
    if(window.console) {
        var scripts = document.getElementsByTagName("script");
        for(var i=0; i<scripts.length; ++i) {
            if(scripts[i].src.indexOf("firebug.js") != -1) {
                OpenLayers.Util.extend(OpenLayers.Console, console);
                break;
            }
        }
    }
})();
