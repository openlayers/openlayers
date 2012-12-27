/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Format.EncodedPolyline
 * Class for reading and writing encoded polylines.  Create a new instance
 * with the <OpenLayers.Format.EncodedPolyline> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.EncodedPolyline = OpenLayers.Class(OpenLayers.Format, {

    /**
     * APIProperty: geometryType
     * {String} Geometry type to output. One of: linestring (default),
     *     linearring, multipoint or polygon
     */
    geometryType: "linestring",

    /**
     * Constructor: OpenLayers.Format.EncodedPolyline
     * Create a new parser for encoded polylines
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *           this instance
     *
     * Returns:
     * {<OpenLayers.Format.EncodedPolyline>} A new encoded polylines parser.
     */
    initialize: function(options) {
        OpenLayers.Format.prototype.initialize.apply(this, [options]);
    },

    /**
     * Method: read
     * Deserialize an encoded polyline string and return a vector feature.
     *
     * Parameters:
     * encoded - {String} An encoded polyline string
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A vector feature with a linestring.
     */
    read: function(encoded) {
        var geomType;
        if (this.geometryType == "linestring")
            geomType = OpenLayers.Geometry.LineString;
        else if (this.geometryType == "linearring")
            geomType = OpenLayers.Geometry.LinearRing;
        else if (this.geometryType == "multipoint")
            geomType = OpenLayers.Geometry.MultiPoint;
        else if (this.geometryType != "polygon")
            return null;

        var points = new Array();
        var point = new Array(0, 0);

        for (var i = 0; i < encoded.length;) {
            for (var dim = 0; dim < 2; ++dim) {
                var result = 0;
                var shift = 0;

                var b;
                do {
                    b = encoded.charCodeAt(i++) - 63;
                    result |= (b & 0x1f) << shift;
                    shift += 5;
                } while (b >= 0x20);

                point[dim] += ((result & 1) ? ~(result >> 1) : (result >> 1));
            }

            points.push(new OpenLayers.Geometry.Point(point[1] * 1e-5,
                                                      point[0] * 1e-5));
        }

        if (this.geometryType == "polygon")
            return new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon([
                    new OpenLayers.Geometry.LinearRing(points)
                ])
            );

        return new OpenLayers.Feature.Vector(
            new geomType(points)
        );
    },

    CLASS_NAME: "OpenLayers.Format.EncodedPolyline"
});
