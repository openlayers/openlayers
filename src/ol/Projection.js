goog.provide('ol.Projection');
goog.require('ol.UnreferencedBounds');

/**
 * @export
 * @constructor
 * @param {string} code Projection identifier.
 */
ol.Projection = function(code) {

    /**
     * @private
     * @type {string}
     */
    this.code_ = code;
    
    /**
     * @private
     * @type {string|undefined}
     */
    this.units_ = undefined;
    
    /**
     * @private
     * @type {Object}
     */
    this.proj_ = null;

    /**
     * @private
     * @type {ol.UnreferencedBounds}
     */
    this.extent_ = null;

};


/**
 * @return {string} Code.
 */
ol.Projection.prototype.getCode = function() {
    return this.code_;
};

/**
 * @param {string} code Code.
 */
ol.Projection.prototype.setCode = function(code) {
    this.code_ = code;
};

/**
 * @return {string|undefined} Units abbreviation.
 */
ol.Projection.prototype.getUnits = function() {
    return this.units_;
};

/**
 * @param {string} units Units abbreviation.
 */
ol.Projection.prototype.setUnits = function(units) {
    this.units_ = units;
};

/**
 * Get the validity extent of the coordinate reference system.
 * 
 * @return {ol.UnreferencedBounds} The valididty extent.
 */
ol.Projection.prototype.getExtent = function() {
    if (goog.isNull(this.extent_)) {
        var defs = ol.Projection['defaults'][this.code_];
        if (goog.isDef(defs)) {
            var ext = defs['maxExtent'];
            if (goog.isDef(ext)) {
                this.setExtent(new ol.UnreferencedBounds(ext[0],ext[1],ext[2],ext[3]));
            }
        }
    }
    return this.extent_;
};

/**
 * @param {!ol.UnreferencedBounds} extent Validity extent.
 */
ol.Projection.prototype.setExtent = function(extent) {
    this.extent_ = extent;
};

/**
 * Transforms is an object, with from properties, each of which may
 * have a to property. This allows you to define projections without 
 * requiring support for proj4js to be included.
 *
 * This object has keys which correspond to a 'source' projection object.  The
 * keys should be strings, corresponding to the projection.getCode() value.
 * Each source projection object should have a set of destination projection
 * keys included in the object. 
 * 
 * Each value in the destination object should be a transformation function,
 * where the function is expected to be passed an object with a .x and a .y
 * property.  The function should return the object, with the .x and .y
 * transformed according to the transformation function.
 *
 * Note - Properties on this object should not be set directly.  To add a
 *     transform method to this object, use the <addTransform> method.  For an
 *     example of usage, see the OpenLayers.Layer.SphericalMercator file.
 *
 * @type {Object}
 */
ol.Projection.transforms = {};

/**
 * Defaults for the SRS codes known to OpenLayers (currently EPSG:4326, CRS:84, 
 * urn:ogc:def:crs:EPSG:6.6:4326, EPSG:900913, EPSG:3857, EPSG:102113 and 
 * EPSG:102100). Keys are the SRS code, values are units, maxExtent (the 
 * validity extent for the SRS) and yx (true if this SRS is known to have a 
 * reverse axis order).
 *
 * @type {Object}
 */
ol.Projection.defaults = {
    "EPSG:4326": {
        units: "degrees",
        maxExtent: [-180, -90, 180, 90],
        yx: true
    },
    "CRS:84": {
        units: "degrees",
        maxExtent: [-180, -90, 180, 90]
    },
    "EPSG:900913": {
        units: "m",
        maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
    }
};

/**
 * Set a custom transform method between two projections.  Use this method in
 *     cases where the proj4js lib is not available or where custom projections
 *     need to be handled.
 *
 * @param {string} from The code for the source projection.
 * @param {string} to The code for the destination projection.
 * @param {function(Object)} method A function that takes an object with x and
 *     y properties as an argument and transforms that point from the source to 
 *     the destination projection in place.  The original point should be 
 *     modified.
 */
