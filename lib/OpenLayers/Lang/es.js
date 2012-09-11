/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["es"]
 * Dictionary for Spanish, UTF8 encoding. Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang.es = {

    'unhandledRequest': "Respuesta a petición no gestionada ${statusText}",

    'Permalink': "Enlace permanente",

    'Overlays': "Capas superpuestas",

    'Base Layer': "Capa Base",

    'noFID': "No se puede actualizar un elemento para el que no existe FID.",

    'browserNotSupported':
        "Su navegador no soporta renderización vectorial. Los renderizadores soportados actualmente son:\n${renderers}",

    // console message
    'minZoomLevelError':
        "La propiedad minZoomLevel debe sólo utilizarse " +
        "con las capas que tienen FixedZoomLevels. El hecho de que " +
        "una capa wfs compruebe minZoomLevel es una reliquia del " +
        "pasado. Sin embargo, no podemos eliminarla sin discontinuar " +
        "probablemente las aplicaciones OL que puedan depender de ello. " +
        "Así pues estamos haciéndolo obsoleto --la comprobación " +
        "minZoomLevel se eliminará en la versión 3.0. Utilice el ajuste " +
        "de resolution min/max en su lugar, tal como se describe aquí: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transacción WFS: ÉXITO ${response}",

    'commitFailed': "Transacción WFS: FALLÓ ${response}",

    'googleWarning':
        "La capa Google no pudo ser cargada correctamente.<br><br>" +
        "Para evitar este mensaje, seleccione una nueva Capa Base " +
        "en el selector de capas en la esquina superior derecha.<br><br>" +
        "Probablemente, esto se debe a que el script de la biblioteca de " +
        "Google Maps no fue correctamente incluido en su página, o no " +
        "contiene la clave del API correcta para su sitio.<br><br>" +
        "Desarrolladores: Para ayudar a hacer funcionar esto correctamente, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>haga clic aquí</a>",

    'getLayerWarning':
        "La capa ${layerType} no pudo ser cargada correctamente.<br><br>" +
        "Para evitar este mensaje, seleccione una nueva Capa Base " +
        "en el selector de capas en la esquina superior derecha.<br><br>" +
        "Probablemente, esto se debe a que el script de " +
        "la biblioteca ${layerLib} " +
        "no fue correctamente incluido en su página.<br><br>" +
        "Desarrolladores: Para ayudar a hacer funcionar esto correctamente, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>haga clic aquí</a>",

    'Scale = 1 : ${scaleDenom}': "Escala = 1 : ${scaleDenom}",

    //labels for the graticule control
    'W': 'O',
    'E': 'E',
    'N': 'N',
    'S': 'S',
    'Graticule': 'Retícula',
    
    // console message
    'reprojectDeprecated':
        "Está usando la opción 'reproject' en la capa " +
        "${layerName}. Esta opción es obsoleta: su uso fue diseñado " +
        "para soportar la visualización de datos sobre mapas base comerciales, " + 
        "pero ahora esa funcionalidad debería conseguirse mediante el soporte " +
        "de la proyección Spherical Mercator. Más información disponible en " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Este método es obsoleto y se eliminará en la versión 3.0. " +
        "Por favor utilice el método ${newMethod} en su lugar.",

    // **** end ****
    'end': ''

};
