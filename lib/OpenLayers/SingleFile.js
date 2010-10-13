/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

var OpenLayers = {
    singleFile: true,
    _getScriptLocation: (function() {
        var s = document.getElementsByTagName('script');
        var match = s[s.length-1].getAttribute("src").match(/(^|(.*?\/))(OpenLayers\.js)(\?|$)/);
        var l = match ? match[1] : "";
        return (function() { return l; });
    })()
};

/**
 * Constant: VERSION_NUMBER
 */
OpenLayers.VERSION_NUMBER="$Revision$";
