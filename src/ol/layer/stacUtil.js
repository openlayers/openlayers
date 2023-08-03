import VectorLayer from './Vector.js';
import {Fill, Stroke, Style} from '../style.js';
import {STAC} from 'stac-js';
import {WMTSCapabilities} from '../format.js';
import {
  fromEPSGCode,
  isRegistered as isProj4Registered,
} from '../proj/proj4.js';

export const defaultBoundsStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.4)',
  }),
  stroke: new Stroke({
    color: '#3399CC',
    width: 3,
  }),
});

export const defaultCollectionStyle = new Style({
  stroke: new Stroke({
    color: '#ff9933',
    width: 1,
  }),
});

/**
 * Get the STAC objects associated with this event, if any. Excludes API Collections.
 * @param {import('../MapBrowserEvent.js').default} event The asset to read the information from.
 * @return {Promise<Array<STAC>>} A list of STAC objects
 */
export async function getStacObjectsForEvent(event) {
  const objects = event.map
    .getAllLayers()
    .filter((layer) => {
      if (
        layer instanceof VectorLayer &&
        layer.get('bounds') === true &&
        layer.get('stac') instanceof STAC
      ) {
        const features = layer
          .getSource()
          .getFeaturesAtCoordinate(event.coordinate);
        return features.length > 0;
      }
      return false;
    })
    .map((layer) => layer.get('stac'));
  // Make sure we return no duplicates
  return [...new Set(objects)];
}

/**
 * Get the source info for the GeoTiff from the asset.
 * @param {import('stac-js').Asset} asset The asset to read the information from.
 * @param {Array<number>} bands The (one-based) bands to show.
 * @return {import('../source/GeoTIFF.js').SourceInfo} The source info for the GeoTiff asset
 */
export function getGeoTiffSourceInfoFromAsset(asset, bands) {
  const sourceInfo = {
    url: asset.getAbsoluteUrl(),
  };

  let band = null;
  // If there's just one band, we can also read the information from there.
  if (asset.getBands().length === 1) {
    band = 0;
  }

  // TODO: It would be useful if OL would allow min/max values per band
  const {minimum, maximum} = asset.getMinMaxValues(band);
  if (typeof minimum === 'number') {
    sourceInfo.min = minimum;
  }
  if (typeof maximum === 'number') {
    sourceInfo.max = maximum;
  }

  // TODO: It would be useful if OL would allow multiple no-data values
  const nodata = asset.getNoDataValues(band);
  if (nodata.length > 0) {
    sourceInfo.nodata = nodata[0];
  } else {
    sourceInfo.nodata = NaN; // NaN is usually a reasonable default if nothing is provided
  }

  if (bands.length > 0) {
    sourceInfo.bands = bands;
  }

  return sourceInfo;
}

/**
 * Gets the projection from the asset or link.
 * @param {import('stac-js').STACReference} reference The asset or link to read the information from.
 * @param {import('../proj.js').ProjectionLike} defaultProjection A default projection to use.
 * @return {Promise<import('../proj.js').ProjectionLike>} The projection, if any.
 */
export async function getProjection(reference, defaultProjection = undefined) {
  let projection = defaultProjection;
  if (isProj4Registered()) {
    // TODO: It would be great to handle WKT2 and PROJJSON, but is not supported yet by proj4js.
    const epsgCode = reference.getMetadata('proj:epsg');
    if (epsgCode) {
      try {
        projection = await fromEPSGCode(epsgCode);
      } catch (_) {
        // pass
      }
    }
  }
  return projection;
}

/**
 * Returns the style for the footprint.
 * Removes the fill if anything is meant to be shown in the bounds.
 *
 * @param {Style} [originalStyle] The original style for the footprint.
 * @param {import('./STAC.js').default} [layerGroup] The associated STAC layergroup to check.
 * @return {Style} The adapted style for the footprint.
 */
export function getBoundsStyle(originalStyle, layerGroup) {
  const style = originalStyle.clone();
  if (!layerGroup.hasOnlyBounds()) {
    style.setFill(null);
  }
  return style;
}

/**
 * Get a URL from a web-map-link that is specific enough, i.e.
 * replaces any occurances of {s} if possible, otherwise returns null.
 * @param {import('./STAC.js').Link} link The web map link.
 * @return {string|null} Specific URL
 */
export function getSpecificWebMapUrl(link) {
  let url = link.href;
  if (url.includes('{s}')) {
    if (
      Array.isArray(link['href:servers']) &&
      link['href:servers'].length > 0
    ) {
      const i = (Math.random() * link['href:servers'].length) | 0;
      url = url.replace('{s}', link['href:servers'][i]);
    } else {
      return null;
    }
  }
  return url;
}

/**
 * Gets the WMTS capabilities from the given web-map-links URL.
 * @param {string} url Base URL for the WMTS
 * @return {Promise<Object|null>} Resolves with the WMTS Capabilities object
 */
export async function getWmtsCapabilities(url) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('service', 'wmts');
    urlObj.searchParams.set('request', 'GetCapabilities');
    const response = await fetch(urlObj);
    return new WMTSCapabilities().read(await response.text());
  } catch (error) {
    return null;
  }
}
