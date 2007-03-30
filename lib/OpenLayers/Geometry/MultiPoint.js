/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * MultiPoint is a collection of Points.
 * 
 * @requires OpenLayers/Geometry/Collection.js
 */
OpenLayers.Geometry.MultiPoint = OpenLayers.Class.create();
OpenLayers.Geometry.MultiPoint.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry.Collection, {

    /**
     * An array of class names representing the types of components that
     * the collection can include.  A null value means the component types
     * are not restricted.
     * @type Array(String)
     */
    componentTypes: ["OpenLayers.Geometry.Point"],

    /**
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.Point)} components
     */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
                                                                  arguments);
    },

    /**
     * Wrapper for addComponent()
     * 
     * @param {OpenLayers.Geometry.Point} point
     * @param {int} index
     */
    addPoint: function(point, index) {
        this.addComponent(point, index);
    },
    
    /**
     * Wrapper for removeComponent()
     *
     * @param {OpenLayers.Geometry.Point} point
     */
    removePoint: function(point){
        this.removeComponent(point);
    },
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.MultiPoint"
});
