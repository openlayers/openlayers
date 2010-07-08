/* Copyright (c) 2006-2009 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Tile/Image.js
 */

/**
 * Class: OpenLayers.Layer.WMTS
 * Instances of the WMTS class allow viewing of tiles from a service that 
 *     implements the OGC WMTS specification version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.WMTS = OpenLayers.Class(OpenLayers.Layer.Grid, {
    
    /**
     * APIProperty: isBaseLayer
     * {Boolean} The layer will be considered a base layer.  Default is true.
     */
    isBaseLayer: true,

    /**
     * Property: version
     * {String} WMTS version.  Default is "1.0.0".
     */
    version: "1.0.0",
    
    /**
     * APIProperty: requestEncoding
     * {String} Request encoding.  Can be "REST" or "KVP".  Default is "KVP".
     */
    requestEncoding: "KVP",
    
    /**
     * APIProperty: url
     * {String} The base URL for the WMTS service.  Must be provided.
     */
    url: null,

    /**
     * APIProperty: layer
     * {String} The layer identifier advertised by the WMTS service.  Must be 
     *     provided.
     */
    layer: null,
    
    /** 
     * APIProperty: matrixSet
     * {String} One of the advertised matrix set identifiers.  Must be provided.
     */
    matrixSet: null,

    /** 
     * APIProperty: style
     * {String} One of the advertised layer styles.  Must be provided.
     */
    style: null,
    
    /** 
     * APIProperty: format
     * {String} The image MIME type.  Default is "image/jpeg".
     */
    format: "image/jpeg",
    
    /**
     * APIProperty: tileOrigin
     * {<OpenLayers.LonLat>} The top-left corner of the tile matrix in map 
     *     units.  If the tile origin for each matrix in a set is different,
     *     the <matrixIds> should include a topLeftCorner property.  If
     *     not provided, the tile origin will default to the top left corner
     *     of the layer <maxExtent>.
     */
    tileOrigin: null,
    
    /**
     * APIProperty: tileFullExtent
     * {<OpenLayers.Bounds>}  The full extent of the tile set.  If not supplied,
     *     the layer's <maxExtent> property will be used.
     */
    tileFullExtent: null,

    /**
     * APIProperty: formatSuffix
     * {String} For REST request encoding, an image format suffix must be 
     *     included in the request.  If not provided, the suffix will be derived
     *     from the <format> property.
     */
    formatSuffix: null,    

    /**
     * APIProperty: matrixIds
     * {Array} A list of tile matrix identifiers.  If not provided, the matrix
     *     identifiers will be assumed to be integers corresponding to the 
     *     map zoom level.  If a list of strings is provided, each item should
     *     be the matrix identifier that corresponds to the map zoom level.
     *     Additionally, a list of objects can be provided.  Each object should
     *     describe the matrix as presented in the WMTS capabilities.  These
     *     objects should have the propertes shown below.
     * 
     * Matrix properties:
     * identifier - {String} The matrix identifier (required).
     * topLeftCorner - {<OpenLayers.LonLat>} The top left corner of the 
     *     matrix.  Must be provided if different than the layer <tileOrigin>.
     * tileWidth - {Number} The tile width for the matrix.  Must be provided 
     *     if different than the width given in the layer <tileSize>.
     * tileHeight - {Number} The tile height for the matrix.  Must be provided 
     *     if different than the height given in the layer <tileSize>.
     */
    matrixIds: null,
    
    /**
     * APIProperty: dimensions
     * {Array} For RESTful request encoding, extra dimensions may be specified.
     *     Items in this list should be property names in the <params> object.
     *     Values of extra dimensions will be determined from the corresponding
     *     values in the <params> object.
     */
    dimensions: null,
    
    /**
     * APIProperty: params
     * {Object} Extra parameters to include in tile requests.  For KVP 
     *     <requestEncoding>, these properties will be encoded in the request 
     *     query string.  For REST <requestEncoding>, these properties will
     *     become part of the request path, with order determined by the 
     *     <dimensions> list.
     */
    params: null,    
    
    /**
     * Property: formatSuffixMap
     * {Object} a map between WMTS 'format' request parameter and tile image file suffix
     */
    formatSuffixMap: {
        "image/png": "png",
        "image/png8": "png",
        "image/png24": "png",
        "image/png32": "png",
        "png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "jpeg": "jpg",
        "jpg": "jpg"
    },
    
    /**
     * Constructor: OpenLayers.Layer.WMTS
     * Create a new WMTS layer.
     *
     * Example:
     * (code)
     * var wmts = new OpenLayers.Layer.WMTS({
     *     name: "My WMTS Layer",
     *     url: "http://example.com/wmts", 
     *     layer: "layer_id",
     *     style: "default",
     *     matrixSet: "matrix_id"
     * });
     * (end)
     *
     * Parameters:
     * config - {Object} Configuration properties for the layer.
     *
     * Required configuration properties:
     * url - {String} The base url for the service.  See the <url> property.
     * layer - {String} The layer identifier.  See the <layer> property.
     * style - {String} The layer style identifier.  See the <style> property.
     * matrixSet - {String} The tile matrix set identifier.  See the <matrixSet>
     *     property.
     *
     * Any other documented layer properties can be provided in the config object.
     */
    initialize: function(config) {
        config.params = OpenLayers.Util.upperCaseObject(config.params);
        var args = [config.name, config.url, config.params, config];
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, args);
        
        // confirm required properties are supplied
        var required = {
            url: true,
            layer: true,
            style: true,
            matrixSet: true
        };
        for (var prop in required) {
            if (!(prop in this)) {
                throw new Error("Missing property '" + prop + "' in layer configuration.");
            }
        }

        // determine format suffix (for REST)
        if (!this.formatSuffix) {
            this.formatSuffix = this.formatSuffixMap[this.format] || this.format.split("/").pop();            
        }

        // expand matrixIds (may be array of string or array of object)
        if (this.matrixIds) {
            var len = this.matrixIds.length;
            if (len && typeof this.matrixIds[0] === "string") {
                var ids = this.matrixIds;
                this.matrixIds = new Array(len);
                for (var i=0; i<len; ++i) {
                    this.matrixIds[i] = {identifier: ids[i]};
                }
            }
        }

    },
    
    /**
     * Method: updateMatrixProperties
     * Set as a listener for zoom end to update tile matrix related properties.
     */
    updateMatrixProperties: function() {
        if (this.matrixIds && this.matrixIds.length) {
            var zoom = this.map.getZoom();
            var matrix = this.matrixIds[zoom];
            if (matrix) {
                if (matrix.topLeftCorner) {
                    this.tileOrigin = matrix.topLeftCorner;
                }
                if (matrix.tileWidth && matrix.tileHeight) {
                    this.tileSize = new OpenLayers.Size(
                        matrix.tileWidth, matrix.tileHeight
                    );
                }
            }
        }
    },
    
    /**
     * Method: setMap
     * Overwrite default <setMap> from Layer
     *
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        this.map.events.on({
            zoomend: this.updateMatrixProperties,
            scope: this
        });
        this.updateMatrixProperties();
        if (!this.tileOrigin) { 
            this.tileOrigin = new OpenLayers.LonLat(this.maxExtent.left, this.maxExtent.top);
        }   
        if (!this.tileFullExtent) { 
            this.tileFullExtent = this.maxExtent;
        }
    },
    
    /** 
     * Method: removeMap
     */
    removeMap: function() {
        if (this.map) {
            this.map.events.un({
                zoomend: this.updateMatrixProperties,
                scope: this
            });
        }
        OpenLayers.Layer.Grid.prototype.removeMap.apply(this, arguments);        
    },

    /**
     * APIMethod: clone
     * 
     * Parameters:
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.WMTS>} An exact clone of this <OpenLayers.Layer.WMTS>
     */
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.WMTS(this.options);
        }
        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        // copy/set any non-init, non-simple values here
        return obj;
    },
    
    /**
     * Method: getMatrixId
     * Determine the appropriate matrix id for the given map resolution.
     */
    getMatrixId: function() {
        var id;
        var zoom = this.map.getZoom();
        if (!this.matrixIds || this.matrixIds.length === 0) {
            id = zoom;
        } else {
            // TODO: get appropriate matrix id given the map resolution
            id = this.matrixIds[zoom].identifier;
        }
        return id;
    },
    
    /**
     * Method: getURL
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * 
     * Returns:
     * {String} A URL for the tile corresponding to the given bounds.
     */
    getURL: function(bounds) {
        bounds = this.adjustBounds(bounds);
        var url = "";
        if (!this.tileFullExtent || this.tileFullExtent.intersectsBounds(bounds)) {            

            var res = this.map.getResolution();        
            var zoom = this.map.getZoom();
            var center = bounds.getCenterLonLat();

            var col = Math.floor((center.lon - this.tileOrigin.lon) / (res * this.tileSize.w));
            var row = Math.floor((this.tileOrigin.lat - center.lat) / (res * this.tileSize.h));
            
            var matrixId = this.getMatrixId();

            if (this.requestEncoding.toUpperCase() === "REST") {

                // include 'version', 'layer' and 'style' in tile resource url
                var path = this.version + "/" + this.layer + "/" + this.style + "/";

                // append optional dimension path elements
                if (this.dimensions) {
                    for (var i=0; i<this.dimensions.length; i++) {
                        if (this.params[this.dimensions[i]]) {
                            path = path + this.params[this.dimensions[i]] + "/";
                        }
                    }
                }

                // append other required path elements
                path = path + this.matrixSet + "/" + matrixId + "/" + row + "/" + col + "." + this.formatSuffix;
                
                if (this.url instanceof Array) {
                    url = this.selectUrl(path, this.url);
                } else {
                    url = this.url;
                }
                if (!url.match(/\/$/)) {
                    url = url + "/";
                }
                url = url + path;

            } else if (this.requestEncoding.toUpperCase() === "KVP") {

                // assemble all required parameters
                var params = {
                    SERVICE: "WMTS",
                    REQUEST: "GetTile",
                    VERSION: this.version,
                    LAYER: this.layer,
                    STYLE: this.style,
                    TILEMATRIXSET: this.matrixSet,
                    TILEMATRIX: matrixId,
                    TILEROW: row,
                    TILECOL: col,
                    FORMAT: this.format
                };
                url = OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(this, [params]);

            }
        }
        return url;    
    },
    
    /**
     * APIMethod: mergeNewParams
     * Extend the existing layer <params> with new properties.  Tiles will be
     *     reloaded with updated params in the request.
     * 
     * Parameters:
     * newParams - {Object} Properties to extend to existing <params>.
     */
    mergeNewParams: function(newParams) {
        if (this.requestEncoding.toUpperCase() === "KVP") {
            return OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(
                this, [OpenLayers.Util.upperCaseObject(newParams)]
            );
        }
    },

    /**
     * Method: addTile
     * Create a tile, initialize it, and add it to the layer div. 
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Tile.Image>} The added OpenLayers.Tile.Image
     */
    addTile: function(bounds,position) {
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                         null, this.tileSize);
    },

    CLASS_NAME: "OpenLayers.Layer.WMTS"
});
