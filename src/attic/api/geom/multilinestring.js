goog.provide('ol.geom.multilinestring');

goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.point');
goog.require('ol.geom.collection');
goog.require('ol.projection');

/**
 * @export
 * @param {Array.<ol.LineStringLike>} opt_arg Point.
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
ol.geom.multilinestring = function(opt_arg){

    if (opt_arg instanceof ol.geom.MultiLineString) {
        return opt_arg;
    }

    var ls = [];
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isArray(opt_arg)) {
            var allValid = goog.array.every(opt_arg, function(spec){
                var l = ol.geom.linestring(spec);
                if (l instanceof ol.geom.LineString) {
                    ls.push(l);
                    return true;
                } else {
                    return false;
                }
            });
            if (!allValid) {
                var msg = 'ol.geom.linestring: at least one linestring '
                    + 'definition was erroneous.';
                throw new Error(msg);
            }
        } else {
            throw new Error('ol.geom.multilinestring');
        }
    }

    var mls = new ol.geom.MultiLineString(ls);
    return mls;
};
goog.inherits(ol.geom.multilinestring, ol.geom.collection);

/**
 * @export
 * @param {Array.<ol.LineStringLike>=} opt_arg An array of point specifications.
 * @return {Array.<ol.geom.LineString>|ol.geom.MultiLineString|undefined} Result.
 */
ol.geom.MultiLineString.prototype.linestrings = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        var ls = [],
            allValid = false;
        allValid = goog.array.every(opt_arg, function(spec){
            var l = ol.geom.linestring(spec);
            if (l instanceof ol.geom.LineString) {
                ls.push(l);
                return true;
            } else {
                return false;
            }
        });
        if (!allValid) {
            ls = [];
        }
        this.setComponents(ls);
        return this;
    }
    else {
        return this.getComponents();
    }
};

/**
 * @export
 * @param {ol.LineStringLike} line A linestring specification.
 * @param {number=} opt_index An optional index to add the point(s) at. If not
 *     provided, the point(s) will be added to the end of the list of points.
 * @return {ol.geom.MultiLineString} The MultiPoint instance.
 */
ol.geom.MultiLineString.prototype.add = function(line, opt_index){
    var index = this.getLineStrings().length,
        l = ol.geom.linestring(line);
    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }
    this.addLineString(l, index);
    return this;
};

/**
 * @export
 * @param {Array.<ol.LineStringLike>} lines Some linestring specifications.
 * @param {number=} opt_index An optional index to add the points at. If not
 *     provided, the linestrings will be added to the end of the list of 
 *     linestrings.
 * @return {ol.geom.MultiLineString} The MultiLineString instance.
 */
ol.geom.MultiLineString.prototype.addAll = function(lines, opt_index){
    var index = this.getLineStrings().length,
        l;

    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }

    goog.array.every(lines, function(pointSpec){
        l = ol.geom.linestring(pointSpec);
        this.addLineString(l, index);
        index++;
        return true;
    }, this);

    return this;
};

/**
 * @export
 * @param {(ol.geom.LineString|Array.<ol.geom.LineString>)} lines A linestring
 *     specification or an array of linestring specifications.
 * @return {ol.geom.MultiLineString} The MultiLineString instance.
 */
ol.geom.MultiLineString.prototype.remove = function(lines){
    var lineArr = [];
    if (!goog.isArray(lines)) {
        lineArr.push(lines);
    } else {
        lineArr = lines;
    }

    goog.array.every(lineArr, function(l){
        this.removeLineString(l);
        return true;
    }, this);

    return this;
};
