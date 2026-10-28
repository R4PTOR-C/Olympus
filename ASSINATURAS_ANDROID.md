# Assinaturas do plano de professor — Google Play

Billing nativo da loja, com validação no nosso backend. O app nunca decide o
plano: ele entrega o `purchaseToken`, o servidor pergunta pra Google e grava.

## Arquitetura

```
app (cordova-plugin-purchase)
  │  compra → purchaseToken
  ▼
POST /assinaturas/google/validar        (JWT do usuário)
  │  back consulta purchases.subscriptionsv2.get
  │  grava em `assinaturas`, faz acknowledge
  ▼
professores.plano espelhado + LIMITES_PLANO em vinculos.js

Google Play ──RTDN/Pub-Sub──▶ POST /assinaturas/google/rtdn?token=SEGREDO
  (renovou, cancelou, expirou, estornou → back reconsulta e regrava)
```

`assinaturas` é a fonte da verdade. `professores.plano` continua sendo
atualizado para não quebrar tela nenhuma, mas só é *lido* para quem nunca
assinou pela loja — isso preserva concessão manual de plano.

## Arquivos

| Arquivo | O quê |
|---|---|
| `back/config/googleplay.js` | Cliente da Android Publisher API (service account) |
| `back/assinaturas.js` | Rotas, validação, RTDN, `planoDoUsuario()` |
| `back/scripts/assinaturas.sql` | Migration (rodar uma vez) |
| `back/vinculos.js` | Passou a usar `planoDoUsuario()` no limite de alunos |
| `front/src/services/billing.js` | Wrapper do plugin + chamadas ao backend |
| `front/src/views/professores/PlanosModal.js` | Tela de planos ligada na loja |

## Passo a passo pra colocar no ar

### 1. Banco

```bash
psql "$DATABASE_URL" -f back/scripts/assinaturas.sql
```

### 2. Play Console — criar os produtos

Monetizar → Produtos → Assinaturas. Criar duas, com **exatamente** estes IDs
(o backend mapeia por eles em `PRODUTOS`, `back/assinaturas.js`):

| ID da assinatura | Plano | Preço |
|---|---|---|
| `olympus_pro_mensal` | pro | R$ 19,90 / mês |
| `olympus_elite_mensal` | elite | R$ 59,90 / mês |

Cada uma precisa de um **plano base** mensal com renovação automática, ativado.

### 3. Service account (pro backend ler a API)

1. Play Console → Configurações → Acesso via API → vincular um projeto do Google Cloud.
2. No Google Cloud, criar service account + chave JSON.
3. Voltar no Play Console → Usuários e permissões → convidar o e-mail da service
   account com **"Ver dados financeiros"** e **"Gerenciar pedidos e assinaturas"**.
4. Pode levar até 24h pra permissão propagar.

### 4. RTDN (renovações)

1. Google Cloud → Pub/Sub → criar tópico, ex: `play-rtdn`.
2. Dar `Pub/Sub Publisher` no tópico para `google-play-developer-notifications@system.gserviceaccount.com`.
3. Play Console → app → Monetizar → Configuração de monetização → colar o nome
   completo do tópico.
4. Criar uma **subscription do tipo push** apontando para:
   `https://SEU-BACKEND/assinaturas/google/rtdn?token=O_MESMO_RTDN_SECRET`
5. Botão "Enviar notificação de teste" no Play Console — deve aparecer
   `RTDN de teste recebido da Google Play.` no log.

### 5. Variáveis de ambiente (Render)

```
ANDROID_PACKAGE_NAME=br.com.fenrystech.atlanteon
GOOGLE_PLAY_CLIENT_EMAIL=<client_email do JSON>
GOOGLE_PLAY_PRIVATE_KEY=<private_key do JSON, com \n escapado>
RTDN_SECRET=<string aleatória longa>
```

### 6. Testar

1. Play Console → Configurações → Teste de licença: adicionar sua conta Google.
2. Subir o AAB numa trilha de **teste interno** (billing não funciona em debug
   instalado por USB — precisa vir da Play Store).
3. Instalar pelo link da trilha, entrar como professor, assinar.
4. Compras de teste não cobram e o ciclo mensal vira ~5 minutos, então dá pra
   ver renovação e expiração no mesmo dia.

## Migração para API 36 (feita junto)

O Google Play exige API 36 (Android 16) para novos apps desde 31/08/2026. O
projeto Android ainda estava com a cadeia de build do Capacitor 7:

| | Antes | Depois |
|---|---|---|
| `minSdkVersion` | 23 | **24** (exigido pelo Capacitor 8; corta Android 6.0) |
| `compileSdk` / `targetSdk` | 35 | **36** |
| Android Gradle Plugin | 8.7.2 | **8.13.0** |
| Gradle wrapper | 8.11.1 | **8.14.3** |
| androidx (core, appcompat, etc.) | Capacitor 7 | defaults do `@capacitor/android` 8.5.x |
| `cordovaAndroidVersion` | 10.1.1 | 14.0.1 |

Também removi do `android/build.gradle` o `resolutionStrategy` que forçava
`kotlin-stdlib:1.8.22` — pin legado que conflita com os androidx atuais, que
são compilados contra Kotlin 2.x. O projeto não tem código Kotlin próprio.

**Edge-to-edge não exigiu retrabalho de layout:** o Android 15 já impunha
edge-to-edge para quem mira a API 35, então o app já rodava assim. O CSS já
usa `env(safe-area-inset-*)` (`App.css`, `Navbar.css`, `NavbarInferior.css`) e
o `index.html` já tem `viewport-fit=cover`.

## Pendências conhecidas

- **Barra de status:** o app não chama `SystemBars.setStyle()`. Como o tema é
  escuro e os ícones do sistema seguem o modo do aparelho, num aparelho em modo
  claro os ícones podem ficar escuros sobre fundo escuro. Vale conferir no
  dispositivo — se estiver ruim, é uma linha com `SystemBars` do `@capacitor/core`.
- **WebView antigo:** Chromium < 140 tem um bug que zera `env(safe-area-inset-*)`.
  Se aparecer conteúdo embaixo da barra de status em aparelho velho, a correção
  é `@capacitor-community/safe-area`.
- iOS não foi implementado. A estrutura já prevê (`assinaturas.store`), mas
  falta o adapter da App Store Server API.
