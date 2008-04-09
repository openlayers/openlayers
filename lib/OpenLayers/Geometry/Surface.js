/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry.js
 */

OpenLayers.Geometry.Surface = OpenLayers.Class(OpenLayers.Geometry, {

    initialize: function() {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Geometry.Surface"
});
