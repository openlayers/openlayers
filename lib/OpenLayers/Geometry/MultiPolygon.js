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
    * @constructor
    *
    * @param {Array(OpenLayers.Geometry.Polygon)} components
    */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
                                                                  arguments);
    },

    /**
     * adds component to the MultiPolygon, checking type
     *
     * @param {OpenLayers.Geometry.Polygon} component Polygon to add
     * @param {int} index Index into the array to insert the component
     */
    addComponent: function(component, index) {
        if (!(component instanceof OpenLayers.Geometry.Polygon)) {
            var throwStr = "component should be an " +
                           "OpenLayers.Geometry.Polygon but is an " + 
                           component.CLASS_NAME;
            throw throwStr;
        }
        OpenLayers.Geometry.Collection.prototype.addComponent.apply(this, 
                                                                    arguments);
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.MultiPolygon"
});
