/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Keyboard.js
 */

/**
 * Class: OpenLayers.Control.KeyboardDefaults
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.KeyboardDefaults = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: slideFactor
     * Pixels to slide by.
     */
    slideFactor: 75,

    /**
     * Constructor: OpenLayers.Control.KeyboardDefaults
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * APIMethod: destroy
     */
    destroy: function() {
        if (this.handler) {
            this.handler.destroy();
        }        
        this.handler = null;
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: draw
     * Create handler.
     */
    draw: function() {
        this.handler = new OpenLayers.Handler.Keyboard( this, { 
                                "keypress": this.defaultKeyPress });
        this.activate();
    },
    
    /**
     * Method: defaultKeyPress
     *
     * Parameters:
     * code - {Integer} 
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

    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
