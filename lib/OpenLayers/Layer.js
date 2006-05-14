OpenLayers.Layer = Class.create();

OpenLayers.Layer.prototype = {
    // str: name
    name: null,

    // DOMElement: div
    div: null,

    // OpenLayers.Map
    map: null,

    status: null,

    /**
    * @param {str} name
    */
    initialize: function(name) {
        this.name = name;
        this.div = OpenLayers.Util.createDiv();
        this.div.style.width="100%";
        this.div.style.height="100%";
        this.status = true;
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
    },
    getVisibility: function() {
        return this.status;
    },
    setVisibility: function(on) {
        if (on) {
            this.div.style.display="block";
        } else {
            this.div.style.display="none";
        }
        this.status = on;
    }
    
};
