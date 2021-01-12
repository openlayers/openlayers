import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
// import {OSM, TileDebugAsync} from '../src/ol/source.js';
import GlTiledTextureGeoTiff from '../src/ol/source/GlTiledTexture/GlTiledTextureGeoTiff.js';
import {GlTiles, OSM} from '../src/ol/source.js';
import {createXYZ, extentFromProjection} from '../src/ol/tilegrid.js';

import {Worker} from 'threads';

// This example depends on a global variable "GeoTIFF" being defined.
// This is done via a <script src="https://unpkg.com/geotiff..."> tag
// It'd be also possible to do a "import * as GeoTIFF from 'geotiff';"
/* global GeoTIFF */

// Creating a GeoTIFF worker Pool is not needed, but makes decoding feel faster
const pool = new GeoTIFF.Pool(
  navigator.hardwareConcurrency,
  new Worker(
    'https://unpkg.com/geotiff@1.0.0-beta.16/dist-browser/decoder.worker.1936c0d9.js'
  )
);

// Create geotiff.js instances
// See https://s2downloads.eox.at/demo/Sentinel-2/README.txt for info about procedence of the data
// Note that just creating the geotiff.js instances requests just the GeoTIFF
// metadata, but doesn't request any raster data.
const geotiffTCI = GeoTIFF.fromUrl(
  'https://s2downloads.eox.at/demo/Sentinel-2/3857/TCI.tif'
);
const geotiff60m = GeoTIFF.fromUrl(
  'https://s2downloads.eox.at/demo/Sentinel-2/3857/R60m.tif'
);
const geotiff20m = GeoTIFF.fromUrl(
  'https://s2downloads.eox.at/demo/Sentinel-2/3857/R20m.tif'
);
const geotiff10m = GeoTIFF.fromUrl(
  'https://s2downloads.eox.at/demo/Sentinel-2/3857/R10m.tif'
);

/* eslint-disable no-unused-vars */
// Create GlTiledTextureGeoTiff instances from each geotiff - one per sample ("image channel")
// Constructor options for each include the GeoTIFF (promised) instance,
// sample (channel) index (0-indexed), value to be used where there's no
// data, a GLSL function name to be created, and a GeoTIFF worker pool.

// tcr, tcg, tcb = True Colour Red/Green/Blue
// This is a 8-bit 3-sample RGB geotiff
const tcr = new GlTiledTextureGeoTiff({
  tiff: geotiffTCI,
  sample: 0,
  fillValue: 0,
  fetchFuncName: 'getTCR',
  pool: pool,
});
const tcg = new GlTiledTextureGeoTiff({
  tiff: geotiffTCI,
  sample: 1,
  fillValue: 0,
  fetchFuncName: 'getTCG',
  pool: pool,
});
const tcb = new GlTiledTextureGeoTiff({
  tiff: geotiffTCI,
  sample: 2,
  fillValue: 0,
  fetchFuncName: 'getTCB',
  pool: pool,
});

// Bands from the 10m GeoTIFF file
// This is a Uint16, 4-sample file (b2,b3,b4,b8); pixels with no data get the value 65535.
const b2 = new GlTiledTextureGeoTiff({
  tiff: geotiff10m,
  sample: 0,
  fillValue: 65535,
  fetchFuncName: 'getB2',
  pool: pool,
});
const b3 = new GlTiledTextureGeoTiff({
  tiff: geotiff10m,
  sample: 1,
  fillValue: 65535,
  fetchFuncName: 'getB3',
  pool: pool,
});
const b4 = new GlTiledTextureGeoTiff({
  tiff: geotiff10m,
  sample: 2,
  fillValue: 65535,
  fetchFuncName: 'getB4',
  pool: pool,
});
const b8 = new GlTiledTextureGeoTiff({
  tiff: geotiff10m,
  sample: 3,
  fillValue: 65535,
  fetchFuncName: 'getB8',
  pool: pool,
});

// Bands from the 20m GeoTIFF file
// This is a Uint16, 10-sample file (b2,b3,b4,b5,b6,b7,b8,b11,b12,b8a);
// pixels with no data get the value 65535.
const b5 = new GlTiledTextureGeoTiff({
  tiff: geotiff20m,
  sample: 3,
  fillValue: 65535,
  fetchFuncName: 'getB5',
  pool: pool,
});
const b6 = new GlTiledTextureGeoTiff({
  tiff: geotiff20m,
  sample: 4,
  fillValue: 65535,
  fetchFuncName: 'getB6',
  pool: pool,
});
const b7 = new GlTiledTextureGeoTiff({
  tiff: geotiff20m,
  sample: 5,
  fillValue: 65535,
  fetchFuncName: 'getB7',
  pool: pool,
});
const b11 = new GlTiledTextureGeoTiff({
  tiff: geotiff20m,
  sample: 7,
  fillValue: 65535,
  fetchFuncName: 'getB11',
  pool: pool,
});
const b12 = new GlTiledTextureGeoTiff({
  tiff: geotiff20m,
  sample: 8,
  fillValue: 65535,
  fetchFuncName: 'getB12',
  pool: pool,
});
const b8a = new GlTiledTextureGeoTiff({
  tiff: geotiff20m,
  sample: 9,
  fillValue: 65535,
  fetchFuncName: 'getB8A',
  pool: pool,
});

