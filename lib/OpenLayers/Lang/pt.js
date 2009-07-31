/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 *  - Malafaya
 *  - Waldir
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["pt"]
 * Dictionary for Português.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["pt"] = OpenLayers.Util.applyDefaults({

    'permalink': "Ligação permanente",

    'overlays': "!!FUZZY!!Sobreposições",

    'baseLayer': "!!FUZZY!!Camada Base",

    'sameProjection': "O mapa panorâmico só funciona quando está na mesma projeção que o mapa principal",

    'readNotImplemented': "Leitura não implementada.",

    'writeNotImplemented': "Escrita não implementada.",

    'noFID': "Não é possível atualizar um elemento para a qual não há FID.",

    'errorLoadingGML': "Erro ao carregar ficheiro GML ${url}",

    'browserNotSupported': "!!FUZZY!!O seu navegador não suporta renderização vetorial. Actualmente os renderizadores suportados são:\n${renderers}",

    'componentShouldBe': "addFeatures: componente deve ser um(a) ${geomType}",

    'getFeatureError': "!!FUZZY!!getFeatureFromEvent foi chamado numa camada sem renderizador. Isso normalmente significa que você destruiu uma camada, mas não um manipulador que lhe estava associado.",

    'commitSuccess': "Transacção WFS: SUCESSO ${response}",

    'commitFailed': "Transacção WFS: FALHOU ${response}",

    'googleWarning': "!!FUZZY!!A camada do Google não pôde ser carregada corretamente.\x3cbr\x3e\x3cbr\x3ePara se livrar desta mensagem, selecione uma nova Camada-Base no switcher de camadas no canto superior direito.\x3cbr\x3e\x3cbr\x3eProvavelmente, isso acontece porque o script da biblioteca do Google Maps ou não foi incluído, ou não contém a chave da API correta para o seu site.\x3cbr\x3e\x3cbr\x3e Programadores: Para obter ajuda a fazer com que isto funcione corretamente, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eclique aqui\x3c/a\x3e",

    'getLayerWarning': "!!FUZZY!!A ${layerType} não pôde ser carregada corretamente.\x3cbr\x3e\x3cbr\x3ePara se livrar desta mensagem, selecione uma nova Camada-Base no switcher de camadas no canto superior direito.\x3cbr\x3e\x3cbr\x3eProvavelmente, isso acontece porque o script da ${layerLib} ou não foi incluída corretamente.\x3cbr\x3e\x3cbr\x3eProgramadores: Ver  \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eo wiki\x3c/a\x3e para obter ajuda a fazer com que isto funcione corretamente.",

    'scale': "Escala = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Você tentou adicionar a camada: ${layerName} ao mapa, mas ela já tinha sido adicionada antes",

    'reprojectDeprecated': "!!FUZZY!!Você está a usar a opção \'reproject\' na camada ${layerName}. Esta opção foi declarada obsoleta: o seu uso foi projetado para permitir a exibição de dados de sobre mapas-base comerciais, mas essa funcionalidade deve agora ser obtida utilizando a funcionalidade Mercator Esférico. Mais informação está disponível em http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Este método foi declarado obsoleto e será removido na versão 3.0. Por favor, use ${newMethod} em vez disso.",

    'boundsAddError': "Você deve passar tanto o valor x como o y à função de adição.",

    'lonlatAddError': "Você deve passar tanto o valor lon como o lat à função de adição.",

    'pixelAddError': "Você deve passar tanto o valor x como o y à função de adição.",

    'unsupportedGeometryType': "Tipo de geometria não suportado: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition falhou: o elemento com o id ${elemId} poderá estar mal-posicionado.",

    'filterEvaluateNotImplemented': "avaliar não está implementado para este tipo de filtro."

});
