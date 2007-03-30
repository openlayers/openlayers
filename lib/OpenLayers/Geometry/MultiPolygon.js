/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * MultiPolygon is a collection of Polygons.
 * 
 * @requires OpenLayers/Geometry/Collection.js
 */
OpenLayers.Geometry.MultiPolygon = OpenLayers.Class.create();
OpenLayers.Geometry.MultiPolygon.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry.Collection, {

    /**
     * An array of class names representing the types of components that
     * the collection can include.  A null value means the component types
     * are not restricted.
     * @type Array(String)
     */
    componentTypes: ["OpenLayers.Geometry.Polygon"],

    /**
    * @constructor
    *
    * @param {Array(OpenLayers.Geometry.Polygon)} components
    */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
                                                                  arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.MultiPolygon"
});
