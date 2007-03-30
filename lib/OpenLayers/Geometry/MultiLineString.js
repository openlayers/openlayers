/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * A MultiLineString is a collection of LineStrings
 *
 * @requires OpenLayers/Geometry/Collection.js
 */
OpenLayers.Geometry.MultiLineString = OpenLayers.Class.create();
OpenLayers.Geometry.MultiLineString.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry.Collection, {

    /**
     * An array of class names representing the types of components that
     * the collection can include.  A null value means the component types
     * are not restricted.
     * @type Array(String)
     */
    componentTypes: ["OpenLayers.Geometry.LineString"],

    /**
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.LineString)} components
     */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
                                                                  arguments);        
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.MultiLineString"
});
