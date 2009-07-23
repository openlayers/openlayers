/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang/en.js
 */

/**
 * Namespace: OpenLayers.Lang["nl"]
 * Dictionary for Dutch.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang.nl = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Niet afgehandeld request met als terugmelding ${statusText}",

    'permalink': "Permalink",

    'overlays': "Overlays",

    'baseLayer': "Achtergrondkaart",

    'sameProjection':
        "De overzichtskaart werkt alleen als de projectie gelijk is aan de projectie van de hoofdkaart",

    'readNotImplemented': "Lezen niet geïmplementeerd.",

    'writeNotImplemented': "Schrijven niet geïmplementeerd.",

    'noFID': "Een feature welke geen FID heeft kan niet bijgewerkt worden.",

    'errorLoadingGML': "Fout bij het laden van GML bestand ${url}",

    'browserNotSupported':
        "Uw browser ondersteunt het weergeven van vector niet. Momenteel ondersteunde weergave engines:\n${renderers}",

    'componentShouldBe': "addFeatures : component zou van het type ${geomType} moeten zijn",

    'commitSuccess': "WFS-transactie: SUCCESVOL ${response}",

    'commitFailed': "WFS-transactie: MISLUKT ${response}",

    'googleWarning':
        "De Google-Layer kon niet correct geladen worden.<br><br>" +
        "Om deze melding niet meer te krijgen, moet u een andere " +
        "achtergrondkaart kiezen in de LayerSwitcher in de rechterbovenhoek.<br><br>" +
        "Dit is waarschijnlijk omdat de ${layerLib} bilbiotheek " +
        "niet correct ingevoegd is.<br><br>" +
        "Ontwikkelaars: om dit werkend te krijgen, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>klik hier</a>",

    'getLayerWarning':
        "De ${layerType} Layer kon niet goed geladen worden.<br><br>" +
        "Om deze melding niet meer te krijgen, moet u een andere " +
        "achtergrondkaart kiezen in de LayerSwitcher in de rechterbovenhoek.<br><br>" +
        "Dit is waarschijnlijk omdat de ${layerLib} bilbiotheek " +
        "niet correct ingevoegd is.<br><br>" +
        "Ontwikkelaars: om dit werkend te krijgen, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>klik hier</a>",

    'scale': "Schaal = 1 : ${scaleDenom}",

    'end': ''
}, OpenLayers.Lang["en"]);
