/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Click.js
 * @requires OpenLayers/Handler/Box.js
 * @requires OpenLayers/Handler/Hover.js
 * @requires OpenLayers/Filter/Spatial.js
 */

/**
 * Class: OpenLayers.Control.GetFeature
 * Gets vector features for locations underneath the mouse cursor. Can be
 *     configured to act on click, hover or dragged boxes. Uses an
 *     <OpenLayers.Protocol> that supports spatial filters to retrieve
 *     features from a server and fires events that notify applications of the
 *     selected features. 
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.GetFeature = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * APIProperty: protocol
     * {<OpenLayers.Protocol>} Required. The protocol used for fetching
     *     features.
     */
    protocol: null,
    
    /**
     * APIProperty: multipleKey
     * {String} An event modifier ('altKey' or 'shiftKey') that temporarily sets
     *     the <multiple> property to true.  Default is null.
     */
    multipleKey: null,
    
    /**
     * APIProperty: toggleKey
     * {String} An event modifier ('altKey' or 'shiftKey') that temporarily sets
     *     the <toggle> property to true.  Default is null.
     */
    toggleKey: null,
    
    /**
     * Property: modifiers
     * {Object} The event modifiers to use, according to the current event
     *     being handled by this control's handlers
     */
    modifiers: null,
    
    /**
     * APIProperty: multiple
     * {Boolean} Allow selection of multiple geometries.  Default is false.
     */
    multiple: false, 

    /**
     * APIProperty: click
     * {Boolean} Use a click handler for selecting/unselecting features. If
     *     both <click> and <box> are set to true, the click handler takes
     *     precedence over the box handler if a box with zero extent was
     *     selected.  Default is true.
     */
    click: true,

    /**
     * APIProperty: single
     * {Boolean} Tells whether select by click should select a single
     *     feature. If set to false, all matching features are selected.
     *     If set to true, only the best matching feature is selected.
     *     This option has an effect only of the <click> option is set
     *     to true. Default is true.
     */
    single: true,
    
    /**
     * APIProperty: clickout
     * {Boolean} Unselect features when clicking outside any feature.
     *     Applies only if <click> is true.  Default is true.
     */
    clickout: true,
    
    /**
     * APIProperty: toggle
     * {Boolean} Unselect a selected feature on click.  Applies only if
     *     <click> is true.  Default is false.
     */
    toggle: false,

    /**
     * APIProperty: clickTolerance
     * {Integer} Tolerance for the filter query in pixels. This has the
     *     same effect as the tolerance parameter on WMS GetFeatureInfo
     *     requests.  Will be ignored for box selections.  Applies only if
     *     <click> or <hover> is true.  Default is 5.  Note that this not
     *     only affects requests on click, but also on hover.
     */
    clickTolerance: 5,
    
    /**
     * APIProperty: hover
     * {Boolean} Send feature requests on mouse moves.  Default is false.
     */
    hover: false,

    /**
     * APIProperty: box
     * {Boolean} Allow feature selection by drawing a box. If set to
     *     true set <click> to false to disable the click handler and
     *     rely on the box handler only, even for "zero extent" boxes.
     *     See the description of the <click> option for additional
     *     information.  Default is false.
     */
    box: false,
    
    /**
     * APIProperty: maxFeatures
     * {Integer} Maximum number of features to return from a query in single mode
     *     if supported by the <protocol>. This set of features is then used to
     *     determine the best match client-side. Default is 10.
     */
    maxFeatures: 10,
    
    /**
     * Property: features
     * {Object} Hash of {<OpenLayers.Feature.Vector>}, keyed by fid, holding
     *     the currently selected features
     */
    features: null,
    
    /**
     * Proeprty: hoverFeature
     * {<OpenLayers.Feature.Vector>} The feature currently selected by the
     *     hover handler
     */
    hoverFeature: null,
    
    /**
     * APIProperty: handlerOptions
     * {Object} Additional options for the handlers used by this control. This
     *     is a hash with the keys "click", "box" and "hover".
     */
    handlerOptions: null,
    
    /**
     * Property: handlers
     * {Object} Object with references to multiple <OpenLayers.Handler>
     *     instances.
     */
    handlers: null,

    /**
     * Property: hoverResponse
     * {<OpenLayers.Protocol.Response>} The response object associated with
     *     the currently running hover request (if any).
     */
    hoverResponse: null,
    
    /**
     * Property: filterType
     * {<String>} The type of filter to use when sending off a request. 
     *     Possible values: 
     *     OpenLayers.Filter.Spatial.<BBOX|INTERSECTS|WITHIN|CONTAINS>
     *     Defaults to: OpenLayers.Filter.Spatial.BBOX
     */
    filterType: OpenLayers.Filter.Spatial.BBOX,

    /** 
     * APIProperty: events
     * {<OpenLayers.Events>} Events instance for listeners and triggering
     *     control specific events.
     *
     * Register a listener for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Supported event types (in addition to those from <OpenLayers.Control.events>):
     * beforefeatureselected - Triggered when <click> is true before a
     *      feature is selected. The event object has a feature property with
     *      the feature about to select
     * featureselected - Triggered when <click> is true and a feature is
     *      selected. The event object has a feature property with the
     *      selected feature
     * beforefeaturesselected - Triggered when <click> is true before a
     *      set of features is selected. The event object is an array of
     *      feature properties with the features about to be selected.  
     *      Return false after receiving this event to discontinue processing
     *      of all featureselected events and the featuresselected event.
     * featuresselected - Triggered when <click> is true and a set of
     *      features is selected.  The event object is an array of feature
     *      properties of the selected features
     * featureunselected - Triggered when <click> is true and a feature is
     *      unselected. The event object has a feature property with the
     *      unselected feature
     * clickout - Triggered when when <click> is true and no feature was
     *      selected.
     * hoverfeature - Triggered when <hover> is true and the mouse has
     *      stopped over a feature
     * outfeature - Triggered when <hover> is true and the mouse moves
     *      moved away from a hover-selected feature
     */

    /**
     * Constructor: OpenLayers.Control.GetFeature
     * Create a new control for fetching remote features.
     *
     * Parameters:
     * options - {Object} A configuration object which at least has to contain
     *     a <protocol> property (if not, it has to be set before a request is
     *     made)
     */
    initialize: function(options) {
        options.handlerOptions = options.handlerOptions || {};

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        this.features = {};

        this.handlers = {};
        
        if(this.click) {
            this.handlers.click = new OpenLayers.Handler.Click(this,
                {click: this.selectClick}, this.handlerOptions.click || {});
        }

        if(this.box) {
            this.handlers.box = new OpenLayers.Handler.Box(
                this, {done: this.selectBox},
                OpenLayers.Util.extend(this.handlerOptions.box, {
                    boxDivClassName: "olHandlerBoxSelectFeature"
                })
            ); 
        }
        
        if(this.hover) {
            this.handlers.hover = new OpenLayers.Handler.Hover(
                this, {'move': this.cancelHover, 'pause': this.selectHover},
                OpenLayers.Util.extend(this.handlerOptions.hover, {
                    'delay': 250,
                    'pixelTolerance': 2
                })
            );
        }
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
            for(var i in this.handlers) {
                this.handlers[i].activate();
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
            for(var i in this.handlers) {
                this.handlers[i].deactivate();
            }
        }
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },
    
    /**
     * Method: selectClick
     * Called on click
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    selectClick: function(evt) {
        var bounds = this.pixelToBounds(evt.xy);
        
        this.setModifiers(evt);
        this.request(bounds, {single: this.single});
    },

    /**
     * Method: selectBox
     * Callback from the handlers.box set up when <box> selection is on
     *
     * Parameters:
     * position - {<OpenLayers.Bounds>|Object} An OpenLayers.Bounds or
     * an object with a 'left', 'bottom', 'right' and 'top' properties.
     */
    selectBox: function(position) {
        var bounds;
        if (position instanceof OpenLayers.Bounds) {
            var minXY = this.map.getLonLatFromPixel({
                x: position.left,
                y: position.bottom
            });
            var maxXY = this.map.getLonLatFromPixel({
                x: position.right,
                y: position.top
            });
            bounds = new OpenLayers.Bounds(
                minXY.lon, minXY.lat, maxXY.lon, maxXY.lat
            );
            
        } else {
            if(this.click) {
                // box without extent - let the click handler take care of it
                return;
            }
            bounds = this.pixelToBounds(position);
        }
        this.setModifiers(this.handlers.box.dragHandler.evt);
        this.request(bounds);
    },
    
    /**
     * Method: selectHover
     * Callback from the handlers.hover set up when <hover> selection is on
     *
     * Parameters:
     * evt - {Object} event object with an xy property
     */
    selectHover: function(evt) {
        var bounds = this.pixelToBounds(evt.xy);
        this.request(bounds, {single: true, hover: true});
    },

    /**
     * Method: cancelHover
     * Callback from the handlers.hover set up when <hover> selection is on
     */
    cancelHover: function() {
        if (this.hoverResponse) {
            this.protocol.abort(this.hoverResponse);
            this.hoverResponse = null;

            OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
        }
    },

    /**
     * Method: request
     * Sends a GetFeature request to the WFS
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} bounds for the request's BBOX filter
     * options - {Object} additional options for this method.
     * 
     * Supported options include:
     * single - {Boolean} A single feature should be returned.
     *     Note that this will be ignored if the protocol does not
     *     return the geometries of the features.
     * hover - {Boolean} Do the request for the hover handler.
     */
    request: function(bounds, options) {
        options = options || {};
        var filter = new OpenLayers.Filter.Spatial({
            type: this.filterType, 
            value: bounds
        });
        
        // Set the cursor to "wait" to tell the user we're working.
        OpenLayers.Element.addClass(this.map.viewPortDiv, "olCursorWait");

        var response = this.protocol.read({
            maxFeatures: options.single == true ? this.maxFeatures : undefined,
            filter: filter,
            callback: function(result) {
                if(result.success()) {
                    if(result.features.length) {
                        if(options.single == true) {
                            this.selectBestFeature(result.features,
                                bounds.getCenterLonLat(), options);
                        } else {
                            this.select(result.features);
                        }
                    } else if(options.hover) {
                        this.hoverSelect();
                    } else {
                        this.events.triggerEvent("clickout");
                        if(this.clickout) {
                            this.unselectAll();
                        }
                    }
                }
                // Reset the cursor.
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
            },
            scope: this
        });
        if(options.hover == true) {
            this.hoverResponse = response;
        }
    },

    /**
     * Method: selectBestFeature
     * Selects the feature from an array of features that is the best match
     *     for the click position.
     * 
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)}
     * clickPosition - {<OpenLayers.LonLat>}
     * options - {Object} additional options for this method
     * 
     * Supported options include:
     * hover - {Boolean} Do the selection for the hover handler.
     */
    selectBestFeature: function(features, clickPosition, options) {
        options = options || {};
        if(features.length) {
            var point = new OpenLayers.Geometry.Point(clickPosition.lon,
                clickPosition.lat);
            var feature, resultFeature, dist;
            var minDist = Number.MAX_VALUE;
            for(var i=0; i<features.length; ++i) {
                feature = features[i];
                if(feature.geometry) {
                    dist = point.distanceTo(feature.geometry, {edge: false});
                    if(dist < minDist) {
                        minDist = dist;
                        resultFeature = feature;
                        if(minDist == 0) {
                            break;
                        }
                    }
                }
            }
            
            if(options.hover == true) {
                this.hoverSelect(resultFeature);
            } else {
                this.select(resultFeature || features);
            } 
        }
    },
    
    /**
     * Method: setModifiers
     * Sets the multiple and toggle modifiers according to the current event
     * 
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    setModifiers: function(evt) {
        this.modifiers = {
            multiple: this.multiple || (this.multipleKey && evt[this.multipleKey]),
            toggle: this.toggle || (this.toggleKey && evt[this.toggleKey])
        };        
    },

    /**
     * Method: select
     * Add feature to the hash of selected features and trigger the
     * featureselected and featuresselected events.
     * 
     * Parameters:
     * features - {<OpenLayers.Feature.Vector>} or an array of features
     */
    select: function(features) {
        if(!this.modifiers.multiple && !this.modifiers.toggle) {
            this.unselectAll();
        }
        if(!(OpenLayers.Util.isArray(features))) {
            features = [features];
        }
        
        var cont = this.events.triggerEvent("beforefeaturesselected", {
            features: features
        });
        if(cont !== false) {
            var selectedFeatures = [];
            var feature;
            for(var i=0, len=features.length; i<len; ++i) {
                feature = features[i];
                if(this.features[feature.fid || feature.id]) {
                    if(this.modifiers.toggle) {
                        this.unselect(this.features[feature.fid || feature.id]);
                    }
                } else {
                    cont = this.events.triggerEvent("beforefeatureselected", {
                        feature: feature
                    });
                    if(cont !== false) {
                        this.features[feature.fid || feature.id] = feature;
                        selectedFeatures.push(feature);
                
                        this.events.triggerEvent("featureselected",
                            {feature: feature});
                    }
                }
            }
            this.events.triggerEvent("featuresselected", {
                features: selectedFeatures
            });
        }
    },
    
    /**
     * Method: hoverSelect
     * Sets/unsets the <hoverFeature>
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} the feature to hover-select.
     *     If none is provided, the current <hoverFeature> will be nulled and
     *     the outfeature event will be triggered.
     */
    hoverSelect: function(feature) {
        var fid = feature ? feature.fid || feature.id : null;
        var hfid = this.hoverFeature ?
            this.hoverFeature.fid || this.hoverFeature.id : null;
            
        if(hfid && hfid != fid) {
            this.events.triggerEvent("outfeature",
                {feature: this.hoverFeature});
            this.hoverFeature = null;
        }
        if(fid && fid != hfid) {
            this.events.triggerEvent("hoverfeature", {feature: feature});
            this.hoverFeature = feature;
        }
    },

    /**
     * Method: unselect
     * Remove feature from the hash of selected features and trigger the
     * featureunselected event.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    unselect: function(feature) {
        delete this.features[feature.fid || feature.id];
        this.events.triggerEvent("featureunselected", {feature: feature});
    },
    
    /**
     * Method: unselectAll
     * Unselect all selected features.
     */
    unselectAll: function() {
        // we'll want an option to supress notification here
        for(var fid in this.features) {
            this.unselect(this.features[fid]);
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
        for(var i in this.handlers) {
            this.handlers[i].setMap(map);
        }
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
    
    /**
     * Method: pixelToBounds
     * Takes a pixel as argument and creates bounds after adding the
     * <clickTolerance>.
     * 
     * Parameters:
     * pixel - {<OpenLayers.Pixel>}
     */
    pixelToBounds: function(pixel) {
        var llPx = pixel.add(-this.clickTolerance/2, this.clickTolerance/2);
        var urPx = pixel.add(this.clickTolerance/2, -this.clickTolerance/2);
        var ll = this.map.getLonLatFromPixel(llPx);
        var ur = this.map.getLonLatFromPixel(urPx);
        return new OpenLayers.Bounds(ll.lon, ll.lat, ur.lon, ur.lat);
    },

    CLASS_NAME: "OpenLayers.Control.GetFeature"
});
