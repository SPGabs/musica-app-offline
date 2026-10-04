# Música — leitor de áudio 100% offline

Leitor de música para iPhone e iPad (também funciona no navegador de qualquer
dispositivo). Sem conta, sem login, sem servidor: as músicas que escolhe na app
**Ficheiros** ficam guardadas no próprio dispositivo (IndexedDB) e a app nunca
envia nem recebe dados da internet.

## O que mudou nesta versão

- Removidos por completo: servidor Node/Hono/tRPC, base de dados MySQL,
  armazenamento em nuvem e todo o sistema de login.
- Biblioteca local em **IndexedDB** (`src/lib/localdb.ts`): músicas, capas e
  playlists nunca saem do dispositivo.
- Importação de ficheiros locais (MP3, M4A, AAC, FLAC, WAV, OGG) com leitura de
  tags ID3 (título, artista, álbum, capa) via `jsmediatags`.
- Rotação por `HashRouter` e `base: "./"` no Vite — funciona offline em qualquer
  contexto, incluindo `file://` dentro do Capacitor.
- Pronto para empacotar como app iOS nativa com **Capacitor 7**.

## Estrutura

```
src/
  components/         CoverArt, SongList, SongActions, AppLayout,
                      MiniPlayer, NowPlaying, PageHeader
  components/ui/      botões, diálogos, menus, toasts (sonner)
  pages/              Músicas, Álbuns, Playlists, Buscar, Ajustes, Adicionar
  lib/localdb.ts      IndexedDB: músicas + playlists + object URLs
  lib/audio.ts        leitura de tags ID3 e duração
  providers/library   estado da biblioteca (React context)
  providers/player    reprodução (<audio> + Media Session)
public/icons          ícones PWA (180, 192, 512)
public/sw.js          cache da app para PWA offline
resources/icon.png    ícone 1024×1024 usado pela app iOS
capacitor.config.ts   configuração Capacitor (appId com.gabriel.musica)
.github/workflows/    iOS IPA + publicação no GitHub Pages
```

## Desenvolvimento (opcional, em qualquer computador)

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # verificação TypeScript
npm run build    # gera dist/ pronto a empacotar
```

## Instalar no iPhone/iPad (uso pessoal, sem Mac)

O repositório inclui um workflow do GitHub Actions (`.github/workflows/ios-ipa.yml`)
que compila a app num Mac virtual do GitHub — **não precisa de ter um Mac**.

1. Crie uma conta gratuita no GitHub e um repositório privado (pode fazer tudo
   no Safari do iPad: github.com → New repository). Envie estes ficheiros
   (no site: Add file → Upload files, mantendo as pastas).
2. No separador **Actions**, autorize os workflows e execute
   "iOS IPA (unsigned)" (Run workflow). Em ~10 minutos fica disponível o
   artefacto **Musica-unsigned-ipa** (um zip com o `.ipa` dentro).
3. Descarregue o artefacto no Safari do iPad.

### Instalar com SideStore (grátis)

- O SideStore assina o `.ipa` com o seu Apple ID gratuito. Limitações da conta
  gratuita: a assinatura expira a cada 7 dias (o SideStore renova sozinho por
  Wi-Fi) e o máximo são 3 apps instaladas por este método.
- A instalação inicial do SideStore precisa **uma única vez** de um computador
  (Windows ou Mac) com o AltServer/SideServer e o iPad ligado por cabo ou na
  mesma rede. Depois disso, instalar o `.ipa` e renovar a assinatura é tudo
  feito no próprio iPad.
- Com o SideStore instalado: My Apps → + → escolha o `Musica-unsigned.ipa`
  descarregado → entre com o seu Apple ID (crie uma palavra-passe específica de
  app em account.apple.com se tiver autenticação de dois fatores).

### Alternativa 100% no iPad (sem computador nenhum)

Serviços de assinatura como Signulous ou iOS Code Signing (~20 €/ano) deixam
enviar o `.ipa` pelo Safari e instalam a app por "over-the-air". Funcionam bem,
mas está a confiar a assinatura a terceiros — para um leitor offline sem
internet, o risco prático é baixo.

### Alternativa sem instalação nenhuma (PWA no iPhone/iPad)

O GitHub Pages publica a app em HTTPS (obrigatório para o Safari). No plano
gratuito o repositório tem de ser **público** — só o código da app fica visível;
as músicas continuam só no seu dispositivo.

1. Abra no **Safari** (não no Chrome): `https://SPGabs.github.io/musica-app-offline/`
2. Toque em Partilhar → **Adicionar ao ecrã principal**.
3. Abra o ícone **Música** e importe ficheiros pela app Ficheiros.

O workflow `.github/workflows/pages.yml` volta a publicar a cada push em `main`.
Na primeira vez: Settings → Pages → Source = **GitHub Actions**.

Limitação: a Apple pode libertar o armazenamento do Safari se o iPhone/iPad
tiver pouco espaço. Com o `.ipa` nativo isso não acontece.

## Privacidade

A app não contém analytics, telemetria, contas nem pedidos de rede. Todas as
músicas e playlists ficam no armazenamento local da própria app no dispositivo.

## Personalizar

- Nome da app e ícone: `capacitor.config.ts` (`appName`, `appId`) e
  `resources/icon.png`.
- Cores/tema: ecrã Ajustes dentro da app (acento e modo claro/escuro).
