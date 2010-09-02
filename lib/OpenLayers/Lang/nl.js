/* Translators (2009 onwards):
 *  - Siebrand
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["nl"]
 * Dictionary for Nederlands.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["nl"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Het verzoek is niet afgehandeld met de volgende melding: ${statusText}",

    'permalink': "Permanente verwijzing",

    'overlays': "Overlays",

    'baseLayer': "Achtergrondkaart",

    'sameProjection': "De overzichtskaart werkt alleen als de projectie gelijk is aan de projectie van de hoofdkaart",

    'readNotImplemented': "Lezen is niet geïmplementeerd.",

    'writeNotImplemented': "Schrijven is niet geïmplementeerd.",

    'noFID': "Een optie die geen FID heeft kan niet bijgewerkt worden.",

    'errorLoadingGML': "Er is een fout opgetreden bij het laden van het GML bestand van ${url}",

    'browserNotSupported': "Uw browser ondersteunt het weergeven van vectoren niet.\nMomenteel ondersteunde weergavemogelijkheden:\n${renderers}",

    'componentShouldBe': "addFeatures : component moet van het type ${geomType} zijn",

    'getFeatureError': "getFeatureFromEvent is aangeroepen op een laag zonder rederer.\nDit betekent meestal dat u een laag hebt verwijderd, maar niet een handler die ermee geassocieerd was.",

    'minZoomLevelError': "De eigenschap minZoomLevel is alleen bedoeld voor gebruik lagen met die afstammen van FixedZoomLevels-lagen.\nDat deze WFS-laag minZoomLevel controleert, is een overblijfsel uit het verleden.\nWe kunnen deze controle echter niet verwijderen zonder op OL gebaseerde applicaties die hervan afhankelijk zijn stuk te maken.\nDaarom heeft deze functionaliteit de eigenschap \'deprecated\' gekregen - de minZoomLevel wordt verwijderd in versie 3.0.\nGebruik in plaats van deze functie de mogelijkheid om min/max voor resolutie in te stellen zoals op de volgende pagina wordt beschreven:\nhttp://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transactie: succesvol ${response}",

    'commitFailed': "WFS-transactie: mislukt ${response}",

    'googleWarning': "De Google-Layer kon niet correct geladen worden.\x3cbr /\x3e\x3cbr /\x3e\nOm deze melding niet meer te krijgen, moet u een andere achtergrondkaart kiezen in de laagwisselaar in de rechterbovenhoek.\x3cbr /\x3e\x3cbr /\x3e\nDit komt waarschijnlijk doordat de bibliotheek ${layerLib} niet correct ingevoegd is.\x3cbr /\x3e\x3cbr /\x3e\nOntwikkelaars: \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklik hier\x3c/a\x3e om dit werkend te krijgen.",

    'getLayerWarning': "De laag ${layerType} kon niet goed geladen worden.\x3cbr /\x3e\x3cbr /\x3e\nOm deze melding niet meer te krijgen, moet u een andere achtergrondkaart kiezen in de laagwisselaar in de rechterbovenhoek.\x3cbr /\x3e\x3cbr /\x3e\nDit komt waarschijnlijk doordat de bibliotheek ${layerLib} niet correct is ingevoegd.\x3cbr /\x3e\x3cbr /\x3e\nOntwikkelaars: \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklik hier\x3c/a\x3e om dit werkend te krijgen.",

    'scale': "Schaal = 1 : ${scaleDenom}",

    'W': "W",

    'E': "O",

    'N': "N",

    'S': "Z",

    'layerAlreadyAdded': "U hebt geprobeerd om de laag  ${layerName} aan de kaart toe te voegen, maar deze is al toegevoegd",

    'reprojectDeprecated': "U gebruikt de optie \'reproject\' op de laag ${layerName}.\nDeze optie is vervallen: deze optie was ontwikkeld om gegevens over commerciële basiskaarten weer te geven, maar deze functionaliteit wordt nu bereikt door ondersteuning van Spherical Mercator.\nMeer informatie is beschikbaar op http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Deze methode is verouderd en wordt verwijderd in versie 3.0.\nGebruik ${newMethod}.",

    'boundsAddError': "U moet zowel de x- als de y-waarde doorgeven aan de toevoegfunctie.",

    'lonlatAddError': "U moet zowel de lengte- als de breedtewaarde doorgeven aan de toevoegfunctie.",

    'pixelAddError': "U moet zowel de x- als de y-waarde doorgeven aan de toevoegfunctie.",

    'unsupportedGeometryType': "Dit geometrietype wordt niet ondersteund: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition is mislukt: het element met id ${elemId} is wellicht onjuist geplaatst.",

    'filterEvaluateNotImplemented': "evalueren is niet geïmplementeerd voor dit filtertype."

});
