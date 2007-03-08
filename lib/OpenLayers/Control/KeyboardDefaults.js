/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Control.js
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
        OpenLayers.Event.observe(document, 
                      'keypress', 
                      this.defaultKeyDown.bindAsEventListener(this));
    },
    
    /**
    * @param {Event} evt
    */
    defaultKeyDown: function (evt) {
        switch(evt.keyCode) {
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
                this.map.zoomIn();
                break;
            case 34: // Page Down 
                this.map.zoomOut();
                break;
        }
        switch(evt.charCode) {
            case 43: // +
                this.map.zoomIn();
                break;
            case 45: // -
                this.map.zoomOut();
                break;
        }        
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
