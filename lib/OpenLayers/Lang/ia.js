/* Translators (2009 onwards):
 *  - McDutchie
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["ia"]
 * Dictionary for Interlingua.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["ia"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Le responsa a un requesta non esseva maneate: ${statusText}",

    'Permalink': "Permaligamine",

    'Overlays': "Superpositiones",

    'Base Layer': "Strato de base",

    'noFID': "Non pote actualisar un elemento sin FID.",

    'browserNotSupported': "Tu navigator non supporta le rendition de vectores. Le renditores actualmente supportate es:\n${renderers}",

    'minZoomLevelError': "Le proprietate minZoomLevel es solmente pro uso con le stratos descendente de FixedZoomLevels. Le facto que iste strato WFS verifica minZoomLevel es un reliquia del passato. Nonobstante, si nos lo remove immediatemente, nos pote rumper applicationes a base de OL que depende de illo. Ergo nos lo declara obsolete; le verification de minZoomLevel in basso essera removite in version 3.0. Per favor usa in su loco le configuration de resolutiones min/max como describite a: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transaction WFS: SUCCESSO ${response}",

    'commitFailed': "Transaction WFS: FALLEVA ${response}",

    'googleWarning': "Le strato Google non poteva esser cargate correctemente.\x3cbr\x3e\x3cbr\x3ePro disfacer te de iste message, selige un nove BaseLayer in le selector de strato in alto a dextra.\x3cbr\x3e\x3cbr\x3eMulto probabilemente, isto es proque le script del libreria de Google Maps non esseva includite o non contine le clave API correcte pro tu sito.\x3cbr\x3e\x3cbr\x3eDisveloppatores: Pro adjuta de corriger isto, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eclicca hic\x3c/a",

    'getLayerWarning': "Le strato ${layerType} non poteva esser cargate correctemente.\x3cbr\x3e\x3cbr\x3ePro disfacer te de iste message, selige un nove BaseLayer in le selector de strato in alto a dextra.\x3cbr\x3e\x3cbr\x3eMulto probabilemente, isto es proque le script del libreria de ${layerLib} non esseva correctemente includite.\x3cbr\x3e\x3cbr\x3eDisveloppatores: Pro adjuta de corriger isto, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eclicca hic\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Scala = 1 : ${scaleDenom}",

    'W': "W",

    'E': "E",

    'N': "N",

    'S': "S",

    'reprojectDeprecated': "Tu usa le option \'reproject\' in le strato ${layerName} layer. Iste option es obsolescente: illo esseva pro poter monstrar datos super cartas de base commercial, ma iste functionalitate pote ora esser attingite con le uso de Spherical Mercator. Ulterior information es disponibile a http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Iste methodo ha essite declarate obsolescente e essera removite in version 3.0. Per favor usa ${newMethod} in su loco."

});
