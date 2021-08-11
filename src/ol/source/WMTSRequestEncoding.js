/**
 * @module ol/source/WMTSRequestEncoding
 */

/**
 * Request encoding. One of 'KVP', 'REST'.
 * @enum {string}
 */
const WMTSRequestEncoding = {
  KVP: 'KVP', // see spec §8
  REST: 'REST', // see spec §10
};

export default WMTSRequestEncoding;
