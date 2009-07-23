/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["en"]
 * Dictionary for English.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["en"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Unhandled request return ${statusText}",

    'permalink': "Permalink",

    'overlays': "Overlays",

    'baseLayer': "Base Layer",

    'sameProjection': "The overview map only works when it is in the same projection as the main map",

    'readNotImplemented': "Read not implemented.",

    'writeNotImplemented': "Write not implemented.",

    'noFID': "Can\'t update a feature for which there is no FID.",

    'errorLoadingGML': "Error in loading GML file ${url}",

    'browserNotSupported': "Your browser does not support vector rendering. Currently supported renderers are:\n${renderers}",

    'componentShouldBe': "addFeatures: component should be a ${geomType}",

    'getFeatureError': "getFeatureFromEvent has been called on a layer with no renderer. This usually means you destroyed a layer, but not some handler which is associated with it.",

    'minZoomLevelError': "The minZoomLevel property is only intended for use with the FixedZoomLevels-descendent layers. That this WFS layer checks for minZoomLevel is a relic of the past. We cannot, however, remove it without possibly breaking OpenLayers based applications that may depend on it. Therefore we are deprecating it -- the minZoomLevel check below will be removed at 3.0. Please instead use min/max resolution setting as described here: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: Success ${response}",

    'commitFailed': "WFS Transaction: Failed ${response}",

    'googleWarning': "The Google Layer was unable to load correctly.\x3cbr\x3e\x3cbr\x3eTo get rid of this message, select a new BaseLayer in the layer switcher in the upper-right corner.\x3cbr\x3e\x3cbr\x3eMost likely, this is because the Google Maps library script was either not included, or does not contain the correct API key for your site.\x3cbr\x3e\x3cbr\x3eDevelopers: See \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3ethe wiki\x3c/a\x3e for help getting this working correctly.",

    'getLayerWarning': "The ${layerType} layer was unable to load correctly.\x3cbr\x3e\x3cbr\x3eTo get rid of this message, select a new BaseLayer in the layer switcher in the upper-right corner.\x3cbr\x3e\x3cbr\x3eMost likely, this is because the ${layerLib} library script was not correctly included.\x3cbr\x3e\x3cbr\x3eDevelopers: See \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3ethe wiki\x3c/a\x3e for help getting this working correctly.",

    'scale': "Scale = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "You tried to add the layer: ${layerName} to the map, but it has already been added",

    'reprojectDeprecated': "You are using the \'reproject\' option on the ${layerName} layer. This option is deprecated: its use was designed to support displaying data over commercial basemaps, but that functionality should now be achieved by using Spherical Mercator support. More information is available from http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "This method has been deprecated and will be removed in 3.0. Please use ${newMethod} instead.",

    'boundsAddError': "You must pass both x and y values to the add function.",

    'lonlatAddError': "You must pass both lon and lat values to the add function.",

    'pixelAddError': "You must pass both x and y values to the add function.",

    'unsupportedGeometryType': "Unsupported geometry type: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition failed: element with id ${elemId} may be misplaced.",

    'filterEvaluateNotImplemented': "\'evaluate\' is not implemented for this filter type.",

};
