goog.provide('ga.Lang');

// Mostly from https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Lang.js

/**
 * @type {Object<?,?>}
 * @api stable
 */
ga.Lang = {};

/**
 * @type {string}
 */
ga.Lang.code_ = window['GeoAdmin'] && window['GeoAdmin']['lang'] ?
  window['GeoAdmin']['lang'] : "de";


/**
 * Get language code
 * @return {string} language code
 * @api stable
 */
ga.Lang.getCode = function() {
  if (!ga.Lang.code_) {
    ga.Lang.setCode('de');
  }
  return ga.Lang.code_;
};


/**
 * Set language code
 * @param {string} code, e.g. 'de'
 * @api stable
 */
ga.Lang.setCode = function(code) {
  ga.Lang.code_ = code;
  if (window['GeoAdmin'] && window['GeoAdmin']['lang']) {
    window['GeoAdmin']['lang'] = code;
  }
};


/**
 *  Translate a message given a msgid and a context.
 *  @param {string} msgid to translate.
 *  @param {Object=} context (optional),
 *  @return {string} translated message
 *  @api stable
 */
ga.Lang.translate = function(msgid, context) {

  var dictionary = ga.Lang[ga.Lang.getCode()];
  var message = dictionary && dictionary[msgid];
  if (!message) {
    // Message not found, fall back to message key
    message = msgid;
  }
  if (context) {
    message = ga.Lang.format(message, context);
  }
  return message;
};


/**
 * Given a string with tokens in the form ${token}, return a string
 * with tokens replaced with properties from the given context
 * object.  Represent a literal "${" by doubling it, e.g. "${${".
 *
 * @param {string} template A string with tokens to be replaced.
 * @param {Object=} context  An optional object with properties
 * @param {Array=} args Optional arguments to pass to any functions
 *
 * @return {string} A string with tokens replaced from the context object
 *
 * https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/BaseTypes.js#L90
 */

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

/**
 * Message catalog in swiss german
 * @type {Object.<string,string>}
 * @api stable
 */
ga.Lang.de = {
  'Geocoding results': 'Geokodierung Ergebnisse',
  'Zoom in': 'Zoom in',
  'Zoom out': 'Zoom out',
  'Reset rotation': 'Rotation zurücksetzen'
};

/**
 * Message catalog in english
 * @type {Object.<string,string>}
 * @api stable
 */
ga.Lang.en = {
  'Geocoding results': 'Geocoding results',
  'Zoom in': 'Zoom in',
  'Zoom out': 'Zoom out',
  'Reset rotation': 'Reset rotation'
};

/**
 * Message catalog in swiss french
 * @type {Object.<string,string>}
 * @api stable
 */
ga.Lang.fr = {
  'Geocoding results': 'Résultat du géocodage',
  'Zoom in': 'Zoom avant',
  'Zoom out': 'Zoom arri\u00e8re',
  'Reset rotation': 'Annuler la rotation'
};

/**
 * Message catalog in swiss italian
 * @type {Object.<string,string>}
 * @api stable
 */
ga.Lang.it = {
  'Geocoding results': 'Risultati geocoding',
  'Zoom in': 'Zoom in',
  'Zoom out': 'Zoom out',
  'Reset rotation': 'Annullare la rotazione'
};

/**
 * Message catalog in rumantsch
 * @type {Object.<string,string>}
 * @api stable
 */
ga.Lang.rm = {
  'Geocoding results': 'Rezultatele geocodare',
  'Zoom in': 'Zoom in',
  'Zoom out': 'Zoom out',
  'Reset rotation': 'Rotaziun reinizialisar'
};
