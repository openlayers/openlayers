import * as zarr from 'zarrita';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import DataTileSource from '../src/ol/source/DataTile.js';
import {parseTileMatrixSet} from '../src/ol/source/ogcTileUtil.js';

/**
 * @typedef {Object} Options
 * @property {string} url The Zarr URL.
 * @property {string} group The group with arrays to render.
 * @property {import("../proj.js").ProjectionLike} [projection] Source projection.  If not provided, the GeoTIFF metadata
 * will be read for projection information.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 */

class GeoZarr extends DataTileSource {
  /**
   * @param {Options} options The options.
   */
  constructor(options) {
    super({
      state: 'loading',
      tileGrid: null,
      projection: options.projection || null,
      transition: options.transition,
      wrapX: options.wrapX,
    });

    /**
     * @type {string}
     */
    this.url_ = options.url;

    /**
     * @type {string}
     */
    this.group_ = options.group;

    /**
     * @type {Error|null}
     */
    this.error_ = null;

    this.configure_()
      .then(() => {
        this.setState('ready');
      })
      .catch((err) => {
        this.error_ = err;
        this.setState('error');
      });
  }

  async configure_() {
    const store = new zarr.FetchStore(this.url_);

    const node = await zarr.open(store);
    const group = await zarr.open(node.resolve(this.group_));

    /**
     * @type {import('../src/ol/source/ogcTileUtil.js').SourceInfo}
     */
    const sourceInfo = {};

    const tileMatrixSet = group.attrs.multiscales.tile_matrix_set;
    try {
      const {grid, projection} = parseTileMatrixSet(sourceInfo, tileMatrixSet);
      console.log(grid, projection);
    } catch (err) {
      console.error(err);
    }
  }
}

const map = new Map({
  layers: [
    new TileLayer({
      style: {
        color: [
          ['band', 'b02'],
          ['band', 'b08'],
          ['band', 'b04'],
        ],
      },
      source: new GeoZarr({
        url: 'http://localhost:3000/s2l2_test.zarr',
        group: 'measurements/reflectance/r20m',
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
