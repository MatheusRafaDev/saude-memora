#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ALLOWED_HOSTS = new Set(['consultaremedios.com.br', 'portal.anvisa.gov.br']);
const DEFAULT_URL = 'https://consultaremedios.com.br/dipirona-monoidratada/bula';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEFAULT_OUTPUT = join(ROOT, 'data/consulta-remedios');
const SECTION_ALIASES = new Map([
  ['para_que_serve', ['para que serve', 'para o que é indicado e para o que serve']],
  ['contraindicacao', ['contraindicação', 'quais as contraindicações']],
  ['posologia_como_usar', ['posologia', 'como usar', 'instruções para uso', 'instruções para aplicação']],
  ['superdose', ['superdose']],
  ['riscos', ['riscos']],
  ['precaucoes', ['precauções', 'para evitar as reações hipotensivas graves']],
  ['reacoes_adversas', ['reações adversas', 'reacoes anafiláticas', 'grupos de risco']],
  ['interacao_medicamentos', ['interação medicamentosa']],
  ['interacao_alimenticia', ['interação alimentar']],
  ['acao_da_substancia', ['ação da substância']],
]);

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function stripTags(value) {
  return normalizeText(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<a\b[^>]*>.*?<\/a>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function extractJsonLd(html) {
  const match = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

function extractSections(html) {
  const sections = {};
  const headingPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = [...html.matchAll(headingPattern)];

  for (let index = 0; index < matches.length; index++) {
    const heading = normalizeText(matches[index][2].replace(/<[^>]+>/g, ' '));
    const normalizedHeading = heading
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const key = [...SECTION_ALIASES.entries()].find(([, aliases]) =>
      aliases.some((alias) => normalizedHeading.includes(
        alias.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
      )),
    )?.[0];
    const next = matches[index + 1];
    if (!key) continue;

    const headingEnd = matches[index].index + matches[index][0].length;
    const nextStart = next?.index ?? html.length;
    const content = html.slice(headingEnd, nextStart);
    const text = stripTags(content);
    if (text) sections[key] = text;
  }

  return sections;
}

function extractSources(html) {
  const sources = new Set();
  const sourcePattern = /href=["'](https?:\/\/[^"']+)["']/gi;
  for (const match of html.matchAll(sourcePattern)) {
    const url = new URL(match[1]);
    if ([...ALLOWED_HOSTS].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) sources.add(url.href);
  }
  return [...sources];
}

export function extractConsultaRemedios(html, url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    throw new Error('O domínio autorizado é consultaremedios.com.br');
  }

  const metadata = extractJsonLd(html);
  const sections = extractSections(html);
  const title = normalizeText(metadata.name || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || 'Conteúdo da Consulta Remédios');
  const reviewedBy = metadata.reviewedBy?.name || metadata.reviewedBy?.givenName || '';

  return {
    tipo: 'conteudo_publico_terceiro',
    nome: title,
    url_origem: parsedUrl.href,
    data_revisao: metadata.lastReviewed || '',
    revisado_por: reviewedBy,
    fontes_consultadas: extractSources(html),
    secoes: sections,
    eh_oficial: false,
    disclaimer: 'Conteúdo publicado por Consulta Remédios, não é uma bula oficial da ANVISA.',
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'SaudeMemora-ConsultaRemedios/1.0',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao acessar ${url}`);
  return response.text();
}

async function main() {
  const options = parseArgs({
    options: {
      url: { type: 'string', short: 'u', default: DEFAULT_URL },
      output: { type: 'string', short: 'o', default: DEFAULT_OUTPUT },
    },
    allowPositionals: false,
  });
  const url = new URL(options.values.url);
  const html = await fetchHtml(url.href);
  const result = extractConsultaRemedios(html, url.href);
  const output = options.values.output;
  const directory = join(output, 'dipirona-monoidratada');
  const htmlPath = join(directory, 'conteudo.html');
  const metadataPath = join(directory, 'metadata.json');
  const summaryPath = join(directory, 'resumo.txt');
  const bytes = Buffer.from(html, 'utf8');

  await mkdir(directory, { recursive: true });
  await writeFile(htmlPath, bytes);
  await writeFile(metadataPath, JSON.stringify({ ...result, hash_sha256_html: createHash('sha256').update(bytes).digest('hex') }, null, 2), 'utf8');
  const summary = [
    result.nome,
    `Origem: ${result.url_origem}`,
    `Data de revisão: ${result.data_revisao || 'não informada'}`,
    `Revisado por: ${result.revisado_por || 'não informado'}`,
    '',
    ...Object.entries(result.secoes).map(([key, value]) => `${key}: ${value}`),
    '',
    result.disclaimer,
  ].join('\n');
  await writeFile(summaryPath, summary, 'utf8');
  console.log(JSON.stringify({ htmlPath, metadataPath, summaryPath, sections: Object.keys(result.secoes) }, null, 2));
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 2;
  });
}
