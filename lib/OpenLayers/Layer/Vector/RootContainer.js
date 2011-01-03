/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.Vector.RootContainer
 * A special layer type to combine multiple vector layers inside a single
 *     renderer root container. This class is not supposed to be instantiated
 *     from user space, it is a helper class for controls that require event
 *     processing for multiple vector layers.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.Vector.RootContainer = OpenLayers.Class(OpenLayers.Layer.Vector, {
    
    /**
     * Property: displayInLayerSwitcher
     * Set to false for this layer type
     */
    displayInLayerSwitcher: false,
    
    /**
     * APIProperty: layers
     * Layers that are attached to this container. Required config option.
     */
    layers: null,
    
    /**
     * Constructor: OpenLayers.Layer.Vector.RootContainer
     * Create a new root container for multiple vector layer. This constructor
     * is not supposed to be used from user space, it is only to be used by
     * controls that need feature selection across multiple vector layers.
     *
     * Parameters:
     * name - {String} A name for the layer
     * options - {Object} Optional object with non-default properties to set on
     *           the layer.
     * 
     * Required options properties:
     * layers - {Array(<OpenLayers.Layer.Vector>)} The layers managed by this
     *     container
     *
     * Returns:
     * {<OpenLayers.Layer.Vector.RootContainer>} A new vector layer root
     *     container
     */
    initialize: function(name, options) {
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * Method: display
     */
    display: function() {},
    
    /**
     * Method: getFeatureFromEvent
     * walk through the layers to find the feature returned by the event
     * 
     * Parameters:
     * evt - {Object} event object with a feature property
     * 
     * Returns:
     * {<OpenLayers.Feature.Vector>}
     */
    getFeatureFromEvent: function(evt) {
        var layers = this.layers;
        var feature;
        for(var i=0; i<layers.length; i++) {
            feature = layers[i].getFeatureFromEvent(evt);
            if(feature) {
                return feature;
            }
        }
    },
    
    /**
     * Method: setMap
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.Vector.prototype.setMap.apply(this, arguments);
        this.collectRoots();
        map.events.register("changelayer", this, this.handleChangeLayer);
    },
    
    /**
     * Method: removeMap
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    removeMap: function(map) {
        map.events.unregister("changelayer", this, this.handleChangeLayer);
        this.resetRoots();
        OpenLayers.Layer.Vector.prototype.removeMap.apply(this, arguments);
    },
    
    /**
     * Method: collectRoots
     * Collects the root nodes of all layers this control is configured with
     * and moveswien the nodes to this control's layer
     */
    collectRoots: function() {
        var layer;
        // walk through all map layers, because we want to keep the order
        for(var i=0; i<this.map.layers.length; ++i) {
            layer = this.map.layers[i];
            if(OpenLayers.Util.indexOf(this.layers, layer) != -1) {
                layer.renderer.moveRoot(this.renderer);
            }
        }
    },
    
    /**
     * Method: resetRoots
     * Resets the root nodes back into the layers they belong to.
     */
    resetRoots: function() {
        var layer;
        for(var i=0; i<this.layers.length; ++i) {
            layer = this.layers[i];
            if(this.renderer && layer.renderer.getRenderLayerId() == this.id) {
                this.renderer.moveRoot(layer.renderer);
            }
        }
    },
    
    /**
     * Method: handleChangeLayer
     * Event handler for the map's changelayer event. We need to rebuild
     * this container's layer dom if order of one of its layers changes.
     * This handler is added with the setMap method, and removed with the
     * removeMap method.
     * 
     * Parameters:
     * evt - {Object}
     */
    handleChangeLayer: function(evt) {
        var layer = evt.layer;
        if(evt.property == "order" &&
                        OpenLayers.Util.indexOf(this.layers, layer) != -1) {
            this.resetRoots();
            this.collectRoots();
        }
    },

    CLASS_NAME: "OpenLayers.Layer.Vector.RootContainer"
});
