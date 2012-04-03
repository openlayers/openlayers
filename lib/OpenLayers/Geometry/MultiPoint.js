/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Geometry/Point.js
 */

/**
 * Class: OpenLayers.Geometry.MultiPoint
 * MultiPoint is a collection of Points.  Create a new instance with the
 * <OpenLayers.Geometry.MultiPoint> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.Collection>
 *  - <OpenLayers.Geometry>
 */
OpenLayers.Geometry.MultiPoint = OpenLayers.Class(
  OpenLayers.Geometry.Collection, {

    /**
     * Property: componentTypes
     * {Array(String)} An array of class names representing the types of
     * components that the collection can include.  A null value means the
     * component types are not restricted.
     */
    componentTypes: ["OpenLayers.Geometry.Point"],

    /**
     * Constructor: OpenLayers.Geometry.MultiPoint
     * Create a new MultiPoint Geometry
     *
     * Parameters:
     * components - {Array(<OpenLayers.Geometry.Point>)} 
     *
     * Returns:
     * {<OpenLayers.Geometry.MultiPoint>}
     */

    /**
     * APIMethod: addPoint
     * Wrapper for <OpenLayers.Geometry.Collection.addComponent>
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>} Point to be added
     * index - {Integer} Optional index
     */
    addPoint: function(point, index) {
        this.addComponent(point, index);
    },
    
    /**
     * APIMethod: removePoint
     * Wrapper for <OpenLayers.Geometry.Collection.removeComponent>
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>} Point to be removed
     */
    removePoint: function(point){
        this.removeComponent(point);
    },

    CLASS_NAME: "OpenLayers.Geometry.MultiPoint"
});
