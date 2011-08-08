/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Tile.js
 */

/*
 * Class: OpenLayers.Tile.Google
 * Instances of OpenLayers.Tile.Google are used to manage the tiles created
 * by google.maps.MapType (see
 * http://code.google.com/apis/maps/documentation/javascript/reference.html#MapType).
 *
 * Inherits from:
 *  - <OpenLayers.Tile>
 */
OpenLayers.Tile.Google = OpenLayers.Class(OpenLayers.Tile, {
    
    /**
     * Property: node
     * {DOMElement} The tile node from the MapType's getTile method
     */
    node: null,
        
    /** 
     * Constructor: OpenLayers.Tile.Google
     * Constructor for a new <OpenLayers.Tile.Google> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * options - {Object}
     */   
    initialize: function(layer, position, bounds, options) {
        OpenLayers.Tile.prototype.initialize.apply(this, [
            layer, position, bounds, null, null, options
        ]);
    },

    /** 
     * APIMethod: destroy
     * Nullify references to prevent circular references and memory leaks.
     */
    destroy:function() {
        this.node && this.clear();
        this.node = null;
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: clone
     *
     * Parameters:
     * obj - {<OpenLayers.Tile>} The tile to be cloned
     *
     * Returns:
     * {<OpenLayers.Tile>} An exact clone of this <OpenLayers.Tile.Google>
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Tile.Google(this.layer, 
                                      this.position, 
                                      this.bounds);
        } 
        
        // catch any randomly tagged-on properties
        OpenLayers.Util.applyDefaults(obj, this);
        
        obj.node = null;
        
        return obj;
    },

    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * 
     * Returns:
     * {Boolean} Always returns true.
     */
    draw: function() {
        var layerType = OpenLayers.Layer.GoogleNG.mapObject.mapTypes[
            this.layer.type
        ];
        if (layerType && OpenLayers.Tile.prototype.draw.apply(this, arguments)) {
            var xyz = this.layer.getXYZ(this.bounds);
            var point = new google.maps.Point(xyz.x, xyz.y);

            // The hybrid tile consists of two images. For some reason, we have
            // to make sure that the satellite image loads first, otherwise we
            // occasionally get blank tiles for one of the two images. This is
            // done by requesting the tile for just the satellite mapType
            // first, before requesting the hybrid one.
            //TODO revisit this - it may be a temporary issue with GMaps
            var tempTile;
            if (this.layer.type === google.maps.MapTypeId.HYBRID) {
                tempTile = layerType.getTile(point, xyz.z, document);
            }
            
            this.node = layerType.getTile(point, xyz.z, document);
                        
            this.isLoading = true;
            this.events.triggerEvent("loadstart");

            this.layer.div.appendChild(this.node);
            
            // We only modify what we need to - we expect the size to be set
            // by getTile, and we have a test that will fail if this changes.
            OpenLayers.Util.modifyDOMElement(
                this.node, null, this.position, null, "absolute"
            );  
            
            // The images inside the node returned from getTile seem to be
            // preloaded already, so registering onload events on these images
            // won't work. Instead, we trigger the loadend event immediately
            // in the next cycle.
            window.setTimeout(OpenLayers.Function.bind(function() {
                this.isLoading = false;
                // check for this.events - we may be destroyed already
                this.events && this.events.triggerEvent("loadend"); 

                // see hybrid tile issue above
                //TODO revisit this - it may be a temporary issue with GMaps
                if (tempTile) {
                    layerType.releaseTile(tempTile);
                }
            }, this), 0);
        }
        return true;
    },
    
    /** 
     * Method: clear
     * Clear the tile of any bounds/position-related data so that it can 
     *     be reused in a new location. To be implemented by subclasses.
     */
    clear: function() {
        if (this.node) {
            this.node.parentNode &&
                this.node.parentNode.removeChild(this.node);
            OpenLayers.Layer.GoogleNG.mapObject.mapTypes[
                this.layer.type
            ].releaseTile(this.node);
        }
    },
    
    CLASS_NAME: "OpenLayers.Tile.Google"
});
