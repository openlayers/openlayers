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
     * @constructor
     *
     * @param {Array(OpenLayers.Geometry.LineString)} components
     */
    initialize: function(components) {
    	OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
    	                                                          arguments);        
    },

    /**
     * adds a component to the MultiPoint, checking type
     *
     * @param {OpenLayers.Geometry.LineString} component lineString to add
     * @param {int} index Index into the array to insert the component
     */
    addComponent: function(component, index) {
        if (!(component instanceof OpenLayers.Geometry.LineString)) {
            throw "component should be an OpenLayers.Geometry.LineString";
        }
        OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                    arguments);        
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.MultiLineString"
});
