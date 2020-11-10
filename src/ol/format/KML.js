/**
 * @module ol/format/KML
 */
import Feature from '../Feature.js';
import Fill from '../style/Fill.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import Icon from '../style/Icon.js';
import IconAnchorUnits from '../style/IconAnchorUnits.js';
import IconOrigin from '../style/IconOrigin.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import Stroke from '../style/Stroke.js';
import Style from '../style/Style.js';
import Text from '../style/Text.js';
import XMLFeature from './XMLFeature.js';
import {
  OBJECT_PROPERTY_NODE_FACTORY,
  XML_SCHEMA_INSTANCE_URI,
  createElementNS,
  getAllTextContent,
  isDocument,
  makeArrayExtender,
  makeArrayPusher,
  makeChildAppender,
  makeObjectPropertySetter,
  makeReplacer,
  makeSequence,
  makeSimpleNodeFactory,
  makeStructureNS,
  parse,
  parseNode,
  pushParseAndPop,
  pushSerializeAndPop,
} from '../xml.js';
import {asArray} from '../color.js';
import {assert} from '../asserts.js';
import {extend, includes} from '../array.js';
import {get as getProjection} from '../proj.js';
import {
  readBoolean,
  readDecimal,
  readString,
  writeBooleanTextNode,
  writeCDATASection,
  writeDecimalTextNode,
  writeStringTextNode,
} from './xsd.js';
import {toRadians} from '../math.js';
import {transformGeometryWithOptions} from './Feature.js';

/**
 * @typedef {Object} Vec2
 * @property {number} x
 * @property {import("../style/IconAnchorUnits").default} xunits
 * @property {number} y
 * @property {import("../style/IconAnchorUnits").default} yunits
 * @property {import("../style/IconOrigin.js").default} origin
 */

/**
 * @typedef {Object} GxTrackObject
 * @property {Array<number>} flatCoordinates
 * @property {Array<number>} whens
 */

/**
 * @const
 * @type {Array<string>}
 */
const GX_NAMESPACE_URIS = ['http://www.google.com/kml/ext/2.2'];

/**
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [
  null,
  'http://earth.google.com/kml/2.0',
  'http://earth.google.com/kml/2.1',
  'http://earth.google.com/kml/2.2',
  'http://www.opengis.net/kml/2.2',
];

/**
 * @const
 * @type {string}
 */
const SCHEMA_LOCATION =
  'http://www.opengis.net/kml/2.2 ' +
  'https://developers.google.com/kml/schema/kml22gx.xsd';

/**
 * @type {Object<string, import("../style/IconAnchorUnits").default>}
 */
const ICON_ANCHOR_UNITS_MAP = {
  'fraction': IconAnchorUnits.FRACTION,
  'pixels': IconAnchorUnits.PIXELS,
  'insetPixels': IconAnchorUnits.PIXELS,
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const PLACEMARK_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'ExtendedData': extendedDataParser,
    'Region': regionParser,
    'MultiGeometry': makeObjectPropertySetter(readMultiGeometry, 'geometry'),
    'LineString': makeObjectPropertySetter(readLineString, 'geometry'),
    'LinearRing': makeObjectPropertySetter(readLinearRing, 'geometry'),
    'Point': makeObjectPropertySetter(readPoint, 'geometry'),
    'Polygon': makeObjectPropertySetter(readPolygon, 'geometry'),
    'Style': makeObjectPropertySetter(readStyle),
    'StyleMap': placemarkStyleMapParser,
    'address': makeObjectPropertySetter(readString),
    'description': makeObjectPropertySetter(readString),
    'name': makeObjectPropertySetter(readString),
    'open': makeObjectPropertySetter(readBoolean),
    'phoneNumber': makeObjectPropertySetter(readString),
    'styleUrl': makeObjectPropertySetter(readStyleURL),
    'visibility': makeObjectPropertySetter(readBoolean),
  },
  makeStructureNS(GX_NAMESPACE_URIS, {
    'MultiTrack': makeObjectPropertySetter(readGxMultiTrack, 'geometry'),
    'Track': makeObjectPropertySetter(readGxTrack, 'geometry'),
  })
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const NETWORK_LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'ExtendedData': extendedDataParser,
  'Region': regionParser,
  'Link': linkParser,
  'address': makeObjectPropertySetter(readString),
  'description': makeObjectPropertySetter(readString),
  'name': makeObjectPropertySetter(readString),
  'open': makeObjectPropertySetter(readBoolean),
  'phoneNumber': makeObjectPropertySetter(readString),
  'visibility': makeObjectPropertySetter(readBoolean),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'href': makeObjectPropertySetter(readURI),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const REGION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'LatLonAltBox': latLonAltBoxParser,
  'Lod': lodParser,
});

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const KML_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['Document', 'Placemark']);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const KML_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'Document': makeChildAppender(writeDocument),
  'Placemark': makeChildAppender(writePlacemark),
});

/**
 * @type {import("../color.js").Color}
 */
let DEFAULT_COLOR;

/**
 * @type {Fill}
 */
let DEFAULT_FILL_STYLE = null;

/**
 * Get the default fill style (or null if not yet set).
 * @return {Fill} The default fill style.
 */
export function getDefaultFillStyle() {
  return DEFAULT_FILL_STYLE;
}

/**
 * @type {import("../size.js").Size}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR;

/**
 * @type {import("../style/IconAnchorUnits").default}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;

/**
 * @type {import("../style/IconAnchorUnits").default}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;

/**
 * @type {import("../size.js").Size}
 */
let DEFAULT_IMAGE_STYLE_SIZE;

/**
 * @type {string}
 */
let DEFAULT_IMAGE_STYLE_SRC;

/**
 * @type {number}
 */
let DEFAULT_IMAGE_SCALE_MULTIPLIER;

/**
 * @type {import("../style/Image.js").default}
 */
let DEFAULT_IMAGE_STYLE = null;

/**
 * Get the default image style (or null if not yet set).
 * @return {import("../style/Image.js").default} The default image style.
 */
export function getDefaultImageStyle() {
  return DEFAULT_IMAGE_STYLE;
}

/**
 * @type {string}
 */
let DEFAULT_NO_IMAGE_STYLE;

/**
 * @type {Stroke}
 */
let DEFAULT_STROKE_STYLE = null;

/**
 * Get the default stroke style (or null if not yet set).
 * @return {Stroke} The default stroke style.
 */
export function getDefaultStrokeStyle() {
  return DEFAULT_STROKE_STYLE;
}

/**
 * @type {Stroke}
 */
let DEFAULT_TEXT_STROKE_STYLE;

/**
 * @type {Text}
 */
let DEFAULT_TEXT_STYLE = null;

/**
 * Get the default text style (or null if not yet set).
 * @return {Text} The default text style.
 */
export function getDefaultTextStyle() {
  return DEFAULT_TEXT_STYLE;
}

/**
 * @type {Style}
 */
let DEFAULT_STYLE = null;

/**
 * Get the default style (or null if not yet set).
 * @return {Style} The default style.
 */
export function getDefaultStyle() {
  return DEFAULT_STYLE;
}

/**
 * @type {Array<Style>}
 */
let DEFAULT_STYLE_ARRAY = null;

/**
 * Get the default style array (or null if not yet set).
 * @return {Array<Style>} The default style.
 */
export function getDefaultStyleArray() {
  return DEFAULT_STYLE_ARRAY;
}

function createStyleDefaults() {
  DEFAULT_COLOR = [255, 255, 255, 1];

  DEFAULT_FILL_STYLE = new Fill({
    color: DEFAULT_COLOR,
  });

  DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2]; // FIXME maybe [8, 32] ?

  DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = IconAnchorUnits.PIXELS;

  DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = IconAnchorUnits.PIXELS;

  DEFAULT_IMAGE_STYLE_SIZE = [64, 64];

  DEFAULT_IMAGE_STYLE_SRC =
    'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

  DEFAULT_IMAGE_SCALE_MULTIPLIER = 0.5;

  DEFAULT_IMAGE_STYLE = new Icon({
    anchor: DEFAULT_IMAGE_STYLE_ANCHOR,
    anchorOrigin: IconOrigin.BOTTOM_LEFT,
    anchorXUnits: DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS,
    anchorYUnits: DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS,
    crossOrigin: 'anonymous',
    rotation: 0,
    scale: DEFAULT_IMAGE_SCALE_MULTIPLIER,
    size: DEFAULT_IMAGE_STYLE_SIZE,
    src: DEFAULT_IMAGE_STYLE_SRC,
  });

  DEFAULT_NO_IMAGE_STYLE = 'NO_IMAGE';

  DEFAULT_STROKE_STYLE = new Stroke({
    color: DEFAULT_COLOR,
    width: 1,
  });

  DEFAULT_TEXT_STROKE_STYLE = new Stroke({
    color: [51, 51, 51, 1],
    width: 2,
  });

  DEFAULT_TEXT_STYLE = new Text({
    font: 'bold 16px Helvetica',
    fill: DEFAULT_FILL_STYLE,
    stroke: DEFAULT_TEXT_STROKE_STYLE,
    scale: 0.8,
  });

  DEFAULT_STYLE = new Style({
    fill: DEFAULT_FILL_STYLE,
    image: DEFAULT_IMAGE_STYLE,
    text: DEFAULT_TEXT_STYLE,
    stroke: DEFAULT_STROKE_STYLE,
    zIndex: 0,
  });

  DEFAULT_STYLE_ARRAY = [DEFAULT_STYLE];
}

/**
 * @type {HTMLTextAreaElement}
 */
let TEXTAREA;

/**
 * A function that takes a url `{string}` and returns a url `{string}`.
 * Might be used to change an icon path or to substitute a
 * data url obtained from a KMZ array buffer.
 *
 * @typedef {function(string):string} IconUrlFunction
 * @api
 */