ol.Projection.addTransform = function(from, to, method) {
    if (method === ol.Projection.nullTransform) {
        var defaults = ol.Projection.defaults[from];
        if (defaults && !ol.Projection.defaults[to]) {
            ol.Projection.defaults[to] = defaults;
        }
    }
    if(!ol.Projection.transforms[from]) {
        ol.Projection.transforms[from] = {};
    }
    ol.Projection.transforms[from][to] = method;
};

/**
 * Transform a point coordinate from one projection to another.
 * 
 * @param {!Object} point Object with x and y properties.
 * @param {!ol.Projection} source Source projection.
 * @param {!ol.Projection} dest Destination projection.
 */
ol.Projection.transform = function(point, source, dest) {
    if (source.proj_ && dest.proj_) {
        // point = Proj4js.transform(source.proj_, dest.proj_, point);
    } else {
        var sourceCode = source.getCode();
        var destCode = dest.getCode();
        var transforms = ol.Projection.transforms;
        if (transforms[sourceCode] && transforms[sourceCode][destCode]) {
            transforms[sourceCode][destCode](point);
        }
    }
};

/**
 * A null transformation - useful for defining projection aliases when
 * proj4js is not available:
 *
 *     ol.Projection.addTransform("EPSG:3857", "EPSG:900913",
 *         ol.Projection.nullTransform);
 *     ol.Projection.addTransform("EPSG:900913", "EPSG:3857",
 *         ol.Projection.nullTransform);
 *
 * @type {function(Object)}
 */
ol.Projection.nullTransform = function(point) {
    return point;
};

/**
 * Note: Transforms for web mercator <-> geographic
 * OpenLayers recognizes EPSG:3857, EPSG:900913, EPSG:102113 and EPSG:102100.
 * OpenLayers originally started referring to EPSG:900913 as web mercator.
 * The EPSG has declared EPSG:3857 to be web mercator.
 * ArcGIS 10 recognizes the EPSG:3857, EPSG:102113, and EPSG:102100 as
 * equivalent.  See http://blogs.esri.com/Dev/blogs/arcgisserver/archive/2009/11/20/ArcGIS-Online-moving-to-Google-_2F00_-Bing-tiling-scheme_3A00_-What-does-this-mean-for-you_3F00_.aspx#12084.
 * For geographic, OpenLayers recognizes EPSG:4326, CRS:84 and
 * urn:ogc:def:crs:EPSG:6.6:4326. OpenLayers also knows about the reverse axis
 * order for EPSG:4326. 
 */
(function() {

    var pole = 20037508.34;

    function inverseMercator(xy) {
        xy.x = 180 * xy.x / pole;
        xy.y = 180 / Math.PI * (2 * Math.atan(Math.exp((xy.y / pole) * Math.PI)) - Math.PI / 2);
        return xy;
    }

    function forwardMercator(xy) {
        xy.x = xy.x * pole / 180;
        xy.y = Math.log(Math.tan((90 + xy.y) * Math.PI / 360)) / Math.PI * pole;
        return xy;
    }

    function map(base, codes) {
        var add = ol.Projection.addTransform;
        var same = ol.Projection.nullTransform;
        var i, len, code, other, j;
        for (i=0, len=codes.length; i<len; ++i) {
            code = codes[i];
            add(base, code, forwardMercator);
            add(code, base, inverseMercator);
            for (j=i+1; j<len; ++j) {
                other = codes[j];
                add(code, other, same);
                add(other, code, same);
            }
        }
    }
    
    // list of equivalent codes for web mercator
    var mercator = ["EPSG:900913", "EPSG:3857", "EPSG:102113", "EPSG:102100"],
        geographic = ["CRS:84", "urn:ogc:def:crs:EPSG:6.6:4326", "EPSG:4326"],
        i;
    for (i=mercator.length-1; i>=0; --i) {
        map(mercator[i], geographic);
    }
    for (i=geographic.length-1; i>=0; --i) {
        map(geographic[i], mercator);
    }

})();
