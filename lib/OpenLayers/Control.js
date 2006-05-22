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

    /**
    * @constructor
    */
    initialize: function () {
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
        this.moveTo(px);        
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

    /**
    */
    destroy: function () {
        // eliminate circular references
        this.map = null;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control"
};
