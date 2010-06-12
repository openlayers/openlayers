/* Copyright (c) 2006-2009 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMTSCapabilities.js
 * @requires OpenLayers/Format/OWSCommon/v1_1_0.js
 */

/**
 * Class: OpenLayers.Format.WMTSCapabilities.v1_0_0
 * Read WMTS Capabilities version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMTSCapabilities>
 */
OpenLayers.Format.WMTSCapabilities.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.OWSCommon.v1_1_0, {
        
    /**
     * Property: version
     * {String} The parser version ("1.0.0").
     */
    version: "1.0.0",

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        wmts: "http://www.opengis.net/wmts/1.0",
        xlink: "http://www.w3.org/1999/xlink"
    },    
    
    /**
     * Property: defaultPrefix
     * {String} The default namespace alias for creating element nodes.
     */
    defaultPrefix: "wmts",

    /**
     * Constructor: OpenLayers.Format.WMTSCapabilities.v1_0_0
     * Create a new parser for WMTS capabilities version 1.0.0. 
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
        this.options = options;
    },

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return info about the WMTS.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Information about the SOS service.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var capabilities = {};
        this.readNode(data, capabilities);
        capabilities.version = this.version;
        return capabilities;
    },

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {        
        "wmts": {
            "Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Contents": function(node, obj) {
                obj.contents = {};                
                obj.contents.layers = [];
                obj.contents.tileMatrixSets = {};                
                this.readChildNodes(node, obj.contents);
            },
            "Layer": function(node, obj) {
                var layer = {
                    styles: [],
                    formats: [],
                    tileMatrixSetLinks: []
                };
                layer.layers = [];
                this.readChildNodes(node, layer);
                obj.layers.push(layer);
            },
            "Style": function(node, obj) {
                var style = {};
                style.isDefault = node.getAttribute("isDefault");
                this.readChildNodes(node, style);
                obj.styles.push(style);
            },
            "Format": function(node, obj) {
                obj.formats.push(this.getChildValue(node)); 
            },
            "TileMatrixSetLink": function(node, obj) {
                var tileMatrixSetLink = {};
                this.readChildNodes(node, tileMatrixSetLink);
                obj.tileMatrixSetLinks.push(tileMatrixSetLink);
            },
            "TileMatrixSet": function(node, obj) {
                // node could be child of wmts:Contents or wmts:TileMatrixSetLink
                // duck type wmts:Contents by looking for layers
                if (obj.layers) {
                    // TileMatrixSet as object type in schema
                    var tileMatrixSet = {};
                    tileMatrixSet.matrixIds = [];
                    this.readChildNodes(node, tileMatrixSet);
                    obj.tileMatrixSets[tileMatrixSet.identifier] = tileMatrixSet;
                } else {
                    // TileMatrixSet as string type in schema
                    obj.tileMatrixSet = this.getChildValue(node);
                }
            },
            "TileMatrix": function(node, obj) {
                var tileMatrix = {};
                this.readChildNodes(node, tileMatrix);
                obj.matrixIds.push(tileMatrix);
            },
            "ScaleDenominator": function(node, obj) {
                obj.scaleDenominator = parseFloat(this.getChildValue(node)); 
            },
            "TopLeftCorner": function(node, obj) {                
                var topLeftCorner = this.getChildValue(node);
                var coords = topLeftCorner.split(" ");
                obj.topLeftCorner = new OpenLayers.LonLat(parseFloat(coords[1]), parseFloat(coords[0]));
            },
            "TileWidth": function(node, obj) {
                obj.tileWidth = parseInt(this.getChildValue(node)); 
            },
            "TileHeight": function(node, obj) {
                obj.tileHeight = parseInt(this.getChildValue(node)); 
            },
            "MatrixWidth": function(node, obj) {
                obj.matrixWidth = parseInt(this.getChildValue(node)); 
            },
            "MatrixHeight": function(node, obj) {
                obj.matrixHeight = parseInt(this.getChildValue(node)); 
            },        
            // not used for now, can be added in the future though
            /*"Themes": function(node, obj) {
                obj.themes = [];
                this.readChildNodes(node, obj.themes);
            },
            "Theme": function(node, obj) {
                var theme = {};                
                this.readChildNodes(node, theme);
                obj.push(theme);
            },*/
            "WSDL": function(node, obj) {
                obj.wsdl = {};
                obj.wsdl.href = node.getAttribute("xlink:href");
                // TODO: other attributes of <WSDL> element                
            },
            "ServiceMetadataURL": function(node, obj) {
                obj.serviceMetadataUrl = {};
                obj.serviceMetadataUrl.href = node.getAttribute("xlink:href");
                // TODO: other attributes of <ServiceMetadataURL> element                
            }            
        },
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    },    
    
    CLASS_NAME: "OpenLayers.Format.WMTSCapabilities.v1_0_0" 

});
