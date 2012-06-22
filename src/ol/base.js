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
 * @define {boolean}
 */
ol.error.VERBOSE_ERRORS = true;

/**
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
