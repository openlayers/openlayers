goog.provide('ol.source.wms');
goog.provide('ol.source.wms.ServerType');


/**
 * @define {string} WMS default version.
 */
ol.source.wms.DEFAULT_VERSION = '1.3.0';


/**
 * @enum {string}
 */
ol.source.wms.ServerType = {
  CARMENTA_SERVER: 'carmentaserver',
  GEOSERVER: 'geoserver',
  MAPSERVER: 'mapserver',
  QGIS: 'qgis'
};
