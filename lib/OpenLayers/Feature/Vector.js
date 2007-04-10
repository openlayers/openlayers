/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

// TRASH THIS
OpenLayers.State = {
    /** states */
    UNKNOWN: 'Unknown',
    INSERT: 'Insert',
    UPDATE: 'Update',
    DELETE: 'Delete'
}

/**
 * @class
 * 
 * @requires OpenLayers/Feature.js
 * @requires OpenLayers/Util.js
 */
OpenLayers.Feature.Vector = OpenLayers.Class.create();
OpenLayers.Feature.Vector.prototype =
  OpenLayers.Class.inherit( OpenLayers.Feature, {

    /** @type String */
    fid: null,
    
    /** @type OpenLayers.Geometry */
    geometry:null,

    /** @type array */
    attributes: {},

    /** @type strinng */
    state: null,
    
    /** @type Object */
    style: null,
    
    /** 
     * Create a vector feature. 
     * @constructor
     * 
     * @param {OpenLayers.Geometry} geometry
     * @param {Object} data
     */
    initialize: function(geometry, data, style) {
        OpenLayers.Feature.prototype.initialize.apply(this, [null, null, data]);
        this.lonlat = null;
        this.geometry = geometry;
        this.state = null;
        if (data) {
            OpenLayers.Util.extend(this.attributes, data);
        }    
        this.style = style ? style : null; 
    },
    
    /**
     * 
     */
    destroy: function() {
        if (this.layer) {
            this.layer.removeFeatures(this);
            this.layer = null;
        }
            
        this.geometry = null;
        OpenLayers.Feature.prototype.destroy.apply(this, arguments);
    },
    
   /**
    * @returns An exact clone of this OpenLayers.Feature
    * @type OpenLayers.Feature
    */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Feature(null, this.geometry.clone(), this.data);
        } 
        
        // catch any randomly tagged-on properties
        OpenLayers.Util.applyDefaults(obj, this);
        
        return obj;
    },

    /**
     * HACK - we need to rewrite this for non-point geometry
     * @returns null - we need to rewrite this for non-point geometry
     * @type Boolean
     */
    onScreen:function() {
        return null;
    },
    
    /**
     *
     * HACK - we need to decide if all vector features should be able to
     * create markers
     * 
     * @returns null
     * 
     * @type OpenLayers.Marker
     */
    createMarker: function() {
        return null;
    },

    /**
     * HACK - we need to decide if all vector features should be able to
     * delete markers
     * 
     * If user overrides the createMarker() function, s/he should be able
     *   to also specify an alternative function for destroying it
     */
    destroyMarker: function() {
        // pass
    },

    /**
     * HACK - we need to decide if all vector features should be able to
     * create popups
     * 
     * @returns null
     */
    createPopup: function() {
        return null;
    },

    /**
     * @param {OpenLayers.LonLat} lonlat
     * @param {float} toleranceLon Optional tolerance in Geometric Coords
     * @param {float} toleranceLat Optional tolerance in Geographic Coords
     * 
     * @returns Whether or not the feature is at the specified location
     * @type Boolean
     */
    atPoint: function(lonlat, toleranceLon, toleranceLat) {
        var atPoint = false;
        if(this.geometry) {
            atPoint = this.geometry.atPoint(lonlat, toleranceLon, 
                                                    toleranceLat);
        }
        return atPoint;
    },

    /**
     *
     * HACK - we need to decide if all vector features should be able to
     * delete popups
     */
    destroyPopup: function() {
        // pass
    },
    
    /**
     * Sets the new state
     * @param {String} state
     */
    toState: function(state) {
        if (state == OpenLayers.State.UPDATE) {
            switch (this.state) {
                case OpenLayers.State.UNKNOWN:
                case OpenLayers.State.DELETE:
                    this.state = state;
                    break;
                case OpenLayers.State.UPDATE:
                case OpenLayers.State.INSERT:
                    break;
            }
        } else if (state == OpenLayers.State.INSERT) {
            switch (this.state) {
                case OpenLayers.State.UNKNOWN:
                    break;
                default:
                    this.state = state;
                    break;
            }
        } else if (state == OpenLayers.State.DELETE) {
            switch (this.state) {
                case OpenLayers.State.INSERT:
                    // the feature should be destroyed
                    break;
                case OpenLayers.State.DELETE:
                    break;
                case OpenLayers.State.UNKNOWN:
                case OpenLayers.State.UPDATE:
                    this.state = state;
                    break;
            }
        } else if (state == OpenLayers.State.UNKNOWN) {
            this.state = state;
        }
    },
    
    CLASS_NAME: "OpenLayers.Feature.Vector"
});


// styles for feature rendering 
OpenLayers.Feature.Vector.style = {
    'default': {
        fillColor: "#ee9900",
        fillOpacity: 0.4, 
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "#ee9900",
        strokeOpacity: 1,
        strokeWidth: 1,
        hoverStrokeColor: "red",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.2,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted"
    },
    'select': {
        fillColor: "blue",
        fillOpacity: 0.4, 
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "blue",
        strokeOpacity: 1,
        strokeWidth: 2,
        hoverStrokeColor: "red",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.2,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted",
        cursor: "pointer"
    },
    'temporary': {
        fillColor: "yellow",
        fillOpacity: 0.2, 
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "yellow",
        strokeOpacity: 1,
        strokeWidth: 4,
        hoverStrokeColor: "red",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.2,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted"
    }
};    
