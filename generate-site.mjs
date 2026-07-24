/**
 * Gera o site estático de políticas de privacidade (Play Store / LGPD).
 * Saída: privacidade-play/index.html + home/privacidade-*.html
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
  name: "Alleph Nogueira — Fábrica de Software",
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
 * Perfis de conteúdo por tipo de app (Play Data safety + LGPD).
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
      "gestão de frota/postos GNV, rotas, financeiro operacional e assinatura Premium",
    DriverIQ:
      "assistência ao motorista (rotas, captura e alertas) e produtividade na direção",
    LarControl: "organização da casa, tarefas e lembretes domésticos",
    Oikos: "gestão doméstica, compras e lembretes do lar",
    PossoComprar: "organização financeira pessoal e controle de gastos",
    OrganizadordeAssinaturas: "controle de assinaturas e lembretes de cobrança",
    TecnoGestor: "CRM/gestão de clientes e serviços para profissionais",
    GestanteSemana: "acompanhamento de semanas de gestação e lembretes (uso informativo)",
    MedicacaoLembrete: "lembretes de medicação e histórico local de doses",
    VacinaCrianca: "organização do cartão de vacinas infantil (uso familiar/informativo)",
    EscolaKids: "organização escolar infantil (rotina e lembretes)",
    PetVacina: "cartão de vacinas e lembretes do pet",
    PersonalFit: "rotina de treinos e acompanhamento fitness local",
  };

  const purpose =
    purposeByFolder[folder] ||
    `utilitário Android na categoria “${cat || "Produtividade"}”, com dados salvos no aparelho e recursos Premium via Google Play quando disponíveis`;

  const dataExamples = [];
  if (/Finan|Negóc|CLT|FGTS|IRPF|INSS|dívid|aluguel|MEI|frete|obra|consórc/i.test(cat + label + folder)) {
    dataExamples.push(
      "valores, datas e registros que você digita (ex.: cálculos, lançamentos, clientes ou itens)",
    );
  }
  if (/Saúde|fitness|Medic|Gestante|Vacina|Pet|Personal/i.test(cat + label + folder)) {
    dataExamples.push(
      "lembretes, nomes de itens/medicamentos/vacinas e horários que você cadastra (não substitui orientação profissional)",
    );
  }
  if (/Auto|veíc|CNH|Frota|Frete|GNV|Óleo|Sinistro|INMETRO/i.test(cat + label + folder)) {
    dataExamples.push(
      "dados de veículos, manutenções, checklists ou simulações que você registra",
    );
  }
  if (dataExamples.length === 0) {
    dataExamples.push(
      "cadastros e histórico que você cria no app (textos, datas, status e preferências)",
    );
  }

  const permissionBlocks = [];
  if (has("INTERNET") || has("ACCESS_NETWORK_STATE")) {
    permissionBlocks.push({
      name: "Internet / estado da rede",
      why: "Permitir recursos online necessários (ex.: mapas, sincronização pontual ou validação de compra na Play). Sem uso para vender seus dados.",
    });
  }
  if (has("ACCESS_FINE_LOCATION") || has("ACCESS_COARSE_LOCATION")) {
    permissionBlocks.push({
      name: "Localização",
      why: "Usada apenas para funções do app relacionadas a mapa/rota/proximidade, quando você concede a permissão. Não rastreamos em segundo plano para publicidade.",
    });
  }
  if (has("CAMERA")) {
    permissionBlocks.push({
      name: "Câmera",
      why: "Permitir captura de fotos/documentos exigidos por funcionalidades do app, somente quando você inicia a ação.",
    });
  }
  if (has("RECORD_AUDIO")) {
    permissionBlocks.push({
      name: "Microfone",
      why: "Usado apenas se o app oferecer recurso de áudio iniciado por você. Não gravamos áudio continuamente.",
    });
  }
  if (has("POST_NOTIFICATIONS")) {
    permissionBlocks.push({
      name: "Notificações",
      why: "Enviar lembretes locais configuráveis. Opcional — o app continua utilizável se você negar.",
    });
  }
  if (has("RECEIVE_BOOT_COMPLETED") || has("SCHEDULE_EXACT_ALARM") || has("WAKE_LOCK")) {
    permissionBlocks.push({
      name: "Agendamento / reinício do aparelho",
      why: "Reagendar lembretes após reinício ou em horários exatos quando você ativa alertas.",
    });
  }
  if (has("BILLING") || app.sku) {
    permissionBlocks.push({
      name: "Google Play Billing (compras/assinaturas)",
      why: "Processar assinatura Premium / Impulso 90. Pagamentos são tratados pela Google; recebemos o status necessário para liberar recursos.",
    });
  }
  if (has("AD_ID")) {
    permissionBlocks.push({
      name: "ID de publicidade (AD_ID)",
      why: "Pode ser usado por SDKs Google/medição conforme a configuração do app. Não vendemos listas de usuários. Você pode limitar no Android.",
    });
  }
  if (has("SYSTEM_ALERT_WINDOW")) {
    permissionBlocks.push({
      name: "Exibir sobre outros apps",
      why: "Sobreposições/atalhos de produtividade quando o recurso estiver ativo e autorizado por você.",
    });
  }
  if (has("REQUEST_IGNORE_BATTERY_OPTIMIZATIONS")) {
    permissionBlocks.push({
      name: "Otimização de bateria",
      why: "Melhorar a confiabilidade de alertas em segundo plano, se você permitir.",
    });
  }
  if (permissionBlocks.length === 0) {
    permissionBlocks.push({
      name: "Permissões mínimas",
      why: "O app prioriza funcionamento local. Se permissões forem adicionadas no futuro, esta política será atualizada.",
    });
  }

  const specialNotes = [];
  if (/Gestante|Medic|Vacina|Saúde|PersonalFit/i.test(folder + cat + label)) {
    specialNotes.push(
      "Conteúdo informativo/organizacional — não constitui aconselhamento médico. Em dúvidas de saúde, consulte profissional habilitado.",
    );
  }
  if (/EscolaKids|VacinaCrianca/i.test(folder)) {
    specialNotes.push(
      "Se o app for usado por responsáveis para organizar rotina infantil, os dados são inseridos pelo responsável e ficam no dispositivo. Não direcionamos publicidade a crianças.",
    );
  }
  if (/Alta-Pressao-GNV|DriverIQ/i.test(folder)) {
    specialNotes.push(
      "Recursos de mapa/localização dependem de permissão do sistema e de serviços de mapa do dispositivo/terceiros (ex.: Google Maps/Waze), sujeitos às políticas desses provedores.",
    );
  }
  if (has("AD_ID")) {
    specialNotes.push(
      "Este app declara permissão relacionada a identificador de publicidade. Revise também a seção Data safety na ficha da Play Store.",
    );
  }

  const kidsSection = /EscolaKids|VacinaCrianca/i.test(folder)
    ? "O app pode ser usado por pais/responsáveis. Não coletamos intencionalmente dados de crianças em servidores nossos. Cadastros ficam locais no aparelho do responsável."
    : "O app não é direcionado a menores de 13 anos. Não coletamos intencionalmente dados de crianças.";

  const thirdParties = [];
  if (has("BILLING") || app.sku) {
    thirdParties.push("Google Play (faturamento de assinaturas/compras)");
  }
  if (has("INTERNET") && /Alta-Pressao|DriverIQ|Oikos|LarControl/i.test(folder)) {
    thirdParties.push(
      "Serviços Google no dispositivo (ex.: Play Services / mapas), quando a função exigir",
    );
  }
  if (thirdParties.length === 0) {
    thirdParties.push(
      "Na configuração padrão offline-first, não enviamos o conteúdo do seu cadastro para servidores nossos. A Google Play pode processar instalação/atualização e, se houver, compras.",
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
 * Monta HTML de uma política.
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
  <title>Privacidade — ${esc(p.label)}</title>
  <meta name="description" content="Política de Privacidade do aplicativo ${esc(p.label)} para Google Play e LGPD." />
  <link rel="stylesheet" href="../css/styles.css" />
</head>
<body>
  <a class="skip" href="#conteudo">Ir ao conteúdo</a>
  <header class="top">
    <div class="wrap top-inner">
      <a class="brand" href="../index.html">Fábrica de Software — Privacidade</a>
      <nav><a href="../index.html">Todos os apps</a></nav>
    </div>
  </header>
  <main id="conteudo" class="wrap card">
    <p class="eyebrow">Política de Privacidade · Google Play</p>
    <h1>${esc(p.label)}</h1>
    <p class="meta">
      Pacote: <code>${esc(p.packageName)}</code><br />
      Última atualização: <strong>${esc(PUBLISHER.updated)}</strong>
    </p>

    <h2>1. Quem somos</h2>
    <p>
      O aplicativo <strong>${esc(p.label)}</strong> é publicado por
      <strong>${esc(PUBLISHER.name)}</strong> (“nós”).
      Contato: <a href="mailto:${esc(PUBLISHER.email)}">${esc(PUBLISHER.email)}</a> · País: ${esc(PUBLISHER.country)}.
    </p>

    <h2>2. Finalidade do app</h2>
    <p>O app destina-se a: ${esc(p.purpose)}.</p>
    ${notesHtml}

    <h2>3. Dados que você fornece</h2>
    <p>Você pode cadastrar, voluntariamente, informações como:</p>
    <ul>
${dataHtml}
    </ul>
    <p>
      <strong>Armazenamento padrão:</strong> o conteúdo de uso fica no seu dispositivo
      (armazenamento/banco local). Não operamos um “perfil de marketing” com esses dados.
    </p>

    <h2>4. Dados que não pedimos como regra</h2>
    <ul>
      <li>Senhas de banco, cartão completo ou credenciais de instituições financeiras</li>
      <li>Venda de bases de dados pessoais a terceiros</li>
      <li>Coleta oculta de contatos/fotos sem ação sua (salvo permissão e função explícita, se existir)</li>
    </ul>

    <h2>5. Compras e assinaturas (Google Play)</h2>
    <p>
      ${
        p.hasBilling
          ? "Este app pode oferecer assinatura/compra (incluindo oferta Impulso 90 quando disponível). O processamento de pagamento é feito pela <strong>Google Play Billing</strong>. A Google trata dados de pagamento conforme as políticas dela; nós usamos o status da compra para liberar recursos Premium."
          : "Se o app passar a oferecer compras, o processamento será via Google Play e esta política será atualizada."
      }
    </p>

    <h2>6. Permissões</h2>
    <p>Conforme o manifesto atual, o app pode solicitar:</p>
    <ul>
${permsHtml}
    </ul>
    <p>Você pode revogar permissões nas configurações do Android. Funções ligadas à permissão podem deixar de funcionar.</p>

    <h2>7. Localização, câmera e identificadores</h2>
    <ul>
      <li><strong>Localização:</strong> ${p.hasLocation ? "pode ser usada para mapa/rota/proximidade quando autorizada." : "não é solicitada neste app na versão atual."}</li>
      <li><strong>Câmera:</strong> ${p.hasCamera ? "usada sob demanda para captura iniciada por você." : "não é solicitada neste app na versão atual."}</li>
      <li><strong>ID de publicidade:</strong> ${p.hasAdsId ? "há declaração de AD_ID — veja também Data safety na Play." : "não utilizamos AD_ID neste app na versão atual."}</li>
    </ul>

    <h2>8. Serviços de terceiros</h2>
    <ul>
${thirdHtml}
    </ul>
    <p>Não vendemos seus dados pessoais.</p>

    <h2>9. Compartilhamento e base legal (LGPD)</h2>
    <p>
      Tratamos dados com base na execução do contrato de uso do app (prestação do serviço que você solicita),
      cumprimento de obrigação legal quando aplicável, e legítimo interesse em segurança/fraude de forma proporcional.
      Compartilhamento ocorre com a Google para instalação/compras e quando exigido por lei.
    </p>

    <h2>10. Retenção e exclusão</h2>
    <ul>
      <li>Ao desinstalar o app, os dados locais do app são removidos do aparelho.</li>
      <li>Backup do Android/Google (se ativo no sistema) pode incluir dados do app — controle isso nas configurações do aparelho.</li>
      <li>Histórico de compras permanece na sua Conta Google / Play.</li>
    </ul>

    <h2>11. Segurança</h2>
    <p>
      Adotamos medidas razoáveis de segurança de software. Nenhum método é 100% isento de risco.
      Proteja o aparelho com bloqueio de tela e mantenha o sistema atualizado.
    </p>

    <h2>12. Crianças</h2>
    <p>${esc(p.kidsSection)}</p>

    <h2>13. Seus direitos (LGPD)</h2>
    <ul>
      <li>Acesso e correção dos dados no próprio app</li>
      <li>Exclusão (apagar registros ou desinstalar)</li>
      <li>Informação sobre compartilhamentos (esta política + ficha Data safety)</li>
      <li>Contato do controlador: <a href="mailto:${esc(PUBLISHER.email)}">${esc(PUBLISHER.email)}</a></li>
    </ul>

    <h2>14. Alterações</h2>
    <p>
      Podemos atualizar esta política. A data no topo indica a versão vigente.
      Mudanças relevantes podem ser refletidas também na ficha da Play Store.
    </p>

    <h2>15. Lei aplicável</h2>
    <p>
      Aplica-se a legislação brasileira, incluindo a LGPD (Lei nº 13.709/2018) e as políticas do Google Play.
    </p>

    <h2>16. Contato</h2>
    <p>
      <strong>${esc(PUBLISHER.name)}</strong><br />
      E-mail: <a href="mailto:${esc(PUBLISHER.email)}">${esc(PUBLISHER.email)}</a><br />
      App: ${esc(p.label)} · <code>${esc(p.packageName)}</code>
    </p>

    <footer class="page-foot">
      <p>Documento para cumprimento dos requisitos da Google Play Store e transparência LGPD. Recomenda-se revisão jurídica periódica.</p>
      <p><a href="../index.html">← Voltar à lista de apps</a></p>
    </footer>
  </main>
  <script src="../js/main.js"></script>
</body>
</html>
`;
}

/**
 * Página índice com busca.
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
  <title>Privacidade dos apps — Fábrica de Software</title>
  <meta name="description" content="Políticas de privacidade dos aplicativos Android da Fábrica de Software para Google Play." />
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <header class="top">
    <div class="wrap top-inner">
      <a class="brand" href="index.html">Fábrica de Software — Privacidade</a>
    </div>
  </header>
  <main class="wrap">
    <section class="hero card">
      <h1>Políticas de privacidade</h1>
      <p>
        Uma página por aplicativo, pronta para colar na Google Play Console.
        Após o deploy no Git, o link fica:
        <code>https://SEU_USUARIO.github.io/SEU_REPO/home/privacidade-NOME.html</code>
      </p>
      <label class="search-label" for="busca">Buscar app</label>
      <input id="busca" type="search" placeholder="Nome ou applicationId..." autocomplete="off" />
      <p class="meta">${items.length} apps · Atualizado ${esc(PUBLISHER.updated)}</p>
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
    console.error("Rode antes o inventário (_apps-full.json).");
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
        basePathExample: "https://SEU_USUARIO.github.io/SEU_REPO/",
        apps: items.map((i) => ({
          folder: i.folder,
          label: i.label,
          applicationId: i.packageName,
          path: `home/${i.file}`,
          urlExample: `https://SEU_USUARIO.github.io/SEU_REPO/home/${i.file}`,
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
