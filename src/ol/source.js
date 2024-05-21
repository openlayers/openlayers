/**
 * @module ol/source
 */

import LRUCache from './structs/LRUCache.js';
import {getIntersection} from './extent.js';

export {default as BingMaps} from './source/BingMaps.js';
export {default as CartoDB} from './source/CartoDB.js';
export {default as Cluster} from './source/Cluster.js';
export {default as DataTile} from './source/DataTile.js';
export {default as GeoTIFF} from './source/GeoTIFF.js';
export {default as Google} from './source/Google.js';
export {default as IIIF} from './source/IIIF.js';
export {default as Image} from './source/Image.js';
export {default as ImageArcGISRest} from './source/ImageArcGISRest.js';
export {default as ImageCanvas} from './source/ImageCanvas.js';
export {default as ImageMapGuide} from './source/ImageMapGuide.js';
export {default as ImageStatic} from './source/ImageStatic.js';
export {default as ImageWMS} from './source/ImageWMS.js';
export {default as OGCMapTile} from './source/OGCMapTile.js';
export {default as OGCVectorTile} from './source/OGCVectorTile.js';
export {default as OSM} from './source/OSM.js';
export {default as Raster} from './source/Raster.js';
export {default as Source} from './source/Source.js';
export {default as StadiaMaps} from './source/StadiaMaps.js';
export {default as Tile} from './source/Tile.js';
export {default as TileArcGISRest} from './source/TileArcGISRest.js';
export {default as TileDebug} from './source/TileDebug.js';
export {default as TileImage} from './source/TileImage.js';
export {default as TileJSON} from './source/TileJSON.js';
export {default as TileWMS} from './source/TileWMS.js';
export {default as UrlTile} from './source/UrlTile.js';
export {default as UTFGrid} from './source/UTFGrid.js';
export {default as Vector} from './source/Vector.js';
export {default as VectorTile} from './source/VectorTile.js';
export {default as WMTS} from './source/WMTS.js';
export {default as XYZ} from './source/XYZ.js';
export {default as Zoomify} from './source/Zoomify.js';
export {createLoader as createWMSLoader} from './source/wms.js';
export {createLoader as createArcGISRestLoader} from './source/arcgisRest.js';
export {createLoader as createStaticLoader} from './source/static.js';
export {createLoader as createMapGuideLoader} from './source/mapguide.js';

/**
 * Creates a sources function from a tile grid. This function can be used as value for the
 * `sources` property of the {@link module:ol/layer/Layer~Layer} subclasses that support it.
 * @param {import("./tilegrid/TileGrid.js").default} tileGrid Tile grid.
 * @param {function(import("./tilecoord.js").TileCoord): import("./source/Source.js").default} factory Source factory.
 * This function takes a {@link module:ol/tilecoord~TileCoord} as argument and is expected to return a
 * {@link module:ol/source/Source~Source}. **Note**: The returned sources should have a tile grid with
 * a limited set of resolutions, matching the resolution range of a single zoom level of the pyramid
 * `tileGrid` that `sourcesFromTileGrid` was called with.
 * @return {function(import("./extent.js").Extent, number): Array<import("./source/Source.js").default>} Sources function.
 * @api
 */
export function sourcesFromTileGrid(tileGrid, factory) {
  const sourceCache = new LRUCache(32);
  const tileGridExtent = tileGrid.getExtent();
  return function (extent, resolution) {
    sourceCache.expireCache();
    if (tileGridExtent) {
      extent = getIntersection(tileGridExtent, extent);
    }
    const z = tileGrid.getZForResolution(resolution);
    const wantedSources = [];
    tileGrid.forEachTileCoord(extent, z, (tileCoord) => {
      const key = tileCoord.toString();
      if (!sourceCache.containsKey(key)) {
        const source = factory(tileCoord);
        sourceCache.set(key, source);
      }
      wantedSources.push(sourceCache.get(key));
    });
    return wantedSources;
  };
}
