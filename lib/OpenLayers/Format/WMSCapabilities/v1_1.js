/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities/v1.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities.v1_1
 * Abstract class not to be instantiated directly.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMSCapabilities.v1>
 */
OpenLayers.Format.WMSCapabilities.v1_1 = OpenLayers.Class(
    OpenLayers.Format.WMSCapabilities.v1, {
    
    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "wms": OpenLayers.Util.applyDefaults({
            "WMT_MS_Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Keyword": function(node, obj) {
                if (obj.keywords) {
                    obj.keywords.push(this.getChildValue(node));
                }
            },
            "DescribeLayer": function(node, obj) {
                obj.describelayer = {formats: []};
                this.readChildNodes(node, obj.describelayer);
            },
            "GetLegendGraphic": function(node, obj) {
                obj.getlegendgraphic = {formats: []};
                this.readChildNodes(node, obj.getlegendgraphic);
            },
            "GetStyles": function(node, obj) {
                obj.getstyles = {formats: []};
                this.readChildNodes(node, obj.getstyles);
            },
            "PutStyles": function(node, obj) {
                obj.putstyles = {formats: []};
                this.readChildNodes(node, obj.putstyles);
            },
            "UserDefinedSymbolization": function(node, obj) {
                var userSymbols = {
                    supportSLD: parseInt(node.getAttribute("SupportSLD")) == 1,
                    userLayer: parseInt(node.getAttribute("UserLayer")) == 1,
                    userStyle: parseInt(node.getAttribute("UserStyle")) == 1,
                    remoteWFS: parseInt(node.getAttribute("RemoteWFS")) == 1
                };
                obj.userSymbols = userSymbols;
            },
            "LatLonBoundingBox": function(node, obj) {
                obj.llbbox = [
                    parseFloat(node.getAttribute("minx")),
                    parseFloat(node.getAttribute("miny")),
                    parseFloat(node.getAttribute("maxx")),
                    parseFloat(node.getAttribute("maxy"))
                ];
            },
            "BoundingBox": function(node, obj) {
                var bbox = OpenLayers.Format.WMSCapabilities.v1.prototype.readers["wms"].BoundingBox.apply(this, [node, obj]);
                bbox.srs  = node.getAttribute("SRS");
                obj.bbox[bbox.srs] = bbox;
            },
            "ScaleHint": function(node, obj) {
                var min = node.getAttribute("min");
                var max = node.getAttribute("max");
                var rad2 = Math.pow(2, 0.5);
                var ipm = OpenLayers.INCHES_PER_UNIT["m"];
                obj.maxScale = parseFloat(
                    ((min / rad2) * ipm * 
                        OpenLayers.DOTS_PER_INCH).toPrecision(13)
                );
                obj.minScale = parseFloat(
                    ((max / rad2) * ipm * 
                        OpenLayers.DOTS_PER_INCH).toPrecision(13)
                );
            },
            "Dimension": function(node, obj) {
                var name = node.getAttribute("name").toLowerCase();
                var dim = {
                    name: name,
                    units: node.getAttribute("units"),
                    unitsymbol: node.getAttribute("unitSymbol")
                };
                obj.dimensions[dim.name] = dim;
            },
            "Extent": function(node, obj) {
                var name = node.getAttribute("name").toLowerCase();
                if (name in obj["dimensions"]) {
                    var extent = obj.dimensions[name];
                    extent.nearestVal = 
                        node.getAttribute("nearestValue") === "1";
                    extent.multipleVal = 
                        node.getAttribute("multipleValues") === "1";
                    extent.current = node.getAttribute("current") === "1";
                    extent["default"] = node.getAttribute("default") || "";
                    var values = this.getChildValue(node);
                    extent.values = values.split(",");
                }
                }
        }, OpenLayers.Format.WMSCapabilities.v1.prototype.readers["wms"])
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1" 

});
