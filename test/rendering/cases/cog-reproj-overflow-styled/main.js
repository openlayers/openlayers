import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {transformExtent} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

proj4.defs(
  'EPSG:25832',
  '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
);
proj4.defs(
  'EPSG:25833',
  '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
);
register(proj4);

// A tile-multiple RGB GeoTIFF (no nodata, so no alpha band) reprojected to a
// neighbouring UTM zone, which rotates the footprint.  A color style forces the
// output alpha to 1, so the gaps the rotated reprojection leaves only render
// transparent if the appended coverage band discards them.
const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/dop-rgb-tiled.tif',
    },
  ],
  transition: 0,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: source,
      background: 'red',
      style: {
        color: ['array', ['band', 1], ['band', 2], ['band', 3], 1],
      },
    }),
  ],
  target: 'map',
  view: new View({
    projection: 'EPSG:25833',
  }),
});

source.getView().then((viewConfig) => {
  const view = map.getView();
  view.fit(
    transformExtent(
      viewConfig.extent,
      viewConfig.projection,
      view.getProjection(),
    ),
  );
});

render({
  message:
    'reprojected geotiff without alpha discards out-of-footprint pixels even with a color style',
});
