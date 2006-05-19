// @requires core/application.js

////
/// This blob sucks in all the files in uncompressed form for ease of use
///

/** HACK HACK HACK
*   this function is basically duplicated in api.js
*
* @return {str}
*/

OpenLayers = new Object();
OpenLayers._scriptName = "lib/OpenLayers.js";
OpenLayers._getScriptLocation = function () {
    var scriptLocation = "";
    var SCRIPT_NAME = OpenLayers._scriptName;
 
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src');
        if (src) {
            var index = src.lastIndexOf(SCRIPT_NAME); 
            // is it found, at the end of the URL?
            if ((index > -1) && (index + SCRIPT_NAME.length == src.length)) {  
                scriptLocation = src.slice(0, -SCRIPT_NAME.length);
                break;
            }
        }
    }
    return scriptLocation;
}

try{new OpenLayers.Map();}
catch(e){
    var jsfiles=new Array(
        "Prototype.js", 
        "Rico/Corner.js",
        "Rico/Color.js",
        "OpenLayers/Util.js",
        "OpenLayers/Events.js",
        "OpenLayers/Map.js",
        "OpenLayers/Layer.js",
        "OpenLayers/Icon.js",
        "OpenLayers/Marker.js",
        "OpenLayers/Tile.js",
        "OpenLayers/Feature.js",
        "OpenLayers/Tile/Image.js",
        "OpenLayers/Tile/WFS.js",
        "OpenLayers/Layer/Google.js",
        "OpenLayers/Layer/Grid.js",
        "OpenLayers/Layer/Marker.js",
        "OpenLayers/Layer/Text.js",
        "OpenLayers/Layer/WMS.js",
        "OpenLayers/Layer/WFS.js",
        "OpenLayers/Control.js",
        "OpenLayers/Control/PanZoom.js",
        "OpenLayers/Control/PanZoomBar.js",
        "OpenLayers/Control/LayerSwitcher.js"
    ); // etc.

    var allScriptTags = "";
    var host = OpenLayers._getScriptLocation() + "lib/";

    // check to see if prototype.js was already loaded
    //  if so, skip the first dynamic include 
    //
    var start=1;
    try { x = Prototype; }
    catch (e) { start=0; }

    for (var i = start; i < jsfiles.length; i++) {
        var currentScriptTag = "<script src='" + host + jsfiles[i] + "'></script>"; 
        allScriptTags += currentScriptTag;
    }
    document.write(allScriptTags);
};
