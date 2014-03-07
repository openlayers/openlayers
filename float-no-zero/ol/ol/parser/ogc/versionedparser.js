goog.provide('ol.parser.ogc.Versioned');
goog.require('goog.dom.xml');
goog.require('ol.parser.ogc.ExceptionReport');



/**
 * @constructor
 * @param {Object=} opt_options Options which will be set on this object.
 */
ol.parser.ogc.Versioned = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};
  this.options = options;
  this.defaultVersion = options.defaultVersion || null;
  this.version = options.version;
  this.profile = options.profile;
  if (goog.isDef(options.allowFallback)) {
    this.allowFallback = options.allowFallback;
  } else {
    this.allowFallback = false;
  }
  if (goog.isDef(options.stringifyOutput)) {
    this.stringifyOutput = options.stringifyOutput;
  } else {
    this.stringifyOutput = false;
  }
};


/**
 * @param {Element} root root element.
 * @param {Object=} opt_options optional configuration object.
 * @return {string} the version to use.
 */
ol.parser.ogc.Versioned.prototype.getVersion = function(root, opt_options) {
  var version;
  // read
  if (root) {
    version = this.version;
    if (!version) {
      version = root.getAttribute('version');
      if (!version) {
        version = this.defaultVersion;
      }
    }
  } else {
    // write
    version = (opt_options && opt_options.version) ||
        this.version || this.defaultVersion;
  }
  return version;
};


/**
 * @param {string} version the version to use.
 * @return {Object} the parser to use.
 */
ol.parser.ogc.Versioned.prototype.getParser = function(version) {
  version = version || this.defaultVersion;
  var profile = this.profile ? '_' + this.profile : '';
  if (!this.parser || this.parser.VERSION != version) {
    var format = this.parsers['v' + version.replace(/\./g, '_') + profile];
    if (!format) {
      if (profile !== '' && this.allowFallback) {
        // fallback to the non-profiled version of the parser
        profile = '';
        format = this.parsers['v' + version.replace(/\./g, '_') + profile];
      }
      if (!format) {
        throw 'Can\'t find a parser for version ' +
            version + profile;
      }
    }
    this.parser = new format(this.options);
  }
  return this.parser;
};


/**
 * Write a document.
 *
 * @param {Object} obj An object representing the document.
 * @param {Object=} opt_options Optional configuration object.
 * @return {Element|string} the XML created.
 */
ol.parser.ogc.Versioned.prototype.write = function(obj, opt_options) {
  var version = this.getVersion(null, opt_options);
  this.parser = this.getParser(version);
  var root = this.parser.write(obj, opt_options);
  if (this.stringifyOutput === false) {
    return root;
  } else {
    return goog.dom.xml.serialize(root);
  }
};


/**
 * @param {string|Document} data Data to read.
 * @param {Object=} opt_options Options for the reader.
 * @return {Object} An object representing the document.
 */
ol.parser.ogc.Versioned.prototype.read = function(data, opt_options) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  var root = data.documentElement;
  var version = this.getVersion(root);
  this.parser = this.getParser(version);
  var obj = this.parser.read(data, opt_options);
  var errorProperty = this.parser.errorProperty || null;
  if (errorProperty !== null && obj[errorProperty] === undefined) {
    // an error must have happened, so parse it and report back
    var format = new ol.parser.ogc.ExceptionReport();
    obj.error = format.read(data);
  }
  obj.version = version;
  return obj;
};
