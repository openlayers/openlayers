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
const float pi = 3.1415926535897932384626433832795;

void main(void) {
  // Fetch data from texture source 0 using the named GLSL function
  // (which has been set up in the GlTiledTexture)
  float elevation = getElevation(vTextureCoords.st);

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

  // The format of the data table for the colour stops is: R,G,B,elevation (in meters)
  vec4 colours[6];
  colours[0] = vec4(0., 0., 0., -10.);
  colours[1] = vec4(.2, .2, .5, -.01);
  colours[2] = vec4(.4, .55, .3, .01);
  colours[3] = vec4(.9, .9, .6, 500.);
  colours[4] = vec4(.6, .4, .3, 2000.);
  colours[5] = vec4(1., 1., 1., 4000.);

  vec4 tintColour = colours[0];
  for (int i=0; i < 5; i++) {
    // Do a smoothstep of the heights between steps. If the result is > 0
    // (meaning "the height is higher than the lower bound of this step"),
    // then replace the colour with a linear blend of the step.
    // If the result is 1, this means that the real colour will be applied
    // in a later loop.

    tintColour.rgb = mix(
      tintColour.rgb,
      colours[i+1].rgb,
      smoothstep( colours[i].a, colours[i+1].a, elevation )
    );
  }

  gl_FragColor = vec4(tintColour.rgb * (1. + cosIncidence - uSinSunElevation), 1.);

  // Special case for zero elevation, since GPUs seems to handle this particular
  // colour differently when using mix(), for whatever low-level reason.
  if (elevation > -.001 && elevation < .001) {
    gl_FragColor = vec4(colours[1].rgb, 1.);
  }
}
`;

var glSource = new GlTiles({
	fragmentShader: reliefShader,
	textureSources: [
    terrainTexture,
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
    center: fromLonLat([-5, 40]),
    maxZoom: 16,
    zoom: 5,
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




