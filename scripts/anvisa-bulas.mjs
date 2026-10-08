#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ANVISA = 'https://consultas.anvisa.gov.br';
const API = `${ANVISA}/api`;
const BULTO_API = `${API}/consulta/bulario`;
const BULA_API = `${API}/consulta/medicamentos/arquivo/bula/parecer`;
const ANEXO_API = `${API}/medicamento`;
const DEFAULT_CSV = join(fileURLToPath(new URL('..', import.meta.url)), 'backend/data/anvisa/medicamentos.csv');
const DEFAULT_OUTPUT = join(fileURLToPath(new URL('..', import.meta.url)), 'data/bulas');
const MAX_RETRIES = 3;
const REQUIRED = [
  'TIPO_PRODUTO', 'NOME_PRODUTO', 'DATA_FINALIZACAO_PROCESSO', 'CATEGORIA_REGULATORIA',
  'NUMERO_REGISTRO_PRODUTO', 'DATA_VENCIMENTO_REGISTRO', 'NUMERO_PROCESSO',
  'CLASSE_TERAPEUTICA', 'EMPRESA_DETENTORA_REGISTRO', 'SITUACAO_REGISTRO', 'PRINCIPIO_ATIVO'
];

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ';' && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() ?? [];
  const missing = REQUIRED.filter((name) => !header.includes(name));
  if (missing.length) throw new Error(`Colunas obrigatórias ausentes: ${missing.join(', ')}`);
  return rows.filter((values) => values.some((value) => value.trim())).map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] ?? ''])));
}

async function loadCsv(path) {
  const bytes = await readFile(path);
  const text = new TextDecoder('windows-1252').decode(bytes);
  return parseCsv(text);
}

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function safeName(value) {
  return normalize(value).replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'registro_ausente';
}

function isOfficialUrl(url) {
  return /^https:\/\/consultas\.anvisa\.gov\.br\//i.test(url) || /^https:\/\/dados\.anvisa\.gov\.br\//i.test(url);
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function requestJson(url, options = {}, retries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { Accept: 'application/json', 'User-Agent': 'SaudeMemora-AnvisaBulas/1.0', ...(options.headers ?? {}) },
      });
      const text = await response.text();
      if (!response.ok) {
        let detail = text;
        try { detail = JSON.stringify(JSON.parse(text)); } catch {}
        if (response.status === 403 || response.status === 400) throw new Error(`HTTP ${response.status} na ${url}: ${detail.slice(0, 300)}`);
        lastError = new Error(`HTTP ${response.status} na ${url}: ${detail.slice(0, 300)}`);
      } else return JSON.parse(text);
    } catch (error) {
      lastError = error;
    }
    if (attempt < retries) await sleep(1000 * 2 ** attempt);
  }
  throw lastError;
}

async function queryBula(registro, rateLimiter) {
  const url = `${BULTO_API}?${new URLSearchParams({ numeroRegistro: registro })}`;
  await rateLimiter();
  const payload = await requestJson(url);
  const content = payload.content ?? payload;
  const idBula = content?.idBula ?? content?.idBulaProduto ?? content?.id ?? content?.codigo;
  if (!idBula) throw new Error('A resposta oficial não contém um identificador de bula');
  const patientUrl = `${BULA_API}/${encodeURIComponent(String(idBula))}/`;
  const professionalUrl = `${ANEXO_API}/${encodeURIComponent(String(idBula))}/5/anexo`;
  if (!isOfficialUrl(patientUrl) || !isOfficialUrl(professionalUrl)) throw new Error('URL oficial inválida');
  return {
    idBula: String(idBula),
    patientUrl,
    professionalUrl,
    publication: content?.dataPublicacao ?? content?.dataPublicacaoBula ?? content?.data ?? '',
    origin: url,
  };
}

