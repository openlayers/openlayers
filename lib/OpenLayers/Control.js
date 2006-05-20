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
    * @returns A reference to the DIV DOMElement containing the control
    * @type DOMElement
    */
    draw: function () {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv();
        }
        return this.div;
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
