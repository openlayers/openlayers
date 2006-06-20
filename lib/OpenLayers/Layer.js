/**
 * @class
 */
OpenLayers.Layer = Class.create();
OpenLayers.Layer.prototype = {

    /** @type String */
    name: null,

    /** @type DOMElement */
    div: null,

    /** This variable is set in map.addLayer, not within the layer itself
    * @type OpenLayers.Map */
    map: null,
    
    /**
     * @constructor
     * 
     * @param {String} name
     */
    initialize: function(name) {
        if (arguments.length > 0) {
            this.name = name;
            if (this.div == null) {
                this.div = OpenLayers.Util.createDiv();
                this.div.style.width = "100%";
                this.div.style.height = "100%";
            }
        }
    },
    
    /**
     * Destroy is a destructor: this is to alleviate cyclic references which
     * the Javascript garbage cleaner can not take care of on its own.
     */
    destroy: function() {
        if (this.map != null) {
            this.map.removeLayer(this);
        }
        this.map = null;
    },

    /**
    * @params {OpenLayers.Bounds} bound
    * @params {Boolean} zoomChanged tells when zoom has changed, as layers have to do some init work in that case.
    */
    moveTo: function (bound, zoomChanged) {
        // not implemented here
        return;
    },
    
    /**
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
    },
  
    /**
     * @returns Whether or not the layer is a base layer. This should be 
     *          determined individually by all subclasses. 
     * @type Boolean
     */
    isBaseLayer: function() {
       //this function should be implemented by all subclasses.
    },
    
    /**
    * @returns Whether or not the layer is visible
    * @type Boolean
    */
    getVisibility: function() {
        return (this.div.style.display != "none");
    },

    /** 
    * @param {bool} visible
    */
    setVisibility: function(visible) {
        this.div.style.display = (visible) ? "block" : "none";
        if ((visible) && (this.map != null)) {
            this.moveTo(this.map.getExtent());
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer"
};