/**
 * Function that returns a url unchanged.
 * @param {string} href Input url.
 * @return {string} Output url.
 */
function defaultIconUrlFunction(href) {
  return href;
}

/**
 * @typedef {Object} Options
 * @property {boolean} [extractStyles=true] Extract styles from the KML.
 * @property {boolean} [showPointNames=true] Show names as labels for placemarks which contain points.
 * @property {Array<Style>} [defaultStyle] Default style. The
 * default default style is the same as Google Earth.
 * @property {boolean} [writeStyles=true] Write styles into KML.
 * @property {null|string} [crossOrigin='anonymous'] The `crossOrigin` attribute for loaded images. Note that you must provide a
 * `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * @property {IconUrlFunction} [iconUrlFunction] Function that takes a url string and returns a url string.
 * Might be used to change an icon path or to substitute a data url obtained from a KMZ array buffer.
 */

/**
 * @classdesc
 * Feature format for reading and writing data in the KML format.
 *
 * {@link module:ol/format/KML~KML#readFeature} will read the first feature from
 * a KML source.
 *
 * MultiGeometries are converted into GeometryCollections if they are a mix of
 * geometry types, and into MultiPoint/MultiLineString/MultiPolygon if they are
 * all of the same type.
 *
 * Note that the KML format uses the URL() constructor. Older browsers such as IE
 * which do not support this will need a URL polyfill to be loaded before use.
 *
 * @api
 */
class KML extends XMLFeature {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    super();

    const options = opt_options ? opt_options : {};

    if (!DEFAULT_STYLE_ARRAY) {
      createStyleDefaults();
    }

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection('EPSG:4326');

    /**
     * @private
     * @type {Array<Style>}
     */
    this.defaultStyle_ = options.defaultStyle
      ? options.defaultStyle
      : DEFAULT_STYLE_ARRAY;

    /**
     * @private
     * @type {boolean}
     */
    this.extractStyles_ =
      options.extractStyles !== undefined ? options.extractStyles : true;

    /**
     * @type {boolean}
     */
    this.writeStyles_ =
      options.writeStyles !== undefined ? options.writeStyles : true;

    /**
     * @private
     * @type {!Object<string, (Array<Style>|string)>}
     */
    this.sharedStyles_ = {};

    /**
     * @private
     * @type {boolean}
     */
    this.showPointNames_ =
      options.showPointNames !== undefined ? options.showPointNames : true;

    /**
     * @type {null|string}
     */
    this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : 'anonymous';

    /**
     * @type {IconUrlFunction}
     */
    this.iconUrlFunction_ = options.iconUrlFunction
      ? options.iconUrlFunction
      : defaultIconUrlFunction;
  }

  /**
   * @param {Node} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @private
   * @return {Array<Feature>|undefined} Features.
   */
  readDocumentOrFolder_(node, objectStack) {
    // FIXME use scope somehow
    const parsersNS = makeStructureNS(NAMESPACE_URIS, {
      'Document': makeArrayExtender(this.readDocumentOrFolder_, this),
      'Folder': makeArrayExtender(this.readDocumentOrFolder_, this),
      'Placemark': makeArrayPusher(this.readPlacemark_, this),
      'Style': this.readSharedStyle_.bind(this),
      'StyleMap': this.readSharedStyleMap_.bind(this),
    });
    /** @type {Array<Feature>} */
    // @ts-ignore
    const features = pushParseAndPop([], parsersNS, node, objectStack, this);
    if (features) {
      return features;
    } else {
      return undefined;
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @private
   * @return {Feature|undefined} Feature.
   */
  readPlacemark_(node, objectStack) {
    const object = pushParseAndPop(
      {'geometry': null},
      PLACEMARK_PARSERS,
      node,
      objectStack,
      this
    );
    if (!object) {
      return undefined;
    }
    const feature = new Feature();
    const id = node.getAttribute('id');
    if (id !== null) {
      feature.setId(id);
    }
    const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);

    const geometry = object['geometry'];
    if (geometry) {
      transformGeometryWithOptions(geometry, false, options);
    }
    feature.setGeometry(geometry);
    delete object['geometry'];

    if (this.extractStyles_) {
      const style = object['Style'];
      const styleUrl = object['styleUrl'];
      const styleFunction = createFeatureStyleFunction(
        style,
        styleUrl,
        this.defaultStyle_,
        this.sharedStyles_,
        this.showPointNames_
      );
      feature.setStyle(styleFunction);
    }
    delete object['Style'];
    // we do not remove the styleUrl property from the object, so it
    // gets stored on feature when setProperties is called

    feature.setProperties(object, true);

    return feature;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @private
   */
  readSharedStyle_(node, objectStack) {
    const id = node.getAttribute('id');
    if (id !== null) {
      const style = readStyle.call(this, node, objectStack);
      if (style) {
        let styleUri;
        let baseURI = node.baseURI;
        if (!baseURI || baseURI == 'about:blank') {
          baseURI = window.location.href;
        }
        if (baseURI) {
          const url = new URL('#' + id, baseURI);
          styleUri = url.href;
        } else {
          styleUri = '#' + id;
        }
        this.sharedStyles_[styleUri] = style;
      }
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @private
   */
  readSharedStyleMap_(node, objectStack) {
    const id = node.getAttribute('id');
    if (id === null) {
      return;
    }
    const styleMapValue = readStyleMapValue.call(this, node, objectStack);
    if (!styleMapValue) {
      return;
    }
    let styleUri;
    let baseURI = node.baseURI;
    if (!baseURI || baseURI == 'about:blank') {
      baseURI = window.location.href;
    }
    if (baseURI) {
      const url = new URL('#' + id, baseURI);
      styleUri = url.href;
    } else {
      styleUri = '#' + id;
    }
    this.sharedStyles_[styleUri] = styleMapValue;
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions=} opt_options Options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromNode(node, opt_options) {
    if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
      return null;
    }
    const feature = this.readPlacemark_(node, [
      this.getReadOptions(node, opt_options),
    ]);
    if (feature) {
      return feature;
    } else {
      return null;
    }
  }

  /**
   * @protected
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions=} opt_options Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, opt_options) {
    if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
      return [];
    }
    let features;
    const localName = node.localName;
    if (localName == 'Document' || localName == 'Folder') {
      features = this.readDocumentOrFolder_(node, [
        this.getReadOptions(node, opt_options),
      ]);
      if (features) {
        return features;
      } else {
        return [];
      }
    } else if (localName == 'Placemark') {
      const feature = this.readPlacemark_(node, [
        this.getReadOptions(node, opt_options),
      ]);
      if (feature) {
        return [feature];
      } else {
        return [];
      }
    } else if (localName == 'kml') {
      features = [];
      for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
        const fs = this.readFeaturesFromNode(n, opt_options);
        if (fs) {
          extend(features, fs);
        }
      }
      return features;
    } else {
      return [];
    }
  }

  /**
   * Read the name of the KML.
   *
   * @param {Document|Element|string} source Source.
   * @return {string|undefined} Name.
   * @api
   */
  readName(source) {
    if (!source) {
      return undefined;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readNameFromDocument(doc);
    } else if (isDocument(source)) {
      return this.readNameFromDocument(/** @type {Document} */ (source));
    } else {
      return this.readNameFromNode(/** @type {Element} */ (source));
    }
  }

  /**
   * @param {Document} doc Document.
   * @return {string|undefined} Name.
   */
  readNameFromDocument(doc) {
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        const name = this.readNameFromNode(/** @type {Element} */ (n));
        if (name) {
          return name;
        }
      }
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @return {string|undefined} Name.
   */
  readNameFromNode(node) {
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (includes(NAMESPACE_URIS, n.namespaceURI) && n.localName == 'name') {
        return readString(n);
      }
    }
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      const localName = n.localName;
      if (
        includes(NAMESPACE_URIS, n.namespaceURI) &&
        (localName == 'Document' ||
          localName == 'Folder' ||
          localName == 'Placemark' ||
          localName == 'kml')
      ) {
        const name = this.readNameFromNode(n);
        if (name) {
          return name;
        }
      }
    }
    return undefined;
  }

  /**
   * Read the network links of the KML.
   *
   * @param {Document|Element|string} source Source.
   * @return {Array<Object>} Network links.
   * @api
   */
  readNetworkLinks(source) {
    const networkLinks = [];
    if (typeof source === 'string') {
      const doc = parse(source);
      extend(networkLinks, this.readNetworkLinksFromDocument(doc));
    } else if (isDocument(source)) {
      extend(
        networkLinks,
        this.readNetworkLinksFromDocument(/** @type {Document} */ (source))
      );
    } else {
      extend(
        networkLinks,
        this.readNetworkLinksFromNode(/** @type {Element} */ (source))
      );
    }
    return networkLinks;
  }

  /**
   * @param {Document} doc Document.
   * @return {Array<Object>} Network links.
   */
  readNetworkLinksFromDocument(doc) {
    const networkLinks = [];
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        extend(
          networkLinks,
          this.readNetworkLinksFromNode(/** @type {Element} */ (n))
        );
      }
    }
    return networkLinks;
  }

  /**
   * @param {Element} node Node.
   * @return {Array<Object>} Network links.
   */
  readNetworkLinksFromNode(node) {
    const networkLinks = [];
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (
        includes(NAMESPACE_URIS, n.namespaceURI) &&
        n.localName == 'NetworkLink'
      ) {
        const obj = pushParseAndPop({}, NETWORK_LINK_PARSERS, n, []);
        networkLinks.push(obj);
      }
    }
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      const localName = n.localName;
      if (
        includes(NAMESPACE_URIS, n.namespaceURI) &&
        (localName == 'Document' || localName == 'Folder' || localName == 'kml')
      ) {
        extend(networkLinks, this.readNetworkLinksFromNode(n));
      }
    }
    return networkLinks;
  }

  /**
   * Read the regions of the KML.
   *
   * @param {Document|Element|string} source Source.
   * @return {Array<Object>} Regions.
   * @api
   */
  readRegion(source) {
    const regions = [];
    if (typeof source === 'string') {
      const doc = parse(source);
      extend(regions, this.readRegionFromDocument(doc));
    } else if (isDocument(source)) {
      extend(
        regions,
        this.readRegionFromDocument(/** @type {Document} */ (source))
      );
    } else {
      extend(regions, this.readRegionFromNode(/** @type {Element} */ (source)));
    }
    return regions;
  }

  /**
   * @param {Document} doc Document.
   * @return {Array<Object>} Region.
   */
  readRegionFromDocument(doc) {
    const regions = [];
    for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        extend(regions, this.readRegionFromNode(/** @type {Element} */ (n)));
      }
    }
    return regions;
  }

  /**
   * @param {Element} node Node.
   * @return {Array<Object>} Region.
   * @api
   */
  readRegionFromNode(node) {
    const regions = [];
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (includes(NAMESPACE_URIS, n.namespaceURI) && n.localName == 'Region') {
        const obj = pushParseAndPop({}, REGION_PARSERS, n, []);
        regions.push(obj);
      }
    }
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      const localName = n.localName;
      if (
        includes(NAMESPACE_URIS, n.namespaceURI) &&
        (localName == 'Document' || localName == 'Folder' || localName == 'kml')
      ) {
        extend(regions, this.readRegionFromNode(n));
      }
    }
    return regions;
  }

  /**
   * Encode an array of features in the KML format as an XML node. GeometryCollections,
   * MultiPoints, MultiLineStrings, and MultiPolygons are output as MultiGeometries.
   *
   * @param {Array<Feature>} features Features.
   * @param {import("./Feature.js").WriteOptions=} opt_options Options.
   * @return {Node} Node.
   * @api
   */
  writeFeaturesNode(features, opt_options) {
    opt_options = this.adaptOptions(opt_options);
    const kml = createElementNS(NAMESPACE_URIS[4], 'kml');
    const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
    kml.setAttributeNS(xmlnsUri, 'xmlns:gx', GX_NAMESPACE_URIS[0]);
    kml.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
    kml.setAttributeNS(
      XML_SCHEMA_INSTANCE_URI,
      'xsi:schemaLocation',
      SCHEMA_LOCATION
    );

    const /** @type {import("../xml.js").NodeStackItem} */ context = {
        node: kml,
      };
    /** @type {!Object<string, (Array<Feature>|Feature|undefined)>} */
    const properties = {};
    if (features.length > 1) {
      properties['Document'] = features;
    } else if (features.length == 1) {
      properties['Placemark'] = features[0];
    }
    const orderedKeys = KML_SEQUENCE[kml.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
      context,
      KML_SERIALIZERS,
      OBJECT_PROPERTY_NODE_FACTORY,
      values,
      [opt_options],
      orderedKeys,
      this
    );
    return kml;
  }
}

