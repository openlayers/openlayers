/* Translators (2009 onwards):
 *  - Helix84
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["sk"]
 * Dictionary for Slovenčina.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["sk"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Neobslúžené požiadavky vracajú ${statusText}",

    'Permalink': "Trvalý odkaz",

    'Overlays': "Prekrytia",

    'Base Layer': "Základná vrstva",

    'noFID': "Nie je možné aktualizovať vlastnosť, pre ktorú neexistuje FID.",

    'browserNotSupported': "Váš prehliadač nepodporuje vykresľovanie vektorov. Momentálne podporované vykresľovače sú:\n${renderers}",

    'minZoomLevelError': "Vlastnosť minZoomLevel je určený iba na použitie s vrstvami odvodenými od FixedZoomLevels. To, že táto wfs vrstva kontroluje minZoomLevel je pozostatok z minulosti. Nemôžeme ho však odstrániť, aby sme sa vyhli možnému porušeniu aplikácií založených na Open Layers, ktoré na tomto môže závisieť. Preto ho označujeme ako zavrhovaný - dolu uvedená kontrola minZoomLevel bude odstránená vo verzii 3.0. Použite prosím namiesto toho kontrolu min./max. rozlíšenia podľa tu uvedeného popisu: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transakcia WFS: ÚSPEŠNÁ ${response}",

    'commitFailed': "Transakcia WFS: ZLYHALA ${response}",

    'googleWarning': "Vrstvu Google nebolo možné správne načítať.\x3cbr\x3e\x3cbr\x3eAby ste sa tejto správy zbavili vyberte novú BaseLayer v prepínači vrstiev v pravom hornom rohu.\x3cbr\x3e\x3cbr\x3eToto sa stalo pravdepodobne preto, že skript knižnice Google Maps buď nebol načítaný alebo neobsahuje správny kľúč API pre vašu lokalitu.\x3cbr\x3e\x3cbr\x3eVývojári: Tu môžete získať \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3epomoc so sfunkčnením\x3c/a\x3e",

    'getLayerWarning': "Vrstvu ${layerType} nebolo možné správne načítať.\x3cbr\x3e\x3cbr\x3eAby ste sa tejto správy zbavili vyberte novú BaseLayer v prepínači vrstiev v pravom hornom rohu.\x3cbr\x3e\x3cbr\x3eToto sa stalo pravdepodobne preto, že skript knižnice ${layerType} buď nebol načítaný alebo neobsahuje správny kľúč API pre vašu lokalitu.\x3cbr\x3e\x3cbr\x3eVývojári: Tu môžete získať \x3ca href=\'http://trac.openlayers.org/wiki/${layerType}\' target=\'_blank\'\x3epomoc so sfunkčnením\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Mierka = 1 : ${scaleDenom}",

    'reprojectDeprecated': "Používate voľby „reproject“ vrstvy ${layerType}. Táto voľba je zzavrhovaná: jej použitie bolo navrhnuté na podporu zobrazovania údajov nad komerčnými základovými mapami, ale túto funkcionalitu je teraz možné dosiahnuť pomocou Spherical Mercator. Ďalšie informácie získate na stránke http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Táto metóda je zavrhovaná a bude odstránená vo verzii 3.0. Použite prosím namiesto nej metódu ${newMethod}."
});
