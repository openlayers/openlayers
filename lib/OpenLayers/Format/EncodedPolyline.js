/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
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
     *     linearring, point, multipoint or polygon. If the geometryType is
     *     point, only the first point of the string is returned.
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
     * APIMethod: read
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
        else if (this.geometryType != "point" && this.geometryType != "polygon")
            return null;

        var points = this.decode(encoded, 2);
        var pointGeometries = new Array();
        for (var i in points) {
            var point = points[i];
            pointGeometries.push(
                new OpenLayers.Geometry.Point(point[1] * 1e-5, point[0] * 1e-5)
            );
        }

        if (this.geometryType == "point")
            return new OpenLayers.Feature.Vector(
                pointGeometries[0]
            );

        if (this.geometryType == "polygon")
            return new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon([
                    new OpenLayers.Geometry.LinearRing(pointGeometries)
                ])
            );

        return new OpenLayers.Feature.Vector(
            new geomType(pointGeometries)
        );
    },

    /**
     * APIMethod: decode
     * Deserialize an encoded string and return an array of n-dimensional
     * points.
     *
     * Parameters:
     * encoded - {String} An encoded string
     * dims - {int} The dimension of the points that are returned
     *
     * Returns:
     * {Array(Array(int))} An array containing n-dimensional arrays of
     *     coordinates.
     */
    decode: function(encoded, dims) {
        var points = new Array();
        var point = new Array(dims);

        // Reset the point array
        for (var i = 0; i < point.length; ++i)
            point[i] = 0;

        for (var i = 0; i < encoded.length;) {
            for (var dim = 0; dim < dims; ++dim) {
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

            points.push(point.slice(0));
        }

        return points;
    },

    /**
     * APIMethod: write
     * Serialize a feature or array of features into a WKT string.
     *
     * Parameters:
     * features - {<OpenLayers.Feature.Vector>|Array} A feature or array of
     *            features
     *
     * Returns:
     * {String} The WKT string representation of the input geometries
     */
    write: function(features) {
        var feature;
        if (features.constructor == Array)
            feature = features[0];
        else
            feature = features;

        var geometry = feature.geometry;
        var type = geometry.CLASS_NAME.split('.')[2].toLowerCase();

        var pointGeometries;
        if (type == "point")
            pointGeometries = new Array(geometry);
        else if (type == "linestring" ||
                 type == "linearring" ||
                 type == "multipoint")
            pointGeometries = geometry.components;
        else if (type == "polygon")
            pointGeometries = geometry.components[0].components;
        else
            return null;

        var points = new Array();
        for (var i in pointGeometries) {
            var pointGeometry = pointGeometries[i];
            var point = [Math.round(pointGeometry.y * 1e5),
                         Math.round(pointGeometry.x * 1e5)];
            points.push(point);
        }

        var result = this.encode(points, 2);
        return result;
    },

    /**
     * APIMethod: encode
     * Serialize an array of n-dimensional points and return an encoded string
     *
     * Parameters:
     * points - {Array(Array(int))} An array containing n-dimensional
     *          arrays of coordinates
     * dims - {int} The dimension of the points that should be read
     *
     * Returns:
     * {String} An encoded string
     */
    encode: function (points, dims) {
        var encoded_points = "";

        var lastPoint = new Array(dims);
        for (var i = 0; i < lastPoint.length; ++i)
            lastPoint[i] = 0;

        for (var i = 0; i < points.length; i++) {
            var point = points[i];

            for (var dim = 0; dim < lastPoint.length; ++dim) {
                var delta = point[dim] - lastPoint[dim];
                encoded_points += this.encodeSignedNumber(delta);
            }

            lastPoint = point;
        }
        return encoded_points;
    },

    /**
     * Method: encodeSignedNumber
     * Encode one single signed integer and return an encoded string
     *
     * Parameters:
     * num - {int} A signed integer that should be encoded
     *
     * Returns:
     * {String} An encoded string
     */
    encodeSignedNumber: function (num) {
        var sgn_num = num << 1;
        if (num < 0)
            sgn_num = ~(sgn_num);

        return this.encodeNumber(sgn_num);
    },

    /**
     * Method: encodeNumber
     * Encode one single unsigned integer and return an encoded string
     *
     * encodeSignedNumber should be used instead of using this method directly!
     *
     * Parameters:
     * num - {int} An unsigned integer that should be encoded
     *
     * Returns:
     * {String} An encoded string
     */
    encodeNumber: function (num) {
        var encodeString = "";
        var value;
        while (num >= 0x20) {
            value = (0x20 | (num & 0x1f)) + 63;
            encodeString += (String.fromCharCode(value));
            num >>= 5;
        }
        value = num + 63;
        encodeString += (String.fromCharCode(value));
        return encodeString;
    },

    CLASS_NAME: "OpenLayers.Format.EncodedPolyline"
});
