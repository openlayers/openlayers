/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/Navigation.js
 * @requires OpenLayers/Control/ZoomBox.js
 */
OpenLayers.Control.NavToolbar = OpenLayers.Class.create();
OpenLayers.Control.NavToolbar.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control.Panel, {

    /**
     * Add our two mousedefaults controls.
     */
    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, arguments);
        this.addControls([
          new OpenLayers.Control.Navigation(),
          new OpenLayers.Control.ZoomBox()
        ]);
    },

    /**
     * calls the default draw, and then activates mouse defaults.
     */
    draw: function() {
        var div = OpenLayers.Control.Panel.prototype.draw.apply(this, arguments);
        this.activateControl(this.controls[0]);
        return div;
    },

    CLASS_NAME: "OpenLayers.Control.NavToolbar"
});    
