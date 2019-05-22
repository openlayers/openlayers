/**
 * @module ol/format/OSMXML
 */
// FIXME add typedef for stack state objects
import {extend} from '../array.js';
import Feature from '../Feature.js';
import {transformGeometryWithOptions} from './Feature.js';
import XMLFeature from './XMLFeature.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {isEmpty} from '../obj.js';
import {get as getProjection} from '../proj.js';
import {pushParseAndPop, makeStructureNS} from '../xml.js';


/**
 * @const
 * @type {Array<null>}
 */
const NAMESPACE_URIS = [null];


/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const WAY_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'nd': readNd,
    'tag': readTag
  });


/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'node': readNode,
    'way': readWay
  });


/**
 * @classdesc
 * Feature format for reading data in the
 * [OSMXML format](http://wiki.openstreetmap.org/wiki/OSM_XML).
 *
 * @api
 */
class OSMXML extends XMLFeature {
  constructor() {
    super();

    /**
     * @inheritDoc
     */
    this.dataProjection = getProjection('EPSG:4326');
  }

  /**
   * @inheritDoc
   */
  readFeaturesFromNode(node, opt_options) {
    const options = this.getReadOptions(node, opt_options);
    if (node.localName == 'osm') {
      const state = pushParseAndPop({
        nodes: {},
        ways: [],
        features: []
      }, PARSERS, node, [options]);
      // parse nodes in ways
      for (let j = 0; j < state.ways.length; j++) {
        const values = /** @type {Object} */ (state.ways[j]);
        /** @type {Array<number>} */
        const flatCoordinates = [];
        for (let i = 0, ii = values.ndrefs.length; i < ii; i++) {
          const point = state.nodes[values.ndrefs[i]];
          extend(flatCoordinates, point);
        }
        let geometry;
        if (values.ndrefs[0] == values.ndrefs[values.ndrefs.length - 1]) {
          // closed way
          geometry = new Polygon(flatCoordinates, GeometryLayout.XY, [flatCoordinates.length]);
        } else {
          geometry = new LineString(flatCoordinates, GeometryLayout.XY);
        }
        transformGeometryWithOptions(geometry, false, options);
        const feature = new Feature(geometry);
        feature.setId(values.id);
        feature.setProperties(values.tags, true);
        state.features.push(feature);
      }
      if (state.features) {
        return state.features;
      }
    }
    return [];
  }

}


/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const NODE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'tag': readTag
  });


/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readNode(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);
  const state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const id = node.getAttribute('id');
  /** @type {import("../coordinate.js").Coordinate} */
  const coordinates = [
    parseFloat(node.getAttribute('lon')),
    parseFloat(node.getAttribute('lat'))
  ];
  state.nodes[id] = coordinates;

  const values = pushParseAndPop({
    tags: {}
  }, NODE_PARSERS, node, objectStack);
  if (!isEmpty(values.tags)) {
    const geometry = new Point(coordinates);
    transformGeometryWithOptions(geometry, false, options);
    const feature = new Feature(geometry);
    feature.setId(id);
    feature.setProperties(values.tags, true);
    state.features.push(feature);
  }
}


/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readWay(node, objectStack) {
  const id = node.getAttribute('id');
  const values = pushParseAndPop({
    id: id,
    ndrefs: [],
    tags: {}
  }, WAY_PARSERS, node, objectStack);
  const state = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  state.ways.push(values);
}


/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readNd(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.ndrefs.push(node.getAttribute('ref'));
}


/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function readTag(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values.tags[node.getAttribute('k')] = node.getAttribute('v');
}


export default OSMXML;
