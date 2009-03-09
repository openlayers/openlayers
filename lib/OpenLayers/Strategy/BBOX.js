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
     * {<OpenLayers.Bounds>} The current data bounds (in the same projection
     *     as the layer - not always the same projection as the map).
     */
    bounds: null,
    
    /**
     * APIProperty: ratio
     * {Float} The ratio of the data bounds to the viewport bounds (in each
     *     dimension).  Default is 2.
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
        var mapBounds = this.getMapBounds();
        if ((options && options.force) || this.invalidBounds(mapBounds)) {
            this.calculateBounds(mapBounds);
            this.triggerRead();
        }
    },
    
    /**
     * Method: getMapBounds
     * Get the map bounds expressed in the same projection as this layer.
     *
     * Returns:
     * {<OpenLayers.Bounds>} Map bounds in the projection of the layer.
     */
    getMapBounds: function() {
        var bounds = this.layer.map.getExtent();
        if(!this.layer.projection.equals(this.layer.map.getProjectionObject())) {
            bounds = bounds.clone().transform(
                this.layer.map.getProjectionObject(), this.layer.projection
            );
        }
        return bounds;
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
            mapBounds = this.getMapBounds();
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
            mapBounds = this.getMapBounds();
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
        this.layer.protocol.abort(this.response);
        this.layer.events.triggerEvent("loadstart");
        this.response = this.layer.protocol.read({
            filter: this.createFilter(),
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
     *     If the layer projection differs from the map projection, features
     *     will be transformed from the layer projection to the map projection.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object passed
     *      by the protocol.
     */
    merge: function(resp) {
        this.layer.destroyFeatures();
        var features = resp.features;
        if(features && features.length > 0) {
            var remote = this.layer.projection;
            var local = this.layer.map.getProjectionObject();
            if(!local.equals(remote)) {
                var geom;
                for(var i=0, len=features.length; i<len; ++i) {
                    geom = features[i].geometry;
                    if(geom) {
                        geom.transform(remote, local);
                    }
                }
            }
            this.layer.addFeatures(features);
        }
        this.layer.events.triggerEvent("loadend");
    },
   
    CLASS_NAME: "OpenLayers.Strategy.BBOX" 
});
