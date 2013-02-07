/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control/Button.js
 */

/**
 * Class: OpenLayers.Control.ZoomToMaxExtent 
 * The ZoomToMaxExtent control is a button that zooms out to the maximum
 * extent of the map. It is designed to be used with a 
 * <OpenLayers.Control.Panel>.
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ZoomToMaxExtent = OpenLayers.Class(OpenLayers.Control.Button, {

    /**
     * Method: trigger
     * 
     * Called whenever this control is being rendered inside of a panel and a 
     *     click occurs on this controls element. Actually zooms to the maximum
     *     extent of this controls map.
     */
    trigger: function() {
        if (this.map) {
            this.map.zoomToMaxExtent();
        }    
    },

    CLASS_NAME: "OpenLayers.Control.ZoomToMaxExtent"
});
