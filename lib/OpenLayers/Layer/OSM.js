/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/XYZ.js
 */

/**
 * Class: OpenLayers.Layer.OSM
 * This layer allows accessing OpenStreetMap tiles. By default the OpenStreetMap
 *    hosted tile.openstreetmap.org Mapnik tileset is used. If you wish to use
 *    tiles@home / osmarender layer instead, you need to provide a different
 *    URL to the constructor. Here's an example for tiles@home:
 * 
 * (code)
 *     new OpenLayers.Layer.OSM("t@h", 
 *       "http://tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png"); 
 * (end)
 *
 * Inherits from:
 *  - <OpenLayers.Layer.XYZ>
 */
OpenLayers.Layer.OSM = OpenLayers.Class(OpenLayers.Layer.XYZ, {

    /**
     * APIProperty: name
     * {String} The layer name. Defaults to "OpenStreetMap" if the first
     * argument to the constructor is null or undefined.
     */
    name: "OpenStreetMap",

    /**
     * APIProperty: url
     * {String} The tileset URL scheme. Defaults to
     * : http://tile.openstreetmap.org/${z}/${x}/${y}.png
     * (the official OSM tileset) if the second argument to the constructor
     * is null or undefined. To use another tileset you can have something
     * like this:
     * (start code)
     *     new OpenLayers.Layer.OSM("t@h", 
     *       "http://tah.openstreetmap.org/Tiles/tile/${z}/${x}/${y}.png"); 
     * (end)
     */
    url: 'http://tile.openstreetmap.org/${z}/${x}/${y}.png',

    /**
     * Property: attribution
     * {String} The layer attribution.
     */
    attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/'>OpenStreetMap</a>",

    /**
     * Property: sphericalMercator
     * {Boolean}
     */
    sphericalMercator: true,

    /**
     * Property: wrapDateLine
     * {Boolean}
     */
    wrapDateLine: true,

    /**
     * Constructor: OpenLayers.Layer.OSM
     *
     * Parameters:
     * name - {String} The layer name.
     * url - {String} The tileset URL scheme.
     * options - {Object} Configuration options for the layer. Any inherited
     *     layer option can be set in this object (e.g.
     *     <OpenLayers.Layer.Grid.buffer>).
     */

    /**
     * Method: clone
     */
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.OSM(
                this.name, this.url, this.getOptions());
        }
        obj = OpenLayers.Layer.XYZ.prototype.clone.apply(this, [obj]);
        return obj;
    },

    CLASS_NAME: "OpenLayers.Layer.OSM"
});
