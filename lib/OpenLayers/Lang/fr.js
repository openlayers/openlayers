/* Translators (2009 onwards):
 *  - Damouns
 *  - IAlex
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["fr"]
 * Dictionary for Français.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["fr"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Requête non gérée, retournant ${statusText}",

    'Permalink': "Permalien",

    'Overlays': "Calques",

    'Base Layer': "Calque de base",

    'noFID': "Impossible de mettre à jour un objet sans identifiant (fid).",

    'browserNotSupported': "Votre navigateur ne supporte pas le rendu vectoriel. Les renderers actuellement supportés sont : \n${renderers}",

    'minZoomLevelError': "La propriété minZoomLevel doit seulement être utilisée pour des couches FixedZoomLevels-descendent. Le fait que cette couche WFS vérifie la présence de minZoomLevel est une relique du passé. Nous ne pouvons toutefois la supprimer sans casser des applications qui pourraient en dépendre. C\'est pourquoi nous la déprécions -- la vérification du minZoomLevel sera supprimée en version 3.0. A la place, merci d\'utiliser les paramètres de résolutions min/max tel que décrit sur : http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transaction WFS : SUCCES ${response}",

    'commitFailed': "Transaction WFS : ECHEC ${response}",

    'googleWarning': "La couche Google n\'a pas été en mesure de se charger correctement.\x3cbr\x3e\x3cbr\x3ePour supprimer ce message, choisissez une nouvelle BaseLayer dans le sélecteur de couche en haut à droite.\x3cbr\x3e\x3cbr\x3eCela est possiblement causé par la non-inclusion de la librairie Google Maps, ou alors parce que la clé de l\'API ne correspond pas à votre site.\x3cbr\x3e\x3cbr\x3eDéveloppeurs : pour savoir comment corriger ceci, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3ecliquez ici\x3c/a\x3e",

    'getLayerWarning': "La couche ${layerType} n\'est pas en mesure de se charger correctement.\x3cbr\x3e\x3cbr\x3ePour supprimer ce message, choisissez une nouvelle BaseLayer dans le sélecteur de couche en haut à droite.\x3cbr\x3e\x3cbr\x3eCela est possiblement causé par la non-inclusion de la librairie ${layerLib}.\x3cbr\x3e\x3cbr\x3eDéveloppeurs : pour savoir comment corriger ceci, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3ecliquez ici\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Echelle ~ 1 : ${scaleDenom}",

    'W': "O",

    'E': "E",

    'N': "N",

    'S': "S",

    'reprojectDeprecated': "Vous utilisez l\'option \'reproject\' sur la couche ${layerName}. Cette option est dépréciée : Son usage permettait d\'afficher des données au dessus de couches raster commerciales.Cette fonctionalité est maintenant supportée en utilisant le support de la projection Mercator Sphérique. Plus d\'information est disponible sur http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Cette méthode est dépréciée, et sera supprimée à la version 3.0. Merci d\'utiliser ${newMethod} à la place."
});
