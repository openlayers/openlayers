/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Geometry/Polygon.js
 */

/**
 * Class: OpenLayers.Geometry.MultiPolygon
 * MultiPolygon is a geometry with multiple <OpenLayers.Geometry.Polygon>
 * components.  Create a new instance with the <OpenLayers.Geometry.MultiPolygon>
 * constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Geometry.Collection>
 */
OpenLayers.Geometry.MultiPolygon = OpenLayers.Class(
  OpenLayers.Geometry.Collection, {

    /**
     * Property: componentTypes
     * {Array(String)} An array of class names representing the types of
     * components that the collection can include.  A null value means the
     * component types are not restricted.
     */
    componentTypes: ["OpenLayers.Geometry.Polygon"],

    /**
     * Constructor: OpenLayers.Geometry.MultiPolygon
     * Create a new MultiPolygon geometry
     *
     * Parameters:
     * components - {Array(<OpenLayers.Geometry.Polygon>)} An array of polygons
     *              used to generate the MultiPolygon
     *
     */

    CLASS_NAME: "OpenLayers.Geometry.MultiPolygon"
});
