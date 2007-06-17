/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

/**
 * @class
 *
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Renderer.js
 * @requires OpenLayers/Feature/Vector.js
 */
OpenLayers.Layer.Vector = OpenLayers.Class.create();
OpenLayers.Layer.Vector.prototype =
  OpenLayers.Class.inherit(OpenLayers.Layer, {

    /** @type Boolean */
    isBaseLayer: false,

    /** @type Boolean */
    isFixed: false,

    /** @type Boolean */
    isVector: true,

    /** @type Array(OpenLayer.Feature.Vector) */
    features: null,
    
    /** @type Array(OpenLayers.Feature.Vector) */
    selectedFeatures: null,

    /** @type {Boolean} */
    reportError: true, 

    /** @type {Object} */
    style: null,

    /**
     * List of supported Renderer classes. Add to this list to
     * add support for additional renderers. This list is ordered:
     * the first renderer which returns true for the  'supported()'
     * method will be used, if not defined in the 'renderer' option.
     * 
     * @type {Array(String)} 
     */
    renderers: ['SVG', 'VML'],
    
    /** @type OpenLayers.Renderer */
    renderer: null,
   
    /** 
     * geometryType allows you to limit the types of geometries this
     * layer supports. This should be set to something like 
     * "OpenLayers.Geometry.Point" to limit types.
     * 
     * @type string 
     */
    geometryType: null,

    /** Whether the Vector Layer features have been drawn yet.
     *
     * @type boolean 
     */
    drawn: false,

    /**
     * @constructor
     *
     * @param {String} name
     * @param {Object} options Hashtable of extra options to tag onto the layer.
     * Options renderer {Object}: Typically SVGRenderer or VMLRenderer.
     */
    initialize: function(name, options) {

        var defaultStyle = OpenLayers.Feature.Vector.style['default'];
        this.style = OpenLayers.Util.extend({}, defaultStyle);

        OpenLayers.Layer.prototype.initialize.apply(this, arguments);

        // allow user-set renderer, otherwise assign one
        if (!this.renderer || !this.renderer.supported()) {  
            this.assignRenderer();
        }

        // if no valid renderer found, display error
        if (!this.renderer || !this.renderer.supported()) {
            this.renderer = null;
            this.displayError();
        } 

        this.features = new Array();
        this.selectedFeatures = new Array();
    },

    /**
     * 
     */
    destroy: function() {
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);  

        this.destroyFeatures();
        this.features = null;
        this.selectedFeatures = null;
        if (this.renderer) {
            this.renderer.destroy();
        }
        this.renderer = null;
        this.geometryType = null;
        this.drawn = null;
    },

    /** Iterates through the available renderer implementations and selects 
     *  and assigns the first one whose "supported()" function returns true.
     * 
     * @private
     * 
     */    
    assignRenderer: function()  {
        for (var i = 0; i < this.renderers.length; i++) {
            var rendererClass = OpenLayers.Renderer[this.renderers[i]];
            if (rendererClass && rendererClass.prototype.supported()) {
               this.renderer = new rendererClass(this.div);
               break;
            }  
        }  
    },

    /** 
     * Let the user know their browser isn't supported.
     * 
     * @private
     * 
     */
    displayError: function() {
        if (this.reportError) {
            var message = "Your browser does not support vector rendering. " + 
                            "Currently supported renderers are:\n";
            message += this.renderers.join("\n");
            alert(message);
        }    
    },

    /** The layer has been added to the map. 
     * 
     *  If there is no renderer set, the layer can't be used. Remove it.
     *  Otherwise, give the renderer a reference to the map and set its size.
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {        
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        if (!this.renderer) {
            this.map.removeLayer(this);
        } else {
            this.renderer.map = this.map;
            this.renderer.setSize(this.map.getSize());
        }
    },
    
    /** Notify the renderer of the change in size. 
     * 
     */
    onMapResize: function() {
        OpenLayers.Layer.prototype.onMapResize.apply(this, arguments);
        this.renderer.setSize(this.map.getSize());
    },

    /** Reset the vector layer's div so that it once again is lined up with 
     *   the map. Notify the renderer of the change of extent, and in the
     *   case of a change of zoom level (resolution), have the 
     *   renderer redraw features.
     * 
     *  If the layer has not yet been drawn, cycle through the layer's 
     *   features and draw each one.
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
     */
    moveTo: function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);
        
        if (!dragging) {
            this.div.style.left = - parseInt(this.map.layerContainerDiv.style.left) + "px";
            this.div.style.top = - parseInt(this.map.layerContainerDiv.style.top) + "px";
            var extent = this.map.getExtent();
            this.renderer.setExtent(extent);
        }

        if (!this.drawn || zoomChanged) {
            this.drawn = true;
            for(var i = 0; i < this.features.length; i++) {
                var feature = this.features[i];
                this.drawFeature(feature);
            }
        }    
    },

    /**
     * @param {Array(OpenLayers.Feature.Vector} features
     */
    addFeatures: function(features) {
        if (!(features instanceof Array)) {
            features = [features];
        }

        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            
            if (this.geometryType &&
                !(feature.geometry instanceof this.geometryType)) {
                    var throwStr = "addFeatures : component should be an " + 
                                    this.geometryType.prototype.CLASS_NAME;
                    throw throwStr;
                }

            this.features.push(feature);
            
            //give feature reference to its layer
            feature.layer = this;

            if (!feature.style) {
                feature.style = OpenLayers.Util.extend({}, this.style);
            }

            this.preFeatureInsert(feature);

            if (this.drawn) {
                this.drawFeature(feature);
            }
            
            this.onFeatureInsert(feature);
        }
    },


    /**
     * @param {Array(OpenLayers.Feature.Vector} features
     */
    removeFeatures: function(features) {
        if (!(features instanceof Array)) {
            features = [features];
        }

        for (var i = features.length - 1; i >= 0; i--) {
            var feature = features[i];
            this.features = OpenLayers.Util.removeItem(this.features, feature);

            if (feature.geometry) {
                this.renderer.eraseGeometry(feature.geometry);
            }
                    
            //in the case that this feature is one of the selected features, 
            // remove it from that array as well.
            if (OpenLayers.Util.indexOf(this.selectedFeatures, feature) != -1){
                OpenLayers.Util.removeItem(this.selectedFeatures, feature);
            }
        }
    },

    /**
     * Destroy all features on the layer and empty the selected features array.
     */
    destroyFeatures: function () {
        this.selectedFeatures = new Array();
        for (var i = this.features.length - 1; i >= 0; i--) {
            this.features[i].destroy();
        }
    },

    /**
     * Draw (or redraw) a feature on the layer.  If the optional style argument
     * is included, this style will be used.  If no style is included, the
     * feature's style will be used.  If the feature doesn't have a style,
     * the layer's style will be used.
     * 
     * @param {OpenLayers.Feature.Vector} feature
     * @param {Object} style
     */
    drawFeature: function(feature, style) {
        if(style == null) {
            if(feature.style) {
                style = feature.style;
            } else {
                style = this.style;
            }
        }
        this.renderer.drawFeature(feature, style);
    },
    
    /**
     * Erase features from the layer.
     * 
     * @param {Array(OpenLayers.Feature.Vector)} features
     */
    eraseFeatures: function(features) {
        this.renderer.eraseFeatures(features);
    },

    /**
     * Given an event, return a feature if the event occurred over one.
     * Otherwise, return null.
     *
     * @param {Event}
     * @type OpenLayers.Feature.Vector
     * @return A feature if one was under the event
     */
    getFeatureFromEvent: function(evt) {
        var featureId = this.renderer.getFeatureIdFromEvent(evt);
        return this.getFeatureById(featureId);
    },
    
    /**
     * Given a feature id, return the feature if it exists in the features array
     * 
     * @param {String} featureId
     * @type OpenLayers.Feature.Vector
     * @return A feature corresponding to the given featureId
     */
    getFeatureById: function(featureId) {
        //TBD - would it be more efficient to use a hash for this.features?
        var feature = null;
        for(var i=0; i<this.features.length; ++i) {
            if(this.features[i].id == featureId) {
                feature = this.features[i];
                break;
            }
        }
        return feature;
    },
    
    /**
     * Unselect the selected features
     * i.e. clears the featureSelection array
     * change the style back
    clearSelection: function() {

       var vectorLayer = this.map.vectorLayer;
        for (var i = 0; i < this.map.featureSelection.length; i++) {
            var featureSelection = this.map.featureSelection[i];
            vectorLayer.drawFeature(featureSelection, vectorLayer.style);
        }
        this.map.featureSelection = [];
    },
     */


    /**
     * method called when a feature is inserted.
     * Does nothing by default. Override this if you
     * need to do something on feature updates.
     * 
     * @param {OpenLayers.Feature.Vector} feature
     */
    onFeatureInsert: function(feature) {
    },
    
    /**
     * method called before a feature is inserted.
     * Does nothing by default. Override this if you
     * need to do something when features are first added to the
     * layer, but before they are drawn, such as adjust the style.
     * 
     * @param {OpenLayers.Feature.Vector} feature
     */
    preFeatureInsert: function(feature) {
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.Vector"
});
