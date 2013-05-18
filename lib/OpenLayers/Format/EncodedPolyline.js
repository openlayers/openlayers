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

        var flatPoints = this.decodeDeltas(encoded, 2);
        var flatPointsLength = flatPoints.length;

        var pointGeometries = [];
        for (var i = 0; i + 1 < flatPointsLength;) {
            var y = flatPoints[i++], x = flatPoints[i++];
            pointGeometries.push(new OpenLayers.Geometry.Point(x, y));
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
    decode: function(encoded, dims, opt_factor) {
        var factor = opt_factor || 1e5;
        var flatPoints = this.decodeDeltas(encoded, dims, factor);
        var flatPointsLength = flatPoints.length;

        var points = [];
        for (var i = 0; i + (dims - 1) < flatPointsLength;) {
            var point = [];

            for (var dim = 0; dim < dims; ++dim) {
                point.push(flatPoints[i++])
            }

            points.push(point);
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

        var flatPoints = [];

        var pointGeometriesLength = pointGeometries.length;
        for (var i = 0; i < pointGeometriesLength; ++i) {
            var pointGeometry = pointGeometries[i];
            flatPoints.push(pointGeometry.y);
            flatPoints.push(pointGeometry.x);
        }

        return this.encodeDeltas(flatPoints, 2);
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
    encode: function (points, dims, opt_factor) {
        var factor = opt_factor || 1e5;
        var flatPoints = [];

        var pointsLength = points.length;
        for (var i = 0; i < pointsLength; ++i) {
            var point = points[i];

            for (var dim = 0; dim < dims; ++dim) {
                flatPoints.push(point[dim]);
            }
        }

        return this.encodeDeltas(flatPoints, dims, factor);
    },

    /**
     * APIMethod: encodeDeltas
     * Encode a list of n-dimensional points and return an encoded string
     *
     * Attention: This function will modify the passed array!
     *
     * Parameters:
     * numbers - {Array.<number>} A list of n-dimensional points.
     * dimension - {number} The dimension of the points in the list.
     * opt_factor - {number=} The factor by which the numbers will be
     * multiplied. The remaining decimal places will get rounded away.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeDeltas: function(numbers, dimension, opt_factor) {
      var factor = opt_factor || 1e5;
      var d;

      var lastNumbers = new Array(dimension);
      for (d = 0; d < dimension; ++d) {
        lastNumbers[d] = 0;
      }

      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength;) {
        for (d = 0; d < dimension; ++d, ++i) {
          var num = numbers[i];
          var delta = num - lastNumbers[d];
          lastNumbers[d] = num;

          numbers[i] = delta;
        }
      }

      return this.encodeFloats(numbers, factor);
    },


    /**
     * APIMethod: decodeDeltas
     * Decode a list of n-dimensional points from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     * dimension - {number} The dimension of the points in the encoded string.
     * opt_factor - {number=} The factor by which the resulting numbers will
     * be divided.
     *
     * Returns:
     * {Array.<number>} A list of n-dimensional points.
     */
    decodeDeltas: function(encoded, dimension, opt_factor) {
      var factor = opt_factor || 1e5;
      var d;

      var lastNumbers = new Array(dimension);
      for (d = 0; d < dimension; ++d) {
        lastNumbers[d] = 0;
      }

      var numbers = this.decodeFloats(encoded, factor);

      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength;) {
        for (d = 0; d < dimension; ++d, ++i) {
          lastNumbers[d] += numbers[i];

          numbers[i] = lastNumbers[d];
        }
      }

      return numbers;
    },


    /**
     * APIMethod: encodeFloats
     * Encode a list of floating point numbers and return an encoded string
     *
     * Attention: This function will modify the passed array!
     *
     * Parameters:
     * numbers - {Array.<number>} A list of floating point numbers.
     * opt_factor - {number=} The factor by which the numbers will be
     * multiplied. The remaining decimal places will get rounded away.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeFloats: function(numbers, opt_factor) {
      var factor = opt_factor || 1e5;

      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength; ++i) {
        numbers[i] = Math.round(numbers[i] * factor);
      }

      return this.encodeSignedIntegers(numbers);
    },


    /**
     * APIMethod: decodeFloats
     * Decode a list of floating point numbers from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     * opt_factor - {number=} The factor by which the result will be divided.
     *
     * Returns:
     * {Array.<number>} A list of floating point numbers.
     */
    decodeFloats: function(encoded, opt_factor) {
      var factor = opt_factor || 1e5;

      var numbers = this.decodeSignedIntegers(encoded);

      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength; ++i) {
        numbers[i] /= factor;
      }

      return numbers;
    },


    /**
     * APIMethod: encodeSignedIntegers
     * Encode a list of signed integers and return an encoded string
     *
     * Attention: This function will modify the passed array!
     *
     * Parameters:
     * numbers - {Array.<number>} A list of signed integers.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeSignedIntegers: function(numbers) {
      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength; ++i) {
        var num = numbers[i];

        var signedNum = num << 1;
        if (num < 0) {
          signedNum = ~(signedNum);
        }

        numbers[i] = signedNum;
      }

      return this.encodeUnsignedIntegers(numbers);
    },


    /**
     * APIMethod: decodeSignedIntegers
     * Decode a list of signed integers from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     *
     * Returns:
     * {Array.<number>} A list of signed integers.
     */
    decodeSignedIntegers: function(encoded) {
      var numbers = this.decodeUnsignedIntegers(encoded);

      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength; ++i) {
        var num = numbers[i];
        numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
      }

      return numbers;
    },


    /**
     * APIMethod: encodeUnsignedIntegers
     * Encode a list of unsigned integers and return an encoded string
     *
     * Parameters:
     * numbers - {Array.<number>} A list of unsigned integers.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeUnsignedIntegers: function(numbers) {
      var encoded = '';

      var numbersLength = numbers.length;
      for (var i = 0; i < numbersLength; ++i) {
        encoded += this.encodeUnsignedInteger(numbers[i]);
      }

      return encoded;
    },


    /**
     * APIMethod: decodeUnsignedIntegers
     * Decode a list of unsigned integers from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     *
     * Returns:
     * {Array.<number>} A list of unsigned integers.
     */
    decodeUnsignedIntegers: function(encoded) {
      var numbers = [];

      var current = 0;
      var shift = 0;

      var encodedLength = encoded.length;
      for (var i = 0; i < encodedLength; ++i) {
        var b = encoded.charCodeAt(i) - 63;

        current |= (b & 0x1f) << shift;

        if (b < 0x20) {
          numbers.push(current);
          current = 0;
          shift = 0;
        } else {
          shift += 5;
        }
      }

      return numbers;
    },


    /**
     * Method: encodeFloat
     * Encode one single floating point number and return an encoded string
     *
     * Parameters:
     * num - {number} Floating point number that should be encoded.
     * opt_factor - {number=} The factor by which num will be multiplied.
     * The remaining decimal places will get rounded away.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeFloat: function(num, opt_factor) {
      num = Math.round(num * (opt_factor || 1e5));
      return this.encodeSignedInteger(num);
    },


    /**
     * Method: decodeFloat
     * Decode one single floating point number from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     * opt_factor - {number=} The factor by which the result will be divided.
     *
     * Returns:
     * {number} The decoded floating point number.
     */
    decodeFloat: function(encoded, opt_factor) {
      var result = this.decodeSignedInteger(encoded);
      return result / (opt_factor || 1e5);
    },


    /**
     * Method: encodeSignedInteger
     * Encode one single signed integer and return an encoded string
     *
     * Parameters:
     * num - {number} Signed integer that should be encoded.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeSignedInteger: function(num) {
      var signedNum = num << 1;
      if (num < 0) {
        signedNum = ~(signedNum);
      }

      return this.encodeUnsignedInteger(signedNum);
    },


    /**
     * Method: decodeSignedInteger
     * Decode one single signed integer from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     *
     * Returns:
     * {number} The decoded signed integer.
     */
    decodeSignedInteger: function(encoded) {
      var result = this.decodeUnsignedInteger(encoded);
      return ((result & 1) ? ~(result >> 1) : (result >> 1));
    },


    /**
     * Method: encodeUnsignedInteger
     * Encode one single unsigned integer and return an encoded string
     *
     * Parameters:
     * num - {number} Unsigned integer that should be encoded.
     *
     * Returns:
     * {string} The encoded string.
     */
    encodeUnsignedInteger: function(num) {
      var value, encoded = '';
      while (num >= 0x20) {
        value = (0x20 | (num & 0x1f)) + 63;
        encoded += (String.fromCharCode(value));
        num >>= 5;
      }
      value = num + 63;
      encoded += (String.fromCharCode(value));
      return encoded;
    },


    /**
     * Method: decodeUnsignedInteger
     * Decode one single unsigned integer from an encoded string
     *
     * Parameters:
     * encoded - {string} An encoded string.
     *
     * Returns:
     * {number} The decoded unsigned integer.
     */
    decodeUnsignedInteger: function(encoded) {
      var result = 0;
      var shift = 0;

      var encodedLength = encoded.length;
      for (var i = 0; i < encodedLength; ++i) {
        var b = encoded.charCodeAt(i) - 63;

        result |= (b & 0x1f) << shift;

        if (b < 0x20)
          break;

        shift += 5;
      }

      return result;
    },

    CLASS_NAME: "OpenLayers.Format.EncodedPolyline"
});
