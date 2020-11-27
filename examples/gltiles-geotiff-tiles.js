import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileWMS from '../src/ol/source/TileWMS.js';
import TileGrid from 'ol/tilegrid/TileGrid';
import {XYZ, GlTiles} from '../src/ol/source.js';
import GlTiledTextureGeoTiffTiles from '../src/ol/source/GlTiledTexture/GlTiledTextureGeoTiffTiles.js';

import Projection from '../src/ol/proj/Projection.js';
import {register} from '../src/ol/proj/proj4.js';
import MousePosition from '../src/ol/control/MousePosition';
import {createStringXY} from '../src/ol/coordinate';
import {defaults as defaultControls} from '../src/ol/control';

// These non-square GeoTIFF tiles need a custom tilegrid - forcing level 0 for
// the top-level 512x256px tile, and limiting the number of available zoom levels.
// var tileGrid = new TileGrid({
//   extent: [-180, 90, 180, -90],
// //   origin: [-180, 90],
//   resolutions: [360/512, 180/512, 90/512, 45/512, 22.5/512],
//   tileSizes: [[512, 256], [1024, 512], [1024, 1024], [1024, 1024], [1024, 1024]],
// //   resolutions: [180/512, 90/512, 45/512],
// //   tileSize: [512, 256],
//   minZoom: 1
// });

var tileGrid = new TileGrid({
  extent: [-180, -90, 180, 90],
  origin: [-180, 90],
//   resolutions: [360/512, 180/512, 90/512, 45/512, 22.5/512],
  resolutions: [360/512, 180/512, 90/512, 45/512  , 22.5/512],
  tileSizes: [[512, 256], [1024, 512], [1024, 1024], [1024, 1024], [1024, 1024]],
//   resolutions: [180/512, 90/512, 45/512],
//   tileSize: [1024, 1024],
//   minZoom: 2
});

const tiffTiles = new XYZ({
  url: 'https://s2downloads.eox.at/demo/EOxCloudless/2019/rgbnir_16bit/{z}/{y}/{x}.tif',
//   tileSize: [1024, 1024],
  tileGrid: tileGrid,
  projection: 'EPSG:4326',
});

// tcr, tcg, tcb = True Colour Red/Green/Blue
// nir = Near InfraRed
// These tiles are 16-bit 4-sample RGB+NIR geotiff
const tcr = new GlTiledTextureGeoTiffTiles( tiffTiles, GeoTIFF.fromUrl, 0, -999, "getTCR" );
const tcg = new GlTiledTextureGeoTiffTiles( tiffTiles, GeoTIFF.fromUrl, 1, -999, "getTCG" );
const tcb = new GlTiledTextureGeoTiffTiles( tiffTiles, GeoTIFF.fromUrl, 2, -999, "getTCB" );
const nir = new GlTiledTextureGeoTiffTiles( tiffTiles, GeoTIFF.fromUrl, 3, -999, "getNIR" );


const rgbnirShader = "#line 1                                   \n" +
"void main(void) {                                              \n" +
"	// Fetch texel values for different bands                     \n" +
"	// in the current texel coordinate (vTextureCoords.st)        \n" +
"	// These values are in ranges like 0..4000, and must be       \n" +
"	// normalized into the 0..1 range for display in GL.          \n" +
"	float tcr = getTCR(vTextureCoords.st);                        \n" +
"	float tcg = getTCG(vTextureCoords.st);                        \n" +
"	float tcb = getTCB(vTextureCoords.st);                        \n" +
"	float nir = getNIR(vTextureCoords.st);                        \n" +
"                                                               \n" +
" if (tcr < 30.) { gl_FragColor = vec4(0.0); } else              \n" +
" {                                                             \n" +
"	gl_FragColor = vec4(                                          \n" +
"    tcr / 4000.,                                               \n" +
"    tcg / 3000.,                                               \n" +
"    tcb / 2000.,                                               \n" +
"    1.0);                                                      \n" +
" }                                                             \n" +
"}                                                              \n";

// const rgbnirShader = `#line 1
// void main(void) {
// 	gl_FragColor = vec4(
//     vec3((vTextureCoords.s + vTextureCoords.t) / 2.),
//     .5);
// }
// `;

var glSource = new GlTiles({
	fragmentShader: rgbnirShader,
	textureSources: [ tcr, tcg, tcb, nir ],
	attributions: "<a href='https://s2maps.eu'>Sentinel-2 cloudless</a> by <a href='https://eox.at/'>EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2019)",
	uniforms: {},
//   tileSize: [1024, 1024],
// 	projection: epsg8357,
  projection: 'EPSG:4326',
  tileGrid: tileGrid
});



const map = new Map({
	layers: [
      new TileLayer({
    source: new TileWMS({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {
        'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
        'TILED': true,
      },
    }),
    opacity: 0.5
  }),

		new TileLayer({
			source: glSource,
      tileSize: [1024, 1024],
      tileGrid: tileGrid
		}),
	],
	target: 'map',
	view: new View({
    projection: 'EPSG:4326',
//     extent: [15.9906005859375, 45.9613037109375, 16.0894775390625, 46.0601806640625],
    center: [16, 46],
		zoom: 0
	})
});
