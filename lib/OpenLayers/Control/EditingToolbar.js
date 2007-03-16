/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/Navigation.js
 * @requires OpenLayers/Control/DrawFeature.js
 */
OpenLayers.Control.EditingToolbar = OpenLayers.Class.create();
OpenLayers.Control.EditingToolbar.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control.Panel, {

    /**
     * Create an editing toolbar for a given layer. 
     * @param OpenLayers.Layer.Vector layer
     * @param Object options
     */
    initialize: function(layer, options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        
        this.addControls(
          [ new OpenLayers.Control.Navigation() ]
        );  
        var controls = [
          new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Point, {'displayClass': 'olControlDrawFeaturePoint'}),
          new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Path, {'displayClass': 'olControlDrawFeaturePath'}),
          new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Polygon, {'displayClass': 'olControlDrawFeaturePolygon'})
        ];
        for (var i = 0; i < controls.length; i++) {
            controls[i].featureAdded = function(feature) { feature.state = OpenLayers.State.INSERT; }
        }
        this.addControls(controls);
    },

    /**
     * calls the default draw, and then activates mouse defaults.
     */
    draw: function() {
        var div = OpenLayers.Control.Panel.prototype.draw.apply(this, arguments);
        this.activateControl(this.controls[0]);
        return div;
    },

    CLASS_NAME: "OpenLayers.Control.EditingToolbar"
});    
