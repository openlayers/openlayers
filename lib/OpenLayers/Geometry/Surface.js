/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Geometry.js
 * 
 * Class: OpenLayers.Geometry.Surface
 */
OpenLayers.Geometry.Surface = OpenLayers.Class.create();
OpenLayers.Geometry.Surface.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry, {

    /**
     * Constructor: OpenLayers.Geometry.Surface
     *
     */
    initialize: function() {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Surface"
});
