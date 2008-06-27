/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["fr"]
 * Dictionary for French.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang.fr = {

    'unhandledRequest': "Requête non gérée, retournant ${statusText}",

    'permalink': "Permalien",

    'overlays': "Calques",

    'baseLayer': "Calque de base",

    'sameProjection':
        "La carte de situation ne fonctionne que lorsque sa projection est la même que celle de la carte principale",

    'readNotImplemented': "Lecture non implémentée.",

    'writeNotImplemented': "Ecriture non implémentée.",

    'noFID': "Impossible de mettre à jour un objet sans identifiant (fid).",

    'errorLoadingGML': "Erreur au chargement du fichier GML ${url}",

    'browserNotSupported':
        "Votre navigateur ne supporte pas le rendu vectoriel. Les renderers actuellement supportés sont : \n${renderers}",

    'componentShouldBe': "addFeatures : le composant devrait être de type ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent a été appelé sur un calque sans renderer. Cela signifie généralement que vous " +
        "avez détruit cette couche, mais que vous avez conservé un handler qui lui était associé.",

    // console message
    'minZoomLevelError':
        "La propriété minZoomLevel doit seulement être utilisée " +
        "pour des couches FixedZoomLevels-descendent. Le fait que " +
        "cette couche WFS vérifie la présence de minZoomLevel " +
        "est une relique du passé. Nous ne pouvons toutefois la " +
        "supprimer sans casser des applications qui pourraient en dépendre." +
        " C'est pourquoi nous la déprécions -- la vérification du minZoomLevel " +
        "sera supprimée en version 3.0. A la place, merci d'utiliser " +
        "les paramètres de résolutions min/max tel que décrit sur : " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transaction WFS : SUCCES ${response}",

    'commitFailed': "Transaction WFS : ECHEC ${response}",

    'googleWarning':
        "La couche Google n'a pas été en mesure de se charger correctement.<br><br>" +
        "Pour supprimer ce message, choisissez une nouvelle BaseLayer " +
        "dans le sélecteur de couche en haut à droite.<br><br>" +
        "Cela est possiblement causé par la non-inclusion de la " +
        "librairie Google Maps, ou alors parce que la clé de l'API " +
        "ne correspond pas à votre site.<br><br>" +
        "Développeurs : pour savoir comment corriger ceci, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>cliquez ici</a>",

    'getLayerWarning':
        "La couche ${layerType} n'est pas en mesure de se charger correctement.<br><br>" +
        "Pour supprimer ce message, choisissez une nouvelle BaseLayer " +
        "dans le sélecteur de couche en haut à droite.<br><br>" +
        "Cela est possiblement causé par la non-inclusion de la " +
        "librairie ${layerLib}.<br><br>" +
        "Développeurs : pour savoir comment corriger ceci, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>cliquez ici</a>",

    'scale': "Echelle ~ 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Vous avez essayé d'ajouter à la carte le calque : ${layerName}, mais il est déjà présent",

    // console message
    'reprojectDeprecated':
        "Vous utilisez l'option 'reproject' " +
        "sur la couche ${layerName}. Cette option est dépréciée : " +
        "Son usage permettait d'afficher des données au dessus de couches raster commerciales." + 
        "Cette fonctionalité est maintenant supportée en utilisant le support de la projection " +
        "Mercator Sphérique. Plus d'information est disponible sur " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Cette méthode est dépréciée, et sera supprimée à la version 3.0. " +
        "Merci d'utiliser ${newMethod} à la place.",

    // console message
    'boundsAddError': "Vous devez passer les deux valeurs x et y à la fonction add.",

    // console message
    'lonlatAddError': "Vous devez passer les deux valeurs lon et lat à la fonction add.",

    // console message
    'pixelAddError': "Vous devez passer les deux valeurs x et y à la fonction add.",

    // console message
    'unsupportedGeometryType': "Type de géométrie non supporté : ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition a échoué: l'élément d'id ${elemId} pourrait être mal positionné.",
    
    'end': ''

};
