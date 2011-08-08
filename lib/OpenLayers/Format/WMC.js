/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/Context.js
 */

/**
 * Class: OpenLayers.Format.WMC
 * Read and write Web Map Context documents.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WMC = OpenLayers.Class(OpenLayers.Format.Context, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.0".
     */
    defaultVersion: "1.1.0",

    /**
     * Constructor: OpenLayers.Format.WMC
     * Create a new parser for Web Map Context documents.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    
    /**
     * Method: layerToContext
     * Create a layer context object given a wms layer object.
     *
     * Parameters:
     * obj - {<OpenLayers.Layer.WMS>} The layer.
     *
     * Returns:
     * {Object} A layer context object.
     */
    layerToContext: function(layer) {
        var parser = this.getParser();
        var layerContext = {
            queryable: layer.queryable,
            visibility: layer.visibility,
            name: layer.params["LAYERS"],
            title: layer.name,
            "abstract": layer.metadata["abstract"],
            dataURL: layer.metadata.dataURL,
            metadataURL: layer.metadataURL,
            server: {
            version: layer.params["VERSION"],
                url: layer.url
            },
            maxExtent: layer.maxExtent,
            transparent: layer.params["TRANSPARENT"],
            numZoomLevels: layer.numZoomLevels,
            units: layer.units,
            isBaseLayer: layer.isBaseLayer,
            opacity: layer.opacity,
            displayInLayerSwitcher: layer.displayInLayerSwitcher,
            singleTile: layer.singleTile,
            tileSize: (layer.singleTile || !layer.tileSize) ? 
                undefined : {width: layer.tileSize.w, height: layer.tileSize.h},
            minScale : (layer.options.resolutions ||
                        layer.options.scales || 
                        layer.options.maxResolution || 
                        layer.options.minScale) ? 
                        layer.minScale : undefined,
            maxScale : (layer.options.resolutions ||
                        layer.options.scales || 
                        layer.options.minResolution || 
                        layer.options.maxScale) ? 
                        layer.maxScale : undefined,
            formats: [],
            styles: [],
            srs: layer.srs,
            dimensions: layer.dimensions
        };


        if (layer.metadata.servertitle) {
            layerContext.server.title = layer.metadata.servertitle;
        }

        if (layer.metadata.formats && layer.metadata.formats.length > 0) {
            for (var i=0, len=layer.metadata.formats.length; i<len; i++) {
                var format = layer.metadata.formats[i];
                layerContext.formats.push({
                    value: format.value,
                    current: (format.value == layer.params["FORMAT"])
                });
            }
        } else {
            layerContext.formats.push({
                value: layer.params["FORMAT"],
                current: true
            });
        }

        if (layer.metadata.styles && layer.metadata.styles.length > 0) {
            for (var i=0, len=layer.metadata.styles.length; i<len; i++) {
                var style = layer.metadata.styles[i];
                if ((style.href == layer.params["SLD"]) ||
                    (style.body == layer.params["SLD_BODY"]) ||
                    (style.name == layer.params["STYLES"])) {
                    style.current = true;
                } else {
                    style.current = false;
                }
                layerContext.styles.push(style);
            }
        } else {
            layerContext.styles.push({
                href: layer.params["SLD"],
                body: layer.params["SLD_BODY"],
                name: layer.params["STYLES"] || parser.defaultStyleName,
                title: parser.defaultStyleTitle,
                current: true
            });
        }

        return layerContext;
    },
    
    /**
     * Method: toContext
     * Create a context object free from layer given a map or a
     * context object.
     *
     * Parameters:
     * obj - {<OpenLayers.Map> | Object} The map or context.
     *
     * Returns:
     * {Object} A context object.
     */
    toContext: function(obj) {
        var context = {};
        var layers = obj.layers;
        if (obj.CLASS_NAME == "OpenLayers.Map") {
            var metadata = obj.metadata || {};
            context.size = obj.getSize();
            context.bounds = obj.getExtent();
            context.projection = obj.projection;
            context.title = obj.title;
            context.keywords = metadata.keywords;
            context["abstract"] = metadata["abstract"];
            context.logo = metadata.logo;
            context.descriptionURL = metadata.descriptionURL;
            context.contactInformation = metadata.contactInformation;
            context.maxExtent = obj.maxExtent;
        } else {
            // copy all obj properties except the "layers" property
            OpenLayers.Util.applyDefaults(context, obj);
            if (context.layers != undefined) {
                delete(context.layers);
            }
        }

        if (context.layersContext == undefined) {
            context.layersContext = [];
        }

        // let's convert layers into layersContext object (if any)
        if (layers != undefined && OpenLayers.Util.isArray(layers)) {
            for (var i=0, len=layers.length; i<len; i++) {
                var layer = layers[i];
                if (layer instanceof OpenLayers.Layer.WMS) {
                    context.layersContext.push(this.layerToContext(layer));
                }
            }
        }
        return context;
    },

    CLASS_NAME: "OpenLayers.Format.WMC" 

});
