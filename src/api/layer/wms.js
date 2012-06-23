goog.provide('ol.layer.wms');

goog.require('ol.layer.WMS');

/**
 * @export
 * @param {Object} opt_arg Config object.
 * @return {ol.layer.WMS}
 */
ol.layer.wms = function(opt_arg) {
    if (opt_arg instanceof ol.layer.WMS) {
        return opt_arg;
    }

    /** @type {string} */
    var url;
    /** @type {Array.<string>} */
    var layers;
    /** @type {string} */
    var format;

    if (goog.isObject(opt_arg)) {
        ol.base.checkKeys(opt_arg, ['url', 'layers', 'format']);
        url = opt_arg['url'];
        layers = opt_arg['layers'];
        format = opt_arg['format'];
    }

    var msg;
    if (!goog.isDef(url)) {
        msg = 'Cannot create WMS layer; option "url" is missing';
        ol.error(msg);
    }
    if (!goog.isArray(layers)) {
        msg = 'Cannot create WMS layer; option "layers" is missing, ' +
              'or is not an array';
        ol.error(msg);
    }

    return new ol.layer.WMS(url, layers, format);
};
