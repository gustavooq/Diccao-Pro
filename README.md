# 🎙️ Voz & Dicção Pro (PWA)

Aplicativo progressivo (PWA) mobile-first para desenvolvimento de voz, dicção e articulação, pensado como produto digital pronto para venda sem necessidade de login ou servidor.

## 🚀 Funcionalidades
- **🔐 Código de Acesso:** Barreira de entrada configurável para clientes (ex.: código enviado após a compra na Hotmart/Kiwify).
- **👋 Boas-vindas & Instalação Inteligente:** Onboarding personalizado com o nome do aluno e guia automático para instalar na tela de início (Android e iOS).
- **🏆 Desafio 21 Dias:**
  - Bloqueio progressivo real com virada diária às **06h da manhã** (`diario` por padrão, ou `sequencial` selecionável pelo usuário em ⚙️ Configurações), sequência diária (🔥) no fuso horário local e cronômetro de 60s.
  - **Gravador de Voz Integrado:** Gravações salvas no próprio aparelho via `IndexedDB` (com aviso de segurança ao regravar `↺`).
  - **📈 Minha Evolução (Antes x Depois):** Compara lado a lado o áudio do Dia 1 com a gravação mais recente.
  - **🎓 Certificado de Conclusão:** Gera imagem em alta resolução (1080×1350) personalizada com o nome do aluno para baixar ou compartilhar no Dia 21.
- **🔔 Notificações Personalizáveis:** Botão rápido no topo (`🔔`, que fica persistente enquanto desativado e some automaticamente ao ativar), escolha do horário diário da notificação e opção de **relembrar às 22h** caso o treino do dia ainda não tenha sido feito.
- **⚡ Trava-Línguas:** Biblioteca com busca, filtros, favoritos (⭐), gravador próprio por card e **Desafio 3x** com salvamento de recorde de tempo.
- **🎈 Área Kids:** Tema claro e lúdico com orientação para os pais, exercícios de fonoaudiologia em formato de brincadeira e conquista de estrelas.
- **⚙️ Configurações, Iluminação & Backup:** Escolha entre iluminação **Clara** (☀️) ou **Escura** (🌙), exportação e restauração do progresso em arquivo `.json`, além de opção de reiniciar a jornada.
- **📴 100% PWA & Offline:** Tailwind CSS compilado localmente (`css/app.css`) + Service Worker (`sw.js`) e `manifest.json`.

## 🛠️ Onde personalizar seu conteúdo
Todo o conteúdo e as regras do produto ficam centralizados em `js/conteudo.js`:
- **`config.modoLiberacao`:** `"diario"` (1 treino novo por dia), `"sequencial"` (libera ao concluir o anterior) ou `"livre"` (todos abertos).
- **`config.codigoAcesso`:** ative/desative (`ativo: true/false`) e defina a lista de `codigos` válidos (padrão: `DICCAO21` e `VOZPRO2026`).
- **`desafio21`, `travaLinguas` e `kids`:** edite textos, dicas e passos livremente.

## 🎨 Como atualizar o CSS (caso mude classes visuais)
Se alterar classes Tailwind no `index.html` ou nos arquivos `.js`, gere novamente o arquivo `css/app.css` rodando no PowerShell:

```powershell
.\build-css.ps1
```

## 📂 Estrutura de Pastas
```text
app-diccao/
├── index.html          # Interface principal e modais
├── manifest.json       # Configuração PWA (standalone)
├── sw.js               # Service Worker (cache offline)
├── build-css.ps1       # Script para compilar o Tailwind CSS
├── tailwind.config.js  # Configuração do Tailwind
├── css/
│   ├── input.css       # Entrada do Tailwind
│   ├── app.css         # CSS final compilado e minificado
│   └── custom.css      # Ajustes mobile, safe-area e tema Kids
├── js/
│   ├── conteudo.js     # Textos, configurações e códigos de acesso
│   ├── db.js           # Persistência de áudios no IndexedDB
│   ├── recorder.js     # Componente unificado de gravação de voz
│   └── app.js          # Lógica geral do aplicativo
└── assets/
    ├── icons/          # Ícones PWA (192x192 e 512x512)
    ├── audio/          # Pasta opcional para áudios próprios
    └── img/            # Pasta opcional para imagens
```
