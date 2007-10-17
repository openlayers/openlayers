/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry.js
 * 
 * Class: OpenLayers.Geometry.Surface
 */
OpenLayers.Geometry.Surface = OpenLayers.Class(OpenLayers.Geometry, {

    /**
     * Constructor: OpenLayers.Geometry.Surface
     *
     */
    initialize: function() {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Geometry.Surface"
});
