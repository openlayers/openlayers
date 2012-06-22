goog.provide('ol.geom.LineString');

goog.require('goog.array');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.Point');
goog.require('ol.Projection');

/**
 * Creates ol.geom.LineString objects. 
 * 
 * @export
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.geom.Point>} vertices An array of points building the 
 *     linestrings vertices.
 * 
 * @constructor
 */
ol.geom.LineString = function(vertices) {
    /**
     * @private
     * @type {Array.<ol.geom.Point>}
     */
    this.vertices_ = vertices;
    
};

goog.inherits(ol.geom.LineString, ol.geom.Geometry);

/**
 * Sets the LineString's points.
 * 
 * @return {Array.<ol.geom.Point>} An array of points.
 */
ol.geom.LineString.prototype.getVertices = function() {
    return this.vertices_;
};

/**
 * Gets the LineString's points.
 * 
 * @param {Array.<ol.geom.Point>} vertices An array of points.
 */
ol.geom.LineString.prototype.setVertices = function(vertices) {
    this.vertices_ = vertices;
};

/**
 * Adds the given vertex to the list of vertices at the specified index.
 * 
 * @param {ol.geom.Point} vertex A point to be added.
 * @param {number} index The index where to add.
 */
ol.geom.LineString.prototype.addVertex = function(vertex, index) {
    goog.array.insertAt(this.vertices_,vertex,index);
};

/**
 * Removes the given vertex from the list of vertices.
 * 
 * @param {ol.geom.Point} vertex A point to be removed.
 */
ol.geom.LineString.prototype.removeVertex = function(vertex) {
    goog.array.remove(this.vertices_, vertex);
};