/**
 * @param {Style|undefined} foundStyle Style.
 * @param {string} name Name.
 * @return {Style} style Style.
 */
function createNameStyleFunction(foundStyle, name) {
  const textOffset = [0, 0];
  let textAlign = 'start';
  const imageStyle = foundStyle.getImage();
  if (imageStyle) {
    let imageSize = imageStyle.getImageSize();
    if (imageSize === null) {
      imageSize = DEFAULT_IMAGE_STYLE_SIZE;
    }
    if (imageSize.length == 2) {
      const imageScale = imageStyle.getScaleArray();
      // Offset the label to be centered to the right of the icon,
      // if there is one.
      textOffset[0] = (imageScale[0] * imageSize[0]) / 2;
      textOffset[1] = (-imageScale[1] * imageSize[1]) / 2;
      textAlign = 'left';
    }
  }
  let textStyle = foundStyle.getText();
  if (textStyle) {
    // clone the text style, customizing it with name, alignments and offset.
    // Note that kml does not support many text options that OpenLayers does (rotation, textBaseline).
    textStyle = textStyle.clone();
    textStyle.setFont(textStyle.getFont() || DEFAULT_TEXT_STYLE.getFont());
    textStyle.setScale(textStyle.getScale() || DEFAULT_TEXT_STYLE.getScale());
    textStyle.setFill(textStyle.getFill() || DEFAULT_TEXT_STYLE.getFill());
    textStyle.setStroke(textStyle.getStroke() || DEFAULT_TEXT_STROKE_STYLE);
  } else {
    textStyle = DEFAULT_TEXT_STYLE.clone();
  }
  textStyle.setText(name);
  textStyle.setOffsetX(textOffset[0]);
  textStyle.setOffsetY(textOffset[1]);
  textStyle.setTextAlign(textAlign);

  const nameStyle = new Style({
    image: imageStyle,
    text: textStyle,
  });
  return nameStyle;
}

/**
 * @param {Array<Style>|undefined} style Style.
 * @param {string} styleUrl Style URL.
 * @param {Array<Style>} defaultStyle Default style.
 * @param {!Object<string, (Array<Style>|string)>} sharedStyles Shared styles.
 * @param {boolean|undefined} showPointNames true to show names for point placemarks.
 * @return {import("../style/Style.js").StyleFunction} Feature style function.
 */
function createFeatureStyleFunction(
  style,
  styleUrl,
  defaultStyle,
  sharedStyles,
  showPointNames
) {
  return (
    /**
     * @param {Feature} feature feature.
     * @param {number} resolution Resolution.
     * @return {Array<Style>|Style} Style.
     */
    function (feature, resolution) {
      let drawName = showPointNames;
      let name = '';
      let multiGeometryPoints = [];
      if (drawName) {
        const geometry = feature.getGeometry();
        if (geometry) {
          const type = geometry.getType();
          if (type === GeometryType.GEOMETRY_COLLECTION) {
            multiGeometryPoints = geometry
              .getGeometriesArrayRecursive()
              .filter(function (geometry) {
                const type = geometry.getType();
                return (
                  type === GeometryType.POINT ||
                  type === GeometryType.MULTI_POINT
                );
              });
            drawName = multiGeometryPoints.length > 0;
          } else {
            drawName =
              type === GeometryType.POINT || type === GeometryType.MULTI_POINT;
          }
        }
      }

      if (drawName) {
        name = /** @type {string} */ (feature.get('name'));
        drawName = drawName && !!name;
        // convert any html character codes
        if (drawName && name.search(/&[^&]+;/) > -1) {
          if (!TEXTAREA) {
            TEXTAREA = document.createElement('textarea');
          }
          TEXTAREA.innerHTML = name;
          name = TEXTAREA.value;
        }
      }

      let featureStyle = defaultStyle;
      if (style) {
        featureStyle = style;
      } else if (styleUrl) {
        featureStyle = findStyle(styleUrl, defaultStyle, sharedStyles);
      }
      if (drawName) {
        const nameStyle = createNameStyleFunction(featureStyle[0], name);
        if (multiGeometryPoints.length > 0) {
          // in multigeometries restrict the name style to points and create a
          // style without image or text for geometries requiring fill or stroke
          // including any polygon specific style if there is one
          nameStyle.setGeometry(new GeometryCollection(multiGeometryPoints));
          const baseStyle = new Style({
            geometry: featureStyle[0].getGeometry(),
            image: null,
            fill: featureStyle[0].getFill(),
            stroke: featureStyle[0].getStroke(),
            text: null,
          });
          return [nameStyle, baseStyle].concat(featureStyle.slice(1));
        }
        return nameStyle;
      }
      return featureStyle;
    }
  );
}

/**
 * @param {Array<Style>|string|undefined} styleValue Style value.
 * @param {Array<Style>} defaultStyle Default style.
 * @param {!Object<string, (Array<Style>|string)>} sharedStyles
 * Shared styles.
 * @return {Array<Style>} Style.
 */
function findStyle(styleValue, defaultStyle, sharedStyles) {
  if (Array.isArray(styleValue)) {
    return styleValue;
  } else if (typeof styleValue === 'string') {
    return findStyle(sharedStyles[styleValue], defaultStyle, sharedStyles);
  } else {
    return defaultStyle;
  }
}

/**
 * @param {Node} node Node.
 * @return {import("../color.js").Color|undefined} Color.
 */
function readColor(node) {
  const s = getAllTextContent(node, false);
  // The KML specification states that colors should not include a leading `#`
  // but we tolerate them.
  const m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
  if (m) {
    const hexColor = m[1];
    return [
      parseInt(hexColor.substr(6, 2), 16),
      parseInt(hexColor.substr(4, 2), 16),
      parseInt(hexColor.substr(2, 2), 16),
      parseInt(hexColor.substr(0, 2), 16) / 255,
    ];
  } else {
    return undefined;
  }
}

/**
 * @param {Node} node Node.
 * @return {Array<number>|undefined} Flat coordinates.
 */
export function readFlatCoordinates(node) {
  let s = getAllTextContent(node, false);
  const flatCoordinates = [];
  // The KML specification states that coordinate tuples should not include
  // spaces, but we tolerate them.
  s = s.replace(/\s*,\s*/g, ',');
  const re = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?),([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s+|,|$)(?:([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s+|$))?\s*/i;
  let m;
  while ((m = re.exec(s))) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = m[3] ? parseFloat(m[3]) : 0;
    flatCoordinates.push(x, y, z);
    s = s.substr(m[0].length);
  }
  if (s !== '') {
    return undefined;
  }
  return flatCoordinates;
}

/**
 * @param {Node} node Node.
 * @return {string} URI.
 */
function readURI(node) {
  const s = getAllTextContent(node, false).trim();
  let baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    const url = new URL(s, baseURI);
    return url.href;
  } else {
    return s;
  }
}

/**
 * @param {Node} node Node.
 * @return {string} URI.
 */
