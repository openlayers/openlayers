/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Tile.js
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
     * Property: json
     * {Object}
     * Stores the parsed JSON tile data structure. 
     */
    json: null,

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
     * nullify references to prevent circular references and memory leaks
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
                        this.json = response.data;
                    },
                    scope: this
                });
                ols.read();
            } else {
                // Use standard XHR
                OpenLayers.Request.GET({
                    url: this.url,
                    callback: this.parseData,
                    scope: this
                });
            }
        } else {
            this.unload();
        }
        return drawn;
    },

    /**
     * Method: parseJSON
     * Parse the JSON from a request
     * 
     * Returns:
     * {Object} parsed javascript data
     */
    parseData: function(req) {
        if (req.status == 200) {
            var text = req.responseText;
            this.json = JSON.parse(text);
        } 
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
