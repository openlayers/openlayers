/**
 * @module ol/format/IIIFInfo
 */

import {assert} from '../asserts.js';

/**
 * Supported image formats, qualities and supported region / size calculation features
 * for different image API versions and compliance levels
 * @const
 * @type {Object<string, Object<string, Array<string>>>}
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

function getComplianceLevelOfImageInfoForVersion(imageInfo, version) {
  switch (version) {
    case Versions.VERSION1:
    case Versions.VERSION3:
      return imageInfo.profile;
    case Versions.VERSION2:
      if (typeof imageInfo.profile === 'string') {
        return imageInfo.profile;
      }
      if (Array.isArray(imageInfo.profile) && imageInfo.profile.length > 0
        && typeof imageInfo.profile[0] === 'string') {
        return imageInfo.profile[0];
      }
      return;
    default:
  }
}

function getVersionOfImageInfo(imageInfo) {
  const context = imageInfo['@context'] || undefined;
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
      if (getComplianceLevelOfImageInfoForVersion(imageInfo, Versions.VERSION1)) {
        return Versions.VERSION1;
      }
      break;
    default:
  }
  assert(false, 61);
}

function getLevelProfileForImageInfo(imageInfo) {
  const version = getVersionOfImageInfo(imageInfo),
      complianceLevel = getComplianceLevelOfImageInfoForVersion(imageInfo, version);
  let level;
  if (version === undefined || complianceLevel === undefined) {
    return IIIF_PROFILE_VALUES.none;
  }
  level = complianceLevel.match(/level[0-2](\.json)?$/g);
  level = Array.isArray(level) ? level[0].replace('.json', '') : 'none';
  return IIIF_PROFILE_VALUES[version][level];
}

function generateVersion1Options(imageInfo) {
  const levelProfile = getLevelProfileForImageInfo(imageInfo);
  return {
    url: imageInfo['@id'].replace(/\/?(info.json)?$/g, ''),
    supports: levelProfile.supports,
    formats: [...levelProfile.formats, imageInfo.formats === undefined ?
      [] : imageInfo.formats
    ],
    qualities: [...levelProfile.qualities, imageInfo.qualities === undefined ?
      [] : imageInfo.qualities
    ],
    resolutions: imageInfo.scale_factors,
    tileSize: imageInfo.tile_width !== undefined ? imageInfo.tile_height != undefined ?
      [imageInfo.tile_width, imageInfo.tile_height] : [imageInfo.tile_width, imageInfo.tile_width] :
      imageInfo.tile_height != undefined ? [imageInfo.tile_height, imageInfo.tile_height] : undefined
  };
}

function generateVersion2Options(imageInfo) {
  const levelProfile = getLevelProfileForImageInfo(imageInfo),
      additionalProfile = Array.isArray(imageInfo.profile) && imageInfo.profile.length > 1,
      profileSupports = additionalProfile && imageInfo.profile[1].supports ? imageInfo.profile[1].supports : [],
      profileFormats = additionalProfile && imageInfo.profile[1].formats ? imageInfo.profile[1].formats : [],
      profileQualities = additionalProfile && imageInfo.profile[1].qualities ? imageInfo.profile[1].qualities : [],
      attributions = [];
  if (imageInfo.attribution !== undefined) {
    // TODO potentially dangerous
    attributions.push(imageInfo.attribution);
  }
  if (imageInfo.license !== undefined) {
    let license = imageInfo.license;
    if (license.match(/^http(s)?:\/\//g)) {
      license = '<a href="' + encodeURI(license) + '"/>' + encodeURI(license) + '</a>';
    }
    // TODO potentially dangerous
    attributions.push(license);
  }
  return {
    url: imageInfo['@id'].replace(/\/?(info.json)?$/g, ''),
    sizes: imageInfo.sizes === undefined ? undefined : imageInfo.sizes.map(function(size) {
      return [size.width, size.height];
    }),
    tileSize: imageInfo.tiles === undefined ? undefined : [
      imageInfo.tiles.map(function(tile) {
        return tile.width;
      })[0],
      imageInfo.tiles.map(function(tile) {
        return tile.height;
      })[0]
    ],
    resolutions: imageInfo.tiles === undefined ? undefined :
      imageInfo.tiles.map(function(tile) {
        return tile.scaleFactors;
      })[0],
    supports: [...levelProfile.supports, ...profileSupports],
    formats: [...levelProfile.formats, ...profileFormats],
    qualities: [...levelProfile.qualities, ...profileQualities],
    attributions: attributions.length == 0 ? undefined : attributions
  };
}

function generateVersion3Options(imageInfo) {
  const levelProfile = getLevelProfileForImageInfo(imageInfo);
  return {
    url: imageInfo['id'],
    sizes: imageInfo.sizes === undefined ? undefined : imageInfo.sizes.map(function(size) {
      return [size.width, size.height];
    }),
    tileSize: imageInfo.tiles === undefined ? undefined : [
      imageInfo.tiles.map(function(tile) {
        return tile.width;
      })[0],
      imageInfo.tiles.map(function(tile) {
        return tile.height;
      })[0]
    ],
    resolutions: imageInfo.tiles === undefined ? undefined :
      imageInfo.tiles.map(function(tile) {
        return tile.scaleFactors;
      })[0],
    supports: imageInfo.extraFeatures === undefined ? levelProfile.supports :
      [...levelProfile.supports, ...imageInfo.extraFeatures],
    formats: imageInfo.extraFormats === undefined ? levelProfile.formats :
      [...levelProfile.formats, ...imageInfo.extraFormats],
    qualities: imageInfo.extraQualities === undefined ? levelProfile.qualities :
      [...levelProfile.extraQualities, ...imageInfo.extraQualities],
    maxWidth: undefined,
    maxHeight: undefined,
    maxArea: undefined,
    attributions: undefined
  };
}

const versionFunctions = {};
versionFunctions[Versions.VERSION1] = generateVersion1Options;
versionFunctions[Versions.VERSION2] = generateVersion2Options;
versionFunctions[Versions.VERSION3] = generateVersion3Options;

function getOptionsForImageInformation(imageInfo, preferredOptions) {
  const options = preferredOptions || {},
      version = getVersionOfImageInfo(imageInfo),
      optionAttributions = options.attributions ? options.attributions : [],
      imageOptions = version === undefined ? undefined : versionFunctions[version](imageInfo);
  if (imageOptions === undefined) {
    return;
  }
  return {
    url: options.url ? options.url : imageOptions.url,
    version: version,
    size: [imageInfo.width, imageInfo.height],
    sizes: imageOptions.sizes,
    format: imageOptions.formats.includes(options.format) ? options.format : 'jpg',
    supports: imageOptions.supports,
    quality: options.quality && imageOptions.qualities.includes(options.quality) ?
      options.quality : imageOptions.qualities.includes('native') ? 'native' : 'default',
    resolutions: Array.isArray(imageOptions.resolutions) ? imageOptions.resolutions.sort(function(a, b) {
      return b - a;
    }) : undefined,
    tileSize: imageOptions.tileSize,
    attributions: [
      ...optionAttributions,
      ...(imageOptions.attributions === undefined ? [] : imageOptions.attributions)
    ]
  };
}

// TODO at the moment, this does not need to be a class.
class IIIFInfo {
  readFromJson(imageInfo, preferredOptions) {
    return getOptionsForImageInformation(imageInfo, preferredOptions);
  }
}

export default IIIFInfo;
