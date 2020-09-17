import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
// import {OSM, TileDebugAsync} from '../src/ol/source.js';
import {OSM, GlTiles} from '../src/ol/source.js';
import GlTiledTextureGeoTiff from '../src/ol/source/GlTiledTexture/GlTiledTextureGeoTiff.js';
// import GlTiledTextureNoise from '../src/ol/source/GlTiledTexture/GlTiledTextureNoise.js';


const fragShaderCode = `
    void main(void) {
      vec4 texelColour = texture2D(uTexture0, vTextureCoords.st);
//           gl_FragColor = vec4(texelColour.gbr, 1.0);
      gl_FragColor = vec4(texelColour.rg, texelColour.b * 1.1, 1.0);

      // Obsolete: use the getElevation() function now
//       vec4 texelElevation = texture2D(uTexture1, vTextureCoords.st);
//       /// FIXME: careful with 8-bit RGBA vs 16-bit LUMINANCE_ALPHA packing!!!
//       float elevation = texelElevation.x + texelElevation.a * 256.;

      float elevation = getElevation(vTextureCoords.st);

      if (elevation > 0.) {

        vec4 colours[5];
        colours[0] = vec4(.0, .0, .8, 0.);
        colours[1] = vec4(.4, .55, .3, 0.01);
        colours[2] = vec4(.9, .9, .6, 150.);
        colours[3] = vec4(.6, .4, .3, 700.);
        colours[4] = vec4(1., 1., 1., 4000.);

        // Init pixel color to first stop, to get the blending right.
        vec4 pixelColor = colours[0];

        for (int i=0; i < 4; i++) {
          // Do a smoothstep of the heights between steps. If the result is > 0
          // (meaning "the height is higher than the lower bound of this step"),
          // then replace the colour with a linear blend of the step.
          // If the result is 1, this means that the real colour will be applied
          // in a later loop.

          pixelColor.rgb = mix(
            pixelColor.rgb,
            colours[i+1].rgb,
            smoothstep( colours[i].a, colours[i+1].a, elevation * 256.)
          );
        }

        gl_FragColor.rgb = pixelColor.rgb;
      }

      //gl_FragColor.rgb = min(vec3(1.) - texelElevation.xxx, texelColour.gbr);
//       gl_FragColor.rgb = texelElevation.rga * 200.;

      gl_FragColor.a = 1.;
    }
    `;

const geotiffTexture = new GlTiledTextureGeoTiff(
//   GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia-Byte-noCOG.tiff'),
//   GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia-Byte-COG.tiff'),
//   GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia-Int16-noCOG.tiff'),
  GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia-Int16-COG.tiff'),
//   GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia-Float32-noCOG.tiff'),
//   GeoTIFF.fromUrl('data/geotiff/PNOA_MDT200_EPSG3857_Valencia-Float32-COG.tiff'),
  0,  // sample, zero-indexed. This is a one-channel GeoTIFF, so sample is zero.
  0,  // fillValue; in this case, "no data" is zero which means "sea level".
  "getElevation"
);

const map = new Map({
  layers: [
    new TileLayer({
      source: new GlTiles({
        fragmentShader: fragShaderCode,
        textureSources: [
          new OSM(),
          geotiffTexture,
        ]
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 4800000],
    zoom: 7
  })
});

