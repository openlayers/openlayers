/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Layer/WMS.js
 * @requires OpenLayers/Handler/RegularPolygon.js
 * @requires OpenLayers/Handler/Polygon.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Click.js
 * @requires OpenLayers/Filter/Spatial.js
 * @requires OpenLayers/Format/SLD/v1_0_0.js
 */

/**
 * Class: OpenLayers.Control.SLDSelect
 * Perform selections on WMS layers using Styled Layer Descriptor (SLD)
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.SLDSelect = OpenLayers.Class(OpenLayers.Control, {

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
     * selected - Triggered when a selection occurs.  Listeners receive an 
     *     event with *filters* and *layer* properties.  Filters will be an 
     *     array of OpenLayers.Filter objects created in order to perform 
     *     the particular selection.
     */

    /**
     * APIProperty: clearOnDeactivate
     * {Boolean} Should the selection be cleared when the control is 
     *     deactivated. Default value is false.
     */
    clearOnDeactivate: false,

    /**
     * APIProperty: layers
     * {Array(<OpenLayers.Layer.WMS>)} The WMS layers this control will work 
     *     on.
     */
    layers: null,

    /**
     * Property: callbacks
     * {Object} The functions that are sent to the handler for callback
     */
    callbacks: null,

    /**
     * APIProperty: selectionSymbolizer
     * {Object} Determines the styling of the selected objects. Default is
     *     a selection in red.
     */
    selectionSymbolizer: {
        'Polygon': {fillColor: '#FF0000', stroke: false},
        'Line': {strokeColor: '#FF0000', strokeWidth: 2},
        'Point': {graphicName: 'square', fillColor: '#FF0000', pointRadius: 5}
    },

    /**
     * APIProperty: layerOptions
     * {Object} The options to apply to the selection layer, by default the
     *     selection layer will be kept out of the layer switcher.
     */
    layerOptions: null,

    /**
     * APIProperty: handlerOptions
     * {Object} Used to set non-default properties on the control's handler
     */

    /**
     * APIProperty: sketchStyle
     * {<OpenLayers.Style>|Object} Style or symbolizer to use for the sketch
     * handler. The recommended way of styling the sketch layer, however, is
     * to configure an <OpenLayers.StyleMap> in the layerOptions of the
     * <handlerOptions>:
     * 
     * (code)
     * new OpenLayers.Control.SLDSelect(OpenLayers.Handler.Path, {
     *     handlerOptions: {
     *         layerOptions: {
     *             styleMap: new OpenLayers.StyleMap({
     *                 "default": {strokeColor: "yellow"}
     *             })
     *         }
     *     }
     * });
     * (end)
     */
    sketchStyle: null,

    /**
     * APIProperty: wfsCache
     * {Object} Cache to use for storing parsed results from
     *     <OpenLayers.Format.WFSDescribeFeatureType.read>. If not provided,
     *     these will be cached on the prototype.
     */
    wfsCache: {},

    /**
     * APIProperty: layerCache
     * {Object} Cache to use for storing references to the selection layers.
     *     Normally each source layer will have exactly 1 selection layer of
     *     type OpenLayers.Layer.WMS. If not provided, layers will
     *     be cached on the prototype. Note that if <clearOnDeactivate> is
     *     true, the layer will no longer be cached after deactivating the
     *     control.
     */
    layerCache: {},

    /**
     * Constructor: OpenLayers.Control.SLDSelect
     * Create a new control for selecting features in WMS layers using
     *     Styled Layer Descriptor (SLD).
     *
     * Parameters:
     * handler - {<OpenLayers.Class>} A sketch handler class. This determines
     *     the type of selection, e.g. box (<OpenLayers.Handler.Box>), point
     *     (<OpenLayers.Handler.Point>), path (<OpenLayers.Handler.Path>) or
     *     polygon (<OpenLayers.Handler.Polygon>) selection. To use circle
     *     type selection, use <OpenLayers.Handler.RegularPolygon> and pass
     *     the number of desired sides (e.g. 40) as "sides" property to the
     *     <handlerOptions>.
     * options - {Object} An object containing all configuration properties for
     *     the control.
     *
     * Valid options:
     * layers - Array({<OpenLayers.Layer.WMS>}) The layers to perform the
     *     selection on.
     */
    initialize: function(handler, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        this.callbacks = OpenLayers.Util.extend({done: this.select, 
            click: this.select}, this.callbacks);
        this.handlerOptions = this.handlerOptions || {};
        this.layerOptions = OpenLayers.Util.applyDefaults(this.layerOptions, {
            displayInLayerSwitcher: false,
            tileOptions: {maxGetUrlLength: 2048}
        });
        if (this.sketchStyle) {
            this.handlerOptions.layerOptions = OpenLayers.Util.applyDefaults(
                this.handlerOptions.layerOptions,
                {styleMap: new OpenLayers.StyleMap({"default": this.sketchStyle})}
            );
        }
        this.handler = new handler(this, this.callbacks, this.handlerOptions);
    },

    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass.
     */
    destroy: function() {
        for (var key in this.layerCache) {
            delete this.layerCache[key];
        }
        for (var key in this.wfsCache) {
            delete this.wfsCache[key];
        }
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: coupleLayerVisiblity
     * Couple the selection layer and the source layer with respect to
     *     layer visibility. So if the source layer is turned off, the
     *     selection layer is also turned off.
     *
     * Context: 
     * - {<OpenLayers.Layer>}
     *
     * Parameters:
     * evt - {Object}
     */
    coupleLayerVisiblity: function(evt) {
        this.setVisibility(evt.object.getVisibility());
    },

    /**
     * Method: createSelectionLayer
     * Creates a "clone" from the source layer in which the selection can
     * be drawn. This ensures both the source layer and the selection are 
     * visible and not only the selection.
     *
     * Parameters:
     * source - {<OpenLayers.Layer.WMS>} The source layer on which the selection
     *     is performed.
     *
     * Returns:
     * {<OpenLayers.Layer.WMS>} A WMS layer with maxGetUrlLength configured to 2048
     *     since SLD selections can easily get quite long.
     */
    createSelectionLayer: function(source) {
        // check if we already have a selection layer for the source layer
        var selectionLayer;
        if (!this.layerCache[source.id]) {
            selectionLayer = new OpenLayers.Layer.WMS(source.name, 
                source.url, source.params, 
                OpenLayers.Util.applyDefaults(
                    this.layerOptions,
                    source.getOptions())
            );
            this.layerCache[source.id] = selectionLayer;
            // make sure the layers are coupled wrt visibility, but only
            // if they are not displayed in the layer switcher, because in
            // that case the user cannot control visibility.
            if (this.layerOptions.displayInLayerSwitcher === false) {
                source.events.on({
                    "visibilitychanged": this.coupleLayerVisiblity,
                    scope: selectionLayer});
            }
            this.map.addLayer(selectionLayer);
        } else {
            selectionLayer = this.layerCache[source.id];
        }
        return selectionLayer;
    },

    /**
     * Method: createSLD
     * Create the SLD document for the layer using the supplied filters.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>}
     * filters - Array({<OpenLayers.Filter>}) The filters to be applied.
     * geometryAttributes - Array({Object}) The geometry attributes of the 
     *     layer.
     *
     * Returns:
     * {String} The SLD document generated as a string.
     */
    createSLD: function(layer, filters, geometryAttributes) {
        var sld = {version: "1.0.0", namedLayers: {}};
        var layerNames = [layer.params.LAYERS].join(",").split(",");
        for (var i=0, len=layerNames.length; i<len; i++) { 
            var name = layerNames[i];
            sld.namedLayers[name] = {name: name, userStyles: []};
            var symbolizer = this.selectionSymbolizer;
            var geometryAttribute = geometryAttributes[i];
            if (geometryAttribute.type.indexOf('Polygon') >= 0) {
                symbolizer = {Polygon: this.selectionSymbolizer['Polygon']};
            } else if (geometryAttribute.type.indexOf('LineString') >= 0) {
                symbolizer = {Line: this.selectionSymbolizer['Line']};
            } else if (geometryAttribute.type.indexOf('Point') >= 0) {
                symbolizer = {Point: this.selectionSymbolizer['Point']};
            }
            var filter = filters[i];
            sld.namedLayers[name].userStyles.push({name: 'default', rules: [
                new OpenLayers.Rule({symbolizer: symbolizer, 
                    filter: filter, 
                    maxScaleDenominator: layer.options.minScale})
            ]});
        }
        return new OpenLayers.Format.SLD({srsName: this.map.getProjection()}).write(sld);
    },

    /**
     * Method: parseDescribeLayer
     * Parse the SLD WMS DescribeLayer response and issue the corresponding
     *     WFS DescribeFeatureType request
     *
     * request - {XMLHttpRequest} The request object.
     */
    parseDescribeLayer: function(request) {
        var format = new OpenLayers.Format.WMSDescribeLayer();
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        var describeLayer = format.read(doc);
        var typeNames = [];
        var url = null;
        for (var i=0, len=describeLayer.length; i<len; i++) {
            // perform a WFS DescribeFeatureType request
            if (describeLayer[i].owsType == "WFS") {
                typeNames.push(describeLayer[i].typeName);
                url = describeLayer[i].owsURL;
            }
        }
        var options = {
            url: url,
            params: {
                SERVICE: "WFS",
                TYPENAME: typeNames.toString(),
                REQUEST: "DescribeFeatureType",
                VERSION: "1.0.0"
            },
            callback: function(request) {
                var format = new OpenLayers.Format.WFSDescribeFeatureType();
                var doc = request.responseXML;
                if(!doc || !doc.documentElement) {
                    doc = request.responseText;
                }
                var describeFeatureType = format.read(doc);
                this.control.wfsCache[this.layer.id] = describeFeatureType;
                this.control._queue && this.control.applySelection();
            },
            scope: this
        };
        OpenLayers.Request.GET(options);
    },

   /**
    * Method: getGeometryAttributes
    * Look up the geometry attributes from the WFS DescribeFeatureType response
    *
    * Parameters:
    * layer - {<OpenLayers.Layer.WMS>} The layer for which to look up the 
    *     geometry attributes.
    *
    * Returns:
    * Array({Object}) Array of geometry attributes
    */ 
   getGeometryAttributes: function(layer) {
        var result = [];
        var cache = this.wfsCache[layer.id];
        for (var i=0, len=cache.featureTypes.length; i<len; i++) {
            var typeName = cache.featureTypes[i];
            var properties = typeName.properties;
            for (var j=0, lenj=properties.length; j < lenj; j++) {
                var property = properties[j];
                var type = property.type;
                if ((type.indexOf('LineString') >= 0) ||
                    (type.indexOf('GeometryAssociationType') >=0) ||
                    (type.indexOf('GeometryPropertyType') >= 0) ||
                    (type.indexOf('Point') >= 0) ||
                    (type.indexOf('Polygon') >= 0) ) {
                        result.push(property);
                }
            }
        }
        return result;
    },

    /**
     * APIMethod: activate
     * Activate the control. Activating the control will perform a SLD WMS
     *     DescribeLayer request followed by a WFS DescribeFeatureType request
     *     so that the proper symbolizers can be chosen based on the geometry
     *     type.
     */
    activate: function() {
        var activated = OpenLayers.Control.prototype.activate.call(this);
        if(activated) {
            for (var i=0, len=this.layers.length; i<len; i++) {
                var layer = this.layers[i];
                if (layer && !this.wfsCache[layer.id]) {
                    var options = {
                        url: layer.url,
                        params: {
                            SERVICE: "WMS",
                            VERSION: layer.params.VERSION,
                            LAYERS: layer.params.LAYERS,
                            REQUEST: "DescribeLayer"
                        },
                        callback: this.parseDescribeLayer,
                        scope: {layer: layer, control: this}
                    };
                    OpenLayers.Request.GET(options);
                }
            }
        }
        return activated;
    },

    /**
     * APIMethod: deactivate
     * Deactivate the control. If clearOnDeactivate is true, remove the
     *     selection layer(s).
     */
    deactivate: function() {
        var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
        if(deactivated) {
            for (var i=0, len=this.layers.length; i<len; i++) {
                var layer = this.layers[i];
                if (layer && this.clearOnDeactivate === true) {
                    var layerCache = this.layerCache;
                    var selectionLayer = layerCache[layer.id];
                    if (selectionLayer) {
                        layer.events.un({
                            "visibilitychanged": this.coupleLayerVisiblity,
                            scope: selectionLayer});
                        selectionLayer.destroy();
                        delete layerCache[layer.id];
                    }
                }
            }
        }
        return deactivated;
    },

    /**
     * APIMethod: setLayers
     * Set the layers on which the selection should be performed.  Call the 
     *     setLayers method if the layer(s) to be used change and the same 
     *     control should be used on a new set of layers.
     *     If the control is already active, it will be active after the new
     *     set of layers is set.
     *
     * Parameters:
     * layers - {Array(<OpenLayers.Layer.WMS>)}  The new set of layers on which 
     *     the selection should be performed.
     */
    setLayers: function(layers) {
        if(this.active) {
            this.deactivate();
            this.layers = layers;
            this.activate();
        } else {
            this.layers = layers;
        }
    },

    /**
     * Function: createFilter
     * Create the filter to be used in the SLD.
     *
     * Parameters:
     * geometryAttribute - {Object} Used to get the name of the geometry 
     *     attribute which is needed for constructing the spatial filter.
     * geometry - {<OpenLayers.Geometry>} The geometry to use.
     *
     * Returns:
     * {<OpenLayers.Filter.Spatial>} The spatial filter created.
     */
    createFilter: function(geometryAttribute, geometry) {
        var filter = null;
        if (this.handler instanceof OpenLayers.Handler.RegularPolygon) {
            // box
            if (this.handler.irregular === true) {
                filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.BBOX,
                    property: geometryAttribute.name,
                    value: geometry.getBounds()}
                );
            } else {
                filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.INTERSECTS,
                    property: geometryAttribute.name,
                    value: geometry}
                );
            }
        } else if (this.handler instanceof OpenLayers.Handler.Polygon) {
            filter = new OpenLayers.Filter.Spatial({
                type: OpenLayers.Filter.Spatial.INTERSECTS,
                property: geometryAttribute.name,
                value: geometry}
            );
        } else if (this.handler instanceof OpenLayers.Handler.Path) {
            // if source layer is point based, use DWITHIN instead
            if (geometryAttribute.type.indexOf('Point') >= 0) {
                filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.DWITHIN,
                    property: geometryAttribute.name,
                    distance: this.map.getExtent().getWidth()*0.01 ,
                    distanceUnits: this.map.getUnits(),
                    value: geometry}
                );
            } else {
                filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.INTERSECTS,
                    property: geometryAttribute.name,
                    value: geometry}
                );
            }
        } else if (this.handler instanceof OpenLayers.Handler.Click) {
            if (geometryAttribute.type.indexOf('Polygon') >= 0) {
                filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.INTERSECTS,
                    property: geometryAttribute.name,
                    value: geometry}
                );
            } else {
                filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.DWITHIN,
                    property: geometryAttribute.name,
                    distance: this.map.getExtent().getWidth()*0.01 ,
                    distanceUnits: this.map.getUnits(),
                    value: geometry}
                );
            }
        }
        return filter;
    },

    /**
     * Method: select
     * When the handler is done, use SLD_BODY on the selection layer to
     *     display the selection in the map.
     *
     * Parameters:
     * geometry - {Object} or {<OpenLayers.Geometry>}
     */
    select: function(geometry) {
        this._queue = function() {
            for (var i=0, len=this.layers.length; i<len; i++) {
                var layer = this.layers[i];
                var geometryAttributes = this.getGeometryAttributes(layer);
                var filters = [];
                for (var j=0, lenj=geometryAttributes.length; j<lenj; j++) {
                    var geometryAttribute = geometryAttributes[j];
                    if (geometryAttribute !== null) {
                        // from the click handler we will not get an actual 
                        // geometry so transform
                        if (!(geometry instanceof OpenLayers.Geometry)) {
                            var point = this.map.getLonLatFromPixel(
                                geometry.xy);
                            geometry = new OpenLayers.Geometry.Point(
                                point.lon, point.lat);
                        }
                        var filter = this.createFilter(geometryAttribute,
                        geometry);
                        if (filter !== null) {
                            filters.push(filter);
                        }
                    }
                }
    
                var selectionLayer = this.createSelectionLayer(layer);
    
                this.events.triggerEvent("selected", {
                    layer: layer,
                    filters: filters
                });

                var sld = this.createSLD(layer, filters, geometryAttributes);
    
                selectionLayer.mergeNewParams({SLD_BODY: sld});
                delete this._queue;
            }
        };
        this.applySelection();
    },
    
    /**
     * Method: applySelection
     * Checks if all required wfs data is cached, and applies the selection
     */
    applySelection: function() {
        var canApply = true;
        for (var i=0, len=this.layers.length; i<len; i++) {
            if(!this.wfsCache[this.layers[i].id]) {
                canApply = false;
                break;
            }
        }
        canApply && this._queue.call(this);
    },

    CLASS_NAME: "OpenLayers.Control.SLDSelect"
});
