/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/XYZ.js
 */

/**
 * Class: OpenLayers.Layer.OSM
 * This layer allows accessing OpenStreetMap tiles. By default the OpenStreetMap
 *    hosted tile.openstreetmap.org Mapnik tileset is used. If you wish to use
 *    a different layer instead, you need to provide a different
 *    URL to the constructor. Here's an example for using OpenCycleMap:
 * 
 * (code)
 *     new OpenLayers.Layer.OSM("OpenCycleMap", 
 *       ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
 *        "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
 *        "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]); 
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
     * : http://[a|b|c].tile.openstreetmap.org/${z}/${x}/${y}.png
     * (the official OSM tileset) if the second argument to the constructor
     * is null or undefined. To use another tileset you can have something
     * like this:
     * (code)
     *     new OpenLayers.Layer.OSM("OpenCycleMap", 
     *       ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
     *        "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
     *        "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]); 
     * (end)
     */
    url: [
        'http://a.tile.openstreetmap.org/${z}/${x}/${y}.png',
        'http://b.tile.openstreetmap.org/${z}/${x}/${y}.png',
        'http://c.tile.openstreetmap.org/${z}/${x}/${y}.png'
    ],

    /**
     * Property: attribution
     * {String} The layer attribution.
     */
    attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",

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

    /** APIProperty: tileOptions
     *  {Object} optional configuration options for <OpenLayers.Tile> instances
     *  created by this Layer. Default is
     *
     *  (code)
     *  {crossOriginKeyword: 'anonymous'}
     *  (end)
     *
     *  When using OSM tilesets other than the default ones, it may be
     *  necessary to set this to
     *
     *  (code)
     *  {crossOriginKeyword: null}
     *  (end)
     *
     *  if the server does not send Access-Control-Allow-Origin headers.
     */
    tileOptions: null,

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
    initialize: function(name, url, options) {
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);
        this.tileOptions = OpenLayers.Util.extend({
            crossOriginKeyword: 'anonymous'
        }, this.options && this.options.tileOptions);
    },

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
