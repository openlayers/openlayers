/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
* Class: OpenLayers.Control
* Controls affect the display or behavior of the map. They allow everything
* from panning and zooming to displaying a scale indicator.
*/
OpenLayers.Control = OpenLayers.Class.create();

OpenLayers.Control.TYPE_BUTTON = 1;
OpenLayers.Control.TYPE_TOGGLE = 2;
OpenLayers.Control.TYPE_TOOL   = 3;

OpenLayers.Control.prototype = {

    /** 
	 * Property: id 
	 * {String} 
	 */
	id: null,
    
    /** 
	 * Property: map 
     * {<OpenLayers.Map>} this gets set in the addControl() function in
     * OpenLayers.Map 
	 */
	map: null,

    /** 
	 * Property: div 
	 * {DOMElement} 
	 */
	div: null,

    /** 
	 * Property: type 
     * {OpenLayers.Control.TYPES} Controls can have a 'type'. The type
     * determines the type of interactions which are possible with them when
     * they are placed into a toolbar. 
	 */
	type: null, 

    /** 
	 * Property: displayClass 
     * {string}  This property is used for CSS related to the drawing of the
     * Control. 
	 */
	displayClass: "",

    /** 
	 * Property: active 
	 * {boolean} null
	 */
	active: null,

    /** 
	 * Property: handler 
	 * {<OpenLayers.Handler}> null
	 */
	handler: null,

    /**
     * Constructor: OpenLayers.Control
     * Create an OpenLayers Control.
     * 
     * Parameters:
     * options - {Object} 
     */
    initialize: function (options) {
        // We do this before the extend so that instances can override
        // className in options.
        this.displayClass = 
            this.CLASS_NAME.replace("OpenLayers.", "ol").replace(/\./g, "");
        
        OpenLayers.Util.extend(this, options);
        
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
    },

    /**
     * Method: destroy
     */
    destroy: function () {
        // eliminate circular references
        if (this.handler) {
            this.handler.destroy();
        }    
        this.map = null;
    },

    /** 
     * Method: setMap
     * Set the map property for the control. This is done through an accessor
     *   so that subclasses can override this and take special action once 
     *   they have their map variable set. 
     *
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        this.map = map;
        if (this.handler) {
            this.handler.setMap(map);
        }
    },
  
    /**
     * Method: draw 
     *
     * Parameters:
     * px - {<OpenLayers.Pixel>} 
     *
     * Return:
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */
    draw: function (px) {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv();
            this.div.id = this.id;
            this.div.className = this.displayClass;
        }
        if (px != null) {
            this.position = px.clone();
        }
        this.moveTo(this.position);        
        return this.div;
    },

    /**
     * Method: moveTo
     *
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     */
    moveTo: function (px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
     * Method: activate
     * 
     * Return:
     * {Boolean}
     */
    activate: function () {
        if (this.active) {
            return false;
        }
        if (this.handler) {
            this.handler.activate();
        }
        this.active = true;
        return true;
    },
    
    /**
     * Method: deactivate
     * 
     * Return:
     * {Boolean}
     */
    deactivate: function () {
        if (this.active) {
            if (this.handler) {
                this.handler.deactivate();
            }
            this.active = false;
            return true;
        }
        return false;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control"
};
