
goog.provide('ga.Lang');
goog.provide('ga.i18n');
goog.require('goog.object');
goog.require('ol.Object');


// Mostly from https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Lang.js

ga.Lang = function() {
    /** @type {?string} */
    this.code_ = null;

    /** @type {string} */
    this.defaultCode_ = 'en';

    goog.base(this);

};
goog.inherits(ga.Lang, ol.Object);



ga.Lang.getCode = function() {
    if (!this.code_) {
      this.setCode();
    }
    return this.code_;
};

ga.Lang.setCode = function(code) {
    this.code_ = code;
};

ga.Lang.translate = function(key, context) {

  var dictionary = ga.Lang[this.getCode()];
  var message = dictionary && dictionary[key];
  if (!message) {
    // Message not found, fall back to message key
    message = key;
  }
  if (context) {
    message = this.format(message, context);
  }
  return message;
};


ga.Lang.format = function(template, context, args) {
        if (!context) {
            context = window;
        }

        // Example matching:
        // str   = ${foo.bar}
        // match = foo.bar
        var replacer = function(str, match) {
            var replacement;

            // Loop through all subs. Example: ${a.b.c}
            // 0 -> replacement = context[a];
            // 1 -> replacement = context[a][b];
            // 2 -> replacement = context[a][b][c];
            var subs = match.split(/\.+/);
            for (var i = 0; i < subs.length; i++) {
                if (i == 0) {
                    replacement = context;
                }
                if (replacement === undefined) {
                    break;
                }
                replacement = replacement[subs[i]];
            }

            if (typeof replacement == 'function') {
                replacement = args ?
                    replacement.apply(null, args) :
                    replacement();
            }

            // If replacement is undefined, return the string 'undefined'.
            // This is a workaround for a bugs in browsers not properly
            // dealing with non-participating groups in regular expressions:
            // http://blog.stevenlevithan.com/archives/npcg-javascript
            if (typeof replacement == 'undefined') {
                return 'undefined';
            } else {
                return replacement;
            }
        };

        return template.replace(/\$\{([\w.]+?)\}/g, replacer);
};


