goog.provide('ol.base');
goog.provide('ol.error');

/**
 * Compilation with public API, let's accept options from external world
 * @define {boolean}
 */
ol.API = true;

/**
 * @param {string} message Message.
 */
ol.error = function(message) {
    if (goog.DEBUG) {
        throw new Error(message);
    } else {
        throw null;
    }
};

/**
 * @param {Object} obj Object.
 * @param {!Array.<string>} allowedKeys Allowed keys.
 */
ol.base.checkKeys = function(obj, allowedKeys) {
    if (goog.DEBUG) {
        var keys = goog.object.getKeys(obj);
        goog.array.forEach(allowedKeys, function(allowedKey) {
            goog.array.remove(keys, allowedKey);
        });
        if (!goog.array.isEmpty(keys)) {
            ol.error('object contains invalid keys: ' + keys.join(', '));
        }
    }
};
