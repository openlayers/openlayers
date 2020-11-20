import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
// import {OSM, TileDebugAsync} from '../src/ol/source.js';
import {OSM, GlTiles} from '../src/ol/source.js';
import GlTiledTextureGeoTiff from '../src/ol/source/GlTiledTexture/GlTiledTextureGeoTiff.js';

import Projection from '../src/ol/proj/Projection.js';
import {register} from '../src/ol/proj/proj4.js';
import MousePosition from '../src/ol/control/MousePosition';
import {createStringXY} from '../src/ol/coordinate';
import {defaults as defaultControls} from '../src/ol/control';

// import proj4 from 'proj4';


// Create geotiff.js instances
// See https://s2downloads.eox.at/demo/Sentinel-2/README.txt for info about procedence of the data
// Note that just creating the geotiff.js instances requests just the GeoTIFF
// metadata, but doesn't request any raster data.
const geotiffTCI = GeoTIFF.fromUrl('https://s2downloads.eox.at/demo/Sentinel-2/3857/TCI.tif');
const geotiff60m = GeoTIFF.fromUrl('https://s2downloads.eox.at/demo/Sentinel-2/3857/R60m.tif');
const geotiff20m = GeoTIFF.fromUrl('https://s2downloads.eox.at/demo/Sentinel-2/3857/R20m.tif');
const geotiff10m = GeoTIFF.fromUrl('https://s2downloads.eox.at/demo/Sentinel-2/3857/R10m.tif');


// Create GlTiledTextureGeoTiff instances from each geotiff - one per sample ("image channel")
// Second parameter is the (0-indexed) sample number. The meaning of each sample depends on how
//  the GeoTIFF was built.
// Third parameter is the value for the "no data" pixels"
// Fourth parameter is the name of a GLSL function to fetch the data

// tcr, tcg, tcb = True Colour Red/Green/Blue
// This is a 8-bit 3-sample RGB geotiff
const tcr = new GlTiledTextureGeoTiff( geotiffTCI, 0, 0, "getTCR" );
const tcg = new GlTiledTextureGeoTiff( geotiffTCI, 1, 0, "getTCG" );
const tcb = new GlTiledTextureGeoTiff( geotiffTCI, 2, 0, "getTCB" );

// Bands from the 10m GeoTIFF file
// This is a Uint16, 4-sample file (b2,b3,b4,b8); pixels with no data get the value 65535.
const b2  = new GlTiledTextureGeoTiff( geotiff10m, 0, 65535, "getB2" );
const b3  = new GlTiledTextureGeoTiff( geotiff10m, 1, 65535, "getB3" );
const b4  = new GlTiledTextureGeoTiff( geotiff10m, 2, 65535, "getB4" );
const b8  = new GlTiledTextureGeoTiff( geotiff10m, 3, 65535, "getB8" );

// Bands from the 20m GeoTIFF file
// This is a Uint16, 10-sample file (b2,b3,b4,b5,b6,b7,b8,b11,b12,b8a);
// pixels with no data get the value 65535.
const b5  = new GlTiledTextureGeoTiff( geotiff20m, 3, 65535, "getB5" );
const b6  = new GlTiledTextureGeoTiff( geotiff20m, 4, 65535, "getB6" );
const b7  = new GlTiledTextureGeoTiff( geotiff20m, 5, 65535, "getB7" );
const b11 = new GlTiledTextureGeoTiff( geotiff20m, 7, 65535, "getB11" );
const b12 = new GlTiledTextureGeoTiff( geotiff20m, 8, 65535, "getB12" );
const b8a = new GlTiledTextureGeoTiff( geotiff20m, 9, 65535, "getB8A" );

// Bands from the 60m GeoTIFF file
// This is a Uint16, 12-sample file (b1,b2,b3,b4,b5,b6,b7,b8,b9,b11,b12,b8a);
// pixels with no data get the value 65535.
const b1  = new GlTiledTextureGeoTiff( geotiff60m, 0, 65535, "getB1" );
const b9  = new GlTiledTextureGeoTiff( geotiff60m, 8, 65535, "getB9" );


const ndvwiShader = "#line 1                                    \n" +
"void main(void) {                                              \n" +
"	// Fetch texel values for different bands                     \n" +
"	// in the current texel coordinate (vTextureCoords.st)        \n" +
"	float b4 = getB4(vTextureCoords.st);                          \n" +
"	float b8 = getB8(vTextureCoords.st);                          \n" +
"	float b9 = getB9(vTextureCoords.st);                          \n" +
"                                                               \n" +
"	if (b4 >= 65535.) {                                           \n" +
"		gl_FragColor = vec4(0.);                                    \n" +
"	} else {                                                      \n" +
"		highp float ndvi = ((b8 - b4) / (b8 + b4));                 \n" +
"		highp float ndwi = ((b9 - b4) / (b9 + b4));                 \n" +
"		gl_FragColor = vec4(abs(ndvi-ndwi), ndvi, ndwi, 1.0);       \n" +
"	}                                                             \n" +
"}                                                              \n";

var glSource = new GlTiles({
// 	projection: epsg8357,
	fragmentShader: ndvwiShader,
	textureSources: [
		// This GlTiles source shall use only three texture sources.
		// Including more textures here *will* request more data,
		// even if the data isn't used in the shader.
		b4, b8, b9
	],
	attributions: "<a href='https://s2maps.eu'>Sentinel-2 cloudless</a> by <a href='https://eox.at/'>EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2019)",
	uniforms: {}
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
			opacity: 0.5
		}),
		new TileLayer({
			source: glSource,
		})
	],
	target: 'map',
	view: new View({
// 		projection: epsg3035,
		center: [ 1900000,6100000],
		zoom: 15
	})
});


/*
var fragmentCodeMirror = CodeMirror.fromTextArea(document.getElementById('fragmentShaderCode'), {
	mode: "glsl",
// 	mode: "javascript",
	lineNumbers: true,
	lineWrapping: true,
	firstLineNumber: 1,
	viewportMargin: 20,
});

fragmentCodeMirror.setValue( nvdiShader );
fragmentCodeMirror.on('change', debounce(redo, 250));


function debounce(callback, interval) {
  let debounceTimeoutId;

  return function(...args) {
    clearTimeout(debounceTimeoutId);
    debounceTimeoutId = setTimeout(() => callback.apply(this, args), interval);
  };
}


function redo(){
	console.warn("Recompiling shader");
// 	document.getElementById('shader-display').value = glSource.fragmentShader;
	glSource.fragmentShader = "#line 1\n" + fragmentCodeMirror.getValue();

	glSource._fetchFuncDefs.then((defs)=>{
		try {
			glSource.loadGLProgram_(defs);
		} catch(ex) {
			document.getElementById('error-modal').innerHTML = ex;
			document.getElementById('error-modal').style.display = 'block';
			return;
		}
		document.getElementById('error-modal').style.display = 'none';
		glSource.reRender();
	});
}



import presetShaders from './shaders/index.js';

const presetSelector = document.getElementById("presets");
for (let name of Object.keys(presetShaders)) {
	const option = document.createElement("option");
	option.innerHTML = name;
	option.value = name;
	presetSelector.appendChild(option);
}

presetSelector.addEventListener('change', function(ev){
	if (ev.target.value) {
		fragmentCodeMirror.setValue( presetShaders[ev.target.value] );
	}
});*/








