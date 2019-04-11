/**
 * @module ol/format/IIIFInfo
 */

import {assert} from '../asserts.js';


/**
 * @typedef {Object} PreferredOptions
 * @property {string} [format] Preferred image format. Will be used if the image information
 * indicates support for that format.
 * @property {string} [quality] IIIF image qualitiy.  Will be used if the image information
 * indicates support for that quality.
 */

/**
 * @typedef {Object} SupportedFeatures
 * @property {Array<string>} [supports] Supported IIIF image size and region
 * calculation features.
 * @property {Array<string>} [formats] Supported image formats.
 * @property {Array<string>} [qualities] Supported IIIF image qualities.
 */

/**
 * Supported image formats, qualities and supported region / size calculation features
 * for different image API versions and compliance levels
 * @const
 * @type {Object<string, Object<string, SupportedFeatures>}
 */
const IIIF_PROFILE_VALUES = {
  version1: {
    level0: {
      supports: [],
      formats: [],
      qualities: ['native']
    },
    level1: {
      supports: ['regionByPx', 'sizeByW', 'sizeByH', 'sizeByPct'],
      formats: ['jpg'],
      qualities: ['native']
    },
    level2: {
      supports: ['regionByPx', 'regionByPct', 'sizeByW', 'sizeByH', 'sizeByPct',
        'sizeByConfinedWh', 'sizeByWh'],
      formats: ['jpg', 'png'],
      qualities: ['native', 'color', 'grey', 'bitonal']
    }
  },
  version2: {
    level0: {
      supports: [],
      formats: ['jpg'],
      qualities: ['default']
    },
    level1: {
      supports: ['regionByPx', 'sizeByW', 'sizeByH', 'sizeByPct'],
      formats: ['jpg'],
      qualities: ['default']
    },
    level2: {
      supports: ['regionByPx', 'regionByPct', 'sizeByW', 'sizeByH', 'sizeByPct',
        'sizeByConfinedWh', 'sizeByDistortedWh', 'sizeByWh'],
      formats: ['jpg', 'png'],
      qualities: ['default', 'bitonal']
    }
  },
  version3: {
    level0: {
      supports: [],
      formats: ['jpg'],
      qualities: ['default']
    },
    level1: {
      supports: ['regionByPx', 'regionSquare', 'sizeByW', 'sizeByH'],
      formats: ['jpg'],
      qualities: ['default']
    },
    level2: {
      supports: ['regionByPx', 'regionSquare', 'regionByPct',
        'sizeByW', 'sizeByH', 'sizeByPct', 'sizeByConfinedWh', 'sizeByWh'],
      formats: ['jpg'],
      qualities: ['default', 'bitonal']
    }
  },
  none: {
    supports: [],
    formats: [],
    qualities: []
  }
};

/**
 * @enum {string}
 */
export const Versions = {
  VERSION1: 'version1',
  VERSION2: 'version2',
  VERSION3: 'version3'
};

const COMPLIANCE_VERSION1 = new RegExp('^https?\:\/\/library\.stanford\.edu\/iiif\/image-api\/(1\.1\/)?compliance\.html#level[0-2]$');
const COMPLIANCE_VERSION2 = new RegExp('^https?\:\/\/iiif\.io\/api\/image\/2\/level[0-2](\.json)?$');
const COMPLIANCE_VERSION3 = new RegExp('(^https?\:\/\/iiif\.io\/api\/image\/3\/level[0-2](\.json)?$)|(^level[0-2]$)');

/**
 * @classdesc
 * Format for transforming IIIF Image API image information responses into
 * IIIF tile source ready options
 *
 * @api
 */
class IIIFInfo {

  /**
   * @param {Object|string} imageInfo Deserialized image information JSON response
   * object or JSON response as string
   */
  constructor(imageInfo) {
    this.setImageInfo(imageInfo);
    this.versionFunctions = {};
    this.versionFunctions[Versions.VERSION1] = this.generateVersion1Options.bind(this);
    this.versionFunctions[Versions.VERSION2] = this.generateVersion2Options.bind(this);
    this.versionFunctions[Versions.VERSION3] = this.generateVersion3Options.bind(this);
  }

  /**
   * @param {Object|string} imageInfo Deserialized image information JSON response
   * object or JSON response as string
   */
  setImageInfo(imageInfo) {
    if (typeof imageInfo == 'string') {
      this.imageInfo = JSON.parse(imageInfo);
    } else {
      this.imageInfo = imageInfo;
    }
  }

