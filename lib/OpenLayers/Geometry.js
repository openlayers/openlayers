/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */
 
/**
 * @class
 */
OpenLayers.Geometry = OpenLayers.Class.create();
OpenLayers.Geometry.prototype = {

    /** @type String */
    id: null,

    /** This is set when a Geometry is added as Component of another Geometry
     * 
     * @type OpenLayers.Geometry */
    parent: null,

    /** @type OpenLayers.Bounds */
    bounds: null,
    
    /** 
     * Cross reference back to the feature that owns this geometry so
     * that that the feature can be identified after the geometry has been
     * selected by a mouse click.
     * 
     * @type OpenLayers.Feature */
    feature: null,
    
    /** @type OpenLayers.Events */
    events:null,

    /**
     * @constructor
     */
    initialize: function() {
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME+ "_");
    },
    
    /**
     * 
     */
    destroy: function() {
        this.id = null;

        this.bounds = null;
        this.feature = null;

        if (this.events) {
            this.events.destroy();
        }
        this.events = null;        
    },
    
    /**
     * Set the bounds for this Geometry.
     * 
     * @param {OpenLayers.Bounds} object
     */
    setBounds: function(bounds) {
        if (bounds) {
            this.bounds = bounds.clone();
        }
    },
    
    /**
     * Nullify this components bounds and that of its parent as well.
     */
    clearBounds: function() {
        this.bounds = null;
        if (this.parent) {
            this.parent.clearBounds();
        }    
    },
    
    /**
     * Extend the existing bounds to include the new bounds. 
     * If geometry's bounds is not yet set, then set a new Bounds.
     * 
     * @param {OpenLayers.Bounds} newBounds
     */
    extendBounds: function(newBounds){
        var bounds = this.getBounds();
        if (!bounds) {
            this.setBounds(newBounds);
        } else {
            this.bounds.extend(newBounds);
        }
    },
    
    /**
     * Get the bounds for this Geometry. If bounds is not set, it 
     * is calculated again, this makes queries faster.
     * 
     * @type OpenLayers.Bounds
     */
    getBounds: function() {
        if (this.bounds == null) {
            this.calculateBounds();
        }
        return this.bounds;
    },
    
    /** Recalculate the bounds for the geometry. 
     * 
     */
    calculateBounds: function() {
        //
        // This should be overridden by subclasses.
        //
    },
    
    /**
     * Note: This is only an approximation based on the bounds of the 
     * geometry.
     * 
     * @param {OpenLayers.LonLat} lonlat
     * @param {float} toleranceLon Optional tolerance in Geometric Coords
     * @param {float} toleranceLat Optional tolerance in Geographic Coords
     * 
     * @returns Whether or not the geometry is at the specified location
     * @type Boolean
     */
    atPoint: function(lonlat, toleranceLon, toleranceLat) {
        var atPoint = false;
        var bounds = this.getBounds();
        if ((bounds != null) && (lonlat != null)) {

            var dX = (toleranceLon != null) ? toleranceLon : 0;
            var dY = (toleranceLat != null) ? toleranceLat : 0;
    
            var toleranceBounds = 
                new OpenLayers.Bounds(this.bounds.left - dX,
                                      this.bounds.bottom - dY,
                                      this.bounds.right + dX,
                                      this.bounds.top + dY);

            atPoint = toleranceBounds.containsLonLat(lonlat);
        }
        return atPoint;
    },
    
    /**
     * @returns The length of the geometry
     * @type float
     */
    getLength: function() {
        //to be overridden by geometries that actually have a length
        //
        return 0.0;
    },

    /**
     * @returns The area of the geometry
     * @type float
     */
    getArea: function() {
        //to be overridden by geometries that actually have an area
        //
        return 0.0;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry"
};
