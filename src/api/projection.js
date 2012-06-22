goog.provide('ol.projection');

goog.require('ol.base');
goog.require('ol.Projection');


/**
 * @typedef {ol.Projection|Object|string}
 */
ol.ProjectionLike;


/**
 * @export
 * @param {ol.ProjectionLike=} opt_arg Argument.
 * @return {ol.Projection} Projection.
 */
ol.projection = function(opt_arg){
    /** @type {string} */
    var code;
    
    /** @type {undefined|number} */
    var units;

    /** @type {undefined|Array|ol.UnreferencedBounds} */
    var extent;

    if (arguments.length == 1 && goog.isDefAndNotNull(opt_arg)) {
        if (opt_arg instanceof ol.Projection) {
            return opt_arg;
        }
        else if (goog.isString(opt_arg)) {
            code = opt_arg;
        }
        else if (goog.isObject(opt_arg)) {
            ol.base.checkKeys(opt_arg, ['code', 'maxExtent', 'units']);
            if (goog.isString(opt_arg['code'])) {
                code = opt_arg['code'];
            } else {
                throw new Error('Projection requires a string code.');
            }
            units = opt_arg['units'];
            extent = opt_arg['maxExtent'];
        }
        else {
            throw new Error('ol.projection');
        }
    }
    var proj = new ol.Projection(code);
    if (goog.isDef(units)) {
        proj.setUnits(units);
    }
    if (goog.isDef(extent)) {
        proj.setExtent(
            new ol.UnreferencedBounds(extent[0],extent[1],extent[2],extent[3])
        );
    }
    return proj;
};

/**
 * @export
 * @param {string=} opt_code Code.
 * @return {!ol.Projection|string} Result.
 */
ol.Projection.prototype.code = function(opt_code){
    if (arguments.length == 1 && goog.isDef(opt_code)) {
        this.setCode(opt_code);
        return this;
    }
    else {
        return this.getCode();
    }
};

/**
 * @export
 * @param {string=} opt_units Units abbreviation.
 * @return {undefined|!ol.Projection|string} Result.
 */
ol.Projection.prototype.units = function(opt_units){
    if (goog.isDef(opt_units)) {
        return this.setUnits(opt_units);
    }
    else {
        return this.getUnits();
    }
};
