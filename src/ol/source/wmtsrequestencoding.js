goog.provide('ol.source.WMTSRequestEncoding');

/**
 * Request encoding. One of 'KVP', 'REST'.
 * @enum {string}
 */
ol.source.WMTSRequestEncoding = {
  KVP: 'KVP',  // see spec §8
  REST: 'REST' // see spec §10
};