function readStyleURL(node) {
  // KML files in the wild occasionally forget the leading
  // `#` on styleUrlsdefined in the same document.
  const s = getAllTextContent(node, false)
    .trim()
    .replace(/^(?!.*#)/, '#');
  let baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    const url = new URL(s, baseURI);
    return url.href;
  } else {
    return s;
  }
}

/**
 * @param {Element} node Node.
 * @return {Vec2} Vec2.
 */
function readVec2(node) {
  const xunits = node.getAttribute('xunits');
  const yunits = node.getAttribute('yunits');
  let origin;
  if (xunits !== 'insetPixels') {
    if (yunits !== 'insetPixels') {
      origin = IconOrigin.BOTTOM_LEFT;
    } else {
      origin = IconOrigin.TOP_LEFT;
    }
  } else {
    if (yunits !== 'insetPixels') {
      origin = IconOrigin.BOTTOM_RIGHT;
    } else {
      origin = IconOrigin.TOP_RIGHT;
    }
  }
  return {
    x: parseFloat(node.getAttribute('x')),
    xunits: ICON_ANCHOR_UNITS_MAP[xunits],
    y: parseFloat(node.getAttribute('y')),
    yunits: ICON_ANCHOR_UNITS_MAP[yunits],
    origin: origin,
  };
}

/**
 * @param {Node} node Node.
 * @return {number|undefined} Scale.
 */
function readScale(node) {
  return readDecimal(node);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const STYLE_MAP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'Pair': pairDataParser,
});

/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<Style>|string|undefined} StyleMap.
 */
function readStyleMapValue(node, objectStack) {
  return pushParseAndPop(undefined, STYLE_MAP_PARSERS, node, objectStack, this);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const ICON_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'Icon': makeObjectPropertySetter(readIcon),
  'color': makeObjectPropertySetter(readColor),
  'heading': makeObjectPropertySetter(readDecimal),
  'hotSpot': makeObjectPropertySetter(readVec2),
  'scale': makeObjectPropertySetter(readScale),
});

