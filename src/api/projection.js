goog.provide('ol.projection');

goog.require('ol.Projection');


/**
 * @typedef {ol.Projection|string}
 */
ol.ProjectionLike;


/**
 * @export
 * @param {ol.ProjectionLike=} opt_arg Argument.
 * @return {ol.Projection} Projection.
 */
ol.projection = function(opt_arg){
    var code, units;
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (opt_arg instanceof ol.Projection) {
            return opt_arg;
        }
        else if (goog.isString(opt_arg)) {
            code = opt_arg;
        }
        else if (goog.isObject(opt_arg)) {
            code = opt_arg['code'];
            units = opt_arg['units'];
        }
        else {
            throw new Error('ol.projection');
        }
    }
    var proj = new ol.Projection();
    proj.setCode(code);
    return proj;
};


/**
 * @export
 * @param {string=} opt_code Code.
 * @return {ol.Projection|string} Result.
 */
ol.Projection.prototype.code = function(opt_code){
    if (goog.isDef(opt_code)) {
        return this.setCode(opt_code);
    }
    else {
        return this.getCode();
    }
};
