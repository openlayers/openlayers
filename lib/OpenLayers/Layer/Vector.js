/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer.js
 * @requires OpenLayers/Renderer.js
 * @requires OpenLayers/StyleMap.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Layer.Vector
 * Instances of OpenLayers.Layer.Vector are used to render vector data from
 *     a variety of sources. Create a new vector layer with the
 *     <OpenLayers.Layer.Vector> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Layer>
 */
OpenLayers.Layer.Vector = OpenLayers.Class(OpenLayers.Layer, {

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * layer.events.register(type, obj, listener);
     * (end)
     *
     * Listeners will be called with a reference to an event object.  The
     *     properties of this event depends on exactly what happened.
     *
     * All event objects have at least the following properties:
     *  - *object* {Object} A reference to layer.events.object.
     *  - *element* {DOMElement} A reference to layer.events.element.
     *
     * Supported map event types (in addition to those from <OpenLayers.Layer>):
     *  - *beforefeatureadded* Triggered before a feature is added.  Listeners
     *      will receive an object with a *feature* property referencing the
     *      feature to be added.
     *  - *featureadded* Triggered after a feature is added.  The event
     *      object passed to listeners will have a *feature* property with a
     *      reference to the added feature.
     *  - *featuresadded* Triggered after features are added.  The event
     *      object passed to listeners will have a *features* property with a
     *      reference to an array of added features.
     *  - *beforefeatureremoved* Triggered before a feature is removed. Listeners
     *      will receive an object with a *feature* property referencing the
     *      feature to be removed.
     *  - *featureremoved* Triggerd after a feature is removed. The event
     *      object passed to listeners will have a *feature* property with a
     *      reference to the removed feature.
     *  - *featuresremoved* Triggered after features are removed. The event
     *      object passed to listeners will have a *features* property with a
     *      reference to an array of removed features.
     *  - *featureselected* Triggered after a feature is selected.  Listeners
     *      will receive an object with a *feature* property referencing the
     *      selected feature.
     *  - *featureunselected* Triggered after a feature is unselected.
     *      Listeners will receive an object with a *feature* property
     *      referencing the unselected feature.
     *  - *beforefeaturemodified* Triggered when a feature is selected to 
     *      be modified.  Listeners will receive an object with a *feature* 
     *      property referencing the selected feature.
     *  - *featuremodified* Triggered when a feature has been modified.
     *      Listeners will receive an object with a *feature* property referencing 
     *      the modified feature.
     *  - *afterfeaturemodified* Triggered when a feature is finished being modified.
     *      Listeners will receive an object with a *feature* property referencing 
     *      the modified feature.
     */
    EVENT_TYPES: ["beforefeatureadded", "featureadded", "featuresadded",
                  "beforefeatureremoved", "featureremoved", "featuresremoved",
                  "featureselected", "featureunselected", 
                  "beforefeaturemodified", "featuremodified", "afterfeaturemodified"],

    /**
     * APIProperty: isBaseLayer
     * {Boolean} The layer is a base layer.  Default is true.  Set this property
     * in the layer options
     */
    isBaseLayer: false,

    /** 
     * APIProperty: isFixed
     * {Boolean} Whether the layer remains in one place while dragging the
     * map.
     */
    isFixed: false,

    /** 
     * APIProperty: isVector
     * {Boolean} Whether the layer is a vector layer.
     */
    isVector: true,

    /** 
     * APIProperty: features
     * {Array(<OpenLayers.Feature.Vector>)} 
     */
    features: null,
    
    /** 
     * Property: selectedFeatures
     * {Array(<OpenLayers.Feature.Vector>)} 
     */
    selectedFeatures: null,

    /**
     * APIProperty: reportError
     * {Boolean} report error message via alert() when loading of renderers
     * fails.
     */
    reportError: true, 

    /** 
     * APIProperty: style
     * {Object} Default style for the layer
     */
    style: null,
    
    /**
     * Property: styleMap
     * {<OpenLayers.StyleMap>}
     */
    styleMap: null,

    /**
     * Property: renderers
     * {Array(String)} List of supported Renderer classes. Add to this list to
     * add support for additional renderers. This list is ordered:
     * the first renderer which returns true for the  'supported()'
     * method will be used, if not defined in the 'renderer' option.
     */
    renderers: ['SVG', 'VML'],
    
    /** 
     * Property: renderer
     * {<OpenLayers.Renderer>}
     */
    renderer: null,
   
    /** 
     * APIProperty: geometryType
     * {String} geometryType allows you to limit the types of geometries this
     * layer supports. This should be set to something like
     * "OpenLayers.Geometry.Point" to limit types.
     */
    geometryType: null,

    /** 
     * Property: drawn
     * {Boolean} Whether the Vector Layer features have been drawn yet.
     */
    drawn: false,

    /**
     * Constructor: OpenLayers.Layer.Vector
     * Create a new vector layer
     *
     * Parameters:
     * name - {String} A name for the layer
     * options - {Object} Optional object with non-default properties to set on
     *           the layer.
     *
     * Returns:
     * {<OpenLayers.Layer.Vector>} A new vector layer
     */
    initialize: function(name, options) {
        
        // concatenate events specific to vector with those from the base
        this.EVENT_TYPES =
            OpenLayers.Layer.Vector.prototype.EVENT_TYPES.concat(
            OpenLayers.Layer.prototype.EVENT_TYPES
        );

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

        if (!this.styleMap) {
            this.styleMap = new OpenLayers.StyleMap();
        }

        this.features = [];
        this.selectedFeatures = [];
    },

    /**
     * APIMethod: destroy
     * Destroy this layer
     */
    destroy: function() {
        this.destroyFeatures();
        this.features = null;
        this.selectedFeatures = null;
        if (this.renderer) {
            this.renderer.destroy();
        }
        this.renderer = null;
        this.geometryType = null;
        this.drawn = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);  
    },

    /** 
     * Method: assignRenderer
     * Iterates through the available renderer implementations and selects 
     * and assigns the first one whose "supported()" function returns true.
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
     * Method: displayError 
     * Let the user know their browser isn't supported.
     */
    displayError: function() {
        if (this.reportError) {
            alert(OpenLayers.i18n("browserNotSupported", 
                                     {'renderers':this.renderers.join("\n")}));
        }    
    },

    /** 
     * Method: setMap
     * The layer has been added to the map. 
     * 
     * If there is no renderer set, the layer can't be used. Remove it.
     * Otherwise, give the renderer a reference to the map and set its size.
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
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
    
    /**
     * Method: onMapResize
     * Notify the renderer of the change in size. 
     * 
     */
    onMapResize: function() {
        OpenLayers.Layer.prototype.onMapResize.apply(this, arguments);
        this.renderer.setSize(this.map.getSize());
    },

    /**
     * Method: moveTo
     *  Reset the vector layer's div so that it once again is lined up with 
     *   the map. Notify the renderer of the change of extent, and in the
     *   case of a change of zoom level (resolution), have the 
     *   renderer redraw features.
     * 
     *  If the layer has not yet been drawn, cycle through the layer's 
     *   features and draw each one.
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * zoomChanged - {Boolean} 
     * dragging - {Boolean} 
     */
    moveTo: function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        if (!dragging) {
            this.renderer.root.style.visibility = "hidden";
            // force a reflow on gecko based browsers to actually hide the svg
            if (navigator.userAgent.toLowerCase().indexOf("gecko") != -1) {
                this.div.scrollLeft = this.div.scrollLeft;
            }
            
            this.div.style.left = -parseInt(this.map.layerContainerDiv.style.left) + "px";
            this.div.style.top = -parseInt(this.map.layerContainerDiv.style.top) + "px";
            var extent = this.map.getExtent();
            this.renderer.setExtent(extent);
            
            this.renderer.root.style.visibility = "visible";
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
     * APIMethod: addFeatures
     * Add Features to the layer.
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} 
     * options - {Object}
     */
    addFeatures: function(features, options) {
        if (!(features instanceof Array)) {
            features = [features];
        }
        
        var notify = !options || !options.silent;

        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            
            if (this.geometryType &&
              !(feature.geometry instanceof this.geometryType)) {
                var throwStr = OpenLayers.i18n('componentShouldBe',
                          {'geomType':this.geometryType.prototype.CLASS_NAME});
                throw throwStr;
              }

            this.features.push(feature);
            
            //give feature reference to its layer
            feature.layer = this;

            if (!feature.style && this.style) {
                feature.style = OpenLayers.Util.extend({}, this.style);
            }

            if (notify) {
                this.events.triggerEvent("beforefeatureadded", {
                    feature: feature
                });
                this.preFeatureInsert(feature);
            }

            if (this.drawn) {
                this.drawFeature(feature);
            }
            
            if (notify) {
                this.events.triggerEvent("featureadded", {
                    feature: feature
                });
                this.onFeatureInsert(feature);
            }
        }
        
        if(notify) {
            this.events.triggerEvent("featuresadded", {features: features});
        }
    },


    /**
     * APIMethod: removeFeatures
     * 
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} 
     * options - {Object}
     */
    removeFeatures: function(features, options) {
        if (!(features instanceof Array)) {
            features = [features];
        }
        if (features.length <= 0) {
            return;
        }

        var notify = !options || !options.silent;

        for (var i = features.length - 1; i >= 0; i--) {
            var feature = features[i];

            if (notify) {
                this.events.triggerEvent("beforefeatureremoved", {
                    feature: feature
                });
            }

            this.features = OpenLayers.Util.removeItem(this.features, feature);

            if (feature.geometry) {
                this.renderer.eraseGeometry(feature.geometry);
            }
                    
            //in the case that this feature is one of the selected features, 
            // remove it from that array as well.
            if (OpenLayers.Util.indexOf(this.selectedFeatures, feature) != -1){
                OpenLayers.Util.removeItem(this.selectedFeatures, feature);
            }

            if (notify) {
                this.events.triggerEvent("featureremoved", {
                    feature: feature
                });
            }
        }

        if (notify) {
            this.events.triggerEvent("featuresremoved", {features: features});
        }
    },

    /**
     * APIMethod: destroyFeatures
     * Erase and destroy features on the layer.
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} An optional array of
     *     features to destroy.  If not supplied, all features on the layer
     *     will be destroyed.
     */
    destroyFeatures: function(features) {
        var all = (features == undefined);
        if(all) {
            features = this.features;
            this.selectedFeatures = [];
        }
        this.eraseFeatures(features);
        var feature;
        for(var i=features.length-1; i>=0; i--) {
            feature = features[i];
            if(!all) {
                OpenLayers.Util.removeItem(this.selectedFeatures, feature);
            }
            feature.destroy();
        }
    },

    /**
     * APIMethod: drawFeature
     * Draw (or redraw) a feature on the layer.  If the optional style argument
     * is included, this style will be used.  If no style is included, the
     * feature's style will be used.  If the feature doesn't have a style,
     * the layer's style will be used.
     * 
     * Parameters: 
     * feature - {<OpenLayers.Feature.Vector>} 
     * style - {Object} Symbolizer hash or {String} renderIntent
     */
    drawFeature: function(feature, style) {
        if (typeof style != "object") {
            var renderIntent = typeof style == "string" ?
                style : feature.renderIntent;
            style = feature.style || this.style;
            if (!style) {
                style = this.styleMap.createSymbolizer(feature, renderIntent);
            }
        }
        
        this.renderer.drawFeature(feature, style);
    },
    
    /**
     * Method: eraseFeatures
     * Erase features from the layer.
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} 
     */
    eraseFeatures: function(features) {
        this.renderer.eraseFeatures(features);
    },

    /**
     * Method: getFeatureFromEvent
     * Given an event, return a feature if the event occurred over one.
     * Otherwise, return null.
     *
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A feature if one was under the event.
     */
    getFeatureFromEvent: function(evt) {
        if (!this.renderer) {
            OpenLayers.Console.error(OpenLayers.i18n("getFeatureError")); 
            return null;
        }    
        var featureId = this.renderer.getFeatureIdFromEvent(evt);
        return this.getFeatureById(featureId);
    },
    
    /**
     * APIMethod: getFeatureById
     * Given a feature id, return the feature if it exists in the features array
     *
     * Parameters:
     * featureId - {String} 
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A feature corresponding to the given
     * featureId
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
     * APIMethod: onFeatureInsert
     * method called after a feature is inserted.
     * Does nothing by default. Override this if you
     * need to do something on feature updates.
     *
     * Paarameters: 
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    onFeatureInsert: function(feature) {
    },
    
    /**
     * APIMethod: preFeatureInsert
     * method called before a feature is inserted.
     * Does nothing by default. Override this if you
     * need to do something when features are first added to the
     * layer, but before they are drawn, such as adjust the style.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    preFeatureInsert: function(feature) {
    },

    /** 
     * APIMethod: getDataExtent
     * Calculates the max extent which includes all of the features.
     * 
     * Returns:
     * {<OpenLayers.Bounds>}
     */
    getDataExtent: function () {
        var maxExtent = null;
        if( this.features && (this.features.length > 0)){
            var maxExtent = this.features[0].geometry.getBounds();
            for(var i=0; i < this.features.length; i++){
                maxExtent.extend(this.features[i].geometry.getBounds());
            }
        }

        return maxExtent;
    },

    CLASS_NAME: "OpenLayers.Layer.Vector"
});
