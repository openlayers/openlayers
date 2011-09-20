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

    'Permalink': "Permanente verwijzing",

    'Overlays': "Overlays",

    'Base Layer': "Achtergrondkaart",

    'noFID': "Een optie die geen FID heeft kan niet bijgewerkt worden.",

    'browserNotSupported': "Uw browser ondersteunt het weergeven van vectoren niet.\nMomenteel ondersteunde weergavemogelijkheden:\n${renderers}",

    'minZoomLevelError': "De eigenschap minZoomLevel is alleen bedoeld voor gebruik lagen met die afstammen van FixedZoomLevels-lagen.\nDat deze WFS-laag minZoomLevel controleert, is een overblijfsel uit het verleden.\nWe kunnen deze controle echter niet verwijderen zonder op OL gebaseerde applicaties die hervan afhankelijk zijn stuk te maken.\nDaarom heeft deze functionaliteit de eigenschap \'deprecated\' gekregen - de minZoomLevel wordt verwijderd in versie 3.0.\nGebruik in plaats van deze functie de mogelijkheid om min/max voor resolutie in te stellen zoals op de volgende pagina wordt beschreven:\nhttp://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transactie: succesvol ${response}",

    'commitFailed': "WFS-transactie: mislukt ${response}",

    'googleWarning': "De Google-Layer kon niet correct geladen worden.\x3cbr /\x3e\x3cbr /\x3e\nOm deze melding niet meer te krijgen, moet u een andere achtergrondkaart kiezen in de laagwisselaar in de rechterbovenhoek.\x3cbr /\x3e\x3cbr /\x3e\nDit komt waarschijnlijk doordat de bibliotheek ${layerLib} niet correct ingevoegd is.\x3cbr /\x3e\x3cbr /\x3e\nOntwikkelaars: \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklik hier\x3c/a\x3e om dit werkend te krijgen.",

    'getLayerWarning': "De laag ${layerType} kon niet goed geladen worden.\x3cbr /\x3e\x3cbr /\x3e\nOm deze melding niet meer te krijgen, moet u een andere achtergrondkaart kiezen in de laagwisselaar in de rechterbovenhoek.\x3cbr /\x3e\x3cbr /\x3e\nDit komt waarschijnlijk doordat de bibliotheek ${layerLib} niet correct is ingevoegd.\x3cbr /\x3e\x3cbr /\x3e\nOntwikkelaars: \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklik hier\x3c/a\x3e om dit werkend te krijgen.",

    'Scale = 1 : ${scaleDenom}': "Schaal = 1 : ${scaleDenom}",

    'W': "W",

    'E': "O",

    'N': "N",

    'S': "Z",

    'reprojectDeprecated': "U gebruikt de optie \'reproject\' op de laag ${layerName}.\nDeze optie is vervallen: deze optie was ontwikkeld om gegevens over commerciële basiskaarten weer te geven, maar deze functionaliteit wordt nu bereikt door ondersteuning van Spherical Mercator.\nMeer informatie is beschikbaar op http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Deze methode is verouderd en wordt verwijderd in versie 3.0.\nGebruik ${newMethod}."

});