// Bands from the 60m GeoTIFF file
// This is a Uint16, 12-sample file (b1,b2,b3,b4,b5,b6,b7,b8,b9,b11,b12,b8a);
// pixels with no data get the value 65535.
const b1 = new GlTiledTextureGeoTiff({
  tiff: geotiff60m,
  sample: 0,
  fillValue: 65535,
  fetchFuncName: 'getB1',
  pool: pool,
});
const b9 = new GlTiledTextureGeoTiff({
  tiff: geotiff60m,
  sample: 8,
  fillValue: 65535,
  fetchFuncName: 'getB9',
  pool: pool,
});

/* eslint-enable no-unused-vars */

const ndvwiShader =
  '#line 1                                    \n' +
  'void main(void) {                                              \n' +
  '	// Fetch texel values for different bands                     \n' +
  '	// in the current texel coordinate (vTextureCoords.st)        \n' +
  '	float b4 = getB4(vTextureCoords.st);                          \n' +
  '	float b8 = getB8(vTextureCoords.st);                          \n' +
  '	float b9 = getB9(vTextureCoords.st);                          \n' +
  '                                                               \n' +
  '	if (b4 >= 65535.) {                                           \n' +
  '		gl_FragColor = vec4(0.);                                    \n' +
  '	} else {                                                      \n' +
  '		highp float ndvi = ((b8 - b4) / (b8 + b4));                 \n' +
  '		highp float ndwi = ((b9 - b4) / (b9 + b4));                 \n' +
  '		gl_FragColor = vec4(abs(ndvi-ndwi), ndvi, ndwi, 1.0);       \n' +
  '	}                                                             \n' +
  '}                                                              \n';

const glSource = new GlTiles({
  // Since this GLSource only uses texture sources that don't have projection
  // and tilegrid (unlike TerrainRGB or TextureGeoTiffTiles), a projection and
  // tile grid must be provided manually.
  projection: 'EPSG:3857',
  tileGrid: createXYZ({
            extent: extentFromProjection('EPSG:3857'),
            maxZoom: 20,
            minZoom: 12,
            tileSize: 256,
          }),

  fragmentShader: ndvwiShader,
  textureSources: [
    // This GlTiles source shall use only three texture sources.
    // Including more textures here *will* request more data,
    // even if the data isn't used in the shader.
    b4,
    b8,
    b9,
  ],
  attributions:
    "<a href='https://s2maps.eu'>Sentinel-2 cloudless</a> by <a href='https://eox.at/'>EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2019)",
  uniforms: {},
});

// const truecolorShader = `#line 1
// void main(void) {
// 	// Fetch texel values for different bands
// 	// in the current texel coordinate (vTextureCoords.st)
// 	float tcr = getTCR(vTextureCoords.st);
// 	float tcg = getTCG(vTextureCoords.st);
// 	float tcb = getTCB(vTextureCoords.st);
//
// 	gl_FragColor = vec4(vec3(tcr, tcg, tcb)/256., 1.0);
// }
// `;
//
// var glSource = new GlTiles({
// // 	projection: epsg8357,
// 	fragmentShader: truecolorShader,
// 	textureSources: [
// 		// This GlTiles source shall use only three texture sources.
// 		// Including more textures here *will* request more data,
// 		// even if the data isn't used in the shader.
// 		tcr, tcg, tcb,
// 	],
// 	attributions: "Sentinel 2 data",
// 	uniforms: {}
// });

// var mousePositionControl = new MousePosition({
//   coordinateFormat: createStringXY(4),
//   projection: 'EPSG:3035',
//   // comment the following two lines to have the mouse position
//   // be placed within the map.
// //   className: 'custom-mouse-position',
// //   target: document.getElementById('mouse-position'),
//   undefinedHTML: '&nbsp;',
// });

const map = new Map({
  // 	controls: defaultControls().extend([mousePositionControl]),
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.5,
    }),
    new TileLayer({
      source: glSource,
    }),
  ],
  target: 'map',
  view: new View({
    // 		projection: epsg3035,
    center: [1900000, 6100000],
    zoom: 15,
  }),
});

