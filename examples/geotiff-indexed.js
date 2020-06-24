import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
// import {OSM, TileDebugAsync} from '../src/ol/source.js';
import {OSM, GlTiles} from '../src/ol/source.js';
import GlTiledTextureGeoTiff from '../src/ol/source/GlTiledTexture/GlTiledTextureGeoTiff.js';

import Projection from '../src/ol/proj/Projection.js';
import {register} from '../src/ol/proj/proj4.js';
import proj4 from 'proj4';

const geotiffTexture = new GlTiledTextureGeoTiff(
//   GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia_8bit.tiff'),
//   GeoTIFF.fromUrl('http://192.168.0.11/NA_NALCMS_2015_LC_30m_LAEA_mmu5pix_COG.tif'),
  GeoTIFF.fromUrl('http://192.168.0.80:5001/NA_NALCMS_2015_LC_30m_LAEA_mmu5pix_COG.tif'),
  0,  // sample, zero-indexed. This is a one-channel GeoTIFF, so sample is zero.
  0   // fillValue; in this case, "no data" is zero which means "sea level".
);



proj4.defs('SR-ORG:7314', '+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs');
register(proj4);

var lambert = new Projection({
  code: 'SR-ORG:7314',
    extent: [-9009954.605703328, -9009954.605703328,
    9009954.605703328, 9009954.605703328],
  worldExtent: [-179, -89.99, 179, 89.99]
});

var colours = [
   [0,0,0,0         ],
   [0,60,0,255      ],
   [147,156,111,255 ],
   [0,98,0,255      ],
   [30,171,5,255    ],
   [19,139,60,255   ],
   [92,117,43,255   ],
   [179,158,43,255  ],
   [179,137,51,255  ],
   [232,220,94,255  ],
   [224,207,137,255 ],
   [156,117,83,255  ],
   [185,211,143,255 ],
   [64,137,111,255  ],
   [107,162,137,255 ],
   [230,173,102,255 ],
   [168,171,173,255 ],
   [220,32,37,255   ],
   [75,111,162,255  ],
   [255,249,255,255 ],
].map(function(colour) {
  // Divide by 256 because the byte value is normalized
  return [colour[0]/256, colour[1]/256, colour[2]/256, colour[3]/256]
});


var glSource = new GlTiles({
        fragmentShader: `
    void main(void) {
      vec4 texelColour = texture2D(uTexture0, vec2(vTextureCoords.s, vTextureCoords.t));

      if (texelColour.x < (0.5 / 256.)) {
//         gl_FragColor = vec4(0.0);
        gl_FragColor = uColour0;
      }
      else if (texelColour.x < (1.5 / 256.)) { gl_FragColor = uColour1; }
      else if (texelColour.x < (2.5 / 256.)) { gl_FragColor = uColour2; }
      else if (texelColour.x < (3.5 / 256.)) { gl_FragColor = uColour3; }
      else if (texelColour.x < (4.5 / 256.)) { gl_FragColor = uColour4; }
      else if (texelColour.x < (5.5 / 256.)) { gl_FragColor = uColour5; }
      else if (texelColour.x < (6.5 / 256.)) { gl_FragColor = uColour6; }
      else if (texelColour.x < (7.5 / 256.)) { gl_FragColor = uColour7; }
      else if (texelColour.x < (8.5 / 256.)) { gl_FragColor = uColour8; }
      else if (texelColour.x < (9.5 / 256.)) { gl_FragColor = uColour9; }
      else if (texelColour.x < (10.5 / 256.)) { gl_FragColor = uColour10; }
      else if (texelColour.x < (11.5 / 256.)) { gl_FragColor = uColour11; }
      else if (texelColour.x < (12.5 / 256.)) { gl_FragColor = uColour12; }
      else if (texelColour.x < (13.5 / 256.)) { gl_FragColor = uColour13; }
      else if (texelColour.x < (14.5 / 256.)) { gl_FragColor = uColour14; }
      else if (texelColour.x < (15.5 / 256.)) { gl_FragColor = uColour15; }
      else if (texelColour.x < (16.5 / 256.)) { gl_FragColor = uColour16; }
      else if (texelColour.x < (17.5 / 256.)) { gl_FragColor = uColour17; }
      else if (texelColour.x < (18.5 / 256.)) { gl_FragColor = uColour18; }
      else if (texelColour.x < (19.5 / 256.)) { gl_FragColor = uColour19; }
      else {
        gl_FragColor = vec4(vec3(texelColour.r * 3.), 1.0);
      }

// 					gl_FragColor.rgb = min(vec3(1.) - texelElevation.xxx, texelColour.gbr);
//           gl_FragColor.a = 1.;
    }
    `,
        textureSources: [
          geotiffTexture
        ],
        uniforms: {
          uColour0: colours[0],
          uColour1: colours[1],
          uColour2: colours[2],
          uColour3: colours[3],
          uColour4: colours[4],
          uColour5: colours[5],
          uColour6: colours[6],
          uColour7: colours[7],
          uColour8: colours[8],
          uColour9: colours[9],
          uColour10: colours[10],
          uColour11: colours[11],
          uColour12: colours[12],
          uColour13: colours[13],
          uColour14: colours[14],
          uColour15: colours[15],
          uColour16: colours[16],
          uColour17: colours[17],
          uColour18: colours[18],
          uColour19: colours[19],
        }
      });

const map = new Map({
  layers: [
        new TileLayer({
          source: new OSM()
        }),

    new TileLayer({
      source: glSource
    })
  ],
  target: 'map',
  view: new View({
    projection: lambert,
    center: [0, 0],
    zoom: 12
  })
});


colours.forEach(function(c, i){
  console.log(c, i);
  var el = document.createElement('input');
  el.setAttribute('type', 'color');

  var hexColour = '#' +
    (c[0] * 256).toString(16).padStart(2,0) +
    (c[1] * 256).toString(16).padStart(2,0) +
    (c[2] * 256).toString(16).padStart(2,0);

  el.setAttribute('value', hexColour);

  el.addEventListener('input', function(ev) {
    console.log(i, ev.target.value);
    var r = parseInt(ev.target.value.substring(1,3), 16) / 256;
    var g = parseInt(ev.target.value.substring(3,5), 16) / 256;
    var b = parseInt(ev.target.value.substring(5,7), 16) / 256;
    glSource.setUniform('uColour' + i, [r, g, b, 1]);
  });

  document.getElementById('colour-pickers').appendChild(el);
})