/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function iconStyleParser(node, objectStack) {
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  const object = pushParseAndPop({}, ICON_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = /** @type {Object} */ (objectStack[
    objectStack.length - 1
  ]);
  const IconObject = 'Icon' in object ? object['Icon'] : {};
  const drawIcon = !('Icon' in object) || Object.keys(IconObject).length > 0;
  let src;
  const href = /** @type {string|undefined} */ (IconObject['href']);
  if (href) {
    src = href;
  } else if (drawIcon) {
    src = DEFAULT_IMAGE_STYLE_SRC;
  }
  let anchor, anchorXUnits, anchorYUnits;
  let anchorOrigin = IconOrigin.BOTTOM_LEFT;
  const hotSpot = /** @type {Vec2|undefined} */ (object['hotSpot']);
  if (hotSpot) {
    anchor = [hotSpot.x, hotSpot.y];
    anchorXUnits = hotSpot.xunits;
    anchorYUnits = hotSpot.yunits;
    anchorOrigin = hotSpot.origin;
  } else if (src === DEFAULT_IMAGE_STYLE_SRC) {
    anchor = DEFAULT_IMAGE_STYLE_ANCHOR;
    anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
    anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
  } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
    anchor = [0.5, 0];
    anchorXUnits = IconAnchorUnits.FRACTION;
    anchorYUnits = IconAnchorUnits.FRACTION;
  }

  let offset;
  const x = /** @type {number|undefined} */ (IconObject['x']);
  const y = /** @type {number|undefined} */ (IconObject['y']);
  if (x !== undefined && y !== undefined) {
    offset = [x, y];
  }

  let size;
  const w = /** @type {number|undefined} */ (IconObject['w']);
  const h = /** @type {number|undefined} */ (IconObject['h']);
  if (w !== undefined && h !== undefined) {
    size = [w, h];
  }

  let rotation;
  const heading = /** @type {number} */ (object['heading']);
  if (heading !== undefined) {
    rotation = toRadians(heading);
  }

  let scale = /** @type {number|undefined} */ (object['scale']);

  const color = /** @type {Array<number>|undefined} */ (object['color']);

  if (drawIcon) {
    if (src == DEFAULT_IMAGE_STYLE_SRC) {
      size = DEFAULT_IMAGE_STYLE_SIZE;
      if (scale === undefined) {
        scale = DEFAULT_IMAGE_SCALE_MULTIPLIER;
      }
    }

    const imageStyle = new Icon({
      anchor: anchor,
      anchorOrigin: anchorOrigin,
      anchorXUnits: anchorXUnits,
      anchorYUnits: anchorYUnits,
      crossOrigin: this.crossOrigin_,
      offset: offset,
      offsetOrigin: IconOrigin.BOTTOM_LEFT,
      rotation: rotation,
      scale: scale,
      size: size,
      src: this.iconUrlFunction_(src),
      color: color,
    });
    styleObject['imageStyle'] = imageStyle;
  } else {
    // handle the case when we explicitly want to draw no icon.
    styleObject['imageStyle'] = DEFAULT_NO_IMAGE_STYLE;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LABEL_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'color': makeObjectPropertySetter(readColor),
  'scale': makeObjectPropertySetter(readScale),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function labelStyleParser(node, objectStack) {
  // FIXME colorMode
  const object = pushParseAndPop({}, LABEL_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const textStyle = new Text({
    fill: new Fill({
      color:
        /** @type {import("../color.js").Color} */
        ('color' in object ? object['color'] : DEFAULT_COLOR),
    }),
    scale: /** @type {number|undefined} */ (object['scale']),
  });
  styleObject['textStyle'] = textStyle;
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LINE_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'color': makeObjectPropertySetter(readColor),
  'width': makeObjectPropertySetter(readDecimal),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function lineStyleParser(node, objectStack) {
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  const object = pushParseAndPop({}, LINE_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const strokeStyle = new Stroke({
    color:
      /** @type {import("../color.js").Color} */
      ('color' in object ? object['color'] : DEFAULT_COLOR),
    width: /** @type {number} */ ('width' in object ? object['width'] : 1),
  });
  styleObject['strokeStyle'] = strokeStyle;
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const POLY_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'color': makeObjectPropertySetter(readColor),
  'fill': makeObjectPropertySetter(readBoolean),
  'outline': makeObjectPropertySetter(readBoolean),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function polyStyleParser(node, objectStack) {
  // FIXME colorMode
  const object = pushParseAndPop({}, POLY_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const fillStyle = new Fill({
    color:
      /** @type {import("../color.js").Color} */
      ('color' in object ? object['color'] : DEFAULT_COLOR),
  });
  styleObject['fillStyle'] = fillStyle;
  const fill = /** @type {boolean|undefined} */ (object['fill']);
  if (fill !== undefined) {
    styleObject['fill'] = fill;
  }
  const outline = /** @type {boolean|undefined} */ (object['outline']);
  if (outline !== undefined) {
    styleObject['outline'] = outline;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const FLAT_LINEAR_RING_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'coordinates': makeReplacer(readFlatCoordinates),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<number>} LinearRing flat coordinates.
 */
function readFlatLinearRing(node, objectStack) {
  return pushParseAndPop(null, FLAT_LINEAR_RING_PARSERS, node, objectStack);
}

/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function gxCoordParser(node, objectStack) {
  const gxTrackObject =
    /** @type {GxTrackObject} */
    (objectStack[objectStack.length - 1]);
  const flatCoordinates = gxTrackObject.flatCoordinates;
  const s = getAllTextContent(node, false);
  const re = /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
  const m = re.exec(s);
  if (m) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = parseFloat(m[3]);
    flatCoordinates.push(x, y, z, 0);
  } else {
    flatCoordinates.push(0, 0, 0, 0);
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const GX_MULTITRACK_GEOMETRY_PARSERS = makeStructureNS(GX_NAMESPACE_URIS, {
  'Track': makeArrayPusher(readGxTrack),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {MultiLineString|undefined} MultiLineString.
 */
function readGxMultiTrack(node, objectStack) {
  const lineStrings = pushParseAndPop(
    [],
    GX_MULTITRACK_GEOMETRY_PARSERS,
    node,
    objectStack
  );
  if (!lineStrings) {
    return undefined;
  }
  return new MultiLineString(lineStrings);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const GX_TRACK_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'when': whenParser,
  },
  makeStructureNS(GX_NAMESPACE_URIS, {
    'coord': gxCoordParser,
  })
);

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {LineString|undefined} LineString.
 */
function readGxTrack(node, objectStack) {
  const gxTrackObject = pushParseAndPop(
    /** @type {GxTrackObject} */ ({
      flatCoordinates: [],
      whens: [],
    }),
    GX_TRACK_PARSERS,
    node,
    objectStack
  );
  if (!gxTrackObject) {
    return undefined;
  }
  const flatCoordinates = gxTrackObject.flatCoordinates;
  const whens = gxTrackObject.whens;
  for (
    let i = 0, ii = Math.min(flatCoordinates.length, whens.length);
    i < ii;
    ++i
  ) {
    flatCoordinates[4 * i + 3] = whens[i];
  }
  return new LineString(flatCoordinates, GeometryLayout.XYZM);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const ICON_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'href': makeObjectPropertySetter(readURI),
  },
  makeStructureNS(GX_NAMESPACE_URIS, {
    'x': makeObjectPropertySetter(readDecimal),
    'y': makeObjectPropertySetter(readDecimal),
    'w': makeObjectPropertySetter(readDecimal),
    'h': makeObjectPropertySetter(readDecimal),
  })
);

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object} Icon object.
 */
function readIcon(node, objectStack) {
  const iconObject = pushParseAndPop({}, ICON_PARSERS, node, objectStack);
  if (iconObject) {
    return iconObject;
  } else {
    return null;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const GEOMETRY_FLAT_COORDINATES_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'coordinates': makeReplacer(readFlatCoordinates),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<number>} Flat coordinates.
 */
function readFlatCoordinatesFromNode(node, objectStack) {
  return pushParseAndPop(
    null,
    GEOMETRY_FLAT_COORDINATES_PARSERS,
    node,
    objectStack
  );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const EXTRUDE_AND_ALTITUDE_MODE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'extrude': makeObjectPropertySetter(readBoolean),
  'tessellate': makeObjectPropertySetter(readBoolean),
  'altitudeMode': makeObjectPropertySetter(readString),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {LineString|undefined} LineString.
 */
function readLineString(node, objectStack) {
  const properties = pushParseAndPop(
    {},
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
    node,
    objectStack
  );
  const flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
  if (flatCoordinates) {
    const lineString = new LineString(flatCoordinates, GeometryLayout.XYZ);
    lineString.setProperties(properties, true);
    return lineString;
  } else {
    return undefined;
  }
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Polygon|undefined} Polygon.
 */
function readLinearRing(node, objectStack) {
  const properties = pushParseAndPop(
    {},
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
    node,
    objectStack
  );
  const flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
  if (flatCoordinates) {
    const polygon = new Polygon(flatCoordinates, GeometryLayout.XYZ, [
      flatCoordinates.length,
    ]);
    polygon.setProperties(properties, true);
    return polygon;
  } else {
    return undefined;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const MULTI_GEOMETRY_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'LineString': makeArrayPusher(readLineString),
  'LinearRing': makeArrayPusher(readLinearRing),
  'MultiGeometry': makeArrayPusher(readMultiGeometry),
  'Point': makeArrayPusher(readPoint),
  'Polygon': makeArrayPusher(readPolygon),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {import("../geom/Geometry.js").default} Geometry.
 */
function readMultiGeometry(node, objectStack) {
  const geometries = pushParseAndPop(
    [],
    MULTI_GEOMETRY_PARSERS,
    node,
    objectStack
  );
  if (!geometries) {
    return null;
  }
  if (geometries.length === 0) {
    return new GeometryCollection(geometries);
  }
  let multiGeometry;
  let homogeneous = true;
  const type = geometries[0].getType();
  let geometry;
  for (let i = 1, ii = geometries.length; i < ii; ++i) {
    geometry = geometries[i];
    if (geometry.getType() != type) {
      homogeneous = false;
      break;
    }
  }
  if (homogeneous) {
    let layout;
    let flatCoordinates;
    if (type == GeometryType.POINT) {
      const point = geometries[0];
      layout = point.getLayout();
      flatCoordinates = point.getFlatCoordinates();
      for (let i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        extend(flatCoordinates, geometry.getFlatCoordinates());
      }
      multiGeometry = new MultiPoint(flatCoordinates, layout);
      setCommonGeometryProperties(multiGeometry, geometries);
    } else if (type == GeometryType.LINE_STRING) {
      multiGeometry = new MultiLineString(geometries);
      setCommonGeometryProperties(multiGeometry, geometries);
    } else if (type == GeometryType.POLYGON) {
      multiGeometry = new MultiPolygon(geometries);
      setCommonGeometryProperties(multiGeometry, geometries);
    } else if (type == GeometryType.GEOMETRY_COLLECTION) {
      multiGeometry = new GeometryCollection(geometries);
    } else {
      assert(false, 37); // Unknown geometry type found
    }
  } else {
    multiGeometry = new GeometryCollection(geometries);
  }
  return /** @type {import("../geom/Geometry.js").default} */ (multiGeometry);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Point|undefined} Point.
 */
function readPoint(node, objectStack) {
  const properties = pushParseAndPop(
    {},
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
    node,
    objectStack
  );
  const flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
  if (flatCoordinates) {
    const point = new Point(flatCoordinates, GeometryLayout.XYZ);
    point.setProperties(properties, true);
    return point;
  } else {
    return undefined;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const FLAT_LINEAR_RINGS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'innerBoundaryIs': innerBoundaryIsParser,
  'outerBoundaryIs': outerBoundaryIsParser,
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Polygon|undefined} Polygon.
 */
function readPolygon(node, objectStack) {
  const properties = pushParseAndPop(
    /** @type {Object<string,*>} */ ({}),
    EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
    node,
    objectStack
  );
  const flatLinearRings = pushParseAndPop(
    [null],
    FLAT_LINEAR_RINGS_PARSERS,
    node,
    objectStack
  );
  if (flatLinearRings && flatLinearRings[0]) {
    const flatCoordinates = flatLinearRings[0];
    const ends = [flatCoordinates.length];
    for (let i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    const polygon = new Polygon(flatCoordinates, GeometryLayout.XYZ, ends);
    polygon.setProperties(properties, true);
    return polygon;
  } else {
    return undefined;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'IconStyle': iconStyleParser,
  'LabelStyle': labelStyleParser,
  'LineStyle': lineStyleParser,
  'PolyStyle': polyStyleParser,
});

/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<Style>} Style.
 */
function readStyle(node, objectStack) {
  const styleObject = pushParseAndPop(
    {},
    STYLE_PARSERS,
    node,
    objectStack,
    this
  );
  if (!styleObject) {
    return null;
  }
  let fillStyle =
    /** @type {Fill} */
    ('fillStyle' in styleObject
      ? styleObject['fillStyle']
      : DEFAULT_FILL_STYLE);
  const fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  if (fill !== undefined && !fill) {
    fillStyle = null;
  }
  let imageStyle;
  if ('imageStyle' in styleObject) {
    if (styleObject['imageStyle'] != DEFAULT_NO_IMAGE_STYLE) {
      imageStyle = styleObject['imageStyle'];
    }
  } else {
    imageStyle = DEFAULT_IMAGE_STYLE;
  }
  const textStyle =
    /** @type {Text} */
    ('textStyle' in styleObject
      ? styleObject['textStyle']
      : DEFAULT_TEXT_STYLE);
  const strokeStyle =
    /** @type {Stroke} */
    ('strokeStyle' in styleObject
      ? styleObject['strokeStyle']
      : DEFAULT_STROKE_STYLE);
  const outline = /** @type {boolean|undefined} */ (styleObject['outline']);
  if (outline !== undefined && !outline) {
    // if the polystyle specifies no outline two styles are needed,
    // one for non-polygon geometries where linestrings require a stroke
    // and one for polygons where there should be no stroke
    return [
      new Style({
        geometry: function (feature) {
          const geometry = feature.getGeometry();
          const type = geometry.getType();
          if (type === GeometryType.GEOMETRY_COLLECTION) {
            return new GeometryCollection(
              geometry
                .getGeometriesArrayRecursive()
                .filter(function (geometry) {
                  const type = geometry.getType();
                  return (
                    type !== GeometryType.POLYGON &&
                    type !== GeometryType.MULTI_POLYGON
                  );
                })
            );
          } else if (
            type !== GeometryType.POLYGON &&
            type !== GeometryType.MULTI_POLYGON
          ) {
            return geometry;
          }
        },
        fill: fillStyle,
        image: imageStyle,
        stroke: strokeStyle,
        text: textStyle,
        zIndex: undefined, // FIXME
      }),
      new Style({
        geometry: function (feature) {
          const geometry = feature.getGeometry();
          const type = geometry.getType();
          if (type === GeometryType.GEOMETRY_COLLECTION) {
            return new GeometryCollection(
              geometry
                .getGeometriesArrayRecursive()
                .filter(function (geometry) {
                  const type = geometry.getType();
                  return (
                    type === GeometryType.POLYGON ||
                    type === GeometryType.MULTI_POLYGON
                  );
                })
            );
          } else if (
            type === GeometryType.POLYGON ||
            type === GeometryType.MULTI_POLYGON
          ) {
            return geometry;
          }
        },
        fill: fillStyle,
        stroke: null,
        zIndex: undefined, // FIXME
      }),
    ];
  }
  return [
    new Style({
      fill: fillStyle,
      image: imageStyle,
      stroke: strokeStyle,
      text: textStyle,
      zIndex: undefined, // FIXME
    }),
  ];
}

/**
 * Reads an array of geometries and creates arrays for common geometry
 * properties. Then sets them to the multi geometry.
 * @param {MultiPoint|MultiLineString|MultiPolygon} multiGeometry A multi-geometry.
 * @param {Array<import("../geom/Geometry.js").default>} geometries List of geometries.
 */
function setCommonGeometryProperties(multiGeometry, geometries) {
  const ii = geometries.length;
  const extrudes = new Array(geometries.length);
  const tessellates = new Array(geometries.length);
  const altitudeModes = new Array(geometries.length);
  let hasExtrude, hasTessellate, hasAltitudeMode;
  hasExtrude = false;
  hasTessellate = false;
  hasAltitudeMode = false;
  for (let i = 0; i < ii; ++i) {
    const geometry = geometries[i];
    extrudes[i] = geometry.get('extrude');
    tessellates[i] = geometry.get('tessellate');
    altitudeModes[i] = geometry.get('altitudeMode');
    hasExtrude = hasExtrude || extrudes[i] !== undefined;
    hasTessellate = hasTessellate || tessellates[i] !== undefined;
    hasAltitudeMode = hasAltitudeMode || altitudeModes[i];
  }
  if (hasExtrude) {
    multiGeometry.set('extrude', extrudes);
  }
  if (hasTessellate) {
    multiGeometry.set('tessellate', tessellates);
  }
  if (hasAltitudeMode) {
    multiGeometry.set('altitudeMode', altitudeModes);
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'displayName': makeObjectPropertySetter(readString),
  'value': makeObjectPropertySetter(readString),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function dataParser(node, objectStack) {
  const name = node.getAttribute('name');
  parseNode(DATA_PARSERS, node, objectStack);
  const featureObject = /** @type {Object} */ (objectStack[
    objectStack.length - 1
  ]);
  if (name && featureObject.displayName) {
    featureObject[name] = {
      value: featureObject.value,
      displayName: featureObject.displayName,
      toString: function () {
        return featureObject.value;
      },
    };
  } else if (name !== null) {
    featureObject[name] = featureObject.value;
  } else if (featureObject.displayName !== null) {
    featureObject[featureObject.displayName] = featureObject.value;
  }
  delete featureObject['value'];
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const EXTENDED_DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'Data': dataParser,
  'SchemaData': schemaDataParser,
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function extendedDataParser(node, objectStack) {
  parseNode(EXTENDED_DATA_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function regionParser(node, objectStack) {
  parseNode(REGION_PARSERS, node, objectStack);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const PAIR_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'Style': makeObjectPropertySetter(readStyle),
  'key': makeObjectPropertySetter(readString),
  'styleUrl': makeObjectPropertySetter(readStyleURL),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function pairDataParser(node, objectStack) {
  const pairObject = pushParseAndPop({}, PAIR_PARSERS, node, objectStack, this);
  if (!pairObject) {
    return;
  }
  const key = /** @type {string|undefined} */ (pairObject['key']);
  if (key && key == 'normal') {
    const styleUrl = /** @type {string|undefined} */ (pairObject['styleUrl']);
    if (styleUrl) {
      objectStack[objectStack.length - 1] = styleUrl;
    }
    const style = /** @type {Style} */ (pairObject['Style']);
    if (style) {
      objectStack[objectStack.length - 1] = style;
    }
  }
}

/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function placemarkStyleMapParser(node, objectStack) {
  const styleMapValue = readStyleMapValue.call(this, node, objectStack);
  if (!styleMapValue) {
    return;
  }
  const placemarkObject = objectStack[objectStack.length - 1];
  if (Array.isArray(styleMapValue)) {
    placemarkObject['Style'] = styleMapValue;
  } else if (typeof styleMapValue === 'string') {
    placemarkObject['styleUrl'] = styleMapValue;
  } else {
    assert(false, 38); // `styleMapValue` has an unknown type
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const SCHEMA_DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'SimpleData': simpleDataParser,
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function schemaDataParser(node, objectStack) {
  parseNode(SCHEMA_DATA_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function simpleDataParser(node, objectStack) {
  const name = node.getAttribute('name');
  if (name !== null) {
    const data = readString(node);
    const featureObject = /** @type {Object} */ (objectStack[
      objectStack.length - 1
    ]);
    featureObject[name] = data;
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LAT_LON_ALT_BOX_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'altitudeMode': makeObjectPropertySetter(readString),
  'minAltitude': makeObjectPropertySetter(readDecimal),
  'maxAltitude': makeObjectPropertySetter(readDecimal),
  'north': makeObjectPropertySetter(readDecimal),
  'south': makeObjectPropertySetter(readDecimal),
  'east': makeObjectPropertySetter(readDecimal),
  'west': makeObjectPropertySetter(readDecimal),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function latLonAltBoxParser(node, objectStack) {
  const object = pushParseAndPop(
    {},
    LAT_LON_ALT_BOX_PARSERS,
    node,
    objectStack
  );
  if (!object) {
    return;
  }
  const regionObject = /** @type {Object} */ (objectStack[
    objectStack.length - 1
  ]);
  const extent = [
    parseFloat(object['west']),
    parseFloat(object['south']),
    parseFloat(object['east']),
    parseFloat(object['north']),
  ];
  regionObject['extent'] = extent;
  regionObject['altitudeMode'] = object['altitudeMode'];
  regionObject['minAltitude'] = parseFloat(object['minAltitude']);
  regionObject['maxAltitude'] = parseFloat(object['maxAltitude']);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LOD_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'minLodPixels': makeObjectPropertySetter(readDecimal),
  'maxLodPixels': makeObjectPropertySetter(readDecimal),
  'minFadeExtent': makeObjectPropertySetter(readDecimal),
  'maxFadeExtent': makeObjectPropertySetter(readDecimal),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function lodParser(node, objectStack) {
  const object = pushParseAndPop({}, LOD_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  const lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  lodObject['minLodPixels'] = parseFloat(object['minLodPixels']);
  lodObject['maxLodPixels'] = parseFloat(object['maxLodPixels']);
  lodObject['minFadeExtent'] = parseFloat(object['minFadeExtent']);
  lodObject['maxFadeExtent'] = parseFloat(object['maxFadeExtent']);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const INNER_BOUNDARY_IS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'LinearRing': makeReplacer(readFlatLinearRing),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function innerBoundaryIsParser(node, objectStack) {
  /** @type {Array<number>|undefined} */
  const flatLinearRing = pushParseAndPop(
    undefined,
    INNER_BOUNDARY_IS_PARSERS,
    node,
    objectStack
  );
  if (flatLinearRing) {
    const flatLinearRings =
      /** @type {Array<Array<number>>} */
      (objectStack[objectStack.length - 1]);
    flatLinearRings.push(flatLinearRing);
  }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const OUTER_BOUNDARY_IS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  'LinearRing': makeReplacer(readFlatLinearRing),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function outerBoundaryIsParser(node, objectStack) {
  /** @type {Array<number>|undefined} */
  const flatLinearRing = pushParseAndPop(
    undefined,
    OUTER_BOUNDARY_IS_PARSERS,
    node,
    objectStack
  );
  if (flatLinearRing) {
    const flatLinearRings =
      /** @type {Array<Array<number>>} */
      (objectStack[objectStack.length - 1]);
    flatLinearRings[0] = flatLinearRing;
  }
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function linkParser(node, objectStack) {
  parseNode(LINK_PARSERS, node, objectStack);
}

/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function whenParser(node, objectStack) {
  const gxTrackObject =
    /** @type {GxTrackObject} */
    (objectStack[objectStack.length - 1]);
  const whens = gxTrackObject.whens;
  const s = getAllTextContent(node, false);
  const when = Date.parse(s);
  whens.push(isNaN(when) ? 0 : when);
}

/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {import("../color.js").Color|string} color Color.
 */
function writeColorTextNode(node, color) {
  const rgba = asArray(color);
  const opacity = rgba.length == 4 ? rgba[3] : 1;
  /** @type {Array<string|number>} */
  const abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  for (let i = 0; i < 4; ++i) {
    const hex = Math.floor(/** @type {number} */ (abgr[i])).toString(16);
    abgr[i] = hex.length == 1 ? '0' + hex : hex;
  }
  writeStringTextNode(node, abgr.join(''));
}

/**
 * @param {Node} node Node to append a TextNode with the coordinates to.
 * @param {Array<number>} coordinates Coordinates.
 * @param {Array<*>} objectStack Object stack.
 */
function writeCoordinatesTextNode(node, coordinates, objectStack) {
  const context = objectStack[objectStack.length - 1];

  const layout = context['layout'];
  const stride = context['stride'];

  let dimension;
  if (layout == GeometryLayout.XY || layout == GeometryLayout.XYM) {
    dimension = 2;
  } else if (layout == GeometryLayout.XYZ || layout == GeometryLayout.XYZM) {
    dimension = 3;
  } else {
    assert(false, 34); // Invalid geometry layout
  }

  const ii = coordinates.length;
  let text = '';
  if (ii > 0) {
    text += coordinates[0];
    for (let d = 1; d < dimension; ++d) {
      text += ',' + coordinates[d];
    }
    for (let i = stride; i < ii; i += stride) {
      text += ' ' + coordinates[i];
      for (let d = 1; d < dimension; ++d) {
        text += ',' + coordinates[i + d];
      }
    }
  }
  writeStringTextNode(node, text);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const EXTENDEDDATA_NODE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'Data': makeChildAppender(writeDataNode),
  'value': makeChildAppender(writeDataNodeValue),
  'displayName': makeChildAppender(writeDataNodeName),
});

/**
 * @param {Element} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array<*>} objectStack Object stack.
 */
function writeDataNode(node, pair, objectStack) {
  node.setAttribute('name', pair.name);
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const value = pair.value;

  if (typeof value == 'object') {
    if (value !== null && value.displayName) {
      pushSerializeAndPop(
        context,
        EXTENDEDDATA_NODE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        [value.displayName],
        objectStack,
        ['displayName']
      );
    }

    if (value !== null && value.value) {
      pushSerializeAndPop(
        context,
        EXTENDEDDATA_NODE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        [value.value],
        objectStack,
        ['value']
      );
    }
  } else {
    pushSerializeAndPop(
      context,
      EXTENDEDDATA_NODE_SERIALIZERS,
      OBJECT_PROPERTY_NODE_FACTORY,
      [value],
      objectStack,
      ['value']
    );
  }
}

/**
 * @param {Node} node Node to append a TextNode with the name to.
 * @param {string} name DisplayName.
 */
function writeDataNodeName(node, name) {
  writeCDATASection(node, name);
}

/**
 * @param {Node} node Node to append a CDATA Section with the value to.
 * @param {string} value Value.
 */
function writeDataNodeValue(node, value) {
  writeStringTextNode(node, value);
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const DOCUMENT_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'Placemark': makeChildAppender(writePlacemark),
});

/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
const DOCUMENT_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
  const parentNode = objectStack[objectStack.length - 1].node;
  return createElementNS(parentNode.namespaceURI, 'Placemark');
};

/**
 * @param {Node} node Node.
 * @param {Array<Feature>} features Features.
 * @param {Array<*>} objectStack Object stack.
 * @this {KML}
 */
function writeDocument(node, features, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  pushSerializeAndPop(
    context,
    DOCUMENT_SERIALIZERS,
    DOCUMENT_NODE_FACTORY,
    features,
    objectStack,
    undefined,
    this
  );
}

/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array<*>): (Node|undefined)}
 */
const DATA_NODE_FACTORY = makeSimpleNodeFactory('Data');

/**
 * @param {Node} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array<*>} objectStack Object stack.
 */
function writeExtendedData(node, namesAndValues, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const names = namesAndValues.names;
  const values = namesAndValues.values;
  const length = names.length;

  for (let i = 0; i < length; i++) {
    pushSerializeAndPop(
      context,
      EXTENDEDDATA_NODE_SERIALIZERS,
      DATA_NODE_FACTORY,
      [{name: names[i], value: values[i]}],
      objectStack
    );
  }
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const ICON_SEQUENCE = makeStructureNS(
  NAMESPACE_URIS,
  ['href'],
  makeStructureNS(GX_NAMESPACE_URIS, ['x', 'y', 'w', 'h'])
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const ICON_SERIALIZERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    'href': makeChildAppender(writeStringTextNode),
  },
  makeStructureNS(GX_NAMESPACE_URIS, {
    'x': makeChildAppender(writeDecimalTextNode),
    'y': makeChildAppender(writeDecimalTextNode),
    'w': makeChildAppender(writeDecimalTextNode),
    'h': makeChildAppender(writeDecimalTextNode),
  })
);

/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
const GX_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
  return createElementNS(GX_NAMESPACE_URIS[0], 'gx:' + opt_nodeName);
};

/**
 * @param {Node} node Node.
 * @param {Object} icon Icon object.
 * @param {Array<*>} objectStack Object stack.
 */
function writeIcon(node, icon, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const parentNode = objectStack[objectStack.length - 1].node;
  let orderedKeys = ICON_SEQUENCE[parentNode.namespaceURI];
  let values = makeSequence(icon, orderedKeys);
  pushSerializeAndPop(
    context,
    ICON_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
  orderedKeys = ICON_SEQUENCE[GX_NAMESPACE_URIS[0]];
  values = makeSequence(icon, orderedKeys);
  pushSerializeAndPop(
    context,
    ICON_SERIALIZERS,
    GX_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const ICON_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'scale',
  'heading',
  'Icon',
  'color',
  'hotSpot',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const ICON_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'Icon': makeChildAppender(writeIcon),
  'color': makeChildAppender(writeColorTextNode),
  'heading': makeChildAppender(writeDecimalTextNode),
  'hotSpot': makeChildAppender(writeVec2),
  'scale': makeChildAppender(writeScaleTextNode),
});

/**
 * @param {Node} node Node.
 * @param {import("../style/Icon.js").default} style Icon style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeIconStyle(node, style, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const /** @type {Object<string, any>} */ properties = {};
  const src = style.getSrc();
  const size = style.getSize();
  const iconImageSize = style.getImageSize();
  const iconProperties = {
    'href': src,
  };

  if (size) {
    iconProperties['w'] = size[0];
    iconProperties['h'] = size[1];
    const anchor = style.getAnchor(); // top-left
    const origin = style.getOrigin(); // top-left

    if (origin && iconImageSize && origin[0] !== 0 && origin[1] !== size[1]) {
      iconProperties['x'] = origin[0];
      iconProperties['y'] = iconImageSize[1] - (origin[1] + size[1]);
    }

    if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
      const /** @type {Vec2} */ hotSpot = {
          x: anchor[0],
          xunits: IconAnchorUnits.PIXELS,
          y: size[1] - anchor[1],
          yunits: IconAnchorUnits.PIXELS,
        };
      properties['hotSpot'] = hotSpot;
    }
  }

  properties['Icon'] = iconProperties;

  const scale = style.getScale();
  if (scale !== 1) {
    properties['scale'] = scale;
  }

  const rotation = style.getRotation();
  if (rotation !== 0) {
    properties['heading'] = rotation; // 0-360
  }

  const color = style.getColor();
  if (color) {
    properties['color'] = color;
  }

  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = ICON_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    ICON_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const LABEL_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'color',
  'scale',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const LABEL_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'color': makeChildAppender(writeColorTextNode),
  'scale': makeChildAppender(writeScaleTextNode),
});

/**
 * @param {Node} node Node.
 * @param {Text} style style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeLabelStyle(node, style, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const properties = {};
  const fill = style.getFill();
  if (fill) {
    properties['color'] = fill.getColor();
  }
  const scale = style.getScale();
  if (scale && scale !== 1) {
    properties['scale'] = scale;
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = LABEL_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    LABEL_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const LINE_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['color', 'width']);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const LINE_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'color': makeChildAppender(writeColorTextNode),
  'width': makeChildAppender(writeDecimalTextNode),
});

/**
 * @param {Node} node Node.
 * @param {Stroke} style style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeLineStyle(node, style, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const properties = {
    'color': style.getColor(),
    'width': Number(style.getWidth()) || 1,
  };
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = LINE_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    LINE_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @const
 * @type {Object<string, string>}
 */
const GEOMETRY_TYPE_TO_NODENAME = {
  'Point': 'Point',
  'LineString': 'LineString',
  'LinearRing': 'LinearRing',
  'Polygon': 'Polygon',
  'MultiPoint': 'MultiGeometry',
  'MultiLineString': 'MultiGeometry',
  'MultiPolygon': 'MultiGeometry',
  'GeometryCollection': 'MultiGeometry',
};

/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 */
const GEOMETRY_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
  if (value) {
    const parentNode = objectStack[objectStack.length - 1].node;
    return createElementNS(
      parentNode.namespaceURI,
      GEOMETRY_TYPE_TO_NODENAME[
        /** @type {import("../geom/Geometry.js").default} */ (value).getType()
      ]
    );
  }
};

/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const POINT_NODE_FACTORY = makeSimpleNodeFactory('Point');

/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const LINE_STRING_NODE_FACTORY = makeSimpleNodeFactory('LineString');

/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const LINEAR_RING_NODE_FACTORY = makeSimpleNodeFactory('LinearRing');

/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const POLYGON_NODE_FACTORY = makeSimpleNodeFactory('Polygon');

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const MULTI_GEOMETRY_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'LineString': makeChildAppender(writePrimitiveGeometry),
  'Point': makeChildAppender(writePrimitiveGeometry),
  'Polygon': makeChildAppender(writePolygon),
  'GeometryCollection': makeChildAppender(writeMultiGeometry),
});

/**
 * @param {Node} node Node.
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
function writeMultiGeometry(node, geometry, objectStack) {
  /** @type {import("../xml.js").NodeStackItem} */
  const context = {node: node};
  const type = geometry.getType();
  /** @type {Array<import("../geom/Geometry.js").default>} */
  let geometries = [];
  /** @type {function(*, Array<*>, string=): (Node|undefined)} */
  let factory;
  if (type === GeometryType.GEOMETRY_COLLECTION) {
    /** @type {GeometryCollection} */ (geometry)
      .getGeometriesArrayRecursive()
      .forEach(function (geometry) {
        const type = geometry.getType();
        if (type === GeometryType.MULTI_POINT) {
          geometries = geometries.concat(
            /** @type {MultiPoint} */ (geometry).getPoints()
          );
        } else if (type === GeometryType.MULTI_LINE_STRING) {
          geometries = geometries.concat(
            /** @type {MultiLineString} */ (geometry).getLineStrings()
          );
        } else if (type === GeometryType.MULTI_POLYGON) {
          geometries = geometries.concat(
            /** @type {MultiPolygon} */ (geometry).getPolygons()
          );
        } else if (
          type === GeometryType.POINT ||
          type === GeometryType.LINE_STRING ||
          type === GeometryType.POLYGON
        ) {
          geometries.push(geometry);
        } else {
          assert(false, 39); // Unknown geometry type
        }
      });
    factory = GEOMETRY_NODE_FACTORY;
  } else if (type === GeometryType.MULTI_POINT) {
    geometries = /** @type {MultiPoint} */ (geometry).getPoints();
    factory = POINT_NODE_FACTORY;
  } else if (type === GeometryType.MULTI_LINE_STRING) {
    geometries = /** @type {MultiLineString} */ (geometry).getLineStrings();
    factory = LINE_STRING_NODE_FACTORY;
  } else if (type === GeometryType.MULTI_POLYGON) {
    geometries = /** @type {MultiPolygon} */ (geometry).getPolygons();
    factory = POLYGON_NODE_FACTORY;
  } else {
    assert(false, 39); // Unknown geometry type
  }
  pushSerializeAndPop(
    context,
    MULTI_GEOMETRY_SERIALIZERS,
    factory,
    geometries,
    objectStack
  );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const BOUNDARY_IS_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'LinearRing': makeChildAppender(writePrimitiveGeometry),
});

/**
 * @param {Node} node Node.
 * @param {import("../geom/LinearRing.js").default} linearRing Linear ring.
 * @param {Array<*>} objectStack Object stack.
 */
function writeBoundaryIs(node, linearRing, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  pushSerializeAndPop(
    context,
    BOUNDARY_IS_SERIALIZERS,
    LINEAR_RING_NODE_FACTORY,
    [linearRing],
    objectStack
  );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const PLACEMARK_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'ExtendedData': makeChildAppender(writeExtendedData),
  'MultiGeometry': makeChildAppender(writeMultiGeometry),
  'LineString': makeChildAppender(writePrimitiveGeometry),
  'LinearRing': makeChildAppender(writePrimitiveGeometry),
  'Point': makeChildAppender(writePrimitiveGeometry),
  'Polygon': makeChildAppender(writePolygon),
  'Style': makeChildAppender(writeStyle),
  'address': makeChildAppender(writeStringTextNode),
  'description': makeChildAppender(writeStringTextNode),
  'name': makeChildAppender(writeStringTextNode),
  'open': makeChildAppender(writeBooleanTextNode),
  'phoneNumber': makeChildAppender(writeStringTextNode),
  'styleUrl': makeChildAppender(writeStringTextNode),
  'visibility': makeChildAppender(writeBooleanTextNode),
});

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const PLACEMARK_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'name',
  'open',
  'visibility',
  'address',
  'phoneNumber',
  'description',
  'styleUrl',
  'Style',
]);

/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array<*>): (Node|undefined)}
 */
const EXTENDEDDATA_NODE_FACTORY = makeSimpleNodeFactory('ExtendedData');

/**
 * FIXME currently we do serialize arbitrary/custom feature properties
 * (ExtendedData).
 * @param {Element} node Node.
 * @param {Feature} feature Feature.
 * @param {Array<*>} objectStack Object stack.
 * @this {KML}
 */
function writePlacemark(node, feature, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};

  // set id
  if (feature.getId()) {
    node.setAttribute('id', /** @type {string} */ (feature.getId()));
  }

  // serialize properties (properties unknown to KML are not serialized)
  const properties = feature.getProperties();

  // don't export these to ExtendedData
  const filter = {
    'address': 1,
    'description': 1,
    'name': 1,
    'open': 1,
    'phoneNumber': 1,
    'styleUrl': 1,
    'visibility': 1,
  };
  filter[feature.getGeometryName()] = 1;
  const keys = Object.keys(properties || {})
    .sort()
    .filter(function (v) {
      return !filter[v];
    });

  const styleFunction = feature.getStyleFunction();
  if (styleFunction) {
    // FIXME the styles returned by the style function are supposed to be
    // resolution-independent here
    const styles = styleFunction(feature, 0);
    if (styles) {
      const styleArray = Array.isArray(styles) ? styles : [styles];
      let pointStyles = styleArray;
      if (feature.getGeometry()) {
        pointStyles = styleArray.filter(function (style) {
          const geometry = style.getGeometryFunction()(feature);
          if (geometry) {
            const type = geometry.getType();
            if (type === GeometryType.GEOMETRY_COLLECTION) {
              return /** @type {GeometryCollection} */ (geometry)
                .getGeometriesArrayRecursive()
                .filter(function (geometry) {
                  const type = geometry.getType();
                  return (
                    type === GeometryType.POINT ||
                    type === GeometryType.MULTI_POINT
                  );
                }).length;
            }
            return (
              type === GeometryType.POINT || type === GeometryType.MULTI_POINT
            );
          }
        });
      }
      if (this.writeStyles_) {
        let lineStyles = styleArray;
        let polyStyles = styleArray;
        if (feature.getGeometry()) {
          lineStyles = styleArray.filter(function (style) {
            const geometry = style.getGeometryFunction()(feature);
            if (geometry) {
              const type = geometry.getType();
              if (type === GeometryType.GEOMETRY_COLLECTION) {
                return /** @type {GeometryCollection} */ (geometry)
                  .getGeometriesArrayRecursive()
                  .filter(function (geometry) {
                    const type = geometry.getType();
                    return (
                      type === GeometryType.LINE_STRING ||
                      type === GeometryType.MULTI_LINE_STRING
                    );
                  }).length;
              }
              return (
                type === GeometryType.LINE_STRING ||
                type === GeometryType.MULTI_LINE_STRING
              );
            }
          });
          polyStyles = styleArray.filter(function (style) {
            const geometry = style.getGeometryFunction()(feature);
            if (geometry) {
              const type = geometry.getType();
              if (type === GeometryType.GEOMETRY_COLLECTION) {
                return /** @type {GeometryCollection} */ (geometry)
                  .getGeometriesArrayRecursive()
                  .filter(function (geometry) {
                    const type = geometry.getType();
                    return (
                      type === GeometryType.POLYGON ||
                      type === GeometryType.MULTI_POLYGON
                    );
                  }).length;
              }
              return (
                type === GeometryType.POLYGON ||
                type === GeometryType.MULTI_POLYGON
              );
            }
          });
        }
        properties['Style'] = {
          pointStyles: pointStyles,
          lineStyles: lineStyles,
          polyStyles: polyStyles,
        };
      }
      if (pointStyles.length && properties['name'] === undefined) {
        const textStyle = pointStyles[0].getText();
        if (textStyle) {
          properties['name'] = textStyle.getText();
        }
      }
    }
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = PLACEMARK_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    PLACEMARK_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );

  if (keys.length > 0) {
    const sequence = makeSequence(properties, keys);
    const namesAndValues = {names: keys, values: sequence};
    pushSerializeAndPop(
      context,
      PLACEMARK_SERIALIZERS,
      EXTENDEDDATA_NODE_FACTORY,
      [namesAndValues],
      objectStack
    );
  }

  // serialize geometry
  const options = /** @type {import("./Feature.js").WriteOptions} */ (objectStack[0]);
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = transformGeometryWithOptions(geometry, true, options);
  }
  pushSerializeAndPop(
    context,
    PLACEMARK_SERIALIZERS,
    GEOMETRY_NODE_FACTORY,
    [geometry],
    objectStack
  );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const PRIMITIVE_GEOMETRY_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'extrude',
  'tessellate',
  'altitudeMode',
  'coordinates',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const PRIMITIVE_GEOMETRY_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'extrude': makeChildAppender(writeBooleanTextNode),
  'tessellate': makeChildAppender(writeBooleanTextNode),
  'altitudeMode': makeChildAppender(writeStringTextNode),
  'coordinates': makeChildAppender(writeCoordinatesTextNode),
});

/**
 * @param {Node} node Node.
 * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
function writePrimitiveGeometry(node, geometry, objectStack) {
  const flatCoordinates = geometry.getFlatCoordinates();
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  context['layout'] = geometry.getLayout();
  context['stride'] = geometry.getStride();

  // serialize properties (properties unknown to KML are not serialized)
  const properties = geometry.getProperties();
  properties.coordinates = flatCoordinates;

  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = PRIMITIVE_GEOMETRY_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    PRIMITIVE_GEOMETRY_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const POLY_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'color',
  'fill',
  'outline',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const POLYGON_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'outerBoundaryIs': makeChildAppender(writeBoundaryIs),
  'innerBoundaryIs': makeChildAppender(writeBoundaryIs),
});

/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const INNER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('innerBoundaryIs');

/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const OUTER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('outerBoundaryIs');

/**
 * @param {Node} node Node.
 * @param {Polygon} polygon Polygon.
 * @param {Array<*>} objectStack Object stack.
 */
function writePolygon(node, polygon, objectStack) {
  const linearRings = polygon.getLinearRings();
  const outerRing = linearRings.shift();
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  // inner rings
  pushSerializeAndPop(
    context,
    POLYGON_SERIALIZERS,
    INNER_BOUNDARY_NODE_FACTORY,
    linearRings,
    objectStack
  );
  // outer ring
  pushSerializeAndPop(
    context,
    POLYGON_SERIALIZERS,
    OUTER_BOUNDARY_NODE_FACTORY,
    [outerRing],
    objectStack
  );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const POLY_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'color': makeChildAppender(writeColorTextNode),
  'fill': makeChildAppender(writeBooleanTextNode),
  'outline': makeChildAppender(writeBooleanTextNode),
});

/**
 * @param {Node} node Node.
 * @param {Style} style Style.
 * @param {Array<*>} objectStack Object stack.
 */
function writePolyStyle(node, style, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const fill = style.getFill();
  const stroke = style.getStroke();
  const properties = {
    'color': fill ? fill.getColor() : undefined,
    'fill': fill ? undefined : false,
    'outline': stroke ? undefined : false,
  };
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = POLY_STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    POLY_STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @param {Node} node Node to append a TextNode with the scale to.
 * @param {number|undefined} scale Scale.
 */
function writeScaleTextNode(node, scale) {
  // the Math is to remove any excess decimals created by float arithmetic
  writeDecimalTextNode(node, Math.round(scale * 1e6) / 1e6);
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
  'IconStyle',
  'LabelStyle',
  'LineStyle',
  'PolyStyle',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
  'IconStyle': makeChildAppender(writeIconStyle),
  'LabelStyle': makeChildAppender(writeLabelStyle),
  'LineStyle': makeChildAppender(writeLineStyle),
  'PolyStyle': makeChildAppender(writePolyStyle),
});

/**
 * @param {Node} node Node.
 * @param {Object<string, Array<Style>>} styles Styles.
 * @param {Array<*>} objectStack Object stack.
 */
function writeStyle(node, styles, objectStack) {
  const /** @type {import("../xml.js").NodeStackItem} */ context = {node: node};
  const properties = {};
  if (styles.pointStyles.length) {
    const textStyle = styles.pointStyles[0].getText();
    if (textStyle) {
      properties['LabelStyle'] = textStyle;
    }
    const imageStyle = styles.pointStyles[0].getImage();
    if (
      imageStyle &&
      typeof (/** @type {?} */ (imageStyle).getSrc) === 'function'
    ) {
      properties['IconStyle'] = imageStyle;
    }
  }
  if (styles.lineStyles.length) {
    const strokeStyle = styles.lineStyles[0].getStroke();
    if (strokeStyle) {
      properties['LineStyle'] = strokeStyle;
    }
  }
  if (styles.polyStyles.length) {
    const strokeStyle = styles.polyStyles[0].getStroke();
    if (strokeStyle && !properties['LineStyle']) {
      properties['LineStyle'] = strokeStyle;
    }
    properties['PolyStyle'] = styles.polyStyles[0];
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = STYLE_SEQUENCE[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(
    context,
    STYLE_SERIALIZERS,
    OBJECT_PROPERTY_NODE_FACTORY,
    values,
    objectStack,
    orderedKeys
  );
}

/**
 * @param {Element} node Node to append a TextNode with the Vec2 to.
 * @param {Vec2} vec2 Vec2.
 */
function writeVec2(node, vec2) {
  node.setAttribute('x', String(vec2.x));
  node.setAttribute('y', String(vec2.y));
  node.setAttribute('xunits', vec2.xunits);
  node.setAttribute('yunits', vec2.yunits);
}

export default KML;
