import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { matches } from '../scripts/anvisa-bulas.mjs';

const parseCsv = (text) => {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ';' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((values) => values.some((value) => value.trim())).map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] ?? ''])));
};

test('parses Windows-1252 CSV with quoted fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'anvisa-bulas-'));
  const path = join(directory, 'medicamentos.csv');
  const header = 'TIPO_PRODUTO;NOME_PRODUTO;DATA_FINALIZACAO_PROCESSO;CATEGORIA_REGULATORIA;NUMERO_REGISTRO_PRODUTO;DATA_VENCIMENTO_REGISTRO;NUMERO_PROCESSO;CLASSE_TERAPEUTICA;EMPRESA_DETENTORA_REGISTRO;SITUACAO_REGISTRO;PRINCIPIO_ATIVO\r\n';
  const record = '"MEDICAMENTO";"CARVEDILOL";"12/12/2016";"Genérico";126750242;"122026";"25351396242201612";"ANTI-HIPERTENSIVOS";"72593791000111 - NOVA QUIMICA FARMACÊUTICA S/A";"Inativo";"carvedilol"\r\n';
  await writeFile(path, header + record, { encoding: 'latin1' });
  const bytes = await import('node:fs/promises').then(({ readFile }) => readFile(path));
  const text = new TextDecoder('windows-1252').decode(bytes);
  const rows = parseCsv(text);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].NOME_PRODUTO, 'CARVEDILOL');
  assert.equal(rows[0].EMPRESA_DETENTORA_REGISTRO, '72593791000111 - NOVA QUIMICA FARMACÊUTICA S/A');
  assert.equal(rows[0].PRINCIPIO_ATIVO, 'carvedilol');
});

test('preserves a row without a trailing newline', () => {
  const rows = parseCsv('A;B\n1;dois');
  assert.deepEqual(rows, [{ A: '1', B: 'dois' }]);
});

test('deduplicates repeated registration numbers', () => {
  const records = [
    { NUMERO_REGISTRO_PRODUTO: '126750242', NOME_PRODUTO: 'CARVEDILOL' },
    { NUMERO_REGISTRO_PRODUTO: '126750242', NOME_PRODUTO: 'CARVEDILOL' },
    { NUMERO_REGISTRO_PRODUTO: '100430742', NOME_PRODUTO: 'CEFALEXINA' },
  ];
  assert.deepEqual(matches(records, '126750242', ''), [records[0]]);
});
