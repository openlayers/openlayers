import _ol_ from './index';
import _ol_format_FormatType_ from './format/formattype';
import _ol_xml_ from './xml';
var _ol_featureloader_ = {};


/**
 * @param {string|ol.FeatureUrlFunction} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @param {function(this:ol.VectorTile, Array.<ol.Feature>, ol.proj.Projection, ol.Extent)|function(this:ol.source.Vector, Array.<ol.Feature>)} success
 *     Function called with the loaded features and optionally with the data
 *     projection. Called with the vector tile or source as `this`.
 * @param {function(this:ol.VectorTile)|function(this:ol.source.Vector)} failure
 *     Function called when loading failed. Called with the vector tile or
 *     source as `this`.
 * @return {ol.FeatureLoader} The feature loader.
 */
_ol_featureloader_.loadFeaturesXhr = function(url, format, success, failure) {
  return (
    /**
     * @param {ol.Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {ol.proj.Projection} projection Projection.
     * @this {ol.source.Vector|ol.VectorTile}
     */
    function(extent, resolution, projection) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET',
          typeof url === 'function' ? url(extent, resolution, projection) : url,
          true);
      if (format.getType() == _ol_format_FormatType_.ARRAY_BUFFER) {
        xhr.responseType = 'arraybuffer';
      }
      /**
       * @param {Event} event Event.
       * @private
       */
      xhr.onload = function(event) {
        // status will be 0 for file:// urls
        if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
          var type = format.getType();
          /** @type {Document|Node|Object|string|undefined} */
          var source;
          if (type == _ol_format_FormatType_.JSON ||
                type == _ol_format_FormatType_.TEXT) {
            source = xhr.responseText;
          } else if (type == _ol_format_FormatType_.XML) {
            source = xhr.responseXML;
            if (!source) {
              source = _ol_xml_.parse(xhr.responseText);
            }
          } else if (type == _ol_format_FormatType_.ARRAY_BUFFER) {
            source = /** @type {ArrayBuffer} */ (xhr.response);
          }
          if (source) {
            success.call(this, format.readFeatures(source,
                {featureProjection: projection}),
            format.readProjection(source), format.getLastExtent());
          } else {
            failure.call(this);
          }
        } else {
          failure.call(this);
        }
      }.bind(this);
      /**
       * @private
       */
      xhr.onerror = function() {
        failure.call(this);
      }.bind(this);
      xhr.send();
    }
  );
};


/**
 * Create an XHR feature loader for a `url` and `format`. The feature loader
 * loads features (with XHR), parses the features, and adds them to the
 * vector source.
 * @param {string|ol.FeatureUrlFunction} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @return {ol.FeatureLoader} The feature loader.
 * @api
 */
_ol_featureloader_.xhr = function(url, format) {
  return _ol_featureloader_.loadFeaturesXhr(url, format,
      /**
       * @param {Array.<ol.Feature>} features The loaded features.
       * @param {ol.proj.Projection} dataProjection Data projection.
       * @this {ol.source.Vector}
       */
      function(features, dataProjection) {
        this.addFeatures(features);
      }, /* FIXME handle error */ _ol_.nullFunction);
};
export default _ol_featureloader_;
