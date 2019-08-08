/**
 * @module ol/source/WMSServerType
 */

/**
 * Available server types: `'carmentaserver'`, `'geoserver'`, `'mapserver'`,
 *     `'qgis'`. These are servers that have vendor parameters beyond the WMS
 *     specification that OpenLayers can make use of.
 * @enum {string}
 */
export default {
  /**
   * HiDPI support for [Carmenta Server](https://www.carmenta.com/en/products/carmenta-server)
   * @api
   */
  CARMENTA_SERVER: 'carmentaserver',
  /**
   * HiDPI support for [GeoServer](https://geoserver.org/)
   * @api
   */
  GEOSERVER: 'geoserver',
  /**
   * HiDPI support for [MapServer](https://mapserver.org/)
   * @api
   */
  MAPSERVER: 'mapserver',
  /**
   * HiDPI support for [QGIS](https://qgis.org/)
   * @api
   */
  QGIS: 'qgis'
};
