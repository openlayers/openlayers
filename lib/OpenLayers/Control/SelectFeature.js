/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Handler/Feature.js
 * @requires OpenLayers/Layer/Vector/RootContainer.js
 */

/**
 * Class: OpenLayers.Control.SelectFeature
 * The SelectFeature control selects vector features from a given layer on 
 * click or hover. 
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.SelectFeature = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * Property: multipleKey
     * {String} An event modifier ('altKey' or 'shiftKey') that temporarily sets
     *     the <multiple> property to true.  Default is null.
     */
    multipleKey: null,
    
    /**
     * Property: toggleKey
     * {String} An event modifier ('altKey' or 'shiftKey') that temporarily sets
     *     the <toggle> property to true.  Default is null.
     */
    toggleKey: null,
    
    /**
     * APIProperty: multiple
     * {Boolean} Allow selection of multiple geometries.  Default is false.
     */
    multiple: false, 

    /**
     * APIProperty: clickout
     * {Boolean} Unselect features when clicking outside any feature.
     *     Default is true.
     */
    clickout: true,

    /**
     * APIProperty: toggle
     * {Boolean} Unselect a selected feature on click.  Default is false.  Only
     *     has meaning if hover is false.
     */
    toggle: false,

    /**
     * APIProperty: hover
     * {Boolean} Select on mouse over and deselect on mouse out.  If true, this
     * ignores clicks and only listens to mouse moves.
     */
    hover: false,
    
    /**
     * APIProperty: box
     * {Boolean} Allow feature selection by drawing a box.
     */
    box: false,
    
    /**
     * Property: onBeforeSelect 
     * {Function} Optional function to be called before a feature is selected.
     *     The function should expect to be called with a feature.
     */
    onBeforeSelect: function() {},
    
    /**
     * APIProperty: onSelect 
     * {Function} Optional function to be called when a feature is selected.
     *     The function should expect to be called with a feature.
     */
    onSelect: function() {},

    /**
     * APIProperty: onUnselect
     * {Function} Optional function to be called when a feature is unselected.
     *     The function should expect to be called with a feature.
     */
    onUnselect: function() {},
    
    /**
     * Property: scope
     * {Object} The scope to use with the onBeforeSelect, onSelect, onUnselect
     *     callbacks. If null the scope will be this control.
     */
    scope: this,

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict selecting to a limited set of geometry types,
     *     send a list of strings corresponding to the geometry class names.
     */
    geometryTypes: null,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>} The vector layer with a common renderer
     * root for all layers this control is configured with.
     */
    layer: null,
    
    /**
     * Property: layers
     * {Array(<OpenLayers.Layer.Vector>} The layers this control will work on.
     */
    layers: null,
    
    /**
     * APIProperty: callbacks
     * {Object} The functions that are sent to the handlers.feature for callback
     */
    callbacks: null,
    
    /**
     * APIProperty: selectStyle 
     * {Object} Hash of styles
     */
    selectStyle: null,
    
    /**
     * Property: renderIntent
     * {String} key used to retrieve the select style from the layer's
     * style map.
     */
    renderIntent: "select",

    /**
     * Property: handlers
     * {Object} Object with references to multiple <OpenLayers.Handler>
     *     instances.
     */
    handlers: null,

    /**
     * Constructor: OpenLayers.Control.SelectFeature
     * Create a new control for selecting features.
     *
     * Parameters:
     * layers - {<OpenLayers.Layer.Vector>}, or an array of vector layers
     * options - {Object} 
     */
    initialize: function(layers, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        if(!(layers instanceof Array)) {
            layers = [layers];
        }
        this.layers = layers;
        this.layer = new OpenLayers.Layer.Vector.RootContainer(
            this.id + "_container", {
                layers: layers
            }
        );
        var callbacks = {
            click: this.clickFeature,
            clickout: this.clickoutFeature
        };
        if (this.hover) {
            callbacks.over = this.overFeature;
            callbacks.out = this.outFeature;
        }
             
        this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);
        this.handlers = {
            feature: new OpenLayers.Handler.Feature(
                this, this.layer, this.callbacks,
                {geometryTypes: this.geometryTypes}
            )
        };

        if (this.box) {
            this.handlers.box = new OpenLayers.Handler.Box(
                this, {done: this.selectBox},
                {boxDivClassName: "olHandlerBoxSelectFeature"}
            ); 
        }
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        this.layer.destroy();
    },

    /**
     * Method: activate
     * Activates the control.
     * 
     * Returns:
     * {Boolean} The control was effectively activated.
     */
    activate: function () {
        if (!this.active) {
            this.map.addLayer(this.layer);
            this.handlers.feature.activate();
            if(this.box && this.handlers.box) {
                this.handlers.box.activate();
            }
        }
        return OpenLayers.Control.prototype.activate.apply(
            this, arguments
        );
    },

    /**
     * Method: deactivate
     * Deactivates the control.
     * 
     * Returns:
     * {Boolean} The control was effectively deactivated.
     */
    deactivate: function () {
        if (this.active) {
            this.handlers.feature.deactivate();
            if(this.handlers.box) {
                this.handlers.box.deactivate();
            }
            this.map.events.unregister("changelayer", this.layer,
                this.layer.handleChangeLayer);
            this.map.removeLayer(this.layer);
        }
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },

    /**
     * Method: unselectAll
     * Unselect all selected features.  To unselect all except for a single
     *     feature, set the options.except property to the feature.
     *
     * Parameters:
     * options - {Object} Optional configuration object.
     */
    unselectAll: function(options) {
        // we'll want an option to supress notification here
        var layer, feature;
        for(var l=0; l<this.layers.length; ++l) {
            layer = this.layers[l];
            for(var i=layer.selectedFeatures.length-1; i>=0; --i) {
                feature = layer.selectedFeatures[i];
                if(!options || options.except != feature) {
                    this.unselect(feature);
                }
            }
        }
    },

    /**
     * Method: clickFeature
     * Called on click in a feature
     * Only responds if this.hover is false.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    clickFeature: function(feature) {
        if(!this.hover) {
            var selected = (OpenLayers.Util.indexOf(
                feature.layer.selectedFeatures, feature) > -1);
            if(selected) {
                if(this.toggleSelect()) {
                    this.unselect(feature);
                } else if(!this.multipleSelect()) {
                    this.unselectAll({except: feature});
                }
            } else {
                if(!this.multipleSelect()) {
                    this.unselectAll({except: feature});
                }
                this.select(feature);
            }
        }
    },

    /**
     * Method: multipleSelect
     * Allow for multiple selected features based on <multiple> property and
     *     <multipleKey> event modifier.
     *
     * Returns:
     * {Boolean} Allow for multiple selected features.
     */
    multipleSelect: function() {
        return this.multiple || (this.handlers.feature.evt &&
                                 this.handlers.feature.evt[this.multipleKey]);
    },
    
    /**
     * Method: toggleSelect
     * Event should toggle the selected state of a feature based on <toggle>
     *     property and <toggleKey> event modifier.
     *
     * Returns:
     * {Boolean} Toggle the selected state of a feature.
     */
    toggleSelect: function() {
        return this.toggle || (this.handlers.feature.evt &&
                               this.handlers.feature.evt[this.toggleKey]);
    },

    /**
     * Method: clickoutFeature
     * Called on click outside a previously clicked (selected) feature.
     * Only responds if this.hover is false.
     *
     * Parameters:
     * feature - {<OpenLayers.Vector.Feature>} 
     */
    clickoutFeature: function(feature) {
        if(!this.hover && this.clickout) {
            this.unselectAll();
        }
    },

    /**
     * Method: overFeature
     * Called on over a feature.
     * Only responds if this.hover is true.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    overFeature: function(feature) {
        if(this.hover &&
           (OpenLayers.Util.indexOf(feature.layer.selectedFeatures, feature) == -1)) {
            this.select(feature);
        }
    },

    /**
     * Method: outFeature
     * Called on out of a selected feature.
     * Only responds if this.hover is true.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    outFeature: function(feature) {
        if(this.hover) {
            this.unselect(feature);
        }
    },
    
    /**
     * Method: select
     * Add feature to the layer's selectedFeature array, render the feature as
     * selected, and call the onSelect function.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    select: function(feature) {
        var cont = this.onBeforeSelect.call(this.scope, feature);
        var layer = feature.layer;
        if(cont !== false) {
            cont = layer.events.triggerEvent("beforefeatureselected", {
                feature: feature
            });
            if(cont !== false) {
                layer.selectedFeatures.push(feature);
                this.layerData = {};

                var selectStyle = this.selectStyle || this.renderIntent;
                
                layer.drawFeature(feature, selectStyle);
                layer.events.triggerEvent("featureselected", {feature: feature});
                this.onSelect.call(this.scope, feature);
            }
        }
    },

    /**
     * Method: unselect
     * Remove feature from the layer's selectedFeature array, render the feature as
     * normal, and call the onUnselect function.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    unselect: function(feature) {
        var layer = feature.layer;
        // Store feature style for restoration later
        layer.drawFeature(feature, "default");
        OpenLayers.Util.removeItem(layer.selectedFeatures, feature);
        layer.events.triggerEvent("featureunselected", {feature: feature});
        this.onUnselect.call(this.scope, feature);
    },
    
    /**
     * Method: selectBox
     * Callback from the handlers.box set up when <box> selection is true
     *     on.
     *
     * Parameters:
     * position - {<OpenLayers.Bounds> || <OpenLayers.Pixel> }  
     */
    selectBox: function(position) {
        if (position instanceof OpenLayers.Bounds) {
            var minXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(position.left, position.bottom)
            );
            var maxXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(position.right, position.top)
            );
            var bounds = new OpenLayers.Bounds(
                minXY.lon, minXY.lat, maxXY.lon, maxXY.lat
            );
            
            // if multiple is false, first deselect currently selected features
            if (!this.multipleSelect()) {
                this.unselectAll();
            }
            
            // because we're using a box, we consider we want multiple selection
            var prevMultiple = this.multiple;
            this.multiple = true;
            var layer;
            for(var l=0; l<this.layers.length; ++l) {
                layer = this.layers[l];
                for(var i=0, len = layer.features.length; i<len; ++i) {
                    var feature = layer.features[i];
                    if (this.geometryTypes == null || OpenLayers.Util.indexOf(
                            this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
                        if (bounds.toGeometry().intersects(feature.geometry)) {
                            if (OpenLayers.Util.indexOf(layer.selectedFeatures, feature) == -1) {
                                this.select(feature);
                            }
                        }
                    }
                }
            }
            this.multiple = prevMultiple;
        }
    },

    /** 
     * Method: setMap
     * Set the map property for the control. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        this.handlers.feature.setMap(map);
        if (this.box) {
            this.handlers.box.setMap(map);
        }
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Control.SelectFeature"
});
