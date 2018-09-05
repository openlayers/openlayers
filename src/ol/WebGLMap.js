/**
 * @module ol/WebGLMap
 */
import PluggableMap from './PluggableMap.js';
import {defaults as defaultControls} from './control.js';
import {defaults as defaultInteractions} from './interaction.js';
import {assign} from './obj.js';
import WebGLImageLayerRenderer from './renderer/webgl/ImageLayer.js';
import WebGLMapRenderer from './renderer/webgl/Map.js';
import WebGLTileLayerRenderer from './renderer/webgl/TileLayer.js';
import WebGLVectorLayerRenderer from './renderer/webgl/VectorLayer.js';


/**
 * @classdesc
 * The WebGLMap uses WebGL for rendering map layers.  This renderer has limited
 * support for vector data and no support for vector tiles.
 *
 *     import WebGLMap from 'ol/WebGLMap';
 *     import TileLayer from 'ol/layer/Tile';
 *     import OSM from 'ol/source/OSM';
 *     import View from 'ol/View';
 *
 *     var map = new WebGLMap({
 *       view: new View({
 *         center: [0, 0],
 *         zoom: 1
 *       }),
 *       layers: [
 *         new TileLayer({
 *           source: new OSM()
 *         })
 *       ],
 *       target: 'map'
 *     });
 *
 * The above snippet creates a map using a {@link module:ol/layer/Tile~Tile} to
 * display {@link module:ol/source/OSM~OSM} OSM data and render it to a DOM
 * element with the id `map`.
 *
 * The constructor places a viewport container (with CSS class name
 * `ol-viewport`) in the target element (see `getViewport()`), and then two
 * further elements within the viewport: one with CSS class name
 * `ol-overlaycontainer-stopevent` for controls and some overlays, and one with
 * CSS class name `ol-overlaycontainer` for other overlays (see the `stopEvent`
 * option of {@link module:ol/Overlay~Overlay} for the difference). The map
 * itself is placed in a further element within the viewport.
 *
 * Layers are stored as a {@link module:ol/Collection~Collection} in
 * layerGroups. A top-level group is provided by the library. This is what is
 * accessed by `getLayerGroup` and `setLayerGroup`. Layers entered in the
 * options are added to this group, and `addLayer` and `removeLayer` change the
 * layer collection in the group. `getLayers` is a convenience function for
 * `getLayerGroup().getLayers()`.
 * Note that {@link module:ol/layer/Group~Group} is a subclass of
 * {@link module:ol/layer/Base}, so layers entered in the options or added
 * with `addLayer` can be groups, which can contain further groups, and so on.
 *
 * @fires import("./MapBrowserEvent.js").MapBrowserEvent
 * @fires import("./MapEvent.js").MapEvent
 * @fires module:ol/render/Event~RenderEvent#postcompose
 * @fires module:ol/render/Event~RenderEvent#precompose
 * @api
 */
class WebGLMap extends PluggableMap {

  /**
   * @param {import("./PluggableMap.js").MapOptions} options Map options.
   */
  constructor(options) {
    options = assign({}, options);
    if (!options.controls) {
      options.controls = defaultControls();
    }
    if (!options.interactions) {
      options.interactions = defaultInteractions();
    }

    super(options);
  }

  createRenderer() {
    const renderer = new WebGLMapRenderer(this);
    renderer.registerLayerRenderers([
      WebGLImageLayerRenderer,
      WebGLTileLayerRenderer,
      WebGLVectorLayerRenderer
    ]);
    return renderer;
  }
}


export default WebGLMap;
