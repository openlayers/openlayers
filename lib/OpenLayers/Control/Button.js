/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.Button 
 * The Button control is a very simple push-button, for use with 
 * <OpenLayers.Control.Panel>.
 * When clicked, the function trigger() is executed.
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 *
 * Use:
 * (code)
 * var button = new OpenLayers.Control.Button({
 *     displayClass: "MyButton", trigger: myFunction
 * });
 * panel.addControls([button]);
 * (end)
 * 
 * Will create a button with CSS class MyButtonItemInactive, that
 *     will call the function MyFunction() when clicked.
 */
OpenLayers.Control.Button = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Property: type
     * {Integer} OpenLayers.Control.TYPE_BUTTON.
     */
    type: OpenLayers.Control.TYPE_BUTTON,
    
    /**
     * Method: trigger
     * Called by a control panel when the button is clicked.
     */
    trigger: function() {},

    CLASS_NAME: "OpenLayers.Control.Button"
});
