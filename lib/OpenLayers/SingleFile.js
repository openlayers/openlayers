/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/*
 * @requires OpenLayers/Console.js
 */

var OpenLayers = {
    /**
     * Constant: VERSION_NUMBER
     */
    VERSION_NUMBER: "$Revision$",

    /**
     * Constant: singleFile
     * TODO: remove this in 3.0 when we stop supporting build profiles that
     * include OpenLayers.js
     */
    singleFile: true,

    /**
     * Method: _getScriptLocation
     * Return the path to this script. This is also implemented in
     * OpenLayers.js
     *
     * Returns:
     * {String} Path to this script
     */
    _getScriptLocation: (function() {
        var s = document.getElementsByTagName('script');
        var m = s[s.length-1].getAttribute("src").match(/(^|(.*?\/))(OpenLayers\.js)(\?|$)/);
        var l = m ? m[1] : "";
        return (function() { return l; });
    })()
};
