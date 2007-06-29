/* Cpyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Control.js
 *
 * Class: OpenLayers.Control.ArgParser
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ArgParser = OpenLayers.Class.create();
OpenLayers.Control.ArgParser.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Control, {

    /**
     * Parameter: center
     * {<OpenLayers.LonLat>}
     */
    center: null,
    
    /**
     * Parameter: zoom
     * {int}
     */
    zoom: null,

    /**
     * Parameter: layers 
     * {Array}
     */
    layers: null,

    /**
     * Constructor: OpenLayers.Control.ArgParser
     *
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: setMap
     * Set the map property for the control. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        //make sure we dont already have an arg parser attached
        for(var i=0; i< this.map.controls.length; i++) {
            var control = this.map.controls[i];
            if ( (control != this) &&
                 (control.CLASS_NAME == "OpenLayers.Control.ArgParser") ) {
                break;
            }
        }
        if (i == this.map.controls.length) {

            var args = OpenLayers.Util.getArgs();
            if (args.lat && args.lon) {
                this.center = new OpenLayers.LonLat(parseFloat(args.lon),
                                                    parseFloat(args.lat));
                if (args.zoom) {
                    this.zoom = parseInt(args.zoom);
                }
    
                // when we add a new baselayer to see when we can set the center
                this.map.events.register('changebaselayer', this, 
                                         this.setCenter);
                this.setCenter();
            }
    
            if (args.layers) {
                this.layers = args.layers;
    
                // when we add a new layer, set its visibility 
                this.map.events.register('addlayer', this, 
                                         this.configureLayers);
                this.configureLayers();
            }
        }
    },
   
    /** 
     * Method: setCenter
     * As soon as a baseLayer has been loaded, we center and zoom
     *   ...and remove the handler.
     */
    setCenter: function() {
        
        if (this.map.baseLayer) {
            //dont need to listen for this one anymore
            this.map.events.unregister('changebaselayer', this, 
                                       this.setCenter);
                                       
            this.map.setCenter(this.center, this.zoom);
        }
    },

    /** 
     * Method: configureLayers
     * As soon as all the layers are loaded, cycle through them and 
     *   hide or show them. 
     */
    configureLayers: function() {

        if (this.layers.length == this.map.layers.length) { 
            this.map.events.unregister('addlayer', this, this.configureLayers);

            for(var i=0; i < this.layers.length; i++) {
                
                var layer = this.map.layers[i];
                var c = this.layers.charAt(i);
                
                if (c == "B") {
                    this.map.setBaseLayer(layer);
                } else if ( (c == "T") || (c == "F") ) {
                    layer.setVisibility(c == "T");
                }
            }
        }
    },     
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.ArgParser"
});
