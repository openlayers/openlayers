/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/SingleFile.js
 */

/**
 * Namespace: Spherical
 * The OpenLayers.Spherical namespace includes utility functions for
 * calculations on the basis of a spherical earth (ignoring ellipsoidal
 * effects), which is accurate enough for most purposes.
 *
 * Relevant links:
 * * http://www.movable-type.co.uk/scripts/latlong.html
 * * http://code.google.com/apis/maps/documentation/javascript/reference.html#spherical
 */

OpenLayers.Spherical = OpenLayers.Spherical || {};

OpenLayers.Spherical.DEFAULT_RADIUS = 6378137;

/**
 * APIFunction: computeDistanceBetween
 * Computes the distance between two LonLats.
 *
 * Parameters:
 * from   - {<OpenLayers.LonLat>} or {Object} Starting point. A LonLat or
 *          a JavaScript literal with lon lat properties.
 * to     - {<OpenLayers.LonLat>} or {Object} Ending point. A LonLat or a
 *          JavaScript literal with lon lat properties.
 * radius - {Float} The radius. Optional. Defaults to 6378137 meters.
 *
 * Returns:
 * {Float} The distance in meters.
 */
OpenLayers.Spherical.computeDistanceBetween = function(from, to, radius) {
  var R = radius || OpenLayers.Spherical.DEFAULT_RADIUS;
  var sinHalfDeltaLon = Math.sin(Math.PI * (to.lon - from.lon) / 360);
  var sinHalfDeltaLat = Math.sin(Math.PI * (to.lat - from.lat) / 360);
  var a = sinHalfDeltaLat * sinHalfDeltaLat +
      sinHalfDeltaLon * sinHalfDeltaLon * Math.cos(Math.PI * from.lat / 180) * Math.cos(Math.PI * to.lat / 180); 
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
};


/**
 * APIFunction: computeHeading
 * Computes the heading from one LonLat to another LonLat.
 *
 * Parameters:
 * from   - {<OpenLayers.LonLat>} or {Object} Starting point. A LonLat or
 *          a JavaScript literal with lon lat properties.
 * to     - {<OpenLayers.LonLat>} or {Object} Ending point. A LonLat or a
 *          JavaScript literal with lon lat properties.
 *
 * Returns:
 * {Float} The heading in degrees.
 */
OpenLayers.Spherical.computeHeading = function(from, to) {
    var y = Math.sin(Math.PI * (from.lon - to.lon) / 180) * Math.cos(Math.PI * to.lat / 180);
    var x = Math.cos(Math.PI * from.lat / 180) * Math.sin(Math.PI * to.lat / 180) -
        Math.sin(Math.PI * from.lat / 180) * Math.cos(Math.PI * to.lat / 180) * Math.cos(Math.PI * (from.lon - to.lon) / 180);
    return 180 * Math.atan2(y, x) / Math.PI;
};
