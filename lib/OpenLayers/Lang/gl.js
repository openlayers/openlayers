/* Translators (2009 onwards):
 *  - Toliño
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["gl"]
 * Dictionary for Galego.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["gl"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Solicitude non xerada; a resposta foi: ${statusText}",

    'Permalink': "Ligazón permanente",

    'Overlays': "Capas superpostas",

    'Base Layer': "Capa base",

    'readNotImplemented': "Lectura non implementada.",

    'writeNotImplemented': "Escritura non implementada.",

    'noFID': "Non se pode actualizar a funcionalidade para a que non hai FID.",

    'errorLoadingGML': "Erro ao cargar o ficheiro GML ${url}",

    'browserNotSupported': "O seu navegador non soporta a renderización de vectores. Os renderizadores soportados actualmente son:\n${renderers}",

    'componentShouldBe': "addFeatures: o compoñente debera ser de tipo ${geomType}",

    'getFeatureError': "getFeatureFromEvent ten sido chamado a unha capa sen renderizador. Isto normalmente significa que destruíu unha capa, mais non o executador que está asociado con ela.",

    'minZoomLevelError': "A propiedade minZoomLevel é só para uso conxuntamente coas capas FixedZoomLevels-descendent. O feito de que esa capa wfs verifique o minZoomLevel é unha reliquia do pasado. Non podemos, con todo, eliminala sen a posibilidade de non romper as aplicacións baseadas en OL que poidan depender dela. Por iso a estamos deixando obsoleta (a comprobación minZoomLevel de embaixo será eliminada na versión 3.0). Por favor, no canto diso use o axuste de resolución mín/máx tal e como está descrito aquí: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transacción WFS: ÉXITO ${response}",

    'commitFailed': "Transacción WFS: FALLIDA ${response}",

    'googleWarning': "A capa do Google non puido cargarse correctamente.\x3cbr\x3e\x3cbr\x3ePara evitar esta mensaxe, escolla unha nova capa base no seleccionador de capas na marxe superior dereita.\x3cbr\x3e\x3cbr\x3eProbablemente, isto acontece porque a escritura da libraría do Google Maps ou ben non foi incluída ou ben non contén a clave API correcta para o seu sitio.\x3cbr\x3e\x3cbr\x3eDesenvolvedores: para axudar a facer funcionar isto correctamente, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3epremede aquí\x3c/a\x3e",

    'getLayerWarning': "A capa ${layerType} foi incapaz de cargarse correctamente.\x3cbr\x3e\x3cbr\x3ePara evitar esta mensaxe, escolla unha nova capa base no seleccionador de capas na marxe superior dereita.\x3cbr\x3e\x3cbr\x3eProbablemente, isto acontece porque a escritura da libraría ${layerLib} non foi ben incluída.\x3cbr\x3e\x3cbr\x3eDesenvolvedores: para axudar a facer funcionar isto correctamente, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3epremede aquí\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Escala = 1 : ${scaleDenom}",

    'W': "O",

    'E': "L",

    'N': "N",

    'S': "S",

    'layerAlreadyAdded': "Intentou engadir a capa: ${layerName} ao mapa, pero xa fora engadida",

    'reprojectDeprecated': "Está usando a opción \"reproject\" na capa ${layerName}. Esta opción está obsoleta: o seu uso foi deseñado para a visualización de datos sobre mapas base comerciais, pero esta funcionalidade debera agora ser obtida utilizando a proxección Spherical Mercator. Hai dispoñible máis información en http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Este método está obsoleto e será eliminado na versión 3.0. Por favor, no canto deste use ${newMethod}.",

    'boundsAddError': "Debe achegar os valores x e y á función add.",

    'lonlatAddError': "Debe achegar tanto o valor lon coma o lat á función add.",

    'pixelAddError': "Debe achegar os valores x e y á función add.",

    'unsupportedGeometryType': "Tipo xeométrico non soportado: ${geomType}",

    'filterEvaluateNotImplemented': "avaliar non está implementado para este tipo de filtro."

});