  /**
   * @returns {Versions} Major IIIF version.
   */
  getImageApiVersion() {
    if (this.imageInfo === undefined) {
      return;
    }
    const context = this.imageInfo['@context'] || undefined;
    switch (context) {
      case 'http://library.stanford.edu/iiif/image-api/1.1/context.json':
      case 'http://iiif.io/api/image/1/context.json':
        return Versions.VERSION1;
      case 'http://iiif.io/api/image/2/context.json':
        return Versions.VERSION2;
      case 'http://iiif.io/api/image/3/context.json':
        return Versions.VERSION3;
      case undefined:
        // Image API 1.0 has no '@context'
        if (this.getComplianceLevelEntryFromProfile(Versions.VERSION1) && this.imageInfo.identifier) {
          return Versions.VERSION1;
        }
        break;
      default:
    }
    assert(false, 61);
  }

  /**
   * @param {Versions} version Optional IIIF image API version
   * @returns {string} Compliance level as it appears in the IIIF image information
   * response.
   */
  getComplianceLevelEntryFromProfile(version) {
    if (this.imageInfo === undefined || this.imageInfo.profile === undefined) {
      return;
    }
    if (version === undefined) {
      version = this.getImageApiVersion();
    }
    switch (version) {
      case Versions.VERSION1:
        if (COMPLIANCE_VERSION1.test(this.imageInfo.profile)) {
          return this.imageInfo.profile;
        }
        break;
      case Versions.VERSION3:
        if (COMPLIANCE_VERSION3.test(this.imageInfo.profile)) {
          return this.imageInfo.profile;
        }
        break;
      case Versions.VERSION2:
        if (typeof this.imageInfo.profile === 'string' && COMPLIANCE_VERSION2.test(this.imageInfo.profile)) {
          return this.imageInfo.profile;
        }
        if (Array.isArray(this.imageInfo.profile) && this.imageInfo.profile.length > 0
          && typeof this.imageInfo.profile[0] === 'string' && COMPLIANCE_VERSION2.test(this.imageInfo.profile[0])) {
          return this.imageInfo.profile[0];
        }
        break;
      default:
    }
  }

  /**
   * @param {Versions} version Optional IIIF image API version
   * @returns {string} Compliance level, on of 'level0', 'level1' or 'level2' or undefined
   */
  getComplianceLevelFromProfile(version) {
    const complianceLevel = this.getComplianceLevelEntryFromProfile(version);
    if (complianceLevel === undefined) {
      return undefined;
    }
    const level = complianceLevel.match(/level[0-2](\.json)?$/g);
    return Array.isArray(level) ? level[0].replace('.json', '') : 'none';
  }

  /**
   * @returns {SupportedFeatures} Image formats, qualities and region / size calculation
   * methods that are supported by the IIIF service.
   */
  getComplianceLevelSupportedFeatures() {
    if (this.imageInfo === undefined) {
      return;
    }
    const version = this.getImageApiVersion();
    const level = this.getComplianceLevelFromProfile(version);
    if (level === undefined) {
      return IIIF_PROFILE_VALUES.none;
    }
    return IIIF_PROFILE_VALUES[version][level];
  }

  /**
   * @param {PreferredOptions} opt_preferredOptions Optional options for preferred format and quality.
   * @returns {import("../source/IIIF.js").Options} IIIF tile source ready constructor options.
   */
  getTileSourceOptions(opt_preferredOptions) {
    const options = opt_preferredOptions || {},
        version = this.getImageApiVersion();
    if (version === undefined) {
      return;
    }
    const imageOptions = version === undefined ? undefined : this.versionFunctions[version]();
    if (imageOptions === undefined) {
      return;
    }
    return {
      url: imageOptions.url,
      version: version,
      size: [this.imageInfo.width, this.imageInfo.height],
      sizes: imageOptions.sizes,
      format: imageOptions.formats.includes(options.format) ? options.format : 'jpg',
      supports: imageOptions.supports,
      quality: options.quality && imageOptions.qualities.includes(options.quality) ?
        options.quality : imageOptions.qualities.includes('native') ? 'native' : 'default',
      resolutions: Array.isArray(imageOptions.resolutions) ? imageOptions.resolutions.sort(function(a, b) {
        return b - a;
      }) : undefined,
      tileSize: imageOptions.tileSize,
      attributions: imageOptions.attributions
    };
  }

