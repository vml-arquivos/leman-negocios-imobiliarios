/**
 * client/src/constants/propertyFeatures.ts
 *
 * Lista completa de características (120+ itens), helpers de normalização,
 * toggle e cálculo de qualidade de anúncio (SEO Score).
 *
 * Regra de ouro: tudo salvo em properties.features (JSONB) no formato V2.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FeatureItem = {
  key: string;
  label: string;
  seoWeight: 1 | 2 | 3 | 4 | 5;
  category: string;
};

export type FeatureGroup = {
  groupKey: string;
  title: string;
  items: FeatureItem[];
};

export type FeaturesV2 = {
  version: 2;
  areas?: {
    area_util_m2?: number | null;
    area_privativa_m2?: number | null;
    area_terreno_m2?: number | null;
    pe_direito_m?: number | null;
  };
  imovel?: Record<string, boolean>;
  acabamentos?: Record<string, boolean>;
  seguranca?: Record<string, boolean>;
  condominio?: {
    nome?: string;
    torre_bloco?: string;
    andar?: number | null;
    unidades_por_andar?: number | null;
    elevadores?: number | null;
    ano_construcao?: number | null;
    portaria?: "24h" | "virtual" | "diurna" | "sem";
    lazer?: Record<string, boolean>;
    servicos?: Record<string, boolean>;
    sustentabilidade?: Record<string, boolean>;
  };
  infraestrutura?: Record<string, boolean>;
  luxo?: Record<string, boolean>;
  midia?: {
    youtube_url?: string;
    video_direto_url?: string;
    tour_3d_url?: string;
    planta_urls?: string[];
  };
  destaques?: string[];
};

// ─── Grupos de características ────────────────────────────────────────────────

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    groupKey: "imovel",
    title: "Características do Imóvel",
    items: [
      { key: "mobiliado",                  label: "Mobiliado",                       seoWeight: 3, category: "imovel" },
      { key: "semi_mobiliado",             label: "Semi-mobiliado",                  seoWeight: 2, category: "imovel" },
      { key: "reformado",                  label: "Reformado",                       seoWeight: 3, category: "imovel" },
      { key: "novo",                       label: "Novo",                            seoWeight: 2, category: "imovel" },
      { key: "pronto_para_morar",          label: "Pronto para morar",               seoWeight: 2, category: "imovel" },
      { key: "alto_padrao",                label: "Alto padrão",                     seoWeight: 4, category: "imovel" },
      { key: "vista_livre",                label: "Vista livre",                     seoWeight: 3, category: "imovel" },
      { key: "vista_mar",                  label: "Vista para o mar",                seoWeight: 5, category: "imovel" },
      { key: "vista_lago",                 label: "Vista para lago",                 seoWeight: 4, category: "imovel" },
      { key: "vista_montanha",             label: "Vista para montanha",             seoWeight: 4, category: "imovel" },
      { key: "andar_alto",                 label: "Andar alto",                      seoWeight: 3, category: "imovel" },
      { key: "sol_manha",                  label: "Sol da manhã",                    seoWeight: 2, category: "imovel" },
      { key: "sol_tarde",                  label: "Sol da tarde",                    seoWeight: 2, category: "imovel" },
      { key: "varanda",                    label: "Varanda",                         seoWeight: 3, category: "imovel" },
      { key: "varanda_gourmet",            label: "Varanda gourmet",                 seoWeight: 4, category: "imovel" },
      { key: "sacada",                     label: "Sacada",                          seoWeight: 2, category: "imovel" },
      { key: "quintal",                    label: "Quintal",                         seoWeight: 3, category: "imovel" },
      { key: "jardim",                     label: "Jardim",                          seoWeight: 3, category: "imovel" },
      { key: "jardim_inverno",             label: "Jardim de inverno",               seoWeight: 3, category: "imovel" },
      { key: "piscina_privativa",          label: "Piscina privativa",               seoWeight: 5, category: "imovel" },
      { key: "jacuzzi",                    label: "Jacuzzi / Hidromassagem",         seoWeight: 5, category: "imovel" },
      { key: "sauna_privativa",            label: "Sauna privativa",                 seoWeight: 5, category: "imovel" },
      { key: "churrasqueira_privativa",    label: "Churrasqueira privativa",         seoWeight: 4, category: "imovel" },
      { key: "lareira",                    label: "Lareira",                         seoWeight: 3, category: "imovel" },
      { key: "home_theater",               label: "Home theater",                    seoWeight: 4, category: "imovel" },
      { key: "escritorio",                 label: "Escritório",                      seoWeight: 3, category: "imovel" },
      { key: "closet",                     label: "Closet",                          seoWeight: 3, category: "imovel" },
      { key: "lavabo",                     label: "Lavabo",                          seoWeight: 2, category: "imovel" },
      { key: "despensa",                   label: "Despensa",                        seoWeight: 2, category: "imovel" },
      { key: "area_servico",               label: "Área de serviço",                 seoWeight: 2, category: "imovel" },
      { key: "dependencia_empregada",      label: "Dependência de empregada",        seoWeight: 2, category: "imovel" },
      { key: "banheiro_empregada",         label: "Banheiro de serviço",             seoWeight: 2, category: "imovel" },
      { key: "cozinha_americana",          label: "Cozinha americana",               seoWeight: 3, category: "imovel" },
      { key: "cozinha_planejada",          label: "Cozinha planejada",               seoWeight: 3, category: "imovel" },
      { key: "ilha_na_cozinha",            label: "Ilha na cozinha",                 seoWeight: 4, category: "imovel" },
      { key: "armarios_embutidos",         label: "Armários embutidos",              seoWeight: 3, category: "imovel" },
      { key: "ar_condicionado",            label: "Ar-condicionado",                 seoWeight: 3, category: "imovel" },
      { key: "aquecimento_gas",            label: "Aquecimento a gás",               seoWeight: 3, category: "imovel" },
      { key: "aquecimento_solar",          label: "Aquecimento solar",               seoWeight: 4, category: "imovel" },
      { key: "energia_fotovoltaica",       label: "Energia fotovoltaica",            seoWeight: 4, category: "imovel" },
      { key: "isolamento_acustico",        label: "Isolamento acústico",             seoWeight: 3, category: "imovel" },
      { key: "isolamento_termico",         label: "Isolamento térmico",              seoWeight: 3, category: "imovel" },
      { key: "automacao_residencial",      label: "Automação residencial",           seoWeight: 5, category: "imovel" },
      { key: "som_ambiente",               label: "Som ambiente",                    seoWeight: 4, category: "imovel" },
      { key: "aspiracao_central",          label: "Aspiração central",               seoWeight: 4, category: "imovel" },
      { key: "elevador_privativo",         label: "Elevador privativo",              seoWeight: 5, category: "imovel" },
      { key: "hall_privativo",             label: "Hall privativo",                  seoWeight: 4, category: "imovel" },
      { key: "piso_aquecido",              label: "Piso aquecido",                   seoWeight: 5, category: "imovel" },
      { key: "adega",                      label: "Adega",                           seoWeight: 4, category: "imovel" },
      { key: "espaco_gourmet_privativo",   label: "Espaço gourmet privativo",        seoWeight: 4, category: "imovel" },
      { key: "porta_biometrica",           label: "Porta biométrica",                seoWeight: 4, category: "imovel" },
      { key: "fechadura_eletronica",       label: "Fechadura eletrônica",            seoWeight: 4, category: "imovel" },
      { key: "aceita_pet",                 label: "Aceita pet",                      seoWeight: 3, category: "imovel" },
      { key: "acessibilidade",             label: "Acessibilidade",                  seoWeight: 3, category: "imovel" },
      { key: "rampa_acesso",               label: "Rampa de acesso",                 seoWeight: 2, category: "imovel" },
      { key: "banheiro_adaptado",          label: "Banheiro adaptado",               seoWeight: 2, category: "imovel" },
      { key: "entrada_independente",       label: "Entrada independente",            seoWeight: 2, category: "imovel" },
      // Extras: cobertura / terraço
      { key: "terraco",                    label: "Terraço",                         seoWeight: 4, category: "imovel" },
      { key: "piscina_terraco",            label: "Piscina no terraço",              seoWeight: 5, category: "imovel" },
      { key: "varanda_tecnica",            label: "Varanda técnica",                 seoWeight: 2, category: "imovel" },
      { key: "infra_ar",                   label: "Infra para ar-condicionado",      seoWeight: 2, category: "imovel" },
      { key: "infra_automacao",            label: "Infra para automação",            seoWeight: 3, category: "imovel" },
      // Extras: casa / condomínio fechado
      { key: "canil",                      label: "Canil",                           seoWeight: 2, category: "imovel" },
      { key: "pomar",                      label: "Pomar",                           seoWeight: 2, category: "imovel" },
      { key: "horta",                      label: "Horta",                           seoWeight: 2, category: "imovel" },
      { key: "redario",                    label: "Redário",                         seoWeight: 2, category: "imovel" },
      { key: "fogo_de_chao",               label: "Fogo de chão",                    seoWeight: 3, category: "imovel" },
      // Extras: náutico
      { key: "marina",                     label: "Marina / Píer",                   seoWeight: 5, category: "imovel" },
      // Extras: rural
      { key: "curral",                     label: "Curral",                          seoWeight: 2, category: "imovel" },
      { key: "lago",                       label: "Lago",                            seoWeight: 4, category: "imovel" },
      { key: "nascente",                   label: "Nascente",                        seoWeight: 4, category: "imovel" },
    ],
  },

  {
    groupKey: "acabamentos",
    title: "Acabamentos",
    items: [
      { key: "porcelanato",            label: "Porcelanato",                seoWeight: 3, category: "acabamentos" },
      { key: "granito",                label: "Granito",                    seoWeight: 3, category: "acabamentos" },
      { key: "marmore",                label: "Mármore",                    seoWeight: 4, category: "acabamentos" },
      { key: "madeira",                label: "Piso de madeira",            seoWeight: 3, category: "acabamentos" },
      { key: "vinilico",               label: "Piso vinílico",              seoWeight: 2, category: "acabamentos" },
      { key: "cimento_queimado",       label: "Cimento queimado",           seoWeight: 2, category: "acabamentos" },
      { key: "revestimento_3d",        label: "Revestimento 3D",            seoWeight: 3, category: "acabamentos" },
      { key: "teto_rebaixado_gesso",   label: "Teto rebaixado em gesso",    seoWeight: 3, category: "acabamentos" },
      { key: "iluminacao_projetada",   label: "Iluminação projetada",       seoWeight: 3, category: "acabamentos" },
      { key: "janelas_anti_ruido",     label: "Janelas anti-ruído",         seoWeight: 3, category: "acabamentos" },
      { key: "vidros_blindados",       label: "Vidros blindados",           seoWeight: 4, category: "acabamentos" },
      { key: "bancada_granito",        label: "Bancada em granito",         seoWeight: 3, category: "acabamentos" },
      { key: "bancada_marmore",        label: "Bancada em mármore",         seoWeight: 4, category: "acabamentos" },
      { key: "metais_premium",         label: "Metais premium",             seoWeight: 3, category: "acabamentos" },
      { key: "loucas_premium",         label: "Louças premium",             seoWeight: 3, category: "acabamentos" },
      // Extras
      { key: "piso_deck",              label: "Deck de madeira",            seoWeight: 3, category: "acabamentos" },
      { key: "forro_madeira",          label: "Forro de madeira",           seoWeight: 3, category: "acabamentos" },
      { key: "parede_tijolo_vista",    label: "Parede de tijolo à vista",   seoWeight: 2, category: "acabamentos" },
    ],
  },

  {
    groupKey: "seguranca",
    title: "Segurança",
    items: [
      { key: "portaria_24h",           label: "Portaria 24h",                    seoWeight: 4, category: "seguranca" },
      { key: "portaria_virtual",       label: "Portaria virtual",                seoWeight: 3, category: "seguranca" },
      { key: "controle_acesso",        label: "Controle de acesso",              seoWeight: 3, category: "seguranca" },
      { key: "cftv",                   label: "CFTV / Câmeras",                  seoWeight: 3, category: "seguranca" },
      { key: "guarita",                label: "Guarita",                         seoWeight: 3, category: "seguranca" },
      { key: "alarme",                 label: "Sistema de alarme",               seoWeight: 3, category: "seguranca" },
      { key: "cerca_eletrica",         label: "Cerca elétrica",                  seoWeight: 3, category: "seguranca" },
      { key: "seguranca_armada",       label: "Segurança armada",                seoWeight: 4, category: "seguranca" },
      { key: "ronda_24h",              label: "Ronda 24h",                       seoWeight: 3, category: "seguranca" },
      { key: "biometria",              label: "Acesso por biometria",            seoWeight: 4, category: "seguranca" },
      { key: "reconhecimento_facial",  label: "Reconhecimento facial",           seoWeight: 5, category: "seguranca" },
      { key: "clausura_pedestre",      label: "Clausura para pedestres",         seoWeight: 3, category: "seguranca" },
      { key: "clausura_veiculos",      label: "Clausura para veículos",          seoWeight: 3, category: "seguranca" },
      { key: "vaga_visitante",         label: "Vaga para visitantes",            seoWeight: 2, category: "seguranca" },
      { key: "gerador_area_comum",     label: "Gerador nas áreas comuns",        seoWeight: 3, category: "seguranca" },
    ],
  },

  {
    groupKey: "condominio.lazer",
    title: "Lazer do Condomínio",
    items: [
      { key: "piscina",                    label: "Piscina",                          seoWeight: 4, category: "condominio_lazer" },
      { key: "piscina_aquecida",           label: "Piscina aquecida",                 seoWeight: 5, category: "condominio_lazer" },
      { key: "piscina_infantil",           label: "Piscina infantil",                 seoWeight: 3, category: "condominio_lazer" },
      { key: "academia",                   label: "Academia",                         seoWeight: 4, category: "condominio_lazer" },
      { key: "quadra_poliesportiva",       label: "Quadra poliesportiva",             seoWeight: 3, category: "condominio_lazer" },
      { key: "quadra_tenis",               label: "Quadra de tênis",                  seoWeight: 4, category: "condominio_lazer" },
      { key: "quadra_beach_tenis",         label: "Quadra de beach tênis",            seoWeight: 4, category: "condominio_lazer" },
      { key: "campo_futebol",              label: "Campo de futebol",                 seoWeight: 3, category: "condominio_lazer" },
      { key: "salao_festas",               label: "Salão de festas",                  seoWeight: 3, category: "condominio_lazer" },
      { key: "espaco_gourmet",             label: "Espaço gourmet",                   seoWeight: 4, category: "condominio_lazer" },
      { key: "churrasqueira",              label: "Churrasqueira",                    seoWeight: 3, category: "condominio_lazer" },
      { key: "playground",                 label: "Playground",                       seoWeight: 3, category: "condominio_lazer" },
      { key: "brinquedoteca",              label: "Brinquedoteca",                    seoWeight: 3, category: "condominio_lazer" },
      { key: "salao_jogos",                label: "Salão de jogos",                   seoWeight: 3, category: "condominio_lazer" },
      { key: "cinema",                     label: "Cinema",                           seoWeight: 4, category: "condominio_lazer" },
      { key: "sauna",                      label: "Sauna",                            seoWeight: 4, category: "condominio_lazer" },
      { key: "spa",                        label: "SPA",                              seoWeight: 4, category: "condominio_lazer" },
      { key: "hidromassagem",              label: "Hidromassagem",                    seoWeight: 4, category: "condominio_lazer" },
      { key: "pet_place",                  label: "Pet place",                        seoWeight: 3, category: "condominio_lazer" },
      { key: "pista_caminhada",            label: "Pista de caminhada",               seoWeight: 3, category: "condominio_lazer" },
      { key: "bicicletario",               label: "Bicicletário",                     seoWeight: 2, category: "condominio_lazer" },
      { key: "coworking",                  label: "Coworking",                        seoWeight: 4, category: "condominio_lazer" },
      { key: "lavanderia",                 label: "Lavanderia compartilhada",         seoWeight: 2, category: "condominio_lazer" },
      { key: "mercadinho",                 label: "Mercadinho interno",               seoWeight: 3, category: "condominio_lazer" },
      { key: "sala_yoga",                  label: "Sala de Yoga",                     seoWeight: 3, category: "condominio_lazer" },
      { key: "espaco_massage",             label: "Espaço massagem",                  seoWeight: 3, category: "condominio_lazer" },
      { key: "roof_top",                   label: "Rooftop",                          seoWeight: 4, category: "condominio_lazer" },
      { key: "piscina_borda_infinita",     label: "Piscina borda infinita",           seoWeight: 5, category: "condominio_lazer" },
      { key: "deck_molhado",               label: "Deck molhado",                     seoWeight: 4, category: "condominio_lazer" },
      { key: "bar_piscina",                label: "Bar na piscina",                   seoWeight: 4, category: "condominio_lazer" },
    ],
  },

  {
    groupKey: "condominio.servicos",
    title: "Serviços do Condomínio",
    items: [
      { key: "concierge",                    label: "Concierge",                           seoWeight: 4, category: "condominio_servicos" },
      { key: "recepcao",                     label: "Recepção",                            seoWeight: 2, category: "condominio_servicos" },
      { key: "valet",                        label: "Valet",                               seoWeight: 4, category: "condominio_servicos" },
      { key: "manobrista",                   label: "Manobrista",                          seoWeight: 3, category: "condominio_servicos" },
      { key: "servico_limpeza",              label: "Serviço de limpeza",                  seoWeight: 3, category: "condominio_servicos" },
      { key: "lavagem_carros",               label: "Lavagem de carros",                   seoWeight: 3, category: "condominio_servicos" },
      { key: "manutencao",                   label: "Equipe de manutenção",                seoWeight: 2, category: "condominio_servicos" },
      { key: "locker_entregas",              label: "Locker de entregas",                  seoWeight: 3, category: "condominio_servicos" },
      { key: "espaco_delivery",              label: "Espaço delivery",                     seoWeight: 3, category: "condominio_servicos" },
      { key: "carregador_veiculo_eletrico",  label: "Carregador para veículo elétrico",    seoWeight: 4, category: "condominio_servicos" },
      { key: "vaga_bike_eletrica",           label: "Vaga/recarga para bike elétrica",     seoWeight: 2, category: "condominio_servicos" },
      { key: "sala_reuniao",                 label: "Sala de reunião",                     seoWeight: 3, category: "condominio_servicos" },
    ],
  },

  {
    groupKey: "condominio.sustentabilidade",
    title: "Sustentabilidade do Condomínio",
    items: [
      { key: "reuso_agua",                   label: "Reuso de água",                          seoWeight: 4, category: "condominio_sustentabilidade" },
      { key: "coleta_seletiva",              label: "Coleta seletiva",                        seoWeight: 3, category: "condominio_sustentabilidade" },
      { key: "energia_solar_areas_comuns",   label: "Energia solar nas áreas comuns",         seoWeight: 4, category: "condominio_sustentabilidade" },
      { key: "certificacao_verde",           label: "Certificação sustentável (verde)",        seoWeight: 4, category: "condominio_sustentabilidade" },
      { key: "horta_comunitaria",            label: "Horta comunitária",                      seoWeight: 2, category: "condominio_sustentabilidade" },
      { key: "compostagem",                  label: "Compostagem",                            seoWeight: 2, category: "condominio_sustentabilidade" },
      { key: "aquecimento_solar_central",    label: "Aquecimento solar central",              seoWeight: 4, category: "condominio_sustentabilidade" },
    ],
  },

  {
    groupKey: "infraestrutura",
    title: "Infraestrutura / Utilidades",
    items: [
      { key: "internet_fibra",         label: "Internet fibra",                  seoWeight: 2, category: "infraestrutura" },
      { key: "cabeamento_rede",        label: "Cabeamento de rede",              seoWeight: 2, category: "infraestrutura" },
      { key: "tv_cabo",                label: "TV a cabo",                       seoWeight: 1, category: "infraestrutura" },
      { key: "gas_encanado",           label: "Gás encanado",                    seoWeight: 2, category: "infraestrutura" },
      { key: "agua_individualizada",   label: "Água individualizada",            seoWeight: 2, category: "infraestrutura" },
      { key: "luz_individualizada",    label: "Luz individualizada",             seoWeight: 2, category: "infraestrutura" },
      { key: "medicao_individual_gas", label: "Medição individual de gás",       seoWeight: 2, category: "infraestrutura" },
      { key: "gerador_total",          label: "Gerador total",                   seoWeight: 4, category: "infraestrutura" },
      { key: "deposito_privativo",     label: "Depósito privativo",              seoWeight: 2, category: "infraestrutura" },
      { key: "bike_room",              label: "Bike room",                       seoWeight: 2, category: "infraestrutura" },
      { key: "acesso_pne",             label: "Acesso PNE",                      seoWeight: 2, category: "infraestrutura" },
      { key: "elevador",               label: "Elevador",                        seoWeight: 2, category: "infraestrutura" },
      // Extras: comercial
      { key: "recepcao_comercial",     label: "Recepção comercial",              seoWeight: 2, category: "infraestrutura" },
      { key: "copa",                   label: "Copa",                            seoWeight: 2, category: "infraestrutura" },
      { key: "auditorio",              label: "Auditório",                       seoWeight: 3, category: "infraestrutura" },
      { key: "sala_reuniao_privativa", label: "Sala de reunião privativa",       seoWeight: 3, category: "infraestrutura" },
      { key: "estacionamento_proprio", label: "Estacionamento próprio",          seoWeight: 3, category: "infraestrutura" },
    ],
  },

  {
    groupKey: "luxo",
    title: "Luxo / Alto Padrão",
    items: [
      { key: "piscina_borda_infinita_privativa", label: "Piscina borda infinita (privativa)",  seoWeight: 5, category: "luxo" },
      { key: "spa_privativo",                    label: "SPA privativo",                       seoWeight: 5, category: "luxo" },
      { key: "adega_climatizada",                label: "Adega climatizada",                   seoWeight: 4, category: "luxo" },
      { key: "cozinha_assinada",                 label: "Cozinha assinada / design",            seoWeight: 4, category: "luxo" },
      { key: "eletro_embutidos_premium",         label: "Eletros embutidos premium",            seoWeight: 4, category: "luxo" },
      { key: "som_integrado",                    label: "Som integrado",                        seoWeight: 4, category: "luxo" },
      { key: "automacao_total",                  label: "Automação total",                      seoWeight: 5, category: "luxo" },
      { key: "climatizacao_central",             label: "Climatização central",                 seoWeight: 5, category: "luxo" },
      { key: "paisagismo_assinado",              label: "Paisagismo assinado",                  seoWeight: 4, category: "luxo" },
      { key: "lareira_gas",                      label: "Lareira a gás",                        seoWeight: 4, category: "luxo" },
      { key: "elevador_interno",                 label: "Elevador interno",                     seoWeight: 5, category: "luxo" },
      { key: "banheira_freestanding",            label: "Banheira freestanding",                seoWeight: 4, category: "luxo" },
      { key: "suite_master",                     label: "Suíte master",                         seoWeight: 4, category: "luxo" },
      { key: "closet_ele_ela",                   label: "Closet Sr. e Sra.",                    seoWeight: 4, category: "luxo" },
      { key: "roof_privativo",                   label: "Roof privativo",                       seoWeight: 5, category: "luxo" },
      // Extras
      { key: "heliponto",                        label: "Heliponto",                            seoWeight: 5, category: "luxo" },
      { key: "sala_massagem_privativa",          label: "Sala de massagem privativa",           seoWeight: 4, category: "luxo" },
      { key: "academia_privativa",               label: "Academia privativa",                   seoWeight: 4, category: "luxo" },
      { key: "home_office_premium",              label: "Home office premium",                  seoWeight: 4, category: "luxo" },
      { key: "garagem_multipla",                 label: "Garagem para múltiplos veículos",      seoWeight: 4, category: "luxo" },
    ],
  },
];

// ─── Contagem total de itens ──────────────────────────────────────────────────
// Verificação: deve ser >= 120
export const TOTAL_FEATURE_COUNT = FEATURE_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normaliza o campo features vindo do banco para o formato V2.
 * Compatível com: null, [], {}, objeto V1 (array de strings), objeto V2.
 */
