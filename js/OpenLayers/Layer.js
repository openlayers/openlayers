OpenLayers.Layer = Class.create();

OpenLayers.Layer.prototype = {
    // str: name
    name: null,

    // DOMElement: div
    div: null,

    // OpenLayers.Map
    map: null,

    /**
    * @param {str} name
    */
    initialize: function(name) {
        this.name = name;
    },
    
    /**
     * Destroy is a destructor: this is to alleviate cyclic references which
     * the Javascript garbage cleaner can not take care of on its own.
    */
    destroy: function() {
        this.map = null;
    },

    /**
    * @params {OpenLayers.Bounds} bound
    * @params {bool} zoomChanged tells when zoom has changed, as layers have to do some init work in that case.
    */
    moveTo: function (bound,zoomChanged) {
        // not implemented here
        return;
    }
};
