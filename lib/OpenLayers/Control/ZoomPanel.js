/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/ZoomIn.js
 * @requires OpenLayers/Control/ZoomOut.js
 * @requires OpenLayers/Control/ZoomToMaxExtent.js
 */

/**
 * Class: OpenLayers.Control.ZoomPanel
 * The ZoomPanel control is a compact collecton of 3 zoom controls: a 
 * <OpenLayers.Control.ZoomIn>, a <OpenLayers.Control.ZoomToMaxExtent>, and a
 * <OpenLayers.Control.ZoomOut>. By default it is drawn in the upper left 
 * corner of the map.
 *
 * Note: 
 * If you wish to use this class with the default images and you want 
 *       it to look nice in ie6, you should add the following, conditionally
 *       added css stylesheet to your HTML file:
 * 
 * (code)
 * <!--[if lte IE 6]>
 *   <link rel="stylesheet" href="../theme/default/ie6-style.css" type="text/css" />
 * <![endif]-->
 * (end)
 * 
 * Inherits from:
 *  - <OpenLayers.Control.Panel>
 */
OpenLayers.Control.ZoomPanel = OpenLayers.Class(OpenLayers.Control.Panel, {

    /**
     * Constructor: OpenLayers.Control.ZoomPanel 
     * Add the three zooming controls.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        this.addControls([
            new OpenLayers.Control.ZoomIn(),
            new OpenLayers.Control.ZoomToMaxExtent(),
            new OpenLayers.Control.ZoomOut()
        ]);
    },

    CLASS_NAME: "OpenLayers.Control.ZoomPanel"
});
