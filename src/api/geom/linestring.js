goog.provide('ol.geom.linestring');

goog.require('ol.geom.LineString');
goog.require('ol.geom.point');
goog.require('ol.projection');

/**
 * @export
 * @param {Array.<ol.PointLike>} opt_arg Point.
 * @return {ol.geom.LineString} LineString.
 */
ol.geom.linestring = function(opt_arg){

    if (opt_arg instanceof ol.geom.LineString) {
        return opt_arg;
    }

    var vertices = [];
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isArray(opt_arg)) {
            var allValid = goog.array.every(opt_arg, function(spec){
                var v = ol.geom.point(spec);
                if (v instanceof ol.geom.Point) {
                    vertices.push(v);
                    return true;
                } else {
                    return false;
                }
            });
            if (!allValid) {
                var msg = 'ol.geom.linestring: at least one point '
                    + 'definition was erroneous.';
                throw new Error(msg);
            }
        } else {
            throw new Error('ol.geom.linestring');
        }
    }

    var ls = new ol.geom.LineString(vertices);
    return ls;
};
goog.inherits(ol.geom.linestring, ol.geom.geometry);

/**
 * @export
 * @param {Array.<ol.PointLike>=} opt_arg An array of vertex specifications.
 * @return {Array.<ol.geom.Point>|ol.geom.LineString|undefined} Result.
 */
ol.geom.LineString.prototype.vertices = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        var vertices = [],
            allValid = false;
        goog.array.every(opt_arg, function(spec){
            var v = ol.geom.point(spec);
            if (v instanceof ol.geom.Point) {
                vertices.push(v);
                return true;
            } else {
                return false;
            }
        });
        if (!allValid) {
            vertices = [];
        }
        this.setVertices(vertices);
        return this;
    }
    else {
        return this.getVertices();
    }
};

/**
 * @export
 * @param {ol.PointLike} vertex A point specification.
 * @param {number=} opt_index An optional index to add the vertices at. If not
 *     provided, the vertex will be added to the end of the list of vertices.
 * @return {ol.geom.LineString} The LineString instance.
 */
ol.geom.LineString.prototype.add = function(vertex, opt_index){
    var index = this.vertices_.length,
        allValid = false,
        v = ol.geom.point(vertex);
    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }
    this.addVertex(v, index);
    return this;
};

/**
 * @export
 * @param {Array.<ol.PointLike>} vertices Some vertex specifications.
 * @param {number=} opt_index An optional index to add the vertices at. If not
 *     provided, the points will be added to the end of the list of vertices.
 * @return {ol.geom.LineString} The LineString instance.
 */
ol.geom.LineString.prototype.addAll = function(vertices, opt_index){
    var index = this.vertices_.length,
        v;

    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }

    goog.array.every(vertices, function(vertexSpec){
        v = ol.geom.point(vertexSpec);
        this.addVertex(v, index);
        index++;
        return true;
    }, this);

    return this;
};

/**
 * @export
 * @param {(ol.geom.Point|Array.<ol.geom.Point>)} vertices A point specification or
 *     an array of point specifications.
 * @return {ol.geom.LineString} The MultiPoint instance.
 */
ol.geom.LineString.prototype.remove = function(vertices){
    var vertexArr = [];
    if (!goog.isArray(vertices)) {
        vertexArr.push(vertices);
    } else {
        vertexArr = vertices;
    }

    goog.array.every(vertexArr, function(v){
        this.removeVertex(v);
        return true;
    }, this);
    
    return this;
};
