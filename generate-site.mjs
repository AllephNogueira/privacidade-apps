/**
 * Gera o site estÃ¡tico de polÃ­ticas de privacidade (Play Store / LGPD).
 * SaÃ­da: privacidade-play/index.html + home/privacidade-*.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SITE = __dirname;
const HOME = path.join(SITE, "home");
const INVENTORY = path.join(SITE, "_apps-full.json");

const PUBLISHER = {
  name: "Alleph Nogueira â€” FÃ¡brica de Software",
  email: "allephnogueira@gmail.com",
  country: "Brasil",
  updated: "24 de julho de 2026",
};

/**
 * Converte nome de pasta em slug de URL.
 * @param {string} folder
 * @returns {string}
 */
function toSlug(folder) {
  const special = {
    OrganizadordeAssinaturas: "organizador-de-assinaturas",
    "Alta-Pressao-GNV": "alta-pressao-gnv",
    DriverIQ: "driver-iq",
    PossoComprar: "posso-comprar",
    LarControl: "lar-control",
    TecnoGestor: "tecno-gestor",
  };
  if (special[folder]) return special[folder];
  return String(folder)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Perfis de conteÃºdo por tipo de app (Play Data safety + LGPD).
 * @param {object} app
 */
function buildProfile(app) {
  const folder = app.folder;
  const perms = String(app.perms || "")
    .split("|")
    .filter(Boolean);
  const has = (p) => perms.some((x) => x.includes(p));
  const cat = String(app.category || "");
  const label = app.label || app.folder;

  const purposeByFolder = {
    "Alta-Pressao-GNV":
      "gestÃ£o de frota/postos GNV, rotas, financeiro operacional e assinatura Premium",
    DriverIQ:
      "assistÃªncia ao motorista (rotas, captura e alertas) e produtividade na direÃ§Ã£o",
    LarControl: "organizaÃ§Ã£o da casa, tarefas e lembretes domÃ©sticos",
    Oikos: "gestÃ£o domÃ©stica, compras e lembretes do lar",
    PossoComprar: "organizaÃ§Ã£o financeira pessoal e controle de gastos",
    OrganizadordeAssinaturas: "controle de assinaturas e lembretes de cobranÃ§a",
    TecnoGestor: "CRM/gestÃ£o de clientes e serviÃ§os para profissionais",
    GestanteSemana: "acompanhamento de semanas de gestaÃ§Ã£o e lembretes (uso informativo)",
    MedicacaoLembrete: "lembretes de medicaÃ§Ã£o e histÃ³rico local de doses",
    VacinaCrianca: "organizaÃ§Ã£o do cartÃ£o de vacinas infantil (uso familiar/informativo)",
    EscolaKids: "organizaÃ§Ã£o escolar infantil (rotina e lembretes)",
    PetVacina: "cartÃ£o de vacinas e lembretes do pet",
    PersonalFit: "rotina de treinos e acompanhamento fitness local",
  };

  const purpose =
    purposeByFolder[folder] ||
    `utilitÃ¡rio Android na categoria â€œ${cat || "Produtividade"}â€, com dados salvos no aparelho e recursos Premium via Google Play quando disponÃ­veis`;

  const dataExamples = [];
  if (/Finan|NegÃ³c|CLT|FGTS|IRPF|INSS|dÃ­vid|aluguel|MEI|frete|obra|consÃ³rc/i.test(cat + label + folder)) {
    dataExamples.push(
      "valores, datas e registros que vocÃª digita (ex.: cÃ¡lculos, lanÃ§amentos, clientes ou itens)",
    );
  }
  if (/SaÃºde|fitness|Medic|Gestante|Vacina|Pet|Personal/i.test(cat + label + folder)) {
    dataExamples.push(
      "lembretes, nomes de itens/medicamentos/vacinas e horÃ¡rios que vocÃª cadastra (nÃ£o substitui orientaÃ§Ã£o profissional)",
    );
  }
  if (/Auto|veÃ­c|CNH|Frota|Frete|GNV|Ã“leo|Sinistro|INMETRO/i.test(cat + label + folder)) {
    dataExamples.push(
      "dados de veÃ­culos, manutenÃ§Ãµes, checklists ou simulaÃ§Ãµes que vocÃª registra",
    );
  }
  if (dataExamples.length === 0) {
    dataExamples.push(
      "cadastros e histÃ³rico que vocÃª cria no app (textos, datas, status e preferÃªncias)",
    );
  }

  const permissionBlocks = [];
  if (has("INTERNET") || has("ACCESS_NETWORK_STATE")) {
    permissionBlocks.push({
      name: "Internet / estado da rede",
      why: "Permitir recursos online necessÃ¡rios (ex.: mapas, sincronizaÃ§Ã£o pontual ou validaÃ§Ã£o de compra na Play). Sem uso para vender seus dados.",
    });
  }
  if (has("ACCESS_FINE_LOCATION") || has("ACCESS_COARSE_LOCATION")) {
    permissionBlocks.push({
      name: "LocalizaÃ§Ã£o",
      why: "Usada apenas para funÃ§Ãµes do app relacionadas a mapa/rota/proximidade, quando vocÃª concede a permissÃ£o. NÃ£o rastreamos em segundo plano para publicidade.",
    });
  }
  if (has("CAMERA")) {
    permissionBlocks.push({
      name: "CÃ¢mera",
      why: "Permitir captura de fotos/documentos exigidos por funcionalidades do app, somente quando vocÃª inicia a aÃ§Ã£o.",
    });
  }
  if (has("RECORD_AUDIO")) {
    permissionBlocks.push({
      name: "Microfone",
      why: "Usado apenas se o app oferecer recurso de Ã¡udio iniciado por vocÃª. NÃ£o gravamos Ã¡udio continuamente.",
    });
  }
  if (has("POST_NOTIFICATIONS")) {
    permissionBlocks.push({
      name: "NotificaÃ§Ãµes",
      why: "Enviar lembretes locais configurÃ¡veis. Opcional â€” o app continua utilizÃ¡vel se vocÃª negar.",
    });
  }
  if (has("RECEIVE_BOOT_COMPLETED") || has("SCHEDULE_EXACT_ALARM") || has("WAKE_LOCK")) {
    permissionBlocks.push({
      name: "Agendamento / reinÃ­cio do aparelho",
      why: "Reagendar lembretes apÃ³s reinÃ­cio ou em horÃ¡rios exatos quando vocÃª ativa alertas.",
    });
  }
  if (has("BILLING") || app.sku) {
    permissionBlocks.push({
      name: "Google Play Billing (compras/assinaturas)",
      why: "Processar assinatura Premium / Impulso 90. Pagamentos sÃ£o tratados pela Google; recebemos o status necessÃ¡rio para liberar recursos.",
    });
  }
  if (has("AD_ID")) {
    permissionBlocks.push({
      name: "ID de publicidade (AD_ID)",
      why: "Pode ser usado por SDKs Google/mediÃ§Ã£o conforme a configuraÃ§Ã£o do app. NÃ£o vendemos listas de usuÃ¡rios. VocÃª pode limitar no Android.",
    });
  }
  if (has("SYSTEM_ALERT_WINDOW")) {
    permissionBlocks.push({
      name: "Exibir sobre outros apps",
      why: "SobreposiÃ§Ãµes/atalhos de produtividade quando o recurso estiver ativo e autorizado por vocÃª.",
    });
  }
  if (has("REQUEST_IGNORE_BATTERY_OPTIMIZATIONS")) {
    permissionBlocks.push({
      name: "OtimizaÃ§Ã£o de bateria",
      why: "Melhorar a confiabilidade de alertas em segundo plano, se vocÃª permitir.",
    });
  }
  if (permissionBlocks.length === 0) {
    permissionBlocks.push({
      name: "PermissÃµes mÃ­nimas",
      why: "O app prioriza funcionamento local. Se permissÃµes forem adicionadas no futuro, esta polÃ­tica serÃ¡ atualizada.",
    });
  }

  const specialNotes = [];
  if (/Gestante|Medic|Vacina|SaÃºde|PersonalFit/i.test(folder + cat + label)) {
    specialNotes.push(
      "ConteÃºdo informativo/organizacional â€” nÃ£o constitui aconselhamento mÃ©dico. Em dÃºvidas de saÃºde, consulte profissional habilitado.",
    );
  }
  if (/EscolaKids|VacinaCrianca/i.test(folder)) {
    specialNotes.push(
      "Se o app for usado por responsÃ¡veis para organizar rotina infantil, os dados sÃ£o inseridos pelo responsÃ¡vel e ficam no dispositivo. NÃ£o direcionamos publicidade a crianÃ§as.",
    );
  }
  if (/Alta-Pressao-GNV|DriverIQ/i.test(folder)) {
    specialNotes.push(
      "Recursos de mapa/localizaÃ§Ã£o dependem de permissÃ£o do sistema e de serviÃ§os de mapa do dispositivo/terceiros (ex.: Google Maps/Waze), sujeitos Ã s polÃ­ticas desses provedores.",
    );
  }
  if (has("AD_ID")) {
    specialNotes.push(
      "Este app declara permissÃ£o relacionada a identificador de publicidade. Revise tambÃ©m a seÃ§Ã£o Data safety na ficha da Play Store.",
    );
  }

  const kidsSection = /EscolaKids|VacinaCrianca/i.test(folder)
    ? "O app pode ser usado por pais/responsÃ¡veis. NÃ£o coletamos intencionalmente dados de crianÃ§as em servidores nossos. Cadastros ficam locais no aparelho do responsÃ¡vel."
    : "O app nÃ£o Ã© direcionado a menores de 13 anos. NÃ£o coletamos intencionalmente dados de crianÃ§as.";

  const thirdParties = [];
  if (has("BILLING") || app.sku) {
    thirdParties.push("Google Play (faturamento de assinaturas/compras)");
  }
  if (has("INTERNET") && /Alta-Pressao|DriverIQ|Oikos|LarControl/i.test(folder)) {
    thirdParties.push(
      "ServiÃ§os Google no dispositivo (ex.: Play Services / mapas), quando a funÃ§Ã£o exigir",
    );
  }
  if (thirdParties.length === 0) {
    thirdParties.push(
      "Na configuraÃ§Ã£o padrÃ£o offline-first, nÃ£o enviamos o conteÃºdo do seu cadastro para servidores nossos. A Google Play pode processar instalaÃ§Ã£o/atualizaÃ§Ã£o e, se houver, compras.",
    );
  }

  return {
    label,
    purpose,
    dataExamples,
    permissionBlocks,
    specialNotes,
    kidsSection,
    thirdParties,
    packageName: app.applicationId || "(conforme ficha na Play Console)",
    hasBilling: Boolean(has("BILLING") || app.sku),
    hasLocation: has("ACCESS_FINE_LOCATION") || has("ACCESS_COARSE_LOCATION"),
    hasCamera: has("CAMERA"),
    hasAdsId: has("AD_ID"),
  };
}

/**
 * Escapa HTML.
 * @param {string} s
 */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Monta HTML de uma polÃ­tica.
 * @param {object} app
 * @param {string} slug
 */
function renderPolicyPage(app, slug) {
  const p = buildProfile(app);
  const permsHtml = p.permissionBlocks
    .map(
      (b) =>
        `<li><strong>${esc(b.name)}:</strong> ${esc(b.why)}</li>`,
    )
    .join("\n");
  const dataHtml = p.dataExamples.map((d) => `<li>${esc(d)}</li>`).join("\n");
  const thirdHtml = p.thirdParties.map((t) => `<li>${esc(t)}</li>`).join("\n");
  const notesHtml = p.specialNotes
    .map((n) => `<p class="note">${esc(n)}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacidade â€” ${esc(p.label)}</title>
  <meta name="description" content="PolÃ­tica de Privacidade do aplicativo ${esc(p.label)} para Google Play e LGPD." />
  <link rel="stylesheet" href="../css/styles.css" />
</head>
<body>
  <a class="skip" href="#conteudo">Ir ao conteÃºdo</a>
  <header class="top">
    <div class="wrap top-inner">
      <a class="brand" href="../index.html">FÃ¡brica de Software â€” Privacidade</a>
      <nav><a href="../index.html">Todos os apps</a></nav>
    </div>
  </header>
  <main id="conteudo" class="wrap card">
    <p class="eyebrow">PolÃ­tica de Privacidade Â· Google Play</p>
    <h1>${esc(p.label)}</h1>
    <p class="meta">
      Pacote: <code>${esc(p.packageName)}</code><br />
      Ãšltima atualizaÃ§Ã£o: <strong>${esc(PUBLISHER.updated)}</strong>
    </p>

    <h2>1. Quem somos</h2>
    <p>
      O aplicativo <strong>${esc(p.label)}</strong> Ã© publicado por
      <strong>${esc(PUBLISHER.name)}</strong> (â€œnÃ³sâ€).
      Contato: <a href="mailto:${esc(PUBLISHER.email)}">${esc(PUBLISHER.email)}</a> Â· PaÃ­s: ${esc(PUBLISHER.country)}.
    </p>

    <h2>2. Finalidade do app</h2>
    <p>O app destina-se a: ${esc(p.purpose)}.</p>
    ${notesHtml}

    <h2>3. Dados que vocÃª fornece</h2>
    <p>VocÃª pode cadastrar, voluntariamente, informaÃ§Ãµes como:</p>
    <ul>
${dataHtml}
    </ul>
    <p>
      <strong>Armazenamento padrÃ£o:</strong> o conteÃºdo de uso fica no seu dispositivo
      (armazenamento/banco local). NÃ£o operamos um â€œperfil de marketingâ€ com esses dados.
    </p>

    <h2>4. Dados que nÃ£o pedimos como regra</h2>
    <ul>
      <li>Senhas de banco, cartÃ£o completo ou credenciais de instituiÃ§Ãµes financeiras</li>
      <li>Venda de bases de dados pessoais a terceiros</li>
      <li>Coleta oculta de contatos/fotos sem aÃ§Ã£o sua (salvo permissÃ£o e funÃ§Ã£o explÃ­cita, se existir)</li>
    </ul>

    <h2>5. Compras e assinaturas (Google Play)</h2>
    <p>
      ${
        p.hasBilling
          ? "Este app pode oferecer assinatura/compra (incluindo oferta Impulso 90 quando disponÃ­vel). O processamento de pagamento Ã© feito pela <strong>Google Play Billing</strong>. A Google trata dados de pagamento conforme as polÃ­ticas dela; nÃ³s usamos o status da compra para liberar recursos Premium."
          : "Se o app passar a oferecer compras, o processamento serÃ¡ via Google Play e esta polÃ­tica serÃ¡ atualizada."
      }
    </p>

    <h2>6. PermissÃµes</h2>
    <p>Conforme o manifesto atual, o app pode solicitar:</p>
    <ul>
${permsHtml}
    </ul>
    <p>VocÃª pode revogar permissÃµes nas configuraÃ§Ãµes do Android. FunÃ§Ãµes ligadas Ã  permissÃ£o podem deixar de funcionar.</p>

    <h2>7. LocalizaÃ§Ã£o, cÃ¢mera e identificadores</h2>
    <ul>
      <li><strong>LocalizaÃ§Ã£o:</strong> ${p.hasLocation ? "pode ser usada para mapa/rota/proximidade quando autorizada." : "nÃ£o Ã© solicitada neste app na versÃ£o atual."}</li>
      <li><strong>CÃ¢mera:</strong> ${p.hasCamera ? "usada sob demanda para captura iniciada por vocÃª." : "nÃ£o Ã© solicitada neste app na versÃ£o atual."}</li>
      <li><strong>ID de publicidade:</strong> ${p.hasAdsId ? "hÃ¡ declaraÃ§Ã£o de AD_ID â€” veja tambÃ©m Data safety na Play." : "nÃ£o utilizamos AD_ID neste app na versÃ£o atual."}</li>
    </ul>

    <h2>8. ServiÃ§os de terceiros</h2>
    <ul>
${thirdHtml}
    </ul>
    <p>NÃ£o vendemos seus dados pessoais.</p>

    <h2>9. Compartilhamento e base legal (LGPD)</h2>
    <p>
      Tratamos dados com base na execuÃ§Ã£o do contrato de uso do app (prestaÃ§Ã£o do serviÃ§o que vocÃª solicita),
      cumprimento de obrigaÃ§Ã£o legal quando aplicÃ¡vel, e legÃ­timo interesse em seguranÃ§a/fraude de forma proporcional.
      Compartilhamento ocorre com a Google para instalaÃ§Ã£o/compras e quando exigido por lei.
    </p>

    <h2>10. RetenÃ§Ã£o e exclusÃ£o</h2>
    <ul>
      <li>Ao desinstalar o app, os dados locais do app sÃ£o removidos do aparelho.</li>
      <li>Backup do Android/Google (se ativo no sistema) pode incluir dados do app â€” controle isso nas configuraÃ§Ãµes do aparelho.</li>
      <li>HistÃ³rico de compras permanece na sua Conta Google / Play.</li>
    </ul>

    <h2>11. SeguranÃ§a</h2>
    <p>
      Adotamos medidas razoÃ¡veis de seguranÃ§a de software. Nenhum mÃ©todo Ã© 100% isento de risco.
      Proteja o aparelho com bloqueio de tela e mantenha o sistema atualizado.
    </p>

    <h2>12. CrianÃ§as</h2>
    <p>${esc(p.kidsSection)}</p>

    <h2>13. Seus direitos (LGPD)</h2>
    <ul>
      <li>Acesso e correÃ§Ã£o dos dados no prÃ³prio app</li>
      <li>ExclusÃ£o (apagar registros ou desinstalar)</li>
      <li>InformaÃ§Ã£o sobre compartilhamentos (esta polÃ­tica + ficha Data safety)</li>
      <li>Contato do controlador: <a href="mailto:${esc(PUBLISHER.email)}">${esc(PUBLISHER.email)}</a></li>
    </ul>

    <h2>14. AlteraÃ§Ãµes</h2>
    <p>
      Podemos atualizar esta polÃ­tica. A data no topo indica a versÃ£o vigente.
      MudanÃ§as relevantes podem ser refletidas tambÃ©m na ficha da Play Store.
    </p>

    <h2>15. Lei aplicÃ¡vel</h2>
    <p>
      Aplica-se a legislaÃ§Ã£o brasileira, incluindo a LGPD (Lei nÂº 13.709/2018) e as polÃ­ticas do Google Play.
    </p>

    <h2>16. Contato</h2>
    <p>
      <strong>${esc(PUBLISHER.name)}</strong><br />
      E-mail: <a href="mailto:${esc(PUBLISHER.email)}">${esc(PUBLISHER.email)}</a><br />
      App: ${esc(p.label)} Â· <code>${esc(p.packageName)}</code>
    </p>

    <footer class="page-foot">
      <p>Documento para cumprimento dos requisitos da Google Play Store e transparÃªncia LGPD. Recomenda-se revisÃ£o jurÃ­dica periÃ³dica.</p>
      <p><a href="../index.html">â† Voltar Ã  lista de apps</a></p>
    </footer>
  </main>
  <script src="../js/main.js"></script>
</body>
</html>
`;
}

/**
 * PÃ¡gina Ã­ndice com busca.
 * @param {{slug:string,label:string,packageName:string,file:string}[]} items
 */
function renderIndex(items) {
  const cards = items
    .map(
      (i) => `<a class="app-card" href="home/${esc(i.file)}" data-name="${esc(i.label)}" data-pkg="${esc(i.packageName)}">
  <strong>${esc(i.label)}</strong>
  <span>${esc(i.packageName)}</span>
  <code>home/${esc(i.file)}</code>
</a>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacidade dos apps â€” FÃ¡brica de Software</title>
  <meta name="description" content="PolÃ­ticas de privacidade dos aplicativos Android da FÃ¡brica de Software para Google Play." />
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <header class="top">
    <div class="wrap top-inner">
      <a class="brand" href="index.html">FÃ¡brica de Software â€” Privacidade</a>
    </div>
  </header>
  <main class="wrap">
    <section class="hero card">
      <h1>PolÃ­ticas de privacidade</h1>
      <p>
        Uma pÃ¡gina por aplicativo, pronta para colar na Google Play Console.
        ApÃ³s o deploy no Git, o link fica:
        <code>https://allephnogueira.github.io/privacidade-apps/home/privacidade-NOME.html</code>
      </p>
      <label class="search-label" for="busca">Buscar app</label>
      <input id="busca" type="search" placeholder="Nome ou applicationId..." autocomplete="off" />
      <p class="meta">${items.length} apps Â· Atualizado ${esc(PUBLISHER.updated)}</p>
    </section>
    <section id="lista" class="grid">
${cards}
    </section>
  </main>
  <script src="js/main.js"></script>
</body>
</html>
`;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function main() {
  if (!fs.existsSync(INVENTORY)) {
    console.error("Rode antes o inventÃ¡rio (_apps-full.json).");
    process.exit(1);
  }
  const raw = fs.readFileSync(INVENTORY, "utf8").replace(/^\uFEFF/, "");
  const apps = JSON.parse(raw);
  ensureDir(HOME);
  ensureDir(path.join(SITE, "css"));
  ensureDir(path.join(SITE, "js"));

  const items = [];
  for (const app of apps) {
    const slug = toSlug(app.folder);
    const file = `privacidade-${slug}.html`;
    const html = renderPolicyPage(app, slug);
    fs.writeFileSync(path.join(HOME, file), html, "utf8");
    items.push({
      slug,
      label: app.label || app.folder,
      packageName: app.applicationId || "",
      file,
      folder: app.folder,
    });
    console.error(`OK ${file}`);
  }
  items.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  fs.writeFileSync(path.join(SITE, "index.html"), renderIndex(items), "utf8");
  fs.writeFileSync(
    path.join(SITE, "apps-map.json"),
    JSON.stringify(
      {
        updated: PUBLISHER.updated,
        publisher: PUBLISHER,
        basePathExample: "https://allephnogueira.github.io/privacidade-apps/",
        apps: items.map((i) => ({
          folder: i.folder,
          label: i.label,
          applicationId: i.packageName,
          path: `home/${i.file}`,
          urlExample: `https://allephnogueira.github.io/privacidade-apps/home/${i.file}`,
        })),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(JSON.stringify({ total: items.length }, null, 2));
}

main();
