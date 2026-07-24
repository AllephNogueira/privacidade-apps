/**
 * Validação estática de Skill Certificate (espelha CertificateSigner Kotlin).
 *
 * Contrato HMAC (NÃO alterar sem atualizar o app):
 * - Algoritmo: HmacSHA256
 * - Payload canônico (pipe-separated):
 *   numeroUnico|skillId|nomeAluno|tituloHabilidade|compsJoinedByComma|
 *   percentualConclusao|minutosEstudo|cargaHorariaHoras|emitidoEmEpochMs|saltApp
 * - Material da chave: chaveSecreta.utf8 + saltApp.utf8
 * - Salt padrão: cafecode-p1
 * - Chave P1 (espelho de CertificateSigner.CHAVE_SECRETA_PADRAO): "chave-teste-cafecode"
 *
 * Query params: n, s, name, title, date, hours, pct, min, comp, sig
 */

/** Salt padrão do app (P1). */
const SALT_APP = "cafecode-p1";

/**
 * Chave simétrica P1 — mesma string UTF-8 usada em CertificateSigner.CHAVE_SECRETA_PADRAO.
 * Verificação apenas no cliente; documentado como limitação P1.
 */
const CHAVE_SECRETA = "chave-teste-cafecode";

/**
 * Lê query string da página.
 * @returns {URLSearchParams}
 */
function lerParams() {
  return new URLSearchParams(window.location.search);
}

/**
 * Converte ArrayBuffer em hex minúsculo.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function paraHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Compara strings em tempo aproximadamente constante.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function igualTempoConstante(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Calcula HMAC-SHA256 hex do payload com chave = secret + salt (bytes UTF-8).
 * @param {string} mensagem payload canônico
 * @returns {Promise<string>} hex
 */
async function hmacHex(mensagem) {
  const enc = new TextEncoder();
  const chaveBytes = new Uint8Array([
    ...enc.encode(CHAVE_SECRETA),
    ...enc.encode(SALT_APP),
  ]);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    chaveBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(mensagem));
  return paraHex(assinatura);
}

/**
 * Monta o payload canônico idêntico ao Kotlin.
 * @param {object} claims
 * @returns {string}
 */
function montarPayloadCanonico(claims) {
  return [
    claims.numeroUnico,
    claims.skillId,
    claims.nomeAluno,
    claims.tituloHabilidade,
    claims.competencias.join(","),
    String(claims.percentualConclusao),
    String(claims.minutosEstudo),
    String(claims.cargaHorariaHoras),
    String(claims.emitidoEmEpochMs),
    SALT_APP,
  ].join("|");
}

/**
 * Formata epoch ms em data local pt-BR.
 * @param {number} epochMs
 * @returns {string}
 */
function formatarData(epochMs) {
  if (!Number.isFinite(epochMs) || epochMs <= 0) {
    return "—";
  }
  try {
    return new Date(epochMs).toLocaleString("pt-BR");
  } catch (e) {
    return String(epochMs);
  }
}

/**
 * Atualiza o status visual.
 * @param {"ok"|"bad"|"wait"} tipo
 * @param {string} texto
 */
function definirStatus(tipo, texto) {
  const el = document.getElementById("status");
  el.className = "status " + tipo;
  el.textContent = texto;
}

/**
 * Preenche campos da página.
 * @param {object} claims
 */
function preencherUi(claims) {
  document.getElementById("name").textContent = claims.nomeAluno || "—";
  document.getElementById("title").textContent = claims.tituloHabilidade || "—";
  document.getElementById("number").textContent = claims.numeroUnico || "—";
  document.getElementById("date").textContent = formatarData(claims.emitidoEmEpochMs);
  document.getElementById("hours").textContent =
    claims.cargaHorariaHoras !== "" ? claims.cargaHorariaHoras + " h" : "—";
  document.getElementById("pct").textContent =
    claims.percentualConclusao !== "" ? claims.percentualConclusao + "%" : "—";
  document.getElementById("min").textContent =
    claims.minutosEstudo !== "" ? claims.minutosEstudo + " min" : "—";
  const ul = document.getElementById("comps");
  ul.innerHTML = "";
  if (!claims.competencias.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhuma competência informada";
    ul.appendChild(li);
    return;
  }
  claims.competencias.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c;
    ul.appendChild(li);
  });
}

/**
 * Fluxo principal de validação a partir da query string.
 * @returns {Promise<void>}
 */
async function validar() {
  const params = lerParams();
  const sig = (params.get("sig") || "").trim().toLowerCase();
  const compRaw = params.get("comp") || "";
  const competencias = compRaw
    ? compRaw.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const claims = {
    numeroUnico: params.get("n") || "",
    skillId: params.get("s") || "",
    nomeAluno: params.get("name") || "",
    tituloHabilidade: params.get("title") || "",
    competencias,
    percentualConclusao: params.get("pct") || "",
    minutosEstudo: params.get("min") || "",
    cargaHorariaHoras: params.get("hours") || "",
    emitidoEmEpochMs: Number(params.get("date") || "0"),
  };
  preencherUi(claims);
  if (!sig || !claims.numeroUnico || !claims.skillId) {
    definirStatus("bad", "Certificado inválido ou adulterado");
    return;
  }
  const payload = montarPayloadCanonico(claims);
  const esperada = await hmacHex(payload);
  if (igualTempoConstante(esperada, sig)) {
    definirStatus("ok", "Certificado válido");
  } else {
    definirStatus("bad", "Certificado inválido ou adulterado");
  }
}

validar().catch(() => {
  definirStatus("bad", "Certificado inválido ou adulterado");
});
