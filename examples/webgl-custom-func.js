import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';

import DataTileSource from '../src/ol/source/DataTile.js';
import {fromLonLat} from '../src/ol/proj.js';

// 16-bit COG
// Which will be served as NumpyTiles.
const COG =
  'https://storage.googleapis.com/open-cogs/stac-examples/20201211_223832_CS2_analytic.tif';

function numpyTileLoader(z, x, y) {
  const url = `https://api.cogeo.xyz/cog/tiles/WebMercatorQuad/${z}/${x}/${y}@1x?format=npy&url=${encodeURIComponent(
    COG
  )}`;

  return fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buffer) => NumpyLoader.fromArrayBuffer(buffer)) // eslint-disable-line no-undef
    .then((numpyData) => {
      // flatten the numpy data
      const dataTile = new Float32Array(256 * 256 * 5);
      const bandSize = 256 * 256;
      for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
          const px = x + y * 256;
          dataTile[px * 5 + 0] = numpyData.data[y * 256 + x];
          dataTile[px * 5 + 1] = numpyData.data[bandSize + y * 256 + x];
          dataTile[px * 5 + 2] = numpyData.data[bandSize * 2 + y * 256 + x];
          dataTile[px * 5 + 3] = numpyData.data[bandSize * 3 + y * 256 + x];
          dataTile[px * 5 + 4] =
            numpyData.data[bandSize * 4 + y * 256 + x] > 0 ? 1.0 : 0;
        }
      }
      return dataTile;
    });
}

const BLUR = `

vec4 scaleColor(in vec4 clr) {
  vec4 n = clr;
  n /= 18000.0;
  return n;
}

vec4 blur(in float doBlur, in float alpha) {
  vec4 out_color = vec4(0.0, 0.0, 0.0, 0.0);
  vec2 px_coord;
  vec4 color0;
  vec4 color1;

  if (doBlur == 0.0) {
    color0 = texture2D(u_tileTexture0, v_textureCoord);
    color1 = texture2D(u_tileTexture1, v_textureCoord);
    out_color = scaleColor(vec4(color0.b, color0.g, color0.r, color1.r));
    out_color.a = alpha;
  }

  if (doBlur > 0.0 && alpha > 0.0) {
    float n_px = 0.0;
    for (float ky = -0.02; ky < 0.02; ky += 0.001) {
      for (float kx = -0.02; kx < 0.02; kx += 0.001) {
        px_coord.x = v_textureCoord.x + kx;
        px_coord.y = v_textureCoord.y + ky;
        color0 = texture2D(u_tileTexture0, px_coord);
        color1 = texture2D(u_tileTexture1, px_coord);
        if (color1.r > 0.0) {
          out_color.r += color0.r;
          out_color.g += color0.g;
          out_color.b += color0.b;
          n_px += 1.0;
        }
      }
    }
    out_color /= n_px;
    out_color = scaleColor(out_color);
    // swap the red and blue bands
    out_color.rb = out_color.br;
    out_color.a = alpha;
  }

  return out_color;
}
`;

const numpyLayer = new TileLayer({
  style: {
    color: ['func', 'blur', ['var', 'doBlur'], ['band', 5]],
    variables: {
      'doBlur': 0.0,
    },
    functions: [BLUR],
  },
  source: new DataTileSource({
    loader: numpyTileLoader,
    bandCount: 5,
  }),
});

const map = new Map({
  target: 'map',
  layers: [numpyLayer],
  view: new View({
    center: fromLonLat([172.933, 1.3567]),
    zoom: 15,
  }),
});

const inputBlur = document.getElementById('set-blur');

inputBlur.addEventListener('change', (evt) => {
  numpyLayer.updateStyleVariables({
    'doBlur': evt.target.checked ? 1.0 : 0.0,
  });
});

inputBlur.checked = false;
