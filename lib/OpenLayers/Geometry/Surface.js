/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 *
 * @requires OpenLayers/Geometry.js
 */
OpenLayers.Geometry.Surface = OpenLayers.Class.create();
OpenLayers.Geometry.Surface.prototype =
    OpenLayers.Class.inherit(OpenLayers.Geometry, {

    /**
     * @constructor
     *
     */
    initialize: function() {
        OpenLayers.Geometry.prototype.initialize.apply(this, arguments);
    },


    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry.Surface"
});