export function normalizeFeatures(features: unknown): FeaturesV2 {
  const base: FeaturesV2 = { version: 2 };

  if (!features) return base;

  // Array legado (V1): ["mobiliado", "piscina", ...]
  if (Array.isArray(features)) {
    const imovel: Record<string, boolean> = {};
    for (const key of features) {
      if (typeof key === "string") imovel[key] = true;
    }
    return { ...base, imovel };
  }

  if (typeof features !== "object") return base;

  const f = features as Record<string, unknown>;

  // Já é V2
  if (f.version === 2) return f as FeaturesV2;

  // Objeto V1 genérico (chave: boolean)
  const imovel: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(f)) {
    if (typeof v === "boolean") imovel[k] = v;
  }
  return { ...base, imovel };
}

/**
 * Retorna o valor de uma feature dentro do objeto V2.
 * groupKey pode ser "imovel", "acabamentos", "seguranca", "infraestrutura",
 * "luxo", "condominio.lazer", "condominio.servicos", "condominio.sustentabilidade".
 */
export function getFeatureValue(features: FeaturesV2, groupKey: string, itemKey: string): boolean {
  if (groupKey.startsWith("condominio.")) {
    const sub = groupKey.split(".")[1] as "lazer" | "servicos" | "sustentabilidade";
    return !!(features.condominio?.[sub] as Record<string, boolean> | undefined)?.[itemKey];
  }
  const group = features[groupKey as keyof FeaturesV2] as Record<string, boolean> | undefined;
  return !!(group?.[itemKey]);
}

