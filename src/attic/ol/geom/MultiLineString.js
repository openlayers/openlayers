goog.provide('ol.geom.MultiLineString');

goog.require('goog.array');
goog.require('ol.geom.Collection');

/**
 * Creates ol.geom.MultiLineString objects.
 *
 * @export
 * @extends {ol.geom.Collection}
 * @param {Array.<ol.geom.LineString>} linestrings An array of linestrings.
 *
 * @constructor
 */
ol.geom.MultiLineString = function(linestrings) {
    this.setTypeWhitelist([ol.geom.LineString]);
    this.setTypeBlacklist([ol.geom.Geometry]);
    if (arguments.length === 1 && goog.isDef(linestrings)) {
        this.setLineStrings(linestrings);
    }

};

goog.inherits(ol.geom.MultiLineString, ol.geom.Collection);

/**
 * Gets the MultiLineString's linestrings.
 *
 * @return {Array.<ol.geom.LineString>} An array of linestrings.
 */
ol.geom.MultiLineString.prototype.getLineStrings = function() {
    return this.getComponents();
};

/**
 * Sets the MultiLineString's linestrings.
 *
 * @param {Array.<ol.geom.LineString>} linestrings An array of linestrings.
 */
ol.geom.MultiLineString.prototype.setLineStrings = function(linestrings) {
    this.setComponents(linestrings);
};

/**
 * Adds the given linestring to the list of linestrings at the specified index.
 *
 * @param {ol.geom.LineString} linestring A linestring to be added.
 * @param {number} index The index where to add.
 */
ol.geom.MultiLineString.prototype.addLineString = function(linestring, index) {
    this.addComponent(linestring, index);
};

/**
 * Removes the given linestring from the list of linestrings.
 *
 * @param {ol.geom.LineString} linestring A linestring to be removed.
 */
ol.geom.MultiLineString.prototype.removeLineString = function(linestring) {
    this.removeComponent(linestring);
};
