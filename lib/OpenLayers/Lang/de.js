/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 *  - Umherirrender
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["de"]
 * Dictionary for Deutsch.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["de"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Unbehandelte Anfragerückmeldung ${statusText}",

    'permalink': "Permalink",

    'overlays': "Overlays",

    'baseLayer': "Grundkarte",

    'sameProjection': "Die Übersichtskarte funktioniert nur, wenn sie dieselbe Projektion wie die Hauptkarte verwendet",

    'readNotImplemented': "Lesen nicht implementiert.",

    'writeNotImplemented': "Schreiben nicht implementiert.",

    'noFID': "Ein Feature, für das keine FID existiert, kann nicht aktualisiert werden.",

    'errorLoadingGML': "Fehler beim Laden der GML-Datei ${url}",

    'browserNotSupported': "Ihr Browser unterstützt keine Vektordarstellung. Aktuell unterstützte Renderer:\n${renderers}",

    'componentShouldBe': "addFeatures: Komponente sollte vom Typ ${geomType} sein",

    'getFeatureError': "getFeatureFromEvent wurde vom einem Layer ohne Render aufgerufen. Dies bedeutet normalerweise, das ein Layer vernichtet wurde, aber nicht seine Handler, die auf ihn verweisen.",

    'commitSuccess': "WFS-Transaktion: Erfolgreich ${response}",

    'commitFailed': "WFS-Transaktion: Fehlgeschlagen ${response}",

    'googleWarning': "Der Google-Layer konnte nicht korrekt geladen werden.\x3cbr\x3e\x3cbr\x3eUm diese Meldung nicht mehr zu erhalten, wählen Sie einen anderen Hintergrundlayer aus dem LayerSwitcher in der rechten oberen Ecke.\x3cbr\x3e\x3cbr\x3eSehr wahrscheinlich tritt dieser Fehler auf, weil das Skript der Google-Maps-Bibliothek nicht eingebunden wurde oder keinen gültigen API-Schlüssel für Ihre URL enthält.\x3cbr\x3e\x3cbr\x3eEntwickler: Besuche \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3edas Wiki\x3c/a\x3e für Hilfe zum korrekten Einbinden des Google-Layers",

    'getLayerWarning': "Der ${layerType}-Layer konnte nicht korrekt geladen werden.\x3cbr\x3e\x3cbr\x3eUm diese Meldung nicht mehr zu erhalten, wählen Sie einen anderen Hintergrundlayer aus dem LayerSwitcher in der rechten oberen Ecke.\x3cbr\x3e\x3cbr\x3eSehr wahrscheinlich tritt dieser Fehler auf, weil das Skript der \'${layerLib}\'-Bibliothek nicht eingebunden wurde.\x3cbr\x3e\x3cbr\x3eEntwickler: Besuche \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3edas Wiki\x3c/a\x3e für Hilfe zum korrekten Einbinden von Layern",

    'scale': "Maßstab = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Sie versuchen den Layer „${layerName}“ zur Karte hinzu zufügen, er wurde aber bereits hinzugefügt",

    'methodDeprecated': "Die Methode ist veraltet und wird in 3.0 entfernt. Bitte verwende stattdessen ${newMethod}.",

    'unsupportedGeometryType': "Nicht unterstützter Geometrie-Typ: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition fehlgeschlagen: Element mit Id ${elemId} möglicherweise falsch platziert.",

    'filterEvaluateNotImplemented': "„evaluate“ ist für diesen Filter-Typ nicht implementiert.",

};
