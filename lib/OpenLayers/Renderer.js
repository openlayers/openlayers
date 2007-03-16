/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class Renderer is the base class for all renderers.
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
OpenLayers.Renderer = OpenLayers.Class.create();
OpenLayers.Renderer.prototype = 
{
    /** @type DOMElement */
    container: null,
    
    /** @type OpenLayers.Bounds */
    extent: null,
    
    /** @type OpenLayers.Size */
    size: null,
    
    /** cache of current map resolution
     * @type float */
    resolution: null,
    
    /** Reference to the map -- this is set in Vector's setMap()
     * @type OpenLayers.Map */
    map: null,
    
    /**
     * @constructor
     * 
     * @param {String} containerID
     */
    initialize: function(containerID) {
        this.container = $(containerID);
    },
    
    /**
     * 
     */
    destroy: function() {
        this.container = null;
        this.extent = null;
        this.size =  null;
        this.resolution = null;
        this.map = null;
    },

    /**
     * This should be overridden by specific subclasses
     * 
     * @returns Whether or not the browser supports the VML renderer
     * @type Boolean
     */
    supported: function() {
        return false;
    },    
    
    /**
     * Set the visible part of the layer.
     *
     * Resolution has probably changed, so we nullify the resolution 
     * cache (this.resolution) -- this way it will be re-computed when 
     * next it is needed.
     *
     * @param {OpenLayers.Bounds} extent
     */
    setExtent: function(extent) {
        this.extent = extent.clone();
        this.resolution = null;
    },
    
    /**
     * Sets the size of the drawing surface.
     * 
     * Resolution has probably changed, so we nullify the resolution 
     * cache (this.resolution) -- this way it will be re-computed when 
     * next it is needed.
     *
     * @param {OpenLayers.Size} size
     */
    setSize: function(size) {
        this.size = size.clone();
        this.resolution = null;
    },
    
    /** Uses cached copy of resolution if available to minimize computing
     * 
     * @returns The current map's resolution
     * @type float
     */
    getResolution: function() {
        this.resolution = this.resolution || this.map.getResolution();
        return this.resolution;
    },
    
    /** 
     * virtual function
     * 
     * Draw a geometry on the specified layer.
     *
     * @param geometry {OpenLayers.Geometry}
     * @param style {Object}
     */
    drawGeometry: function(geometry, style) {},
        
    /**
     * virtual function
     *
     * Clear all vectors from the renderer
     *
     */    
    clear: function() {},

    /**
     * virtual function
     * 
     * Returns a geometry from an event that happened on a layer.  
     * How this happens is specific to the renderer.
     * 
     * @param evt {OpenLayers.Event}
     *
     * @returns A geometry from an event that happened on a layer
     * @type OpenLayers.Geometry
     */
    getGeometryFromEvent: function(evt) {},
    
    /**
     * virtual function
     * 
     * Remove a geometry from the renderer (by id)
     * 
     * @param geometry {OpenLayers.Geometry}
     */
    eraseGeometry: function(geometry) {},
        
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Renderer"
};
