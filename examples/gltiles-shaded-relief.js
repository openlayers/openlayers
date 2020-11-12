import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
// import {OSM, TileDebugAsync} from '../src/ol/source.js';
import {OSM, GlTiles, XYZ} from '../src/ol/source.js';
import GlTiledTextureTerrainRGB from '../src/ol/source/GlTiledTexture/GlTiledTextureTerrainRGB.js';

import Projection from '../src/ol/proj/Projection.js';
import {register} from '../src/ol/proj/proj4.js';
import MousePosition from '../src/ol/control/MousePosition';
import {createStringXY} from '../src/ol/coordinate';
import {defaults as defaultControls} from '../src/ol/control';
import {fromLonLat} from '../src/ol/proj.js';


// This MapTiler API key is only valid for the OpenLayers examples page
// Get your own!!
const key = 'F0p8KPTwWvEEc5jKmckC';

const elevation = new XYZ({
  url: 'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
  crossOrigin: 'anonymous',
  tileSize: 512,
});

const terrainTexture = new GlTiledTextureTerrainRGB(elevation, "getElevation");

const reliefShader = `
void main(void) {
  float elevation = getElevation(vTextureCoords.st);
  float brightness = smoothstep(0., 700., elevation);
  gl_FragColor = vec4(vec3(brightness), 1.);
//   gl_FragColor = vec4(vec3(elevation / 700.), 1.);
//   gl_FragColor = texture2D(uTexture0, vTextureCoords.st);
//   gl_FragColor = vec4(texture2D(uTexture0, vTextureCoords.st).rgb, 1.);
}
`;

var glSource = new GlTiles({
	fragmentShader: reliefShader,
	textureSources: [
		terrainTexture
	],
	attributions: 'Terrain-RGB data by <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
	uniforms: {},
  tileSize: 512,
});



const map = new Map({
// 	controls: defaultControls().extend([mousePositionControl]),
	layers: [
// 		new TileLayer({
// 			source: new OSM(),
// 			opacity: 0.3
// 		}),
		new TileLayer({
			source: glSource,
		})
	],
	target: 'map',
  view: new View({
    center: fromLonLat([-122.3267, 37.8377]),
    zoom: 11,
//     extent: [-13675026, 4439648, -13580856, 4580292],
//     center: [-13615645, 4497969],
//     minZoom: 10,
//     maxZoom: 16,
//     zoom: 13,
  }),
});







