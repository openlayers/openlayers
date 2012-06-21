goog.provide('ol.geom.multipoint'); 

goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.point'); 
goog.require('ol.geom.collection'); 
goog.require('ol.projection');

/**
 * @export
 * @param {Array.<ol.PointLike>} opt_arg Point.
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
ol.geom.multipoint = function(opt_arg){
    
    if (opt_arg instanceof ol.geom.MultiPoint) {
        return opt_arg;
    }
    
    var points = [];
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isArray(opt_arg)) {
            var allValid = goog.array.every(opt_arg, function(spec){
                var p = ol.geom.point(spec);
                if (p instanceof ol.geom.Point) {
                    points.push(p);
                    return true;
                } else {
                    return false;
                }
            });
            if (!allValid) {
                var msg = 'ol.geom.multipoint: at least one point '
                    + 'definition was erroneous.';
                throw new Error(msg);
            }
        } else {
            throw new Error('ol.geom.multipoint');
        }
    }
    
    var mp = new ol.geom.MultiPoint(points);
    return mp;
};
goog.inherits(ol.geom.multipoint, ol.geom.collection);

/**
 * @export
 * @param {Array.<ol.PointLike>=} opt_arg An array of point specifications.
 * @return {Array.<ol.geom.Point>|ol.geom.MultiPoint|undefined} Result.
 */
ol.geom.MultiPoint.prototype.points = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        var points = [],
            allValid = false;
        allValid = goog.array.every(opt_arg, function(spec){
            var p = ol.geom.point(spec);
            if (p instanceof ol.geom.Point) {
                points.push(p);
                return true;
            } else {
                return false;
            }
        });
        if (!allValid) {
            points = [];
        }
        this.setComponents(points);
        return this;
    }
    else {
        return this.getComponents();
    }
};

/**
 * @export
 * @param {ol.PointLike} point A point specification.
 * @param {number=} opt_index An optional index to add the point(s) at. If not
 *     provided, the point(s) will be added to the end of the list of points.
 * @return {ol.geom.MultiPoint} The MultiPoint instance.
 */
ol.geom.MultiPoint.prototype.add = function(point, opt_index){
    var index = this.getPoints().length,
        p = ol.geom.point(point);
    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }
    this.addPoint(p, index);
    return this;
};

/**
 * @export
 * @param {Array.<ol.PointLike>} points Some point specifications.
 * @param {number=} opt_index An optional index to add the points at. If not
 *     provided, the points will be added to the end of the list of points.
 * @return {ol.geom.MultiPoint} The MultiPoint instance.
 */
ol.geom.MultiPoint.prototype.addAll = function(points, opt_index){
    var index = this.getPoints().length,
        p;
    
    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }
    
    goog.array.every(points, function(pointSpec){
        p = ol.geom.point(pointSpec);
        this.addPoint(p, index);
        index++;
        return true;
    }, this);
    
    return this;
};

/**
 * @export
 * @param {(ol.geom.Point|Array.<ol.geom.Point>)} points A point specification or
 *     an array of point specifications.
 * @return {ol.geom.MultiPoint} The MultiPoint instance.
 */
ol.geom.MultiPoint.prototype.remove = function(points){
    var pointArr = [];
    if (!goog.isArray(points)) {
        pointArr.push(points);
    } else {
        pointArr = points;
    }

    goog.array.every(pointArr, function(p){
        this.removePoint(p);
        return true;
    }, this);
    
    return this;
};
