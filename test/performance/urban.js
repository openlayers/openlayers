import VectorTileSource from '../../src/ol/source/VectorTile.js';
import Fill from '../../src/ol/style/Fill.js';
import Icon from '../../src/ol/style/Icon.js';
import Stroke from '../../src/ol/style/Stroke.js';
import Style from '../../src/ol/style/Style.js';
import Text from '../../src/ol/style/Text.js';
import {createXYZ} from '../../src/ol/tilegrid.js';
import {createUrbanTileFeatures} from './data.js';

export const VIENNA_CENTER = [1822481.17722, 6141620.25517];
export const NAVIGATION_ZOOM = 17;
export const SOURCE_MAX_ZOOM = 14;

const iconSrc =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18">' +
      '<circle cx="9" cy="9" r="8" fill="#2563eb" stroke="white" stroke-width="2"/>' +
      '<circle cx="9" cy="9" r="2" fill="white"/>' +
      '</svg>',
  );

const buildingFills = [
  '#e7e5e4',
  '#dedbd8',
  '#d6d3d1',
  '#eee8e2',
  '#e5ddd4',
  '#ddd6ce',
];
const roadColors = ['#a8a29e', '#9ca3af', '#94a3b8', '#78716c', '#64748b'];
const icon = new Icon({src: iconSrc});

/**
 * A function style intentionally mirrors generated map styles: many style
 * z-indices, paired icon/text labels, and feature-dependent text.
 *
 * @param {import("../../src/ol/Feature.js").FeatureLike} feature Feature.
 * @return {Style} Style.
 */
export function urbanStyle(feature) {
  const kind = feature.get('kind');
  const rank = feature.get('rank') || 0;
  if (kind === 'building') {
    return new Style({
      zIndex: rank,
      fill: new Fill({color: buildingFills[rank % buildingFills.length]}),
      stroke: new Stroke({color: '#b8b1aa', width: 0.75}),
    });
  }
  if (kind === 'road') {
    return new Style({
      zIndex: 10 + rank,
      stroke: new Stroke({
        color: roadColors[rank % roadColors.length],
        width: 1 + rank * 0.6,
      }),
    });
  }
  return new Style({
    zIndex: 20 + rank,
    image: icon,
    text: new Text({
      text: feature.get('name'),
      font: '12px sans-serif',
      offsetY: -15,
      fill: new Fill({color: '#1f2937'}),
      stroke: new Stroke({color: '#ffffff', width: 3}),
    }),
  });
}

/**
 * @param {number} density Feature density.
 * @return {{source: VectorTileSource, tileGrid: import("../../src/ol/tilegrid/TileGrid.js").default}} Source and grid.
 */
export function createUrbanSource(density) {
  const tileGrid = createXYZ({maxZoom: SOURCE_MAX_ZOOM});
  const source = new VectorTileSource({
    tileGrid,
    projection: 'EPSG:3857',
    transition: 0,
    tileUrlFunction: (tileCoord) => JSON.stringify(tileCoord),
    tileLoadFunction: (tile, url) => {
      const tileCoord = JSON.parse(url);
      setTimeout(() => {
        tile.setFeatures(
          createUrbanTileFeatures(
            tileCoord,
            tileGrid.getTileCoordExtent(tileCoord),
            density,
          ),
        );
      }, 4);
    },
  });
  return {source, tileGrid};
}
