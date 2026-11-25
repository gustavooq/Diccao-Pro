/**
 * CONTEÚDO CENTRAL DO APLICATIVO
 * 
 * Você pode editar qualquer texto, adicionar novos trava-línguas
 * ou colocar os caminhos dos seus próprios arquivos de áudio (.mp3).
 */

const APP_CONTEUDO = {
  // Configurações Gerais
  config: {
    nomeApp: "Voz & Dicção Pro",
    slogan: "Sua fala clara, confiante e destravada em 21 dias",
    totalDiasDesafio: 21,

    // Como os dias do desafio são liberados:
    //  "diario"     -> 1 dia novo por dia (precisa concluir o anterior e esperar o dia seguinte)
    //  "sequencial" -> libera o próximo assim que concluir o anterior (pode fazer vários no mesmo dia)
    //  "livre"      -> todos os dias abertos
    modoLiberacao: "diario",

    // Código de acesso (entregue ao cliente após a compra).
    // ativo: false desliga a tela de código.
    // Atenção: é uma barreira simples (fica no código do site), não é segurança forte.
    codigoAcesso: {
      ativo: true,
      codigos: ["DICCAO21", "VOZPRO2026"]
    },

    // Link de suporte/compra exibido na tela de código (opcional)
    linkSuporte: "",

    avisoLegal: "Este aplicativo oferece exercícios de treino vocal e não substitui a avaliação ou o acompanhamento de um(a) fonoaudiólogo(a). Em caso de dificuldades persistentes na fala, procure um profissional."
  },

  // ==========================================
  // 1. DESAFIO 21 DIAS
  // ==========================================
  desafio21: [
    // --- SEMANA 1: DESTRAVAMENTO E ARTICULAÇÃO ---
    {
      dia: 1,
      semana: 1,
      titulo: "Destravando a Mandíbula e Respiração",
      foco: "Relaxamento & Aquecimento",
      duracao: "5 min",
      dica: "A maioria das pessoas que embola as palavras fala com a boca quase fechada. O segredo de uma boa dicção começa em soltar a articulação da mandíbula.",
      passos: [
        "1. Massageie as laterais do rosto (músculo masseter) em círculos com os dedos por 30 segundos.",
        "2. Abra e feche a boca devagar, como em um grande bocejo, soltando o ar com um som suave de 'Aaaaah'.",
        "3. Faça 5 respirações profundas inflando o abdômen (sem levantar os ombros).",
        "4. Toque em 'Gravar Áudio' e leia a frase de treino. Essa é a sua gravação de ANTES, e no Dia 21 você vai comparar!"
      ],
      fraseTreino: "A aranha arranha a rã. A rã arranha a aranha. Nem a aranha arranha a rã, nem a rã arranha a aranha.",
      audioFile: "" // Coloque aqui "assets/audio/dia1.mp3" quando gravar
    },
    {
      dia: 2,
      semana: 1,
      titulo: "Acordando a Língua (O Motor da Fala)",
      foco: "Agilidade Lingual",
      duracao: "5 min",
      dica: "A língua é um músculo. Se ela estiver 'preguiçosa', os sons saem sem nitidez e arrastados.",
      passos: [
        "1. Faça o som de 'estalo de cavalo' com a língua no céu da boca 20 vezes.",
        "2. Passe a ponta da língua por fora dos dentes, fazendo um círculo completo dentro da boca (10x para cada lado).",
        "3. Solte uma vibração de lábios e língua: 'Brrrrrr' contínuo por 10 segundos."
      ],
      fraseTreino: "O rato roeu a rica roupa do rei de Roma. Rainha raivosa rasgou o resto.",
      audioFile: ""
    },
    {
      dia: 3,
      semana: 1,
      titulo: "Vogais Abertas e Projeção",
      foco: "Abertura Vocal",
      duracao: "6 min",
      dica: "Vogais bem articuladas dão clareza e autoridade à sua comunicação.",
      passos: [
        "1. Pronuncie de forma exagerada em frente ao espelho: A - E - I - O - U (abrindo bem a boca em cada uma).",
        "2. Agora inverta: U - O - I - E - A de forma contínua e ritmada.",
        "3. Fale a frase abaixo sorrindo levemente para projetar a voz para a frente."
      ],
      fraseTreino: "Olga olhava as ondas do oceano onde orcas ondulavam orgulhosas.",
      audioFile: ""
    },
    {
      dia: 4,
      semana: 1,
      titulo: "O Famoso Treino da Caneta",
      foco: "Hiperarticulação",
      duracao: "5 min",
      dica: "A técnica da caneta entre os dentes força todos os músculos da face a trabalharem no limite. Quando você retira a caneta, a sensação de leveza é instantânea!",
      passos: [
        "1. Higienize uma caneta e segure-a horizontalmente entre os dentes caninos.",
        "2. Leia a frase de treino 3 vezes tentando pronunciar cada sílaba o mais claramente possível.",
        "3. Retire a caneta e leia a mesma frase novamente. Perceba como as palavras saem soltas!"
      ],
      fraseTreino: "Constitucionalissimamente falando, a perspectiva da pronúncia perfeita pressupõe paciência e prática permanente.",
      audioFile: ""
    },
    {
      dia: 5,
      semana: 1,
      titulo: "Dominando os Fonemas P e B",
      foco: "Sons Oclusivos Bilabiais",
      duracao: "5 min",
      dica: "Os sons de P e B precisam de uma pressão limpa de lábios. Se forem frouxos, a fala perde firmeza.",
      passos: [
        "1. Junte os lábios com firmeza e solte pequenas explosões de ar: 'Pa! Pe! Pi! Po! Pu!'",
        "2. Repita com a voz mais grave: 'Ba! Be! Bi! Bo! Bu!'",
        "3. Alterne rápido: 'Pa-Ba! Pe-Be! Pi-Bi! Po-Bo! Pu-Bu!'"
      ],
      fraseTreino: "Pedro pregou um prego na pedra preta da ponte de pedra.",
      audioFile: ""
    },
    {
      dia: 6,
      semana: 1,
      titulo: "Dominando os Fonemas T e D",
      foco: "Ponta da Língua nos Dentes",
      duracao: "5 min",
      dica: "O T e o D exigem precisão da ponta da língua atrás dos dentes incisivos superiores.",
      passos: [
        "1. Repita com firmeza: 'Ta-Te-Ti-To-Tu' dando estalos secos da língua.",
        "2. Repita com suavidade: 'Da-De-Di-Do-Du'.",
        "3. Fale a frase em 3 velocidades: devagar, normal e acelerada."
      ],
      fraseTreino: "Tito tentou trazer três tatuís tostados na travessa de tomate.",
      audioFile: ""
    },
    {
      dia: 7,
      semana: 1,
      titulo: "Revisão da Semana 1 & Teste de Gravação",
      foco: "Autoavaliação & Conquista",
      duracao: "7 min",
      dica: "Parabéns por completar sua 1ª semana! Hoje é dia de gravar a sua voz e perceber a evolução.",
      passos: [
        "1. Faça o aquecimento rápido: 10 estalos de língua + 'Brrrrr' por 10 segundos.",
        "2. Toque em 'Gravar Áudio' aqui embaixo e leia a frase com naturalidade.",
        "3. Ouça a gravação e compare com a do Dia 1 no card 'Minha Evolução'. Observe onde as palavras podem ficar ainda mais nítidas."
      ],
      fraseTreino: "Quem a paca cara compra, paca cara pagará. Sete sábios sapateiros sapateavam no saguão.",
      audioFile: ""
    },

    // --- SEMANA 2: CLAREZA, RITMO E ENTONAÇÃO ---
    {
      dia: 8,
      semana: 2,
      titulo: "Destravando o 'R' Brando e Vibrante",
      foco: "Fonema R",
      duracao: "6 min",
      dica: "Dificuldade com 'Arara' ou 'Prato'? O 'R' precisa de uma vibração sutil e rápida da ponta da língua.",
      passos: [
        "1. Repita a sequência: 'Tra - Tre - Tri - Tro - Tru'.",
        "2. Agora faça: 'Ara - Ere - Iri - Oro - Uru'.",
        "3. Fale a frase abaixo prestando atenção na vibração da língua."
      ],
      fraseTreino: "Três pratos de trigo para três tigres tristes que comiam trigo nos pratos.",
      audioFile: ""
    },
    {
      dia: 9,
      semana: 2,
      titulo: "O Segredo do 'S' (Sem Soprar Nem Chiolar)",
      foco: "Fonema Sibilante S",
      duracao: "5 min",
      dica: "O som do 'S' não deve vazar ar pelas laterais da boca. O fluxo de ar deve sair reto pelo centro dos dentes.",
      passos: [
        "1. Sorria levemente e solte um ar contínuo de cobra: 'Sssssssss' por 10 segundos.",
        "2. Alterne em pulso: 'Sa! Se! Si! So! Su!' sem chiado.",
        "3. Fale a frase com bastante clareza nas consoantes finais."
      ],
      fraseTreino: "O sábio sabia que o sabiá sabia assobiar no silêncio da serra.",
      audioFile: ""
    },
    {
      dia: 10,
      semana: 2,
      titulo: "Pausas Estratégicas e Respiração Invisível",
      foco: "Controle de Ritmo",
      duracao: "6 min",
      dica: "Quem fala sem pausas parece ansioso e perde o fôlego no meio da frase. A pausa é onde sua voz ganha autoridade.",
      passos: [
        "1. Leia a frase fazendo uma pausa consciente de 1 segundo a cada barra [ / ].",
        "2. Aproveite a pausa para puxar um gole suave de ar pelo nariz, sem barulho.",
        "3. Repita mantendo o olhar firme."
      ],
      fraseTreino: "A clareza da comunicação [ / ] não está na velocidade das palavras [ / ], mas no espaço que você dá para elas serem compreendidas.",
      audioFile: ""
    },
    {
      dia: 11,
      semana: 2,
      titulo: "Modulação de Voz: O Fim do Monótono",
      foco: "Musicalidade e Dinâmica",
      duracao: "5 min",
      dica: "Voz monótona dá sono. Aprenda a variar entre tons mais agudos (energia) e tons mais graves (credibilidade).",
      passos: [
        "1. Fale a palavra 'SIM' em tom de dúvida (subindo o tom: Sim?).",
        "2. Fale 'SIM' com certeza absoluta (descendo o tom com firmeza: Sim!).",
        "3. Fale a frase alternando o volume e a entonação das palavras marcadas."
      ],
      fraseTreino: "Não é APENAS o que você diz, é o IMPACTO com que a sua voz ecoa nos ouvidos de quem ESCUTA.",
      audioFile: ""
    },
    {
      dia: 12,
      semana: 2,
      titulo: "Encontros Consonantais Complexos (CL, GL, FL, BL)",
      foco: "Fluidez Articulatória",
      duracao: "5 min",
      dica: "Quando duas consoantes se encontram com a letra L, a língua precisa fazer uma transição ultrarrápida.",
      passos: [
        "1. Repita 5x: 'Bla - Cla - Fla - Gla - Pla - Tla'.",
        "2. Exagere o movimento da língua colando no céu da boca em cada 'L'.",
        "3. Fale a frase acelerando gradualmente."
      ],
      fraseTreino: "Clara clareou a claraboia com cloro para a classe comemorar o clima claro.",
      audioFile: ""
    },
    {
      dia: 13,
      semana: 2,
      titulo: "Fim das Palavras: Não 'Coma' as Letras Finais!",
      foco: "Terminações R, S e L",
      duracao: "5 min",
      dica: "O vício de linguagem mais comum no Brasil é cortar o 'R' final (falar 'faze' em vez de 'fazer') e o 'S' no plural.",
      passos: [
        "1. Pronuncie enfatizando o final: 'CantaR, FazeR, QuereR, ViviR, PartiR'.",
        "2. Pronuncie no plural com o 'S' nítido: 'As pessoas, Os resultados, Todas as coisas'.",
        "3. Leia o treino garantindo que cada letra final seja ouvida com clareza."
      ],
      fraseTreino: "Precisamos aprender a ouvir, compreender melhor as pessoas e entregar os resultados prometidos.",
      audioFile: ""
    },
    {
      dia: 14,
      semana: 2,
      titulo: "Revisão da Semana 2: O Desafio da Caneta 2.0",
      foco: "Consolidação e Força",
      duracao: "6 min",
      dica: "Você já está na metade do desafio! Sua musculatura facial já está mais forte e responsiva.",
      passos: [
        "1. Coloque a caneta na boca e fale a frase de treino com energia total.",
        "2. Faça 3 repetições completas com caneta.",
        "3. Retire a caneta e sinta a explosão de clareza ao falar novamente."
      ],
      fraseTreino: "O prestidigitador prodigioso prognosticou a prodigiosa probabilidade de progresso perpétuo.",
      audioFile: ""
    },

    // --- SEMANA 3: DICÇÃO SOB PRESSÃO, PROJEÇÃO E ALTO IMPACTO ---
    {
      dia: 15,
      semana: 3,
      titulo: "Velocidade Controlada (Falar Rápido Sem Embolar)",
      foco: "Ritmo sob Demanda",
      duracao: "6 min",
      dica: "Falar rápido com dicção perfeita é um superpoder. O truque é manter a amplitude da boca mesmo acelerando.",
      passos: [
        "1. Fale o trava-língua bem devagar, quase em câmera lenta.",
        "2. Repita em velocidade de conversa normal.",
        "3. Agora acelere ao máximo que conseguir sem errar nenhuma sílaba!"
      ],
      fraseTreino: "Disseram que na minha rua há um ninho de mafagafos com sete mafagafinhos. Quem desmafagafar esses mafagafinhos, bom desmafagafador será.",
      audioFile: ""
    },
    {
      dia: 16,
      semana: 3,
      titulo: "Ressonância e Voz de Peito",
      foco: "Projeção sem Forçar a Garganta",
      duracao: "5 min",
      dica: "Nunca empurre a voz pela garganta (isso causa rouquidão). Use o peito e a cavidade nasal como caixa de som.",
      passos: [
        "1. Coloque a mão no peito e faça um som prolongado de 'Mmmmmm' até sentir vibrar sob a mão.",
        "2. Solte a vogal mantendo a mesma vibração: 'Mmmmmaaaaa, Mmmmmmooooo'.",
        "3. Projete a frase para o fundo da sala imaginária."
      ],
      fraseTreino: "Minha mensagem tem peso, presença e propósito em cada palavra pronunciada.",
      audioFile: ""
    },
    {
      dia: 17,
      semana: 3,
      titulo: "Dicção para Gravação de Vídeos e Áudios",
      foco: "Comunicação para Câmera e Microfone",
      duracao: "6 min",
      dica: "O microfone amplifica defeitos de dicção como respiração pesada, cliques de saliva e finais engolidos.",
      passos: [
        "1. Tome um gole de água (a hidratação elimina o barulho de 'estalinhos' da saliva).",
        "2. Olhe para a lente da câmera do celular a 40cm de distância.",
        "3. Fale a frase como se estivesse abrindo um vídeo para 100 mil pessoas."
      ],
      fraseTreino: "Seja muito bem-vindo! Hoje eu vou te mostrar exatamente como dominar a sua comunicação com total segurança.",
      audioFile: ""
    },
    {
      dia: 18,
      semana: 3,
      titulo: "Dicção em Momentos de Nervosismo (Técnica SOS)",
      foco: "Controle de Ansiedade na Fala",
      duracao: "5 min",
      dica: "Quando o nervosismo bate, a boca seca e a fala acelera. Esse exercício de 60 segundos destrava o cérebro.",
      passos: [
        "1. Inspire pelo nariz em 4 segundos, segure por 2 segundos e solte em 6 segundos pela boca.",
        "2. Solte os ombros e balance os braços suavemente.",
        "3. Fale com firmeza e volume constante a frase de treino."
      ],
      fraseTreino: "Eu domino o meu ritmo. A cada respiração, meu pensamento fica claro e minhas palavras fluem com facilidade.",
      audioFile: ""
    },
    {
      dia: 19,
      semana: 3,
      titulo: "O Nível Supremo: Trava-Línguas Polissilábicos",
      foco: "Desafio Extremo",
      duracao: "6 min",
      dica: "Palavras longas com muitos encontros de consoantes são o teste final da dicção profissional.",
      passos: [
        "1. Separe a palavra principal em sílabas: In-cons-ti-tu-cio-nal-men-te.",
        "2. Fale de trás para frente: 'men-te', 'nal-men-te', 'cio-nal-men-te'...",
        "3. Fale a frase completa de uma só vez!"
      ],
      fraseTreino: "A inconstitucionalidade do ato foi desconsiderada despropositadamente pelos parlamentares descontentes.",
      audioFile: ""
    },
    {
      dia: 20,
      semana: 3,
      titulo: "A Arte da Fala Expressiva e Sorriso Vocal",
      foco: "Carisma e Conexão",
      duracao: "5 min",
      dica: "O 'sorriso vocal' deixa seu tom convidativo e agradável de ouvir, mesmo em mensagens de voz de WhatsApp.",
      passos: [
        "1. Coloque um sorriso no rosto antes mesmo de emitir o primeiro som.",
        "2. Fale a frase mantendo a musculatura do rosto elevada e os olhos expressivos.",
        "3. Perceba como a voz soa mais calorosa e envolvente."
      ],
      fraseTreino: "É um prazer imenso estar aqui com você. Tenho certeza de que grandes oportunidades estão por vir!",
      audioFile: ""
    },
    {
      dia: 21,
      semana: 3,
      titulo: "O Grande Dia: Comparação Antes x Depois!",
      foco: "Celebração & Nova Voz",
      duracao: "8 min",
      dica: "Você chegou ao fim dos 21 dias! Hoje você vai comparar sua gravação com a do Dia 1 e constatar a sua evolução.",
      passos: [
        "1. Faça seu aquecimento de campeão: estalos de língua + caneta por 1 minuto.",
        "2. Toque em 'Gravar Áudio' e grave o manifesto final.",
        "3. Conclua o dia e abra o card 'Minha Evolução': ouça o Dia 1 e o Dia 21 lado a lado e perceba a diferença de clareza, segurança e presença!"
      ],
      fraseTreino: "Eu concluí o Desafio de 21 Dias. Minha fala agora tem clareza, ritmo, postura e poder. Minha voz é a minha melhor ferramenta!",
      audioFile: ""
    }
  ],

  // ==========================================
  // 2. TRAVA-LÍNGUAS (BIBLIOTECA & DESAFIOS)
  // ==========================================
  travaLinguas: [
    {
      id: "tl1",
      titulo: "O Rato e a Roupa",
      texto: "O rato roeu a roupa do rei de Roma, a rainha com raiva roeu o resto.",
      dificuldade: "facil",
      fonema: "R",
      dica: "Enfatize a força do R no início de cada palavra sem trancar a garganta."
    },
    {
      id: "tl2",
      titulo: "Três Tigres Tristes",
      texto: "Três pratos de trigo para três tigres tristes comerem no trigal.",
      dificuldade: "medio",
      fonema: "TR/PR",
      dica: "A ponta da língua deve bater rapidamente atrás dos dentes no 'TR'."
    },
    {
      id: "tl3",
      titulo: "O Sapo no Saco",
      texto: "Olha o sapo dentro do saco, o saco com o sapo dentro, o sapo batendo papo e o papo soltando vento.",
      dificuldade: "facil",
      fonema: "S/P",
      dica: "Controle a respiração para não faltar ar no final da rima."
    },
    {
      id: "tl4",
      titulo: "A Aranha e a Rã",
      texto: "A aranha arranha a rã, a rã arranha a aranha. Nem a aranha arranha a rã, nem a rã arranha a aranha.",
      dificuldade: "medio",
      fonema: "R/NH",
      dica: "Cuidado para não trocar o som do 'R' pelo som de 'L'."
    },
    {
      id: "tl5",
      titulo: "O Sabido Sabiá",
      texto: "O sabiá não sabia que o sábio sabia que o sabiá não sabia assobiar.",
      dificuldade: "medio",
      fonema: "S",
      dica: "Mantenha o ar direcionado para a frente dos dentes incisivos."
    },
    {
      id: "tl6",
      titulo: "O Ninho de Mafagafos",
      texto: "Num ninho de mafagafos há sete mafagafinhos. Quando a mafagafa gafa, gafam os sete mafagafinhos.",
      dificuldade: "dificil",
      fonema: "F/G",
      dica: "Articule bem a abertura da boca para não embolar as sílabas 'ga' e 'fa'."
    },
    {
      id: "tl7",
      titulo: "Pedro e o Prego",
      texto: "Pedro pregou um prego na pedra preta da parede perto do porto.",
      dificuldade: "facil",
      fonema: "P/PR",
      dica: "Faça uma explosão limpa com os dois lábios juntos no 'P'."
    },
    {
      id: "tl8",
      titulo: "O Peito do Pé do Pai",
      texto: "O peito do pé do pai de Pedro é preto. Quem disser que o peito do pé do pai de Pedro não é preto, tem o peito do pé mais preto que o peito do pé do pai de Pedro.",
      dificuldade: "dificil",
      fonema: "P/T",
      dica: "Desafio de fôlego! Tente falar tudo em uma única respiração profunda."
    },
    {
      id: "tl9",
      titulo: "Casa Suja, Chão Sujo",
      texto: "Casa suja, chão sujo. Chão sujo, casa suja. Casa suja, chão sujo.",
      dificuldade: "facil",
      fonema: "S/CH",
      dica: "Excelente para diferenciar o 'S' (dentes fechados) do 'CH' (lábios projetados para frente)."
    },
    {
      id: "tl10",
      titulo: "Técnica do Desengraxador",
      texto: "O desengraxador desengraxou a caixa de graxa do engraxate na estação.",
      dificuldade: "dificil",
      fonema: "X/GR",
      dica: "Separe mentalmente as sílabas antes de acelerar."
    },
    {
      id: "tl11",
      titulo: "Doce do Doce",
      texto: "O doce perguntou pro doce qual é o doce mais doce que o doce de batata-doce. O doce respondeu pro doce que o doce mais doce é o doce de batata-doce.",
      dificuldade: "facil",
      fonema: "D/T",
      dica: "Foque na ponta da língua batendo no palato a cada 'D'."
    },
    {
      id: "tl12",
      titulo: "O Caju do Juca",
      texto: "Juca ajuda o jeca a juntar o jambo e o caju que caiu na jaula da jiboia.",
      dificuldade: "medio",
      fonema: "J/C",
      dica: "Projete os lábios para frente ao fazer o som vibrante do 'J'."
    }
  ],

  // ==========================================
  // 3. SEÇÃO KIDS (LÚDICO & FONOAUDIOLOGIA INFANTIL)
  // ==========================================
  kids: {
    apresentacao: "Bem-vindo ao Clube da Voz Divertida! Aqui a gente treina a fala brincando como animais e super-heróis!",
    
    // Categorias de brincadeiras
    categorias: [
      { id: "bichos", nome: "🦁 Sons dos Bichos", desc: "Exercícios divertidos de fonoaudiologia" },
      { id: "respiracao", nome: "🎈 Respiração Mágica", desc: "Aprenda a respirar como um balão" },
      { id: "travalinguas", nome: "🎪 Trava-Línguas Kids", desc: "Desafios divertidos para falar rápido" }
    ],

    // Exercícios dos Bichos
    exerciciosBichos: [
      {
        id: "kb1",
        titulo: "O Rugido do Leão",
        emoji: "🦁",
        beneficio: "Solta a mandíbula e relaxa o rosto",
        instrucao: "Abra a boca bem grande, ponha a língua para fora até onde der e solte um rugido forte: 'ROOOAAAR!'. Faça 5 vezes!",
        estrelas: 1
      },
      {
        id: "kb2",
        titulo: "O Galope do Cavalinho",
        emoji: "🐴",
        beneficio: "Fortalece a língua para falar palavras com 'R'",
        instrucao: "Cole a língua no céu da boca e estale com força fazendo o barulhinho do cavalinho correndo: 'Pocoto-pocoto-pocoto'. Faça 20 vezes!",
        estrelas: 1
      },
      {
        id: "kb3",
        titulo: "A Abelhinha Zumbidora",
        emoji: "🐝",
        beneficio: "Aquece a voz e melhora a clareza",
        instrucao: "Encoste os dentes de leve e faça o barulho da abelha voando: 'Zzzzzzzzzz'. Tente fazer durar 10 segundos sem parar!",
        estrelas: 1
      },
      {
        id: "kb4",
        titulo: "O Peixinho Mandando Beijo",
        emoji: "🐠",
        beneficio: "Fortalece os lábios para falar melhor as letras P, B e M",
        instrucao: "Faça bico de peixinho e mande um estalo bem alto de beijo: 'Smack!'. Repita 10 vezes alternando com um sorrisão largo!",
        estrelas: 1
      },
      {
        id: "kb5",
        titulo: "A Motoquinha Acelerando",
        emoji: "🏍️",
        beneficio: "Vibração de lábios para destravar a fala",
        instrucao: "Junte os lábios bem soltinhos e faça a motoquinha acelerar: 'Brrrrrrrrr!'. Faça cosquinha nos lábios por 10 segundos!",
        estrelas: 1
      }
    ],

    // Exercícios de Respiração Mágica
    exerciciosRespiracao: [
      {
        id: "kr1",
        titulo: "O Grande Balão na Barriga",
        emoji: "🎈",
        beneficio: "Respiração diafragmática fácil para crianças",
        instrucao: "Coloque a mãozinha na barriga. Puxe o ar pelo nariz inflando a barriga como um balão colorido. Agora solte o ar devagarzinho fazendo 'shhhh' até o balão esvaziar!",
        estrelas: 1
      },
      {
        id: "kr2",
        titulo: "Soprar a Velinha Sem Apagar",
        emoji: "🎂",
        beneficio: "Controle suave de fluxo de ar",
        instrucao: "Imagine que tem uma vela de aniversário na sua frente. Sopre o ar bem suave para fazer a chama dançar, mas sem deixar a vela apagar!",
        estrelas: 1
      },
      {
        id: "kr3",
        titulo: "Cheirar a Florzinha e Soprar a Sopa",
        emoji: "🌸",
        beneficio: "Ritmo natural de inspirar pelo nariz e expirar pela boca",
        instrucao: "Puxe o ar pelo nariz bem fundo sentindo o cheiro de uma flor linda. Depois solte o ar pela boca suave como se estivesse esfriando uma sopa quentinha!",
        estrelas: 1
      }
    ],

    // Trava-línguas Kids
    travalinguasKids: [
      {
        id: "kt1",
        titulo: "O Pato com Sapato",
        emoji: "🦆",
        texto: "O pato perto do prato pôs o sapato no pé.",
        estrelas: 1
      },
      {
        id: "kt2",
        titulo: "A Vaca Amarela",
        emoji: "🐮",
        texto: "Vaca amarela pulou na panela, quem falar primeiro come toda a meleca dela!",
        estrelas: 1
      },
      {
        id: "kt3",
        titulo: "Gato Escondido",
        emoji: "🐱",
        texto: "Gato escondido com o rabo de fora tá mais escondido que rabo escondido com gato de fora.",
        estrelas: 1
      },
      {
        id: "kt4",
        titulo: "O Pinho da Pinga",
        emoji: "🌲",
        texto: "Pinga a pipa perto do prato, corre o pinto e mia o gato.",
        estrelas: 1
      }
    ]
  }
};
