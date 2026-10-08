import test from 'node:test';
import assert from 'node:assert/strict';
import { extractConsultaRemedios } from '../scripts/consulta-remedios.mjs';

const html = `
<!doctype html>
<html>
  <head>
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"MedicalWebPage","name":"Bula do Dipirona Monoidratada","url":"https://consultaremedios.com.br/dipirona-monoidratada/bula","lastReviewed":"2023-09-05T19:30:22","reviewedBy":{"@type":"Person","name":"Karime Halmenschlager Sleiman"}}
    </script>
  </head>
  <body>
    <main>
      <h1>Bula do Dipirona Monoidratada</h1>
      <h2>Para que serve</h2>
      <p>Este medicamento é indicado como analgésico e antitérmico.</p>
      <h2>Contraindicação</h2>
      <p>Não deve ser administrado a pacientes com hipersensibilidade.</p>
      <a href="https://portal.anvisa.gov.br/notivisa">Fonte consultada</a>
    </main>
  </body>
</html>`;

test('extrai metadados, seções e origem da página pública', () => {
  const result = extractConsultaRemedios(html, 'https://consultaremedios.com.br/dipirona-monoidratada/bula');

  assert.equal(result.nome, 'Bula do Dipirona Monoidratada');
  assert.equal(result.url_origem, 'https://consultaremedios.com.br/dipirona-monoidratada/bula');
  assert.equal(result.data_revisao, '2023-09-05T19:30:22');
  assert.equal(result.revisado_por, 'Karime Halmenschlager Sleiman');
  assert.equal(result.secoes['para_que_serve'], 'Este medicamento é indicado como analgésico e antitérmico.');
  assert.equal(result.secoes.contraindicacao, 'Não deve ser administrado a pacientes com hipersensibilidade.');
  assert.deepEqual(result.fontes_consultadas, ['https://portal.anvisa.gov.br/notivisa']);
  assert.equal(result.eh_oficial, false);
});

test('rejeita URLs fora do domínio autorizado', () => {
  assert.throws(
    () => extractConsultaRemedios(html, 'https://example.com/medicamento/bula'),
    /domínio autorizado/i,
  );
});
