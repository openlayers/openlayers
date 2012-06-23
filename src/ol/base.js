goog.provide('ol.base');
goog.provide('ol.error');

/**
 * @param {string} message Message.
 */
ol.error = function(message) {
    if (ol.error.VERBOSE_ERRORS) {
        throw new Error(message);
    } else {
        throw null;
    }
};

/**
 * Compilation with public API, let's accept options from external world
 * @define {boolean}
 */
ol.API = true;

/**
 * @define {boolean}
 */
ol.error.VERBOSE_ERRORS = true;

/**
 * Options passed in the API from external world are checked for wrong keys
 * @define {boolean}
 */
ol.CHECK_KEYS = true;

/**
 * @param {Object} obj Object.
 * @param {!Array.<string>} allowedKeys Allowed keys.
 */
ol.base.checkKeys = function(obj, allowedKeys) {
    if (ol.CHECK_KEYS) {
        var keys = goog.object.getKeys(obj);
        goog.array.forEach(allowedKeys, function(allowedKey) {
            goog.array.remove(keys, allowedKey);
        });
        if (!goog.array.isEmpty(keys)) {
            ol.error('object contains invalid keys: ' + keys.join(', '));
        }
    }
};
