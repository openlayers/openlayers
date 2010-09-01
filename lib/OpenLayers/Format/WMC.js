/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
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
     * Method: getParser
     * Get the WMC parser given a version. Create a new parser if it does not
     * already exist.
     *
     * Parameters:
     * version - {String} The version of the parser.
     *
     * Returns:
     * {<OpenLayers.Format.WMC.v1>} A WMC parser.
     */
    getParser: function(version) {
        var v = version || this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != v) {
            var format = OpenLayers.Format.WMC[
                "v" + v.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a WMC parser for version " + v;
            }
            this.parser = new format(this.options);
        }
        return this.parser;
    },

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
            metadataURL: layer.metadataURL,
            version: layer.params["VERSION"],
            url: layer.url,
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
            formats: [{
                value: layer.params["FORMAT"],
                current: true
            }],
            styles: [{
                href: layer.params["SLD"],
                body: layer.params["SLD_BODY"],
                name: layer.params["STYLES"] || parser.defaultStyleName,
                title: parser.defaultStyleTitle,
                current: true
            }]
        };
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
        if(obj.CLASS_NAME == "OpenLayers.Map") {
            context.bounds = obj.getExtent();
            context.maxExtent = obj.maxExtent;
            context.projection = obj.projection;
            context.size = obj.getSize();
        }
        else {
            // copy all obj properties except the "layers" property
            OpenLayers.Util.applyDefaults(context, obj);
            if(context.layers != undefined) {
                delete(context.layers);
            }
        }

        if (context.layersContext == undefined) {
            context.layersContext = [];
        }

        // let's convert layers into layersContext object (if any)
        if (layers != undefined && layers instanceof Array) {
            for (var i=0, len=layers.length; i<len; i++) {
                var layer = layers[i];
                if(layer instanceof OpenLayers.Layer.WMS) {
                    context.layersContext.push(this.layerToContext(layer));
                }
            }
        }
        return context;
    },

    CLASS_NAME: "OpenLayers.Format.WMC" 

});
