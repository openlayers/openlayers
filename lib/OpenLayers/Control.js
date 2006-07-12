/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
* @class
*/
OpenLayers.Control = Class.create();
OpenLayers.Control.prototype = {

    /** this gets set in the addControl() function in OpenLayers.Map
    * @type OpenLayers.Map */
    map: null,

    /** @type DOMElement */
    div: null,

    /** @type OpenLayers.Pixel */
    position: null,

    /**
     * @constructor
     * 
     * @param {Hash} options
     */
    initialize: function (options) {
        Object.extend(this, options);
    },

    /**
     * 
     */
    destroy: function () {
        // eliminate circular references
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
        }
        if (px != null) {
            this.position = px.copyOf();
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
            this.div.style.top = px.x + "px";
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control"
};
