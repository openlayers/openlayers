/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control/Button.js
 */

/**
 * Class: OpenLayers.Control.ZoomOut
 * The ZoomOut control is a button to decrease the zoom level of a map.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ZoomOut = OpenLayers.Class(OpenLayers.Control.Button, {

    /**
     * Method: trigger
     */
    trigger: function(){
        if (this.map) {
            this.map.zoomOut();
        }
    },

    CLASS_NAME: "OpenLayers.Control.ZoomOut"
});
