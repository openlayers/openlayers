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
    slideFactor: 75,

    /**
     * @constructor
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * 
     */
    destroy: function() {
        if (this.handler) {
            this.handler.destroy();
        }        
        this.handler = null;
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
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
                this.map.pan(-this.slideFactor, 0);
                break;
            case OpenLayers.Event.KEY_RIGHT: 
                this.map.pan(this.slideFactor, 0);
                break;
            case OpenLayers.Event.KEY_UP:
                this.map.pan(0, -this.slideFactor);
                break;
            case OpenLayers.Event.KEY_DOWN:
                this.map.pan(0, this.slideFactor);
                break;
            
            case 33: // Page Up  
                var size = this.map.getSize();
                this.map.pan(0, -0.75*size.h);
                break;
            case 34: // Page Down  
                var size = this.map.getSize();
                this.map.pan(0, 0.75*size.h);
                break; 
            case 35: // End  
                var size = this.map.getSize();
                this.map.pan(0.75*size.w, 0);
                break; 
            case 36: // Pos1  
                var size = this.map.getSize();
                this.map.pan(-0.75*size.w, 0);
                break; 

            case 43: // + 
                this.map.zoomIn();
                break; 
            case 45: // - 
                this.map.zoomOut();
                break; 
            case 107: // + (IE only)
                this.map.zoomIn();
                break;
            case 109: // - (IE only)
                this.map.zoomOut();
                break;
        } 
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
