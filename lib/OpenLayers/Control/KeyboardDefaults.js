/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.KeyboardDefaults = Class.create();
OpenLayers.Control.KeyboardDefaults.prototype = 
  Object.extend( new OpenLayers.Control(), {

    /** @type int */
    slideFactor: 50,

    /**
     * @constructor
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * 
     */
    draw: function() {
        Event.observe(document, 
                      'keypress', 
                      this.defaultKeyDown.bind(this));
    },
    
    /**
    * @param {Event} evt
    */
    defaultKeyDown: function (evt) {
        switch(evt.keyCode) {
            case Event.KEY_LEFT:
                this.map.pan(-50, 0);
                break;
            case Event.KEY_RIGHT: 
                this.map.pan(50, 0);
                break;
            case Event.KEY_UP:
                this.map.pan(0, -50);
                break;
            case Event.KEY_DOWN:
                this.map.pan(0, 50);
                break;
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
