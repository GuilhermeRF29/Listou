export const SIZE_PATTERN = /\b(?:de\s+|com\s+)?(\d+[\.,]?\d*\s*(?:kg|g|mg|l|ml|un|pcts?|cxs?|caixas?|pacotes?|rolo|rolos|unidade|unidades|folhas?|m|cm|mm))\b/ig

export const COMMON_BRANDS = [
  'camil', 'neve', 'ypê', 'ype', 'omo', 'nestlé', 'nestle', 'garoto', 'lacta',
  'bauducco', 'sazon', 'maggi', 'sadia', 'perdigão', 'perdigao', 'seara',
  'friboi', 'aurora', 'elegê', 'elege', 'parmalat', 'itambé', 'itambe', 'vigor',
  'danone', 'batavo', 'piracanjuba', 'coca-cola', 'coca', 'pepsi', 'guaraná',
  'guarana', 'fanta', 'sprite', 'sukita', 'schin', 'brahma', 'skol',
  'antarctica', 'heineken', 'amstel', 'itaipava', 'qualitá', 'qualita',
  'carrefour', 'extra', 'tixan', 'brilhante', 'ariel', 'downy', 'comfort',
  'fofo', 'limpol', 'minuano', 'bombril', 'assolan', 'veja', 'cif', 'ajax',
  'lysol', 'pinho sol', 'raid', 'sbp', 'baygon', 'pampers', 'huggies', 'cremer',
  'personal', 'chamex', 'bic', 'colgate', 'sorriso', 'close up', 'oral-b',
  'sensodyne', 'listerine', 'rexona', 'dove', 'nivea', 'suave', 'seda',
  'pantene', 'gillette', 'palmolive', 'lux', 'francis', 'phebo', 'granado',
  'hellmanns', 'heinz', 'quero', 'cepêra', 'fugini', 'cica', 'elefante', 'gallo',
  'andorinha', 'soya', 'liza', 'primor', 'delícia', 'qualy', 'claybom',
  'doriana', 'zero cal', 'linea', 'adria', 'piraquê', 'elma chips', 'ruffles',
  'doritos', 'kelloggs', 'sucrilhos', 'nescau', 'toddy', 'pilão', 'melitta',
  'três corações', 'suvinil', 'coral'
]

export const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/arroz|feijão|macarrão|óleo|açúcar|farinha|café/, 'Mercearia'],
  [/leite|queijo|iogurte|manteiga|requeijão/, 'Laticínios'],
  [/carne|frango|bife|peixe|linguiça/, 'Açougue'],
  [/shampoo|sabonete|papel|creme|pasta|desodorante/, 'Higiene'],
  [/detergente|sabão|água sanitária|limpador|bucha/, 'Limpeza'],
  [/banana|maçã|tomate|cebola|batata|cenoura|alface/, 'Hortifruti'],
  [/pão|bolo|biscoito|bolacha/, 'Padaria'],
  [/cerveja|refrigerante|suco|água/, 'Bebidas'],
]
