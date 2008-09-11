/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 * @requires OpenLayers/Filter/Spatial.js
 */

/**
 * Class: OpenLayers.Strategy.BBOX
 * A simple strategy that reads new features when the viewport invalidates
 *     some bounds.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.BBOX = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * Property: bounds
     * {<OpenLayers.Bounds>} The current data bounds.
     */
    bounds: null,
    
    /**
     * Property: ratio
     * {Float} The ratio of the data bounds to the viewport bounds (in each
     *     dimension).
     */
    ratio: 2,

    /**
     * Property: response
     * {<OpenLayers.Protocol.Response>} The protocol response object returned
     *      by the layer protocol.
     */
    response: null,

    /**
     * Constructor: OpenLayers.Strategy.BBOX
     * Create a new BBOX strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Strategy.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: activate
     * Set up strategy with regard to reading new batches of remote data.
     * 
     * Returns:
     * {Boolean} The strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.call(this);
        if(activated) {
            this.layer.events.on({
                "moveend": this.update,
                scope: this
            });
            this.layer.events.on({
                "refresh": this.update,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * Method: deactivate
     * Tear down strategy with regard to reading new batches of remote data.
     * 
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if(deactivated) {
            this.layer.events.un({
                "moveend": this.update,
                scope: this
            });
            this.layer.events.un({
                "refresh": this.update,
                scope: this
            });
        }
        return deactivated;
    },

    /**
     * Method: update
     * Callback function called on "moveend" or "refresh" layer events.
     *
     * Parameters:
     * options - {Object} An object with a property named "force", this
     *      property references a boolean value indicating if new data
     *      must be incondtionally read.
     */
    update: function(options) {
        var mapBounds = this.layer.map.getExtent();
        if ((options && options.force) || this.invalidBounds(mapBounds)) {
            this.calculateBounds(mapBounds);
            this.triggerRead();
        }
    },

    /**
     * Method: invalidBounds
     *
     * Parameters:
     * mapBounds - {<OpenLayers.Bounds>} the current map extent, will be
     *      retrieved from the map object if not provided
     *
     * Returns:
     * {Boolean} 
     */
    invalidBounds: function(mapBounds) {
        if(!mapBounds) {
            mapBounds = this.layer.map.getExtent();
        }
        return !this.bounds || !this.bounds.containsBounds(mapBounds);
    },
 
    /**
     * Method: calculateBounds
     *
     * Parameters:
     * mapBounds - {<OpenLayers.Bounds>} the current map extent, will be
     *      retrieved from the map object if not provided
     */
    calculateBounds: function(mapBounds) {
        if(!mapBounds) {
            mapBounds = this.layer.map.getExtent();
        }
        var center = mapBounds.getCenterLonLat();
        var dataWidth = mapBounds.getWidth() * this.ratio;
        var dataHeight = mapBounds.getHeight() * this.ratio;
        this.bounds = new OpenLayers.Bounds(
            center.lon - (dataWidth / 2),
            center.lat - (dataHeight / 2),
            center.lon + (dataWidth / 2),
            center.lat + (dataHeight / 2)
        );
    },
    
    /**
     * Method: triggerRead
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} The protocol response object
     *      returned by the layer protocol.
     */
    triggerRead: function() {
        var filter = this.createFilter();
        if (this.response && this.response.priv &&
            typeof this.response.priv.abort == "function") {
            this.response.priv.abort();
        }
        this.response = this.layer.protocol.read({
            filter: filter,
            callback: this.merge,
            scope: this
        });
    },
 
    /**
     * Method: createFilter
     *
     * Returns
     * {<OpenLayers.Filter>} The filter object.
     */
    createFilter: function() {
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.BBOX,
            value: this.bounds,
            projection: this.layer.projection
        });
        if (this.layer.filter) {
            filter = new OpenLayers.Filter.Logical({
                type: OpenLayers.Filter.Logical.AND,
                filters: [this.layer.filter, filter]
            });
        }
        return filter;
    },
   
    /**
     * Method: merge
     * Given a list of features, determine which ones to add to the layer.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object passed
     *      by the protocol.
     */
    merge: function(resp) {
        this.layer.destroyFeatures();
        var features = resp.features;
        if(features && features.length > 0) {
            this.layer.addFeatures(features);
        }
    },
   
    CLASS_NAME: "OpenLayers.Strategy.BBOX" 
});
