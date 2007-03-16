/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Keyboard.js
 */
OpenLayers.Control.KeyboardDefaults = OpenLayers.Class.create();
OpenLayers.Control.KeyboardDefaults.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

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
        this.handler = new OpenLayers.Handler.Keyboard( this, { 
                                "keypress": this.defaultKeyPress });
        this.activate();
    },
    
    /**
    * @param {Integer} code
    */
    defaultKeyPress: function (code) {
        switch(code) {
            case OpenLayers.Event.KEY_LEFT:
                this.map.pan(-50, 0);
                break;
            case OpenLayers.Event.KEY_RIGHT: 
                this.map.pan(50, 0);
                break;
            case OpenLayers.Event.KEY_UP:
                this.map.pan(0, -50);
                break;
            case OpenLayers.Event.KEY_DOWN:
                this.map.pan(0, 50);
                break;
            case 33: // Page Up 
            case 43: // +
                this.map.zoomIn();
                break;
            case 45: // -
            case 34: // Page Down 
                this.map.zoomOut();
                break;
        }        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
