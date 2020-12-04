import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
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
const float pxSize = 1./512.;

void main(void) {
  // Fetch data from texture source 0 using the named GLSL function
  // (which has been set up in the GlTiledTexture)
  float elevationNorth = getElevation(vTextureCoords.st + vec2(0., pxSize));
  float elevationSouth = getElevation(vTextureCoords.st + vec2(0., -pxSize));
  float elevationEast = getElevation(vTextureCoords.st + vec2(pxSize, 0.));
  float elevationWest = getElevation(vTextureCoords.st + vec2(-pxSize, 0.));

  float deltaSN = (elevationNorth - elevationSouth) * uVerticalExaggeration * pxSize;
  float deltaWE = (elevationWest - elevationEast) * uVerticalExaggeration * pxSize;

  // Both 'slope' and 'aspect' are in the range of -pi/2 to pi/2
  float slope = atan( length( vec2(deltaSN, deltaWE)) );
  float aspect = atan( deltaSN, deltaWE );

  float cosIncidence =
    uSinSunElevation * cos(slope) +
    uCosSunElevation * sin(slope) * cos( uSunAzimuth - aspect ) ;

  // This would output a shaded relief grayscale raster
  //gl_FragColor = vec4(vec3(cosIncidence), 1.);

  // ...but instead, let's fetch the OSM basemap and *modify* it
  // (because modifying the base map looks better than overlaying
  // a 0.3-opacity shaded relief)
  // The modification is naïve: the RGB values of the OSM texture get
  // multiplied by a factor that depends on the indicence on the pixel,
  // and the "neutral" incidence (given by uSinSunElevation), so that
  // "flat" pixels don't get modified at all.
  vec4 osmTexel = texture2D(uTexture1, vTextureCoords.st) ;
  gl_FragColor = vec4(osmTexel.rgb * (1. + cosIncidence - uSinSunElevation), osmTexel.a);
}
`;

var glSource = new GlTiles({
	fragmentShader: reliefShader,
	textureSources: [
    terrainTexture,
    new OSM()
  ],
	attributions: 'Terrain-RGB data by <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
	uniforms: {
    uVerticalExaggeration: 1,
//     uSunElevation: 45,
    uSinSunElevation: Math.sin( 45 * Math.PI / 180),
    uCosSunElevation: Math.cos( 45 * Math.PI / 180),
    uSunAzimuth: 45 * Math.PI / 180
  },
  tileSize: 512,
  maxZoom: 10
});


const map = new Map({
	layers: [
		new TileLayer({
			source: glSource,
		})
	],
	target: 'map',
  view: new View({
    center: [-13615645, 4497969],
    maxZoom: 12,
    zoom: 7,
  }),
});



const sliderExaggeration = document.getElementById('vert');
sliderExaggeration.addEventListener('input', function(){
  glSource.setUniform('uVerticalExaggeration', sliderExaggeration.value);
  document.getElementById('vertOut').innerText = sliderExaggeration.value;
});

const sliderSunEl = document.getElementById('sunEl');
sliderSunEl.addEventListener('input', function(){
  glSource.setUniform('uSinSunElevation', Math.sin(sliderSunEl.value * Math.PI / 180), false);
  glSource.setUniform('uCosSunElevation', Math.cos(sliderSunEl.value * Math.PI / 180));
  document.getElementById('sunElOut').innerText = sliderSunEl.value;
});

const sliderSunAz = document.getElementById('sunAz');
sliderSunAz.addEventListener('input', function(){
  glSource.setUniform('uSunAzimuth', sliderSunAz.value * Math.PI / 180);
  document.getElementById('sunAzOut').innerText = sliderSunAz.value;
});




