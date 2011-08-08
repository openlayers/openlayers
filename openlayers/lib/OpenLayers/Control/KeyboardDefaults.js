/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Keyboard.js
 */

/**
 * Class: OpenLayers.Control.KeyboardDefaults
 * The KeyboardDefaults control adds panning and zooming functions, controlled
 * with the keyboard. By default arrow keys pan, +/- keys zoom & Page Up/Page
 * Down/Home/End scroll by three quarters of a page.
 * 
 * This control has no visible appearance.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.KeyboardDefaults = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * APIProperty: slideFactor
     * Pixels to slide by.
     */
    slideFactor: 75,

    /**
     * Constructor: OpenLayers.Control.KeyboardDefaults
     */
        
    /**
     * Method: draw
     * Create handler.
     */
    draw: function() {
        this.handler = new OpenLayers.Handler.Keyboard( this, { 
                                "keydown": this.defaultKeyPress });
    },
    
    /**
     * Method: defaultKeyPress
     * When handling the key event, we only use evt.keyCode. This holds 
     * some drawbacks, though we get around them below. When interpretting
     * the keycodes below (including the comments associated with them),
     * consult the URL below. For instance, the Safari browser returns
     * "IE keycodes", and so is supported by any keycode labeled "IE".
     * 
     * Very informative URL:
     *    http://unixpapa.com/js/key.html
     *
     * Parameters:
     * code - {Integer} 
     */
    defaultKeyPress: function (evt) {
        switch(evt.keyCode) {
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
            
            case 33: // Page Up. Same in all browsers.
                var size = this.map.getSize();
                this.map.pan(0, -0.75*size.h);
                break;
            case 34: // Page Down. Same in all browsers.
                var size = this.map.getSize();
                this.map.pan(0, 0.75*size.h);
                break; 
            case 35: // End. Same in all browsers.
                var size = this.map.getSize();
                this.map.pan(0.75*size.w, 0);
                break; 
            case 36: // Home. Same in all browsers.
                var size = this.map.getSize();
                this.map.pan(-0.75*size.w, 0);
                break; 

            case 43:  // +/= (ASCII), keypad + (ASCII, Opera)
            case 61:  // +/= (Mozilla, Opera, some ASCII)
            case 187: // +/= (IE)
            case 107: // keypad + (IE, Mozilla)
                this.map.zoomIn();
                break; 
            case 45:  // -/_ (ASCII, Opera), keypad - (ASCII, Opera)
            case 109: // -/_ (Mozilla), keypad - (Mozilla, IE)
            case 189: // -/_ (IE)
            case 95:  // -/_ (some ASCII)
                this.map.zoomOut();
                break; 
        } 
    },

    CLASS_NAME: "OpenLayers.Control.KeyboardDefaults"
});