/**
 * Alterna (ou define) o valor de uma feature no objeto V2.
 * Retorna um novo objeto (imutável).
 */
export function toggleFeature(
  features: FeaturesV2,
  groupKey: string,
  itemKey: string,
  value: boolean
): FeaturesV2 {
  const next = { ...features };

  if (groupKey.startsWith("condominio.")) {
    const sub = groupKey.split(".")[1] as "lazer" | "servicos" | "sustentabilidade";
    next.condominio = {
      ...next.condominio,
      [sub]: {
        ...(next.condominio?.[sub] as Record<string, boolean> | undefined),
        [itemKey]: value,
      },
    };
    return next;
  }

  const key = groupKey as keyof FeaturesV2;
  next[key] = {
    ...(next[key] as Record<string, boolean> | undefined),
    [itemKey]: value,
  } as any;
  return next;
}

// ─── Score de qualidade do anúncio ───────────────────────────────────────────

export type ListingQualityResult = {
  score: number;                   // 0..100
  status: "RUIM" | "BOM" | "PREMIUM";
  recommendations: string[];       // lista do que falta
  details: {
    photos: { ok: boolean; count: number; needed: number };
    description: { ok: boolean; length: number; needed: number };
    title: { ok: boolean; length: number; needed: number };
    features: { ok: boolean; count: number; needed: number };
    media: { ok: boolean; hasVideo: boolean; hasTour: boolean };
    areas: { ok: boolean };
    address: { ok: boolean };
  };
};

