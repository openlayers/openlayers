// FIXME remove reprojectTo

goog.provide('ol.source.VectorFile');

goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('goog.net.XhrIo');
goog.require('ol.format.FormatType');
goog.require('ol.proj');
goog.require('ol.source.State');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.source.Vector}
 * @param {olx.source.VectorFileOptions=} opt_options Options.
 */
ol.source.VectorFile = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection
  });

  /**
   * @type {ol.format.Format}
   * @protected
   */
  this.format = options.format;

  /**
   * @type {ol.proj.Projection}
   * @private
   */
  this.reprojectTo_ = goog.isDef(options.reprojectTo) ?
      ol.proj.get(options.reprojectTo) : ol.proj.get('EPSG:3857');

  if (goog.isDef(options.doc)) {
    this.readFeatures_(options.doc);
  }

  if (goog.isDef(options.node)) {
    this.readFeatures_(options.node);
  }

  if (goog.isDef(options.object)) {
    this.readFeatures_(options.object);
  }

  if (goog.isDef(options.text)) {
    this.readFeatures_(options.text);
  }

  if (goog.isDef(options.url)) {
    this.setState(ol.source.State.LOADING);
    goog.net.XhrIo.send(options.url, goog.bind(this.handleXhrIo_, this));
  }

};
goog.inherits(ol.source.VectorFile, ol.source.Vector);


/**
 * @param {Event} event Event.
 * @private
 */
ol.source.VectorFile.prototype.handleXhrIo_ = function(event) {
  var xhrIo = /** @type {goog.net.XhrIo} */ (event.target);
  if (xhrIo.isSuccess()) {
    var type = this.format.getType();
    /** @type {Document|Node|Object|string|undefined} */
    var source;
    if (type == ol.format.FormatType.BINARY) {
      // FIXME
    } else if (type == ol.format.FormatType.JSON) {
      source = xhrIo.getResponseJson();
    } else if (type == ol.format.FormatType.TEXT) {
      source = xhrIo.getResponseText();
    } else if (type == ol.format.FormatType.XML) {
      source = xhrIo.getResponseXml();
      if (goog.isNull(source)) {
        source = goog.dom.xml.loadXml(xhrIo.getResponseText());
      }
    } else {
      goog.asserts.fail();
    }
    if (goog.isDef(source)) {
      this.readFeatures_(source);
    } else {
      goog.asserts.fail();
      this.setState(ol.source.State.ERROR);
    }
  } else {
    this.setState(ol.source.State.ERROR);
  }
};


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 */
ol.source.VectorFile.prototype.readFeatures_ = function(source) {
  var format = this.format;
  var features = format.readFeatures(source);
  var featureProjection = format.readProjection(source);
  if (!ol.proj.equivalent(featureProjection, this.reprojectTo_)) {
    var transform = ol.proj.getTransform(featureProjection, this.reprojectTo_);
    var i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      var feature = features[i];
      var geometry = feature.getGeometry();
      if (!goog.isNull(geometry)) {
        geometry.transform(transform);
      }
    }
  }
  this.addFeaturesInternal(features);
  this.setState(ol.source.State.READY);
};
