/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/* 
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/Lang/en.js
 * @requires OpenLayers/Console.js
 */
 
/*
 * TODO: In 3.0, we will stop supporting build profiles that include
 * OpenLayers.js. This means we will not need the singleFile and scriptFile
 * variables, because we don't have to handle the singleFile case any more.
 */

(function() {
    /**
     * Before creating the OpenLayers namespace, check to see if
     * OpenLayers.singleFile is true.  This occurs if the
     * OpenLayers/SingleFile.js script is included before this one - as is the
     * case with old single file build profiles that included both
     * OpenLayers.js and OpenLayers/SingleFile.js.
     */
    var singleFile = (typeof OpenLayers == "object" && OpenLayers.singleFile);
    
    /**
     * Relative path of this script.
     */
    var scriptName = (!singleFile) ? "lib/OpenLayers.js" : "OpenLayers.js";

    /*
     * If window.OpenLayers isn't set when this script (OpenLayers.js) is
     * evaluated (and if singleFile is false) then this script will load
     * *all* OpenLayers scripts. If window.OpenLayers is set to an array
     * then this script will attempt to load scripts for each string of
     * the array, using the string as the src of the script.
     *
     * Example:
     * (code)
     *     <script type="text/javascript">
     *         window.OpenLayers = [
     *             "OpenLayers/Util.js",
     *             "OpenLayers/BaseTypes.js"
     *         ];
     *     </script>
     *     <script type="text/javascript" src="../lib/OpenLayers.js"></script>
     * (end)
     * In this example OpenLayers.js will load Util.js and BaseTypes.js only.
     */
    var jsFiles = window.OpenLayers;

    /**
     * Namespace: OpenLayers
     * The OpenLayers object provides a namespace for all things OpenLayers
     */
    window.OpenLayers = {
        /**
         * Method: _getScriptLocation
         * Return the path to this script. This is also implemented in
         * OpenLayers/SingleFile.js
         *
         * Returns:
         * {String} Path to this script
         */
        _getScriptLocation: (function() {
            var r = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)"),
                s = document.getElementsByTagName('script'),
                src, m, l = "";
            for(var i=0, len=s.length; i<len; i++) {
                src = s[i].getAttribute('src');
                if(src) {
                    m = src.match(r);
                    if(m) {
                        l = m[1];
                        break;
                    }
                }
            }
            return (function() { return l; });
        })(),
        
        /**
         * APIProperty: ImgPath
         * {String} Set this to the path where control images are stored, a path  
         * given here must end with a slash. If set to '' (which is the default) 
         * OpenLayers will use its script location + "img/".
         * 
         * You will need to set this property when you have a singlefile build of 
         * OpenLayers that either is not named "OpenLayers.js" or if you move
         * the file in a way such that the image directory cannot be derived from 
         * the script location.
         * 
         * If your custom OpenLayers build is named "my-custom-ol.js" and the images
         * of OpenLayers are in a folder "/resources/external/images/ol" a correct
         * way of including OpenLayers in your HTML would be:
         * 
         * (code)
         *   <script src="/path/to/my-custom-ol.js" type="text/javascript"></script>
         *   <script type="text/javascript">
         *      // tell OpenLayers where the control images are
         *      // remember the trailing slash
         *      OpenLayers.ImgPath = "/resources/external/images/ol/";
         *   </script>
         * (end code)
         * 
         * Please remember that when your OpenLayers script is not named 
         * "OpenLayers.js" you will have to make sure that the default theme is 
         * loaded into the page by including an appropriate <link>-tag, 
         * e.g.:
         * 
         * (code)
         *   <link rel="stylesheet" href="/path/to/default/style.css"  type="text/css">
         * (end code)
         */
        ImgPath : ''
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
        if (!jsFiles) {
            jsFiles = [
                "OpenLayers/BaseTypes/Class.js",
                "OpenLayers/Util.js",
                "OpenLayers/Util/vendorPrefix.js",
                "OpenLayers/Animation.js",
                "OpenLayers/BaseTypes.js",
                "OpenLayers/BaseTypes/Bounds.js",
                "OpenLayers/BaseTypes/Date.js",
                "OpenLayers/BaseTypes/Element.js",
                "OpenLayers/BaseTypes/LonLat.js",
                "OpenLayers/BaseTypes/Pixel.js",
                "OpenLayers/BaseTypes/Size.js",
                "OpenLayers/Console.js",
                "OpenLayers/Tween.js",
                "OpenLayers/Kinetic.js",
                "OpenLayers/Events.js",
                "OpenLayers/Events/buttonclick.js",
                "OpenLayers/Events/featureclick.js",
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
                "OpenLayers/Tile/UTFGrid.js",
                "OpenLayers/Layer/Image.js",
                "OpenLayers/Layer/SphericalMercator.js",
                "OpenLayers/Layer/EventPane.js",
                "OpenLayers/Layer/FixedZoomLevels.js",
                "OpenLayers/Layer/Google.js",
                "OpenLayers/Layer/Google/v3.js",
                "OpenLayers/Layer/HTTPRequest.js",
                "OpenLayers/Layer/Grid.js",
                "OpenLayers/Layer/MapGuide.js",
                "OpenLayers/Layer/MapServer.js",
                "OpenLayers/Layer/KaMap.js",
                "OpenLayers/Layer/KaMapCache.js",
                "OpenLayers/Layer/Markers.js",
                "OpenLayers/Layer/Text.js",
                "OpenLayers/Layer/WorldWind.js",
                "OpenLayers/Layer/ArcGIS93Rest.js",
                "OpenLayers/Layer/WMS.js",
                "OpenLayers/Layer/WMTS.js",
                "OpenLayers/Layer/ArcIMS.js",
                "OpenLayers/Layer/GeoRSS.js",
                "OpenLayers/Layer/Boxes.js",
                "OpenLayers/Layer/XYZ.js",
                "OpenLayers/Layer/UTFGrid.js",
                "OpenLayers/Layer/OSM.js",
                "OpenLayers/Layer/Bing.js",
                "OpenLayers/Layer/TMS.js",
                "OpenLayers/Layer/TileCache.js",
                "OpenLayers/Layer/Zoomify.js",
                "OpenLayers/Layer/ArcGISCache.js",
                "OpenLayers/Popup/Anchored.js",
                "OpenLayers/Popup/Framed.js",
                "OpenLayers/Popup/FramedCloud.js",
                "OpenLayers/Feature.js",
                "OpenLayers/Feature/Vector.js",
                "OpenLayers/Handler.js",
                "OpenLayers/Handler/Click.js",
                "OpenLayers/Handler/Hover.js",
                "OpenLayers/Handler/Point.js",
                "OpenLayers/Handler/Path.js",
                "OpenLayers/Handler/Polygon.js",
                "OpenLayers/Handler/Feature.js",
                "OpenLayers/Handler/Drag.js",
                "OpenLayers/Handler/Pinch.js",
                "OpenLayers/Handler/RegularPolygon.js",
                "OpenLayers/Handler/Box.js",
                "OpenLayers/Handler/MouseWheel.js",
                "OpenLayers/Handler/Keyboard.js",
                "OpenLayers/Control.js",
                "OpenLayers/Control/Attribution.js",
                "OpenLayers/Control/Button.js",
                "OpenLayers/Control/CacheRead.js",
                "OpenLayers/Control/CacheWrite.js",
                "OpenLayers/Control/ZoomBox.js",
                "OpenLayers/Control/ZoomToMaxExtent.js",
                "OpenLayers/Control/DragPan.js",
                "OpenLayers/Control/Navigation.js",
                "OpenLayers/Control/PinchZoom.js",
                "OpenLayers/Control/TouchNavigation.js",
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
                "OpenLayers/Control/UTFGrid.js",
                "OpenLayers/Control/SLDSelect.js",
                "OpenLayers/Control/Zoom.js",
                "OpenLayers/Geometry.js",
                "OpenLayers/Geometry/Collection.js",
                "OpenLayers/Geometry/Point.js",
                "OpenLayers/Geometry/MultiPoint.js",
                "OpenLayers/Geometry/Curve.js",
                "OpenLayers/Geometry/LineString.js",
                "OpenLayers/Geometry/LinearRing.js",
                "OpenLayers/Geometry/Polygon.js",
                "OpenLayers/Geometry/MultiLineString.js",
                "OpenLayers/Geometry/MultiPolygon.js",
                "OpenLayers/Renderer.js",
                "OpenLayers/Renderer/Elements.js",
                "OpenLayers/Renderer/SVG.js",
                "OpenLayers/Renderer/Canvas.js",
                "OpenLayers/Renderer/VML.js",
                "OpenLayers/Layer/Vector.js",
                "OpenLayers/Layer/PointGrid.js",
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
                "OpenLayers/Filter/Function.js",                
                "OpenLayers/Protocol.js",
                "OpenLayers/Protocol/HTTP.js",
                "OpenLayers/Protocol/WFS.js",
                "OpenLayers/Protocol/WFS/v1.js",
                "OpenLayers/Protocol/WFS/v1_0_0.js",
                "OpenLayers/Protocol/WFS/v1_1_0.js",
                "OpenLayers/Protocol/CSW.js", 
                "OpenLayers/Protocol/CSW/v2_0_2.js",
                "OpenLayers/Protocol/Script.js",
                "OpenLayers/Protocol/SOS.js",
                "OpenLayers/Protocol/SOS/v1_0_0.js",
                "OpenLayers/Layer/PointTrack.js",
                "OpenLayers/Style.js",
                "OpenLayers/Style2.js",
                "OpenLayers/StyleMap.js",
                "OpenLayers/Rule.js",
                "OpenLayers/Format.js",
                "OpenLayers/Format/QueryStringFilter.js",
                "OpenLayers/Format/XML.js",
                "OpenLayers/Format/XML/VersionedOGC.js",
                "OpenLayers/Format/Context.js",
                "OpenLayers/Format/ArcXML.js",
                "OpenLayers/Format/ArcXML/Features.js",
                "OpenLayers/Format/GML.js",
                "OpenLayers/Format/GML/Base.js",
                "OpenLayers/Format/GML/v2.js",
                "OpenLayers/Format/GML/v3.js",
                "OpenLayers/Format/Atom.js",
                "OpenLayers/Format/EncodedPolyline.js",
                "OpenLayers/Format/KML.js",
                "OpenLayers/Format/GeoRSS.js",
                "OpenLayers/Format/WFS.js",
                "OpenLayers/Format/OWSCommon.js",
                "OpenLayers/Format/OWSCommon/v1.js",
                "OpenLayers/Format/OWSCommon/v1_0_0.js",
                "OpenLayers/Format/OWSCommon/v1_1_0.js",
                "OpenLayers/Format/WCSCapabilities.js",
                "OpenLayers/Format/WCSCapabilities/v1.js",
                "OpenLayers/Format/WCSCapabilities/v1_0_0.js",
                "OpenLayers/Format/WCSCapabilities/v1_1_0.js",
                "OpenLayers/Format/WFSCapabilities.js",
                "OpenLayers/Format/WFSCapabilities/v1.js",
                "OpenLayers/Format/WFSCapabilities/v1_0_0.js",
                "OpenLayers/Format/WFSCapabilities/v1_1_0.js",
                "OpenLayers/Format/WFSDescribeFeatureType.js",
                "OpenLayers/Format/WMSDescribeLayer.js",
                "OpenLayers/Format/WMSDescribeLayer/v1_1.js",
                "OpenLayers/Format/WKT.js",
                "OpenLayers/Format/CQL.js",
                "OpenLayers/Format/OSM.js",
                "OpenLayers/Format/GPX.js",
                "OpenLayers/Format/Filter.js",
                "OpenLayers/Format/Filter/v1.js",
                "OpenLayers/Format/Filter/v1_0_0.js",
                "OpenLayers/Format/Filter/v1_1_0.js",
                "OpenLayers/Format/SLD.js",
                "OpenLayers/Format/SLD/v1.js",
                "OpenLayers/Format/SLD/v1_0_0.js",
                "OpenLayers/Format/SLD/v1_0_0_GeoServer.js",
                "OpenLayers/Format/OWSCommon.js",
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
                "OpenLayers/Format/WCSGetCoverage.js",
                "OpenLayers/Format/WMSCapabilities.js",
                "OpenLayers/Format/WMSCapabilities/v1.js",
                "OpenLayers/Format/WMSCapabilities/v1_1.js",
                "OpenLayers/Format/WMSCapabilities/v1_1_0.js",
                "OpenLayers/Format/WMSCapabilities/v1_1_1.js",
                "OpenLayers/Format/WMSCapabilities/v1_3.js",
                "OpenLayers/Format/WMSCapabilities/v1_3_0.js",
                "OpenLayers/Format/WMSCapabilities/v1_1_1_WMSC.js",
                "OpenLayers/Format/WMSGetFeatureInfo.js",
                "OpenLayers/Format/SOSCapabilities.js",
                "OpenLayers/Format/SOSCapabilities/v1_0_0.js",
                "OpenLayers/Format/SOSGetFeatureOfInterest.js",
                "OpenLayers/Format/SOSGetObservation.js",
                "OpenLayers/Format/OWSContext.js",
                "OpenLayers/Format/OWSContext/v0_3_1.js",
                "OpenLayers/Format/WMTSCapabilities.js",
                "OpenLayers/Format/WMTSCapabilities/v1_0_0.js",
                "OpenLayers/Format/WPSCapabilities.js",
                "OpenLayers/Format/WPSCapabilities/v1_0_0.js",
                "OpenLayers/Format/WPSDescribeProcess.js",
                "OpenLayers/Format/WPSExecute.js",
                "OpenLayers/Format/XLS.js",
                "OpenLayers/Format/XLS/v1.js",
                "OpenLayers/Format/XLS/v1_1_0.js",
                "OpenLayers/Format/OGCExceptionReport.js",
                "OpenLayers/Control/GetFeature.js",
                "OpenLayers/Control/NavToolbar.js",
                "OpenLayers/Control/PanPanel.js",
                "OpenLayers/Control/Pan.js",
                "OpenLayers/Control/ZoomIn.js",
                "OpenLayers/Control/ZoomOut.js",
                "OpenLayers/Control/ZoomPanel.js",
                "OpenLayers/Control/EditingToolbar.js",
                "OpenLayers/Control/Geolocate.js",
                "OpenLayers/Symbolizer.js",
                "OpenLayers/Symbolizer/Point.js",
                "OpenLayers/Symbolizer/Line.js",
                "OpenLayers/Symbolizer/Polygon.js",
                "OpenLayers/Symbolizer/Text.js",
                "OpenLayers/Symbolizer/Raster.js",
                "OpenLayers/Lang.js",
                "OpenLayers/Lang/en.js",
                "OpenLayers/Spherical.js",
                "OpenLayers/TileManager.js",
                "OpenLayers/WPSClient.js",
                "OpenLayers/WPSProcess.js"
            ]; // etc.
        }

        // use "parser-inserted scripts" for guaranteed execution order
        // http://hsivonen.iki.fi/script-execution/
        var scriptTags = new Array(jsFiles.length);
        var host = OpenLayers._getScriptLocation() + "lib/";
        for (var i=0, len=jsFiles.length; i<len; i++) {
            scriptTags[i] = "<script src='" + host + jsFiles[i] +
                                   "'></script>"; 
        }
        if (scriptTags.length > 0) {
            document.write(scriptTags.join(""));
        }
    }
})();

/**
 * Constant: VERSION_NUMBER
 *
 * This constant identifies the version of OpenLayers.
 *
 * When asking questions or reporting issues, make sure to include the output of
 *     OpenLayers.VERSION_NUMBER in the question or issue-description.
 */
OpenLayers.VERSION_NUMBER="Release 2.13.1";
