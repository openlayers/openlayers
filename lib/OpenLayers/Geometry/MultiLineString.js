/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry/Collection.js
 */

/**
 * Class: OpenLayers.Geometry.MultiLineString
 * A MultiLineString is a geometry with multiple <OpenLayers.Geometry.LineString>
 * components.
 * 
 * Inherits from:
 *  - <OpenLayers.Geometry.Collection>
 *  - <OpenLayers.Geometry> 
 */
OpenLayers.Geometry.MultiLineString = OpenLayers.Class(
  OpenLayers.Geometry.Collection, {

    /**
     * Property: componentTypes
     * {Array(String)} An array of class names representing the types of
     * components that the collection can include.  A null value means the
     * component types are not restricted.
     */
    componentTypes: ["OpenLayers.Geometry.LineString"],

    /**
     * Constructor: OpenLayers.Geometry.MultiLineString
     * Constructor for a MultiLineString Geometry.
     *
     * Parameters: 
     * components - {Array(<OpenLayers.Geometry.LineString>)} 
     *
     */
    initialize: function(components) {
        OpenLayers.Geometry.Collection.prototype.initialize.apply(this, 
                                                                  arguments);        
    },

    CLASS_NAME: "OpenLayers.Geometry.MultiLineString"
});
