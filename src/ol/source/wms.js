/**
 * @module ol/source/wms
 */

/**
 * Default WMS version.
 * @type {string}
 */
export const DEFAULT_VERSION = '1.3.0';

/**
 * @api
 * @typedef {'carmentaserver' | 'geoserver' | 'mapserver' | 'qgis'} ServerType
 * Set the server type to use implementation-specific parameters beyond the WMS specification.
 *  - `'carmentaserver'`: HiDPI support for [Carmenta Server](https://www.carmenta.com/en/products/carmenta-server)
 *  - `'geoserver'`: HiDPI support for [GeoServer](https://geoserver.org/)
 *  - `'mapserver'`: HiDPI support for [MapServer](https://mapserver.org/)
 *  - `'qgis'`: HiDPI support for [QGIS](https://qgis.org/)
 */
