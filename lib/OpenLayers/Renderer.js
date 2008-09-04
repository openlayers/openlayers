/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * Class: OpenLayers.Renderer 
 * This is the base class for all renderers.
 *
 * This is based on a merger code written by Paul Spencer and Bertil Chapuis.
 * It is largely composed of virtual functions that are to be implemented
 * in technology-specific subclasses, but there is some generic code too.
 * 
 * The functions that *are* implemented here merely deal with the maintenance
 *  of the size and extent variables, as well as the cached 'resolution' 
 *  value. 
 * 
 * A note to the user that all subclasses should use getResolution() instead
 *  of directly accessing this.resolution in order to correctly use the 
 *  cacheing system.
 *
 */
OpenLayers.Renderer = OpenLayers.Class({

    /** 
     * Property: container
     * {DOMElement} 
     */
    container: null,
    
    /** 
     * Property: extent
     * {<OpenLayers.Bounds>}
     */
    extent: null,

    /**
     * Property: locked
     * {Boolean} If the renderer is currently in a state where many things
     *     are changing, the 'locked' property is set to true. This means 
     *     that renderers can expect at least one more drawFeature event to be
     *     called with the 'locked' property set to 'true': In some renderers,
     *     this might make sense to use as a 'only update local information'
     *     flag. 
     */  
    locked: false,
    
    /** 
     * Property: size
     * {<OpenLayers.Size>} 
     */
    size: null,
    
    /**
     * Property: resolution
     * {Float} cache of current map resolution
     */
    resolution: null,
    
    /**
     * Property: map  
     * {<OpenLayers.Map>} Reference to the map -- this is set in Vector's setMap()
     */
    map: null,
    
    /**
     * Constructor: OpenLayers.Renderer 
     *
     * Parameters:
     * containerID - {<String>} 
     * options - {Object} options for this renderer. See sublcasses for
     *     supported options.
     */
    initialize: function(containerID, options) {
        this.container = OpenLayers.Util.getElement(containerID);
    },
    
    /**
     * APIMethod: destroy
     */
    destroy: function() {
        this.container = null;
        this.extent = null;
        this.size =  null;
        this.resolution = null;
        this.map = null;
    },

    /**
     * APIMethod: supported
     * This should be overridden by specific subclasses
     * 
     * Returns:
     * {Boolean} Whether or not the browser supports the renderer class
     */
    supported: function() {
        return false;
    },    
    
    /**
     * Method: setExtent
     * Set the visible part of the layer.
     *
     * Resolution has probably changed, so we nullify the resolution 
     * cache (this.resolution) -- this way it will be re-computed when 
     * next it is needed.
     * We nullify the resolution cache (this.resolution) if resolutionChanged
     * is set to true - this way it will be re-computed on the next
     * getResolution() request.
     *
     * Parameters:
     * extent - {<OpenLayers.Bounds>}
     * resolutionChanged - {Boolean}
     */
    setExtent: function(extent, resolutionChanged) {
        this.extent = extent.clone();
        if (resolutionChanged) {
            this.resolution = null;
        }
    },
    
    /**
     * Method: setSize
     * Sets the size of the drawing surface.
     * 
     * Resolution has probably changed, so we nullify the resolution 
     * cache (this.resolution) -- this way it will be re-computed when 
     * next it is needed.
     *
     * Parameters:
     * size - {<OpenLayers.Size>} 
     */
    setSize: function(size) {
        this.size = size.clone();
        this.resolution = null;
    },
    
    /** 
     * Method: getResolution
     * Uses cached copy of resolution if available to minimize computing
     * 
     * Returns:
     * The current map's resolution
     */
    getResolution: function() {
        this.resolution = this.resolution || this.map.getResolution();
        return this.resolution;
    },
    
    /**
     * Method: drawFeature
     * Draw the feature.  The optional style argument can be used
     * to override the feature's own style.  This method should only
     * be called from layer.drawFeature().
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     * style - {<Object>}
     * 
     * Returns:
     * {Boolean} true if the feature has been drawn completely, false if not,
     *     undefined if the feature had no geometry
     */
    drawFeature: function(feature, style) {
        if(style == null) {
            style = feature.style;
        }
        if (feature.geometry) {
            var bounds = feature.geometry.getBounds();
            if(bounds) {
                if (!bounds.intersectsBounds(this.extent)) {
                    style = {display: "none"};
                }
                return this.drawGeometry(feature.geometry, style, feature.id);
            }
        }
    },


    /** 
     * Method: drawGeometry
     * 
     * Draw a geometry.  This should only be called from the renderer itself.
     * Use layer.drawFeature() from outside the renderer.
     * virtual function
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>} 
     * style - {Object} 
     * featureId - {<String>} 
     */
    drawGeometry: function(geometry, style, featureId) {},
        
    /**
     * Method: clear
     * Clear all vectors from the renderer.
     * virtual function.
     */    
    clear: function() {},

    /**
     * Method: getFeatureIdFromEvent
     * Returns a feature id from an event on the renderer.  
     * How this happens is specific to the renderer.  This should be
     * called from layer.getFeatureFromEvent().
     * Virtual function.
     * 
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     *
     * Returns:
     * {String} A feature id or null.
     */
    getFeatureIdFromEvent: function(evt) {},
    
    /**
     * Method: eraseFeatures 
     * This is called by the layer to erase features
     * 
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} 
     */
    eraseFeatures: function(features) {
        if(!(features instanceof Array)) {
            features = [features];
        }
        for(var i=0, len=features.length; i<len; ++i) {
            this.eraseGeometry(features[i].geometry);
        }
    },
    
    /**
     * Method: eraseGeometry
     * Remove a geometry from the renderer (by id).
     * virtual function.
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>} 
     */
    eraseGeometry: function(geometry) {},

    CLASS_NAME: "OpenLayers.Renderer"
});