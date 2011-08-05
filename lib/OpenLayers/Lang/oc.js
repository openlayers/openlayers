/* Translators (2009 onwards):
 *  - Cedric31
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["oc"]
 * Dictionary for Occitan.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["oc"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Requèsta pas gerida, retorna ${statusText}",

    'Permalink': "Permaligam",

    'Overlays': "Calques",

    'Base Layer': "Calc de basa",

    'readNotImplemented': "Lectura pas implementada.",

    'writeNotImplemented': "Escritura pas implementada.",

    'noFID': "Impossible de metre a jorn un objècte sens identificant (fid).",

    'errorLoadingGML': "Error al cargament del fichièr GML ${url}",

    'browserNotSupported': "Vòstre navegidor supòrta pas lo rendut vectorial. Los renderers actualament suportats son : \n${renderers}",

    'componentShouldBe': "addFeatures : lo compausant deuriá èsser de tipe ${geomType}",

    'getFeatureError': "getFeatureFromEvent es estat apelat sus un calc sens renderer. Aquò significa generalament qu\'avètz destruch aqueste jaç, mas qu\'avètz conservat un handler que li èra associat.",

    'minZoomLevelError': "La proprietat minZoomLevel deu èsser utilizada solament per de jaces FixedZoomLevels-descendent. Lo fach qu\'aqueste jaç WFS verifique la preséncia de minZoomLevel es una relica del passat. Çaquelà, la podèm suprimir sens copar d\'aplicacions que ne poirián dependre. Es per aquò que la depreciam -- la verificacion del minZoomLevel serà suprimida en version 3.0. A la plaça, mercés d\'utilizar los paramètres de resolucions min/max tal coma descrich sus : http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transaccion WFS : SUCCES ${response}",

    'commitFailed': "Transaccion WFS : FRACAS ${response}",

    'googleWarning': "Lo jaç Google es pas estat en mesura de se cargar corrèctament.\x3cbr\x3e\x3cbr\x3ePer suprimir aqueste messatge, causissètz una BaseLayer novèla dins lo selector de jaç en naut a drecha.\x3cbr\x3e\x3cbr\x3eAquò es possiblament causat par la non-inclusion de la librariá Google Maps, o alara perque que la clau de l\'API correspond pas a vòstre site.\x3cbr\x3e\x3cbr\x3eDesvolopaires : per saber cossí corregir aquò, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eclicatz aicí\x3c/a\x3e",

    'getLayerWarning': "Lo jaç ${layerType} es pas en mesura de se cargar corrèctament.\x3cbr\x3e\x3cbr\x3ePer suprimir aqueste messatge, causissètz una  BaseLayer novèla dins lo selector de jaç en naut a drecha.\x3cbr\x3e\x3cbr\x3eAquò es possiblament causat per la non-inclusion de la librariá ${layerLib}.\x3cbr\x3e\x3cbr\x3eDesvolopaires : per saber cossí corregir aquí, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eclicatz aicí\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Escala ~ 1 : ${scaleDenom}",

    'W': "O",

    'E': "È",

    'N': "N",

    'S': "S",

    'layerAlreadyAdded': "Avètz ensajat d\'apondre a la carta lo calc : ${layerName}, mas ja es present",

    'reprojectDeprecated': "Utilizatz l\'opcion \'reproject\' sul jaç ${layerName}. Aquesta opcion es despreciada : Son usatge permetiá d\'afichar de donadas al dessús de jaces raster comercials. Aquesta foncionalitat ara es suportada en utilizant lo supòrt de la projeccion Mercator Esferica. Mai d\'informacion es disponibla sus http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Aqueste metòde es despreciada, e serà suprimida a la version 3.0. Mercés d\'utilizar ${newMethod} a la plaça.",

    'boundsAddError': "Vos cal passar las doas valors x e y a la foncion add.",

    'lonlatAddError': "Vos cal passar las doas valors lon e lat a la foncion add.",

    'pixelAddError': "Vos cal passar las doas valors x e y a la foncion add.",

    'unsupportedGeometryType': "Tipe de geometria pas suportat : ${geomType}",

    'filterEvaluateNotImplemented': "evaluar es pas encara estat implementat per aqueste tipe de filtre."

});