async function downloadPdf(url, path, rateLimiter) {
  await rateLimiter();
  const response = await fetch(url, { headers: { Accept: 'application/pdf', 'User-Agent': 'SaudeMemora-AnvisaBulas/1.0' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100) throw new Error(`PDF vazio ou inválido: ${url}`);
  await writeFile(path, bytes);
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function processRecord(record, mode, output, rateLimiter) {
  const directory = join(output, safeName(record.NUMERO_REGISTRO_PRODUTO));
  await mkdir(directory, { recursive: true });
  const origin = `${BULTO_API}?${new URLSearchParams({ numeroRegistro: record.NUMERO_REGISTRO_PRODUTO })}`;
  try {
    const bula = await queryBula(record.NUMERO_REGISTRO_PRODUTO, rateLimiter);
    if (mode === 'link') {
      const metadata = {
        numero_registro: record.NUMERO_REGISTRO_PRODUTO,
        nome: normalize(record.NOME_PRODUTO),
        empresa: normalize(record.EMPRESA_DETENTORA_REGISTRO),
        url_origem: bula.origin,
        url_bula_official: bula.patientUrl,
        data_publicacao_bula: normalize(bula.publication),
        data_coleta: new Date().toISOString(),
        modo: 'link',
      };
      await writeFile(join(directory, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
      return { status: 'success', mode: 'link', origin };
    }

    const patientPath = join(directory, 'paciente.pdf');
    const professionalPath = join(directory, 'profissional.pdf');
    if (await fileExists(patientPath) && await fileExists(professionalPath)) return { status: 'cached', mode: 'local', origin };
    await downloadPdf(bula.patientUrl, patientPath, rateLimiter);
    await sleep(1000);
    await downloadPdf(bula.professionalUrl, professionalPath, rateLimiter);
    const patientBytes = await readFile(patientPath);
    const professionalBytes = await readFile(professionalPath);
    const metadata = {
      numero_registro: record.NUMERO_REGISTRO_PRODUTO,
      nome: normalize(record.NOME_PRODUTO),
      empresa: normalize(record.EMPRESA_DETENTORA_REGISTRO),
      url_origem: bula.origin,
      id_bula: bula.idBula,
      data_publicacao_bula: normalize(bula.publication),
      data_coleta: new Date().toISOString(),
      hash_sha256_paciente: sha256(patientBytes),
      hash_sha256_profissional: sha256(professionalBytes),
      url_pdf_paciente: bula.patientUrl,
      url_pdf_profissional: bula.professionalUrl,
    };
    await writeFile(join(directory, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
    return { status: 'success', mode: 'local', origin };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorLine = `${new Date().toISOString()} | ${record.NUMERO_REGISTRO_PRODUTO} | ${normalize(record.NOME_PRODUTO)} | ${message}\n`;
    await appendFile(join(output, 'erros.log'), errorLine);
    return { status: 'failed', mode: 'error', origin };
  }
}

async function appendFile(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, { flag: 'a' });
}

export function matches(records, registro, nome) {
  const selected = registro
    ? records.filter((record) => record.NUMERO_REGISTRO_PRODUTO === registro)
    : records.filter((record) => normalize(record.NOME_PRODUTO).toLocaleLowerCase('pt-BR').includes(normalize(nome).toLocaleLowerCase('pt-BR')));
  const seen = new Set();
  return selected.filter((record) => {
    const registroId = record.NUMERO_REGISTRO_PRODUTO;
    if (seen.has(registroId)) return false;
    seen.add(registroId);
    return true;
  });
}

async function main() {
  const options = parseArgs({ options: {
    csv: { type: 'string', short: 'c', default: DEFAULT_CSV },
    output: { type: 'string', short: 'o', default: DEFAULT_OUTPUT },
    registro: { type: 'string', short: 'r' },
    nome: { type: 'string', short: 'n' },
    modo: { type: 'string', short: 'm', default: 'link' },
    'rate-limit': { type: 'string', default: '1' },
    verbose: { type: 'boolean', default: false },
  }, allowPositionals: false });
  const args = options.values;
  if (!args.registro && !args.nome) throw new Error('Informe --registro ou --nome');
  if (args.registro && args.nome) throw new Error('Informe somente --registro ou --nome');
  if (args.registro && !/^\d{9}$/.test(args.registro)) throw new Error('Número de registro deve conter exatamente 9 dígitos');
  if (!['link', 'local'].includes(args.modo)) throw new Error('Modo deve ser link ou local');
  const rateLimit = Number(args['rate-limit']);
  if (!Number.isFinite(rateLimit) || rateLimit < 0) throw new Error('--rate-limit deve ser um número não negativo');
  const records = await loadCsv(args.csv);
  const selected = matches(records, args.registro, args.nome);
  if (!selected.length) throw new Error('Nenhum medicamento encontrado');
  await mkdir(args.output, { recursive: true });
  let lastRequest = 0;
  const rateLimiter = async () => {
    const delay = Math.max(0, rateLimit - (Date.now() - lastRequest));
    if (delay) await sleep(delay);
    lastRequest = Date.now();
  };
  const totals = { processed: 0, success: 0, cached: 0, failed: 0 };
  for (const record of selected) {
    const result = await processRecord(record, args.modo, args.output, rateLimiter);
    totals.processed++;
    if (result.status === 'success') totals.success++;
    else if (result.status === 'cached') totals.cached++;
    else totals.failed++;
    console.log(`${result.status.padEnd(7)} ${record.NUMERO_REGISTRO_PRODUTO} ${normalize(record.NOME_PRODUTO)} [${result.mode}]`);
  }
  console.log(JSON.stringify(totals));
  if (totals.failed) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 2; });
}
