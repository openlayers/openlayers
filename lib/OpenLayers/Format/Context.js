/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 */

/**
 * Class: OpenLayers.Format.Context
 * Base class for both Format.WMC and Format.OWSContext
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.Context = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {

    /**
     * Property: layerOptions
     * {Object} Default options for layers created by the parser. These
     *     options are overridden by the options which are read from the
     *     capabilities document.
     */
    layerOptions: null,

    /**
     * Property: layerParams
     * {Object} Default parameters for layers created by the parser. This
     *     can be used e.g. to override DEFAULT_PARAMS for 
     *     OpenLayers.Layer.WMS.
     */
    layerParams: null,

    /**
     * Constructor: OpenLayers.Format.Context
     * Create a new parser for Context documents.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Read Context data from a string, and return an object with map
     *     properties and a list of layers.
     *
     * Parameters:
     * data - {String} or {DOMElement} data to read/parse.
     * options - {Object} The options object must contain a map property.  If
     *     the map property is a string, it must be the id of a dom element
     *     where the new map will be placed.  If the map property is an
     *     <OpenLayers.Map>, the layers from the context document will be added
     *     to the map.
     *
     * Returns:
     * {<OpenLayers.Map>} A map based on the context.
     */
    read: function(data, options) {
        var context = OpenLayers.Format.XML.VersionedOGC.prototype.read.apply(this, 
            arguments);
        var map;
        if(options && options.map) {
            this.context = context;
            if(options.map instanceof OpenLayers.Map) {
                map = this.mergeContextToMap(context, options.map);
            } else {
                var mapOptions = options.map;
                if(OpenLayers.Util.isElement(mapOptions) ||
                   typeof mapOptions == "string") {
                    // we assume mapOptions references a div
                    // element
                    mapOptions = {div: mapOptions};
                }
                map = this.contextToMap(context, mapOptions);
            }
        } else {
            // not documented as part of the API, provided as a non-API option
            map = context;
        }
        return map;
    },

    /**
     * Method: getLayerFromContext
     * Create a WMS layer from a layerContext object.
     *
     * Parameters:
     * layerContext - {Object} An object representing a WMS layer.
     *
     * Returns:
     * {<OpenLayers.Layer.WMS>} A WMS layer.
     */
    getLayerFromContext: function(layerContext) {
        var i, len;
        // fill initial options object from layerContext
        var options = {
            queryable: layerContext.queryable, //keep queryable for api compatibility
            visibility: layerContext.visibility,
            maxExtent: layerContext.maxExtent,
            metadata: OpenLayers.Util.applyDefaults(layerContext.metadata, 
            {styles: layerContext.styles,
             formats: layerContext.formats,
             "abstract": layerContext["abstract"],
             dataURL: layerContext.dataURL
            }),
            numZoomLevels: layerContext.numZoomLevels,
            units: layerContext.units,
            isBaseLayer: layerContext.isBaseLayer,
            opacity: layerContext.opacity,
            displayInLayerSwitcher: layerContext.displayInLayerSwitcher,
            singleTile: layerContext.singleTile,
            tileSize: (layerContext.tileSize) ? 
                new OpenLayers.Size(
                    layerContext.tileSize.width, 
                    layerContext.tileSize.height
                ) : undefined,
            minScale: layerContext.minScale || layerContext.maxScaleDenominator,
            maxScale: layerContext.maxScale || layerContext.minScaleDenominator,
            srs: layerContext.srs,
            dimensions: layerContext.dimensions,
            metadataURL: layerContext.metadataURL
        };
        if (this.layerOptions) {
            OpenLayers.Util.applyDefaults(options, this.layerOptions);
        }

        var params = {
            layers: layerContext.name,
            transparent: layerContext.transparent,
            version: layerContext.version
        };
        if (layerContext.formats && layerContext.formats.length>0) {
            // set default value for params if current attribute is not positionned
            params.format = layerContext.formats[0].value;
            for (i=0, len=layerContext.formats.length; i<len; i++) {
                var format = layerContext.formats[i];
                if (format.current == true) {
                    params.format = format.value;
                    break;
                }
            }
        }
        if (layerContext.styles && layerContext.styles.length>0) {
            for (i=0, len=layerContext.styles.length; i<len; i++) {
                var style = layerContext.styles[i];
                if (style.current == true) {
                    // three style types to consider
                    // 1) linked SLD
                    // 2) inline SLD
                    // 3) named style
                    if(style.href) {
                        params.sld = style.href;
                    } else if(style.body) {
                        params.sld_body = style.body;
                    } else {
                        params.styles = style.name;
                    }
                    break;
                }
            }
        }
        if (this.layerParams) {
            OpenLayers.Util.applyDefaults(params, this.layerParams);
        }

        var layer = null;
        var service = layerContext.service;
        if (service == OpenLayers.Format.Context.serviceTypes.WFS) {
            options.strategies = [new OpenLayers.Strategy.BBOX()];
            options.protocol = new OpenLayers.Protocol.WFS({
                url: layerContext.url,
                // since we do not know featureNS, let the protocol
                // determine it automagically using featurePrefix
                featurePrefix: layerContext.name.split(":")[0],
                featureType: layerContext.name.split(":").pop()
            });
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
        } else if (service == OpenLayers.Format.Context.serviceTypes.KML) {
            // use a vector layer with an HTTP Protcol and a Fixed strategy
            options.strategies = [new OpenLayers.Strategy.Fixed()];
            options.protocol = new OpenLayers.Protocol.HTTP({
                url: layerContext.url, 
                format: new OpenLayers.Format.KML()
            });
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
        } else if (service == OpenLayers.Format.Context.serviceTypes.GML) {
            // use a vector layer with a HTTP Protocol and a Fixed strategy
            options.strategies = [new OpenLayers.Strategy.Fixed()];
            options.protocol = new OpenLayers.Protocol.HTTP({
                url: layerContext.url, 
                format: new OpenLayers.Format.GML()
            });
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
        } else if (layerContext.features) {
            // inline GML or KML features
            layer = new OpenLayers.Layer.Vector(
                layerContext.title || layerContext.name,
                options
            );
            layer.addFeatures(layerContext.features);
        } else if (layerContext.categoryLayer !== true) {
            layer = new OpenLayers.Layer.WMS(
                layerContext.title || layerContext.name,
                layerContext.url,
                params,
                options
            );
        }
        return layer;
    },

    /**
     * Method: getLayersFromContext
     * Create an array of layers from an array of layerContext objects.
     *
     * Parameters:
     * layersContext - {Array(Object)} An array of objects representing layers.
     *
     * Returns:
     * {Array(<OpenLayers.Layer>)} An array of layers.
     */
    getLayersFromContext: function(layersContext) {
        var layers = [];
        for (var i=0, len=layersContext.length; i<len; i++) {
            var layer = this.getLayerFromContext(layersContext[i]);
            if (layer !== null) {
                layers.push(layer);
            }
        }
        return layers;
    },

    /**
     * Method: contextToMap
     * Create a map given a context object.
     *
     * Parameters:
     * context - {Object} The context object.
     * options - {Object} Default map options.
     *
     * Returns:
     * {<OpenLayers.Map>} A map based on the context object.
     */
    contextToMap: function(context, options) {
        options = OpenLayers.Util.applyDefaults({
            maxExtent:  context.maxExtent,
            projection: context.projection,
            units:      context.units
        }, options);

        if (options.maxExtent) {
            options.maxResolution = 
                options.maxExtent.getWidth() / OpenLayers.Map.TILE_WIDTH;
        }

        var metadata = {
            contactInformation: context.contactInformation,
            "abstract":         context["abstract"],
            keywords:           context.keywords,
            logo:               context.logo,
            descriptionURL:     context.descriptionURL
        };

        options.metadata = metadata;

        var map = new OpenLayers.Map(options);
        map.addLayers(this.getLayersFromContext(context.layersContext));
        map.setCenter(
            context.bounds.getCenterLonLat(),
            map.getZoomForExtent(context.bounds, true)
        );
        return map;
    },

    /**
     * Method: mergeContextToMap
     * Add layers from a context object to a map.
     *
     * Parameters:
     * context - {Object} The context object.
     * map - {<OpenLayers.Map>} The map.
     *
     * Returns:
     * {<OpenLayers.Map>} The same map with layers added.
     */
    mergeContextToMap: function(context, map) {
        map.addLayers(this.getLayersFromContext(context.layersContext));
        return map;
    },

    /**
     * APIMethod: write
     * Write a context document given a map.
     *
     * Parameters:
     * obj - {<OpenLayers.Map> | Object} A map or context object.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} A context document string.
     */
    write: function(obj, options) {
        obj = this.toContext(obj);
        return OpenLayers.Format.XML.VersionedOGC.prototype.write.apply(this,
            arguments);
    },

    CLASS_NAME: "OpenLayers.Format.Context"
});

/**
 * Constant: OpenLayers.Format.Context.serviceTypes
 * Enumeration for service types
 */
OpenLayers.Format.Context.serviceTypes = {
    "WMS": "urn:ogc:serviceType:WMS",
    "WFS": "urn:ogc:serviceType:WFS",
    "WCS": "urn:ogc:serviceType:WCS",
    "GML": "urn:ogc:serviceType:GML",
    "SLD": "urn:ogc:serviceType:SLD",
    "FES": "urn:ogc:serviceType:FES",
    "KML": "urn:ogc:serviceType:KML"
};
