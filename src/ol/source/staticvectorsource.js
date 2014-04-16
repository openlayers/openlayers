goog.provide('ol.source.StaticVector');

goog.require('ol.source.FormatVector');
goog.require('ol.source.State');



/**
 * @constructor
 * @extends {ol.source.FormatVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.StaticVectorOptions} options Options.
 * @todo api
 */
ol.source.StaticVector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    format: options.format,
    logo: options.logo,
    projection: options.projection
  });

  if (goog.isDef(options.arrayBuffer)) {
    this.addFeaturesInternal(this.readFeatures(options.arrayBuffer));
  }

  if (goog.isDef(options.doc)) {
    this.addFeaturesInternal(this.readFeatures(options.doc));
  }

  if (goog.isDef(options.node)) {
    this.addFeaturesInternal(this.readFeatures(options.node));
  }

  if (goog.isDef(options.object)) {
    this.addFeaturesInternal(this.readFeatures(options.object));
  }

  if (goog.isDef(options.text)) {
    this.addFeaturesInternal(this.readFeatures(options.text));
  }

  if (goog.isDef(options.url) || goog.isDef(options.urls)) {
    this.setState(ol.source.State.LOADING);
    if (goog.isDef(options.url)) {
      this.loadFeaturesFromURL(options.url,
          /**
           * @param {Array.<ol.Feature>} features Features.
           * @this {ol.source.StaticVector}
           */
          function(features) {
            this.addFeaturesInternal(features);
            this.setState(ol.source.State.READY);
          }, this);
    }
    if (goog.isDef(options.urls)) {
      var urls = options.urls;
      var i, ii;
      for (i = 0, ii = urls.length; i < ii; ++i) {
        this.loadFeaturesFromURL(urls[i],
            /**
             * @param {Array.<ol.Feature>} features Features.
             * @this {ol.source.StaticVector}
             */
            function(features) {
              this.addFeaturesInternal(features);
              this.setState(ol.source.State.READY);
            }, this);
      }
    }
  }

};
goog.inherits(ol.source.StaticVector, ol.source.FormatVector);