/**
 * Calcula o score de qualidade do anúncio (0..100).
 *
 * Critérios e pesos:
 *  - Fotos >= 15          → 25 pts
 *  - Descrição >= 800     → 20 pts
 *  - Título >= 50 chars   → 10 pts
 *  - Features >= 25       → 20 pts
 *  - Vídeo ou Tour 3D     → 15 pts
 *  - Áreas preenchidas    → 5 pts
 *  - Endereço completo    → 5 pts
 *
 * Total máximo: 100 pts
 */
export function computeListingQuality(property: Record<string, unknown>): ListingQualityResult {
  const recommendations: string[] = [];

  // ── Fotos ──
  const images: string[] = Array.isArray(property.images) ? property.images as string[] : [];
  const photoCount = images.length;
  const photoOk = photoCount >= 15;
  let photoScore = 0;
  if (photoCount >= 15) photoScore = 25;
  else if (photoCount >= 10) photoScore = 18;
  else if (photoCount >= 5) photoScore = 10;
  else if (photoCount >= 1) photoScore = 5;
  if (!photoOk) recommendations.push(`Adicione mais fotos (${photoCount}/15 — recomendado pelo menos 15)`);

  // ── Descrição ──
  const desc = typeof property.description === "string" ? property.description : "";
  const descLen = desc.length;
  const descOk = descLen >= 800;
  let descScore = 0;
  if (descLen >= 800) descScore = 20;
  else if (descLen >= 400) descScore = 12;
  else if (descLen >= 100) descScore = 6;
  if (!descOk) recommendations.push(`Descrição muito curta (${descLen}/800 caracteres recomendados)`);

  // ── Título ──
  const title = typeof property.title === "string" ? property.title : "";
  const titleLen = title.length;
  const titleOk = titleLen >= 50;
  const titleScore = titleOk ? 10 : titleLen >= 30 ? 6 : titleLen >= 10 ? 3 : 0;
  if (!titleOk) recommendations.push(`Título muito curto (${titleLen}/50 caracteres recomendados)`);

  // ── Features ──
  const rawFeatures = property.features ?? property.featuresV2;
  const featV2 = normalizeFeatures(rawFeatures);
  let featCount = 0;
  for (const group of FEATURE_GROUPS) {
    const groupData = group.groupKey.startsWith("condominio.")
      ? (featV2.condominio?.[group.groupKey.split(".")[1] as "lazer" | "servicos" | "sustentabilidade"] as Record<string, boolean> | undefined)
      : (featV2[group.groupKey as keyof FeaturesV2] as Record<string, boolean> | undefined);
    if (groupData) {
      featCount += Object.values(groupData).filter(Boolean).length;
    }
  }
  const featOk = featCount >= 25;
  let featScore = 0;
  if (featCount >= 25) featScore = 20;
  else if (featCount >= 15) featScore = 13;
  else if (featCount >= 8) featScore = 7;
  else if (featCount >= 3) featScore = 3;
  if (!featOk) recommendations.push(`Marque mais características (${featCount}/25 recomendadas)`);

  // ── Mídia (vídeo / tour) ──
  const videoUrl = (property.video_url ?? property.videoUrl ?? featV2.midia?.youtube_url ?? featV2.midia?.video_direto_url) as string | undefined;
  const tourUrl  = (property.tour_virtual_url ?? property.tourVirtualUrl ?? featV2.midia?.tour_3d_url) as string | undefined;
  const hasVideo = !!(videoUrl && String(videoUrl).trim());
  const hasTour  = !!(tourUrl  && String(tourUrl).trim());
  const mediaOk  = hasVideo || hasTour;
  const mediaScore = hasVideo && hasTour ? 15 : mediaOk ? 10 : 0;
  if (!mediaOk) recommendations.push("Adicione um vídeo (YouTube/Vimeo/mp4) ou Tour 3D/360°");

  // ── Áreas ──
  const totalArea = property.total_area ?? property.totalArea;
  const builtArea = property.built_area ?? property.builtArea;
  const areasOk = !!(totalArea || builtArea);
  const areasScore = areasOk ? 5 : 0;
  if (!areasOk) recommendations.push("Informe a área total ou área construída do imóvel");

  // ── Endereço ──
  const hasAddress = !!(property.address && property.neighborhood && property.city && property.state);
  const addressScore = hasAddress ? 5 : 0;
  if (!hasAddress) recommendations.push("Complete o endereço (rua, bairro, cidade e estado)");

  // ── Score final ──
  const score = Math.min(100, photoScore + descScore + titleScore + featScore + mediaScore + areasScore + addressScore);
  const status: "RUIM" | "BOM" | "PREMIUM" = score >= 85 ? "PREMIUM" : score >= 60 ? "BOM" : "RUIM";

  return {
    score,
    status,
    recommendations,
    details: {
      photos:      { ok: photoOk,  count: photoCount, needed: 15 },
      description: { ok: descOk,   length: descLen,   needed: 800 },
      title:       { ok: titleOk,  length: titleLen,  needed: 50 },
      features:    { ok: featOk,   count: featCount,  needed: 25 },
      media:       { ok: mediaOk,  hasVideo,          hasTour },
      areas:       { ok: areasOk },
      address:     { ok: hasAddress },
    },
  };
}

/**
 * Infere até 3 destaques automáticos a partir das features marcadas.
 * Prioriza itens com seoWeight >= 4.
 */
export function inferHighlights(features: FeaturesV2): string[] {
  const highlights: { label: string; weight: number }[] = [];

  for (const group of FEATURE_GROUPS) {
    for (const item of group.items) {
      if (item.seoWeight < 4) continue;
      const val = getFeatureValue(features, group.groupKey, item.key);
      if (val) highlights.push({ label: item.label, weight: item.seoWeight });
    }
  }

  highlights.sort((a, b) => b.weight - a.weight);
  return highlights.slice(0, 3).map((h) => h.label);
}
