/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
* @class
*/
OpenLayers.Control = OpenLayers.Class.create();

OpenLayers.Control.TYPE_BUTTON = 1;
OpenLayers.Control.TYPE_TOGGLE = 2;
OpenLayers.Control.TYPE_TOOL   = 3;

OpenLayers.Control.prototype = {

    /** @type String */
    id: null,
    
    /** this gets set in the addControl() function in OpenLayers.Map
    * @type OpenLayers.Map */
    map: null,

    /** @type DOMElement */
    div: null,

    /** 
     * Controls can have a 'type'. The type determines the type of interactions
     * which are possible with them when they are placed into a toolbar.
     * @type OpenLayers.Control.TYPES
     */
    type: null, 

    /**  This property is used for CSS related to the drawing of the Control.
     * @type string 
     */
    displayClass: "",

    /**
     * @type boolean
     */
    active: null,

    /**
     * @type OpenLayers.Handler
     */
    handler: null,

    /**
     * @constructor
     * 
     * @param {Object} options
     */
    initialize: function (options) {
        // We do this before the extend so that instances can override
        // className in options.
        this.displayClass = this.CLASS_NAME.replace("OpenLayers.", "ol").replace(".","");
        
        OpenLayers.Util.extend(this, options);
        
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
    },

    /**
     * 
     */
    destroy: function () {
        // eliminate circular references
        if (this.handler) {
            this.handler.destroy();
        }    
        this.map = null;
    },

    /** Set the map property for the control. This is done through an accessor
     *   so that subclasses can override this and take special action once 
     *   they have their map variable set. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
        if (this.handler) {
            this.handler.setMap(map);
        }
    },
  
    /**
     * @param {OpenLayers.Pixel} px
     *
     * @returns A reference to the DIV DOMElement containing the control
     * @type DOMElement
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
     * @param {OpenLayers.Pixel} px
     */
    moveTo: function (px) {
        if ((px != null) && (this.div != null)) {
            this.div.style.left = px.x + "px";
            this.div.style.top = px.y + "px";
        }
    },

    /**
     * @type boolean
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
     * @type boolean
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
