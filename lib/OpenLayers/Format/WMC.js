/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.WMC
 * Read and write Web Map Context documents.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WMC = OpenLayers.Class({
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.0".
     */
    defaultVersion: "1.1.0",
    
    /**
     * APIProperty: version
     * {String} Specify a version string if one is known.
     */
    version: null,

    /**
     * Property: layerOptions
     * {Object} Default options for layers created by the parser. These
     *     options are overridden by the options which are read from the 
     *     capabilities document.
     */
    layerOptions: null, 
    
    /**
     * Property: parser
     * {Object} Instance of the versioned parser.  Cached for multiple read and
     *     write calls of the same version.
     */
    parser: null,

    /**
     * Constructor: OpenLayers.Format.WMC
     * Create a new parser for WMC docs.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
    },

    /**
     * APIMethod: read
     * Read WMC data from a string, and return an object with map properties
     *     and a list of layers. 
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
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var version = this.version;
        if(!version) {
            version = root.getAttribute("version");
            if(!version) {
                version = this.defaultVersion;
            }
        }
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.WMC[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a WMC parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var context = this.parser.read(data, options);
        var map;
        if(options.map) {
            this.context = context;
            if(options.map instanceof OpenLayers.Map) {
                map = this.mergeContextToMap(context, options.map);
            } else {
                map = this.contextToMap(context, options.map);
            }
        } else {
            // not documented as part of the API, provided as a non-API option
            map = context;
        }
        return map;
    },
    
    /**
     * Method: contextToMap
     * Create a map given a context object.
     *
     * Parameters:
     * context - {Object} The context object.
     * id - {String | Element} The dom element or element id that will contain
     *     the map.
     *
     * Returns:
     * {<OpenLayers.Map>} A map based on the context object.
     */
    contextToMap: function(context, id) {
        var map = new OpenLayers.Map(id, {
            maxExtent: context.maxExtent,
            projection: context.projection
        });
        map.addLayers(context.layers);
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
        map.addLayers(context.layers);
        return map;
    },

    /**
     * APIMethod: write
     * Write a WMC document given a map.
     *
     * Parameters:
     * obj - {<OpenLayers.Map> | Object} A map or context object.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} A WMC document string.
     */
    write: function(obj, options) {
        if(obj.CLASS_NAME == "OpenLayers.Map") {
            obj = this.mapToContext(obj);
        }
        var version = (options && options.version) ||
                      this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != version) {
            var format = OpenLayers.Format.WMC[
                "v" + version.replace(/\./g, "_")
            ];
            if(!format) {
                throw "Can't find a WMS capabilities parser for version " +
                      version;
            }
            this.parser = new format(this.options);
        }
        var wmc = this.parser.write(obj, options);
        return wmc;
    },
    
    /**
     * Method: mapToContext
     * Create a context object given a map.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map.
     *
     * Returns:
     * {Object} A context object.
     */
    mapToContext: function(map) {
        var context = {
            bounds: map.getExtent(),
            maxExtent: map.maxExtent,
            projection: map.projection,
            layers: map.layers,
            size: map.getSize()
        };
        return context;
    },

    CLASS_NAME: "OpenLayers.Format.WMC" 

});
