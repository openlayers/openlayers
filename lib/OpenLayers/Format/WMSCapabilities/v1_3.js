/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities/v1.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities/v1_3
 * Abstract base class for WMS Capabilities version 1.3.X. 
 * SLD 1.1.0 adds in the extra operations DescribeLayer and GetLegendGraphic, 
 * see: http://schemas.opengis.net/sld/1.1.0/sld_capabilities.xsd
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMSCapabilities.v1>
 */
OpenLayers.Format.WMSCapabilities.v1_3 = OpenLayers.Class(
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
            "WMS_Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "LayerLimit": function(node, obj) {
                obj.layerLimit = parseInt(this.getChildValue(node));
            },
            "MaxWidth": function(node, obj) {
                obj.maxWidth = parseInt(this.getChildValue(node));
            },
            "MaxHeight": function(node, obj) {
                obj.maxHeight = parseInt(this.getChildValue(node));
            },
            "BoundingBox": function(node, obj) {
                var bbox = OpenLayers.Format.WMSCapabilities.v1.prototype.readers["wms"].BoundingBox.apply(this, [node, obj]);
                bbox.srs  = node.getAttribute("CRS");
                obj.bbox[bbox.srs] = bbox;
            },
            "CRS": function(node, obj) {
                // CRS is the synonym of SRS
                this.readers.wms.SRS.apply(this, [node, obj]); 
            },
            "EX_GeographicBoundingBox": function(node, obj) {
                // replacement of LatLonBoundingBox
                obj.llbbox = [];
                this.readChildNodes(node, obj.llbbox);
                
            },
            "westBoundLongitude": function(node, obj) {
                obj[0] = this.getChildValue(node);
            },
            "eastBoundLongitude": function(node, obj) {
                obj[2] = this.getChildValue(node);
            },
            "southBoundLatitude": function(node, obj) {
                obj[1] = this.getChildValue(node);
            },
            "northBoundLatitude": function(node, obj) {
                obj[3] = this.getChildValue(node);
            },
            "MinScaleDenominator": function(node, obj) {
                obj.maxScale = parseFloat(this.getChildValue(node)).toPrecision(16);
            },
            "MaxScaleDenominator": function(node, obj) {
                obj.minScale = parseFloat(this.getChildValue(node)).toPrecision(16);
            },
            "Dimension": function(node, obj) {
                // dimension has extra attributes: default, multipleValues, 
                // nearestValue, current which used to be part of Extent. It now
                // also contains the values.
                var name = node.getAttribute("name").toLowerCase();
                var dim = {
                    name: name,
                    units: node.getAttribute("units"),
                    unitsymbol: node.getAttribute("unitSymbol"),
                    nearestVal: node.getAttribute("nearestValue") === "1",
                    multipleVal: node.getAttribute("multipleValues") === "1",
                    "default": node.getAttribute("default") || "",
                    current: node.getAttribute("current") === "1",
                    values: this.getChildValue(node).split(",")
                    
                };
                // Theoretically there can be more dimensions with the same
                // name, but with a different unit. Until we meet such a case,
                // let's just keep the same structure as the WMS 1.1 
                // GetCapabilities parser uses. We will store the last
                // one encountered.
                obj.dimensions[dim.name] = dim;
            },
            "Keyword": function(node, obj) {
                // TODO: should we change the structure of keyword in v1.js?
                // Make it an object with a value instead of a string?
                var keyword = {value: this.getChildValue(node), 
                    vocabulary: node.getAttribute("vocabulary")};
                if (obj.keywords) {
                    obj.keywords.push(keyword);
                }
            }
        }, OpenLayers.Format.WMSCapabilities.v1.prototype.readers["wms"]),
        "sld": {
            "UserDefinedSymbolization": function(node, obj) {
                this.readers.wms.UserDefinedSymbolization.apply(this, [node, obj]);
                // add the two extra attributes
                obj.userSymbols.inlineFeature = parseInt(node.getAttribute("InlineFeature")) == 1;
                obj.userSymbols.remoteWCS = parseInt(node.getAttribute("RemoteWCS")) == 1;
            },
            "DescribeLayer": function(node, obj) {
                this.readers.wms.DescribeLayer.apply(this, [node, obj]);
            },
            "GetLegendGraphic": function(node, obj) {
                this.readers.wms.GetLegendGraphic.apply(this, [node, obj]);
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_3" 

});
