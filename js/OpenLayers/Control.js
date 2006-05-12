OpenLayers.Control = Class.create();
OpenLayers.Control.prototype = {
    // OpenLayers.Map
    map: null,

    // HTMLDivElement
    div: null,

    initialize: function () {},

    draw: function () {
        if (this.div == null) {
            this.div = OpenLayers.Util.createDiv();
        }
        return this.div;
    },

    destroy: function () {
        // eliminate circular references
        this.map = null;
    }
};
