/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile.js
 * @requires OpenLayers/Format/JSON.js
 * @requires OpenLayers/Request.js
 */

/**
 * Class: OpenLayers.Tile.UTFGrid
 * Instances of OpenLayers.Tile.UTFGrid are used to manage 
 * UTFGrids. This is an unusual tile type in that it doesn't have a
 * rendered image; only a 'hit grid' that can be used to 
 * look up feature attributes.
 *
 * See the <OpenLayers.Tile.UTFGrid> constructor for details on constructing a
 * new instance.
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.UTFGrid = OpenLayers.Class(OpenLayers.Tile, {

    /** 
     * Property: url
     * {String}
     * The URL of the UTFGrid file being requested. Provided by the <getURL>
     *     method. 
     */
    url: null,
    
    /**
     * Property: utfgridResolution
     * {Number}
     * Ratio of the pixel width to the width of a UTFGrid data point.  If an 
     *     entry in the grid represents a 4x4 block of pixels, the 
     *     utfgridResolution would be 4.  Default is 2.
     */
    utfgridResolution: 2,
    
    /** 
     * Property: json
     * {Object}
     * Stores the parsed JSON tile data structure. 
     */
    json: null,
    
    /** 
     * Property: format
     * {OpenLayers.Format.JSON}
     * Parser instance used to parse JSON for cross browser support.  The native
     *     JSON.parse method will be used where available (all except IE<8).
     */
    format: null,

    /** 
     * Constructor: OpenLayers.Tile.UTFGrid
     * Constructor for a new <OpenLayers.Tile.UTFGrid> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>} Deprecated. Remove me in 3.0.
     * size - {<OpenLayers.Size>}
     * options - {Object}
     */

    /** 
     * APIMethod: destroy
     * Clean up.
     */
    destroy: function() {
        this.clear();
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * In the case of UTFGrids, "drawing" it means fetching and
     * parsing the json. 
     * 
     * Returns:
     * {Boolean} Was a tile drawn?
     */
    draw: function() {
        var drawn = OpenLayers.Tile.prototype.draw.apply(this, arguments);
        if (drawn) {
            if (this.isLoading) {
                this.abortLoading();
                //if we're already loading, send 'reload' instead of 'loadstart'.
                this.events.triggerEvent("reload"); 
            } else {
                this.isLoading = true;
                this.events.triggerEvent("loadstart");
            }
            this.url = this.layer.getURL(this.bounds);

            if (this.layer.useJSONP) {
                // Use JSONP method to avoid xbrowser policy
                var ols = new OpenLayers.Protocol.Script({
                    url: this.url,
                    callback: function(response) {
                        this.isLoading = false;
                        this.events.triggerEvent("loadend");
                        this.json = response.data;
                    },
                    scope: this
                });
                ols.read();
                this.request = ols;
            } else {
                // Use standard XHR
                this.request = OpenLayers.Request.GET({
                    url: this.url,
                    callback: function(response) {
                        this.isLoading = false;
                        this.events.triggerEvent("loadend");
                        if (response.status === 200) {
                            this.parseData(response.responseText);
                        }
                    },
                    scope: this
                });
            }
        } else {
            this.unload();
        }
        return drawn;
    },
    
    /**
     * Method: abortLoading
     * Cancel a pending request.
     */
    abortLoading: function() {
        if (this.request) {
            this.request.abort();
            delete this.request;
        }
        this.isLoading = false;
    },
    
    /**
     * Method: getFeatureInfo
     * Get feature information associated with a pixel offset.  If the pixel
     *     offset corresponds to a feature, the returned object will have id
     *     and data properties.  Otherwise, null will be returned.
     *     
     *
     * Parameters:
     * i - {Number} X-axis pixel offset (from top left of tile)
     * j - {Number} Y-axis pixel offset (from top left of tile)
     *
     * Returns:
     * {Object} Object with feature id and data properties corresponding to the 
     *     given pixel offset.
     */
    getFeatureInfo: function(i, j) {
        var info = null;
        if (this.json) {
            var id = this.getFeatureId(i, j);
            if (id !== null) {
                info = {id: id, data: this.json.data[id]};
            }
        }
        return info;
    },
    
    /**
     * Method: getFeatureId
     * Get the identifier for the feature associated with a pixel offset.
     *
     * Parameters:
     * i - {Number} X-axis pixel offset (from top left of tile)
     * j - {Number} Y-axis pixel offset (from top left of tile)
     *
     * Returns:
     * {Object} The feature identifier corresponding to the given pixel offset.
     *     Returns null if pixel doesn't correspond to a feature.
     */
    getFeatureId: function(i, j) {
        var id = null;
        if (this.json) {
            var resolution = this.utfgridResolution;
            var row = Math.floor(j / resolution);
            var col = Math.floor(i / resolution);
            var charCode = this.json.grid[row].charCodeAt(col);
            var index = this.indexFromCharCode(charCode);
            var keys = this.json.keys;
            if (!isNaN(index) && (index in keys)) {
                id = keys[index];
            }
        }
        return id;
    },
    
    /**
     * Method: indexFromCharCode
     * Given a character code for one of the UTFGrid "grid" characters, 
     *     resolve the integer index for the feature id in the UTFGrid "keys"
     *     array.
     *
     * Parameters:
     * charCode - {Integer}
     *
     * Returns:
     * {Integer} Index for the feature id from the keys array.
     */
    indexFromCharCode: function(charCode) {
        if (charCode >= 93) {
            charCode--;
        }
        if (charCode >= 35) {
            charCode --;
        }
        return charCode - 32;
    },
    
    /**
     * Method: parseData
     * Parse the JSON from a request
     *
     * Parameters:
     * str - {String} UTFGrid as a JSON string. 
     * 
     * Returns:
     * {Object} parsed javascript data
     */
    parseData: function(str) {
        if (!this.format) {
            this.format = new OpenLayers.Format.JSON();
        }
        this.json = this.format.read(str);
    },
    
    /** 
     * Method: clear
     * Delete data stored with this tile.
     */
    clear: function() {
        this.json = null;
    },
    
    CLASS_NAME: "OpenLayers.Tile.UTFGrid"

});