  /**
   * @private
   * @returns {object} Available options
   */
  generateVersion1Options() {
    let levelProfile = this.getComplianceLevelSupportedFeatures();
    // Version 1.0 and 1.1 do not require a profile.
    if (levelProfile === undefined) {
      levelProfile = IIIF_PROFILE_VALUES.version1.level0;
    }
    return {
      url: this.imageInfo['@id'] === undefined ? undefined : this.imageInfo['@id'].replace(/\/?(info.json)?$/g, ''),
      supports: levelProfile.supports,
      formats: [...levelProfile.formats, this.imageInfo.formats === undefined ?
        [] : this.imageInfo.formats
      ],
      qualities: [...levelProfile.qualities, this.imageInfo.qualities === undefined ?
        [] : this.imageInfo.qualities
      ],
      resolutions: this.imageInfo.scale_factors,
      tileSize: this.imageInfo.tile_width !== undefined ? this.imageInfo.tile_height != undefined ?
        [this.imageInfo.tile_width, this.imageInfo.tile_height] : [this.imageInfo.tile_width, this.imageInfo.tile_width] :
        this.imageInfo.tile_height != undefined ? [this.imageInfo.tile_height, this.imageInfo.tile_height] : undefined
    };
  }

  /**
   * @private
   * @returns {object} Available options
   */
  generateVersion2Options() {
    const levelProfile = this.getComplianceLevelSupportedFeatures(),
        additionalProfile = Array.isArray(this.imageInfo.profile) && this.imageInfo.profile.length > 1,
        profileSupports = additionalProfile && this.imageInfo.profile[1].supports ? this.imageInfo.profile[1].supports : [],
        profileFormats = additionalProfile && this.imageInfo.profile[1].formats ? this.imageInfo.profile[1].formats : [],
        profileQualities = additionalProfile && this.imageInfo.profile[1].qualities ? this.imageInfo.profile[1].qualities : [],
        attributions = [];
    if (this.imageInfo.attribution !== undefined) {
      // TODO potentially dangerous
      attributions.push(this.imageInfo.attribution);
    }
    if (this.imageInfo.license !== undefined) {
      let license = this.imageInfo.license;
      if (license.match(/^http(s)?:\/\//g)) {
        license = '<a href="' + encodeURI(license) + '"/>' + encodeURI(license) + '</a>';
      }
      // TODO potentially dangerous
      attributions.push(license);
    }
    return {
      url: this.imageInfo['@id'].replace(/\/?(info.json)?$/g, ''),
      sizes: this.imageInfo.sizes === undefined ? undefined : this.imageInfo.sizes.map(function(size) {
        return [size.width, size.height];
      }),
      tileSize: this.imageInfo.tiles === undefined ? undefined : [
        this.imageInfo.tiles.map(function(tile) {
          return tile.width;
        })[0],
        this.imageInfo.tiles.map(function(tile) {
          return tile.height;
        })[0]
      ],
      resolutions: this.imageInfo.tiles === undefined ? undefined :
        this.imageInfo.tiles.map(function(tile) {
          return tile.scaleFactors;
        })[0],
      supports: [...levelProfile.supports, ...profileSupports],
      formats: [...levelProfile.formats, ...profileFormats],
      qualities: [...levelProfile.qualities, ...profileQualities],
      attributions: attributions.length == 0 ? undefined : attributions
    };
  }

  /**
   * @ignore
   * @private
   * @returns {object} Available options
   */
  generateVersion3Options() {
    const levelProfile = this.getComplianceLevelSupportedFeatures();
    return {
      url: this.imageInfo['id'],
      sizes: this.imageInfo.sizes === undefined ? undefined : this.imageInfo.sizes.map(function(size) {
        return [size.width, size.height];
      }),
      tileSize: this.imageInfo.tiles === undefined ? undefined : [
        this.imageInfo.tiles.map(function(tile) {
          return tile.width;
        })[0],
        this.imageInfo.tiles.map(function(tile) {
          return tile.height;
        })[0]
      ],
      resolutions: this.imageInfo.tiles === undefined ? undefined :
        this.imageInfo.tiles.map(function(tile) {
          return tile.scaleFactors;
        })[0],
      supports: this.imageInfo.extraFeatures === undefined ? levelProfile.supports :
        [...levelProfile.supports, ...this.imageInfo.extraFeatures],
      formats: this.imageInfo.extraFormats === undefined ? levelProfile.formats :
        [...levelProfile.formats, ...this.imageInfo.extraFormats],
      qualities: this.imageInfo.extraQualities === undefined ? levelProfile.qualities :
        [...levelProfile.extraQualities, ...this.imageInfo.extraQualities],
      maxWidth: undefined,
      maxHeight: undefined,
      maxArea: undefined,
      attributions: undefined
    };
  }

}

export default IIIFInfo;
