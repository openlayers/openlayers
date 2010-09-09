/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* 
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/Lang/en.js
 * @requires OpenLayers/Console.js
 */ 

(function() {
    /**
     * Before creating the OpenLayers namespace, check to see if
     * OpenLayers.singleFile is true.  This occurs if the
     * OpenLayers/SingleFile.js script is included before this one - as is the
     * case with single file builds.
     */
    var singleFile = (typeof OpenLayers == "object" && OpenLayers.singleFile);
    
    /**
     * Cache for the script location returned from
     * OpenLayers._getScriptLocation
     */
    var scriptLocation;
    
    /**
     * Namespace: OpenLayers
     * The OpenLayers object provides a namespace for all things OpenLayers
     */
    window.OpenLayers = {
        
        /**
         * Property: _scriptName
         * {String} Relative path of this script.
         */
        _scriptName: (!singleFile) ? "lib/OpenLayers.js" : "OpenLayers.js",

        /**
         * Function: _getScriptLocation
         * Return the path to this script.
         *
         * Returns:
         * {String} Path to this script
         */
        _getScriptLocation: function () {
            if (scriptLocation != undefined) {
                return scriptLocation;
            }
            scriptLocation = "";            
            var isOL = new RegExp("(^|(.*?\\/))(" + OpenLayers._scriptName + ")(\\?|$)");
         
            var scripts = document.getElementsByTagName('script');
            for (var i=0, len=scripts.length; i<len; i++) {
                var src = scripts[i].getAttribute('src');
                if (src) {
                    var match = src.match(isOL);
                    if(match) {
                        scriptLocation = match[1];
                        break;
                    }
                }
            }
            return scriptLocation;
        }
    };
    /**
     * OpenLayers.singleFile is a flag indicating this file is being included
     * in a Single File Library build of the OpenLayers Library.
     * 
     * When we are *not* part of a SFL build we dynamically include the
     * OpenLayers library code.
     * 
     * When we *are* part of a SFL build we do not dynamically include the 
     * OpenLayers library code as it will be appended at the end of this file.
      */
    if(!singleFile) {
        var jsfiles = new Array(
            "OpenLayers/Util.js",
            "OpenLayers/BaseTypes.js",
            "OpenLayers/BaseTypes/Class.js",
            "OpenLayers/BaseTypes/Bounds.js",
            "OpenLayers/BaseTypes/Element.js",
            "OpenLayers/BaseTypes/LonLat.js",
            "OpenLayers/BaseTypes/Pixel.js",
            "OpenLayers/BaseTypes/Size.js",
            "OpenLayers/Console.js",
            "OpenLayers/Tween.js",
            "Rico/Corner.js",
            "Rico/Color.js",
            "OpenLayers/Ajax.js",
            "OpenLayers/Events.js",
            "OpenLayers/Request.js",
            "OpenLayers/Request/XMLHttpRequest.js",
            "OpenLayers/Projection.js",
            "OpenLayers/Map.js",
            "OpenLayers/Layer.js",
            "OpenLayers/Icon.js",
            "OpenLayers/Marker.js",
            "OpenLayers/Marker/Box.js",
            "OpenLayers/Popup.js",
            "OpenLayers/Tile.js",
            "OpenLayers/Tile/Image.js",
            "OpenLayers/Tile/Image/IFrame.js",
            "OpenLayers/Tile/WFS.js",
            "OpenLayers/Layer/Image.js",
            "OpenLayers/Layer/SphericalMercator.js",
            "OpenLayers/Layer/EventPane.js",
            "OpenLayers/Layer/FixedZoomLevels.js",
            "OpenLayers/Layer/Google.js",
            "OpenLayers/Layer/Google/v3.js",
            "OpenLayers/Layer/VirtualEarth.js",
            "OpenLayers/Layer/Yahoo.js",
            "OpenLayers/Layer/HTTPRequest.js",
            "OpenLayers/Layer/Grid.js",
            "OpenLayers/Layer/MapGuide.js",
            "OpenLayers/Layer/MapServer.js",
            "OpenLayers/Layer/MapServer/Untiled.js",
            "OpenLayers/Layer/KaMap.js",
            "OpenLayers/Layer/KaMapCache.js",
            "OpenLayers/Layer/MultiMap.js",
            "OpenLayers/Layer/Markers.js",
            "OpenLayers/Layer/Text.js",
            "OpenLayers/Layer/WorldWind.js",
            "OpenLayers/Layer/ArcGIS93Rest.js",
            "OpenLayers/Layer/WMS.js",
            "OpenLayers/Layer/WMS/Untiled.js",
            "OpenLayers/Layer/WMS/Post.js",
            "OpenLayers/Layer/WMTS.js",
            "OpenLayers/Layer/ArcIMS.js",
            "OpenLayers/Layer/GeoRSS.js",
            "OpenLayers/Layer/Boxes.js",
            "OpenLayers/Layer/XYZ.js",
            "OpenLayers/Layer/TMS.js",
            "OpenLayers/Layer/TileCache.js",
            "OpenLayers/Layer/Zoomify.js",
            "OpenLayers/Popup/Anchored.js",
            "OpenLayers/Popup/AnchoredBubble.js",
            "OpenLayers/Popup/Framed.js",
            "OpenLayers/Popup/FramedCloud.js",
            "OpenLayers/Feature.js",
            "OpenLayers/Feature/Vector.js",
            "OpenLayers/Feature/WFS.js",
            "OpenLayers/Handler.js",
            "OpenLayers/Handler/Click.js",
            "OpenLayers/Handler/Hover.js",
            "OpenLayers/Handler/Point.js",
            "OpenLayers/Handler/Path.js",
            "OpenLayers/Handler/Polygon.js",
            "OpenLayers/Handler/Feature.js",
            "OpenLayers/Handler/Drag.js",
            "OpenLayers/Handler/RegularPolygon.js",
            "OpenLayers/Handler/Box.js",
            "OpenLayers/Handler/MouseWheel.js",
            "OpenLayers/Handler/Keyboard.js",
            "OpenLayers/Control.js",
            "OpenLayers/Control/Attribution.js",
            "OpenLayers/Control/Button.js",
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
            "OpenLayers/Control/ScaleLine.js",
            "OpenLayers/Control/Snapping.js",
            "OpenLayers/Control/Split.js",
            "OpenLayers/Control/LayerSwitcher.js",
            "OpenLayers/Control/DrawFeature.js",
            "OpenLayers/Control/DragFeature.js",
            "OpenLayers/Control/ModifyFeature.js",
            "OpenLayers/Control/Panel.js",
            "OpenLayers/Control/SelectFeature.js",
            "OpenLayers/Control/NavigationHistory.js",
            "OpenLayers/Control/Measure.js",
            "OpenLayers/Control/WMSGetFeatureInfo.js",
            "OpenLayers/Control/WMTSGetFeatureInfo.js",
            "OpenLayers/Control/Graticule.js",
            "OpenLayers/Control/TransformFeature.js",
            "OpenLayers/Control/SLDSelect.js",
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
            "OpenLayers/Renderer/Canvas.js",
            "OpenLayers/Renderer/VML.js",
            "OpenLayers/Layer/Vector.js",
            "OpenLayers/Layer/Vector/RootContainer.js",
            "OpenLayers/Strategy.js",
            "OpenLayers/Strategy/Filter.js",
            "OpenLayers/Strategy/Fixed.js",
            "OpenLayers/Strategy/Cluster.js",
            "OpenLayers/Strategy/Paging.js",
            "OpenLayers/Strategy/BBOX.js",
            "OpenLayers/Strategy/Save.js",
            "OpenLayers/Strategy/Refresh.js",
            "OpenLayers/Filter.js",
            "OpenLayers/Filter/FeatureId.js",
            "OpenLayers/Filter/Logical.js",
            "OpenLayers/Filter/Comparison.js",
            "OpenLayers/Filter/Spatial.js",
            "OpenLayers/Protocol.js",
            "OpenLayers/Protocol/HTTP.js",
            "OpenLayers/Protocol/SQL.js",
            "OpenLayers/Protocol/SQL/Gears.js",
            "OpenLayers/Protocol/WFS.js",
            "OpenLayers/Protocol/WFS/v1.js",
            "OpenLayers/Protocol/WFS/v1_0_0.js",
            "OpenLayers/Protocol/WFS/v1_1_0.js",
            "OpenLayers/Protocol/SOS.js",
            "OpenLayers/Protocol/SOS/v1_0_0.js",
            "OpenLayers/Layer/PointTrack.js",
            "OpenLayers/Layer/GML.js",
            "OpenLayers/Style.js",
            "OpenLayers/Style2.js",
            "OpenLayers/StyleMap.js",
            "OpenLayers/Rule.js",
            "OpenLayers/Format.js",
            "OpenLayers/Format/XML.js",
            "OpenLayers/Format/Context.js",
            "OpenLayers/Format/ArcXML.js",
            "OpenLayers/Format/ArcXML/Features.js",
            "OpenLayers/Format/GML.js",
            "OpenLayers/Format/GML/Base.js",
            "OpenLayers/Format/GML/v2.js",
            "OpenLayers/Format/GML/v3.js",
            "OpenLayers/Format/Atom.js",
            "OpenLayers/Format/KML.js",
            "OpenLayers/Format/GeoRSS.js",
            "OpenLayers/Format/WFS.js",
            "OpenLayers/Format/WFSCapabilities.js",
            "OpenLayers/Format/WFSCapabilities/v1.js",
            "OpenLayers/Format/WFSCapabilities/v1_0_0.js",
            "OpenLayers/Format/WFSCapabilities/v1_1_0.js",
            "OpenLayers/Format/WFSDescribeFeatureType.js",
            "OpenLayers/Format/WMSDescribeLayer.js",
            "OpenLayers/Format/WMSDescribeLayer/v1_1.js",
            "OpenLayers/Format/WKT.js",
            "OpenLayers/Format/OSM.js",
            "OpenLayers/Format/GPX.js",
            "OpenLayers/Format/Filter.js",
            "OpenLayers/Format/Filter/v1.js",
            "OpenLayers/Format/Filter/v1_0_0.js",
            "OpenLayers/Format/Filter/v1_1_0.js",
            "OpenLayers/Format/SLD.js",
            "OpenLayers/Format/SLD/v1.js",
            "OpenLayers/Format/SLD/v1_0_0.js",
            "OpenLayers/Format/OWSCommon/v1.js",
            "OpenLayers/Format/OWSCommon/v1_0_0.js",
            "OpenLayers/Format/OWSCommon/v1_1_0.js",
            "OpenLayers/Format/CSWGetDomain.js",
            "OpenLayers/Format/CSWGetDomain/v2_0_2.js",
            "OpenLayers/Format/CSWGetRecords.js",
            "OpenLayers/Format/CSWGetRecords/v2_0_2.js",
            "OpenLayers/Format/WFST.js",
            "OpenLayers/Format/WFST/v1.js",
            "OpenLayers/Format/WFST/v1_0_0.js",
            "OpenLayers/Format/WFST/v1_1_0.js",
            "OpenLayers/Format/Text.js",
            "OpenLayers/Format/JSON.js",
            "OpenLayers/Format/GeoJSON.js",
            "OpenLayers/Format/WMC.js",
            "OpenLayers/Format/WMC/v1.js",
            "OpenLayers/Format/WMC/v1_0_0.js",
            "OpenLayers/Format/WMC/v1_1_0.js",
            "OpenLayers/Format/WMSCapabilities.js",
            "OpenLayers/Format/WMSCapabilities/v1.js",
            "OpenLayers/Format/WMSCapabilities/v1_1.js",
            "OpenLayers/Format/WMSCapabilities/v1_1_0.js",
            "OpenLayers/Format/WMSCapabilities/v1_1_1.js",
            "OpenLayers/Format/WMSCapabilities/v1_3.js",
            "OpenLayers/Format/WMSCapabilities/v1_3_0.js",
            "OpenLayers/Format/WMSGetFeatureInfo.js",
            "OpenLayers/Format/SOSCapabilities.js",
            "OpenLayers/Format/SOSCapabilities/v1_0_0.js",
            "OpenLayers/Format/SOSGetObservation.js",
            "OpenLayers/Format/SOSGetFeatureOfInterest.js",
            "OpenLayers/Format/OWSContext.js",
            "OpenLayers/Format/OWSContext/v0_3_1.js",
            "OpenLayers/Format/WMTSCapabilities.js",
            "OpenLayers/Format/WMTSCapabilities/v1_0_0.js",
            "OpenLayers/Layer/WFS.js",
            "OpenLayers/Control/GetFeature.js",
            "OpenLayers/Control/MouseToolbar.js",
            "OpenLayers/Control/NavToolbar.js",
            "OpenLayers/Control/PanPanel.js",
            "OpenLayers/Control/Pan.js",
            "OpenLayers/Control/ZoomIn.js",
            "OpenLayers/Control/ZoomOut.js",
            "OpenLayers/Control/ZoomPanel.js",
            "OpenLayers/Control/EditingToolbar.js",
            "OpenLayers/Symbolizer.js",
            "OpenLayers/Symbolizer/Point.js",
            "OpenLayers/Symbolizer/Line.js",
            "OpenLayers/Symbolizer/Polygon.js",
            "OpenLayers/Symbolizer/Text.js",
            "OpenLayers/Symbolizer/Raster.js",
            "OpenLayers/Lang.js",
            "OpenLayers/Lang/en.js"
        ); // etc.

        var agent = navigator.userAgent;
        var docWrite = (agent.match("MSIE") || agent.match("Safari"));
        if(docWrite) {
            var allScriptTags = new Array(jsfiles.length);
        }
        var host = OpenLayers._getScriptLocation() + "lib/";    
        for (var i=0, len=jsfiles.length; i<len; i++) {
            if (docWrite) {
                allScriptTags[i] = "<script src='" + host + jsfiles[i] +
                                   "'></script>"; 
            } else {
                var s = document.createElement("script");
                s.src = host + jsfiles[i];
                var h = document.getElementsByTagName("head").length ? 
                           document.getElementsByTagName("head")[0] : 
                           document.body;
                h.appendChild(s);
            }
        }
        if (docWrite) {
            document.write(allScriptTags.join(""));
        }
    }
})();

/**
 * Constant: VERSION_NUMBER
 */
OpenLayers.VERSION_NUMBER="OpenLayers 2.10 -- $Revision$";
