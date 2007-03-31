/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/* @requires OpenLayers/BaseTypes.js
 */ 

////
/// This blob sucks in all the files in uncompressed form for ease of use
///

OpenLayers = new Object();

OpenLayers._scriptName = ( 
    typeof(_OPENLAYERS_SFL_) == "undefined" ? "lib/OpenLayers.js" 
                                            : "OpenLayers.js" );

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

/*
  `_OPENLAYERS_SFL_` is a flag indicating this file is being included
  in a Single File Library build of the OpenLayers Library.

  When we are *not* part of a SFL build we dynamically include the
  OpenLayers library code.

  When we *are* part of a SFL build we do not dynamically include the 
  OpenLayers library code as it will be appended at the end of this file.
*/
if (typeof(_OPENLAYERS_SFL_) == "undefined") {
    /*
      The original code appeared to use a try/catch block
      to avoid polluting the global namespace,
      we now use a anonymous function to achieve the same result.
     */
    (function() {
    var jsfiles=new Array(
        "OpenLayers/BaseTypes.js",
        "OpenLayers/Util.js",
        "Rico/Corner.js",
        "Rico/Color.js",
        "OpenLayers/Ajax.js",
        "OpenLayers/Events.js",
        "OpenLayers/Map.js",
        "OpenLayers/Layer.js",
        "OpenLayers/Icon.js",
        "OpenLayers/Marker.js",
        "OpenLayers/Marker/Box.js",
        "OpenLayers/Popup.js",
        "OpenLayers/Tile.js",
        "OpenLayers/Feature.js",
        "OpenLayers/Feature/Vector.js",
        "OpenLayers/Feature/WFS.js",
        "OpenLayers/Tile/Image.js",
        "OpenLayers/Tile/WFS.js",
        "OpenLayers/Layer/Image.js",
        "OpenLayers/Layer/EventPane.js",
        "OpenLayers/Layer/FixedZoomLevels.js",
        "OpenLayers/Layer/Google.js",
        "OpenLayers/Layer/VirtualEarth.js",
        "OpenLayers/Layer/Yahoo.js",
        "OpenLayers/Layer/HTTPRequest.js",
        "OpenLayers/Layer/Grid.js",
        "OpenLayers/Layer/MapServer.js",
        "OpenLayers/Layer/MapServer/Untiled.js",
        "OpenLayers/Layer/KaMap.js",
        "OpenLayers/Layer/MultiMap.js",
        "OpenLayers/Layer/Markers.js",
        "OpenLayers/Layer/Text.js",
        "OpenLayers/Layer/WorldWind.js",
        "OpenLayers/Layer/WMS.js",
        "OpenLayers/Layer/WMS/Untiled.js",
        "OpenLayers/Layer/GeoRSS.js",
        "OpenLayers/Layer/Boxes.js",
        "OpenLayers/Layer/Canvas.js",
        "OpenLayers/Layer/TMS.js",
        "OpenLayers/Popup/Anchored.js",
        "OpenLayers/Popup/AnchoredBubble.js",
        "OpenLayers/Handler.js",
        "OpenLayers/Handler/Point.js",
        "OpenLayers/Handler/Path.js",
        "OpenLayers/Handler/Polygon.js",
        "OpenLayers/Handler/Feature.js",
        "OpenLayers/Handler/Drag.js",
        "OpenLayers/Handler/Box.js",
        "OpenLayers/Handler/MouseWheel.js",
        "OpenLayers/Handler/Keyboard.js",
        "OpenLayers/Control.js",
        "OpenLayers/Control/ZoomBox.js",
        "OpenLayers/Control/ZoomToMaxExtent.js",
        "OpenLayers/Control/DragPan.js",
        "OpenLayers/Control/Navigation.js",
        "OpenLayers/Control/MouseDefaults.js",
        "OpenLayers/Control/MousePosition.js",
        "OpenLayers/Control/OverviewMap.js",
        "OpenLayers/Control/KeyboardDefaults.js",
        "OpenLayers/Control/PanZoom.js",
        "OpenLayers/Control/PanZoomBar.js",
        "OpenLayers/Control/ArgParser.js",
        "OpenLayers/Control/Permalink.js",
        "OpenLayers/Control/Scale.js",
        "OpenLayers/Control/LayerSwitcher.js",
        "OpenLayers/Control/DrawFeature.js",
        "OpenLayers/Control/Panel.js",
        "OpenLayers/Control/SelectFeature.js",
        "OpenLayers/Geometry.js",
        "OpenLayers/Geometry/Rectangle.js",
        "OpenLayers/Geometry/Collection.js",
        "OpenLayers/Geometry/Point.js",
        "OpenLayers/Geometry/MultiPoint.js",
        "OpenLayers/Geometry/Curve.js",
        "OpenLayers/Geometry/LineString.js",
        "OpenLayers/Geometry/LinearRing.js",        
        "OpenLayers/Geometry/Polygon.js",
        "OpenLayers/Geometry/MultiLineString.js",
        "OpenLayers/Geometry/MultiPolygon.js",
        "OpenLayers/Geometry/Surface.js",
        "OpenLayers/Renderer.js",
        "OpenLayers/Renderer/Elements.js",
        "OpenLayers/Renderer/SVG.js",
        "OpenLayers/Renderer/VML.js",
        "OpenLayers/Layer/Vector.js",
        "OpenLayers/Layer/GML.js",
        "OpenLayers/Format.js",
        "OpenLayers/Format/GML.js",
        "OpenLayers/Format/KML.js",
        "OpenLayers/Format/GeoRSS.js",
        "OpenLayers/Format/WFS.js",
        "OpenLayers/Format/WKT.js",
        "OpenLayers/Layer/WFS.js",
        "OpenLayers/Control/MouseToolbar.js",
        "OpenLayers/Control/NavToolbar.js",
        "OpenLayers/Control/EditingToolbar.js"
    ); // etc.

    var allScriptTags = "";
    var host = OpenLayers._getScriptLocation() + "lib/";

    for (var i = 0; i < jsfiles.length; i++) {
        if (/MSIE/.test(navigator.userAgent) || /Safari/.test(navigator.userAgent)) {
            var currentScriptTag = "<script src='" + host + jsfiles[i] + "'></script>"; 
            allScriptTags += currentScriptTag;
        } else {
            var s = document.createElement("script");
            s.src = host + jsfiles[i];
            var h = document.getElementsByTagName("head").length ? 
                       document.getElementsByTagName("head")[0] : 
                       document.body;
            h.appendChild(s);
        }
    }
    if (allScriptTags) document.write(allScriptTags);
    })();
}
OpenLayers.VERSION_NUMBER="$Revision$";
