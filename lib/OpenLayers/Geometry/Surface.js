/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
