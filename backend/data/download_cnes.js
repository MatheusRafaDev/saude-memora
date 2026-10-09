const fs = require('fs');
const https = require('https');

/**
 * Script para baixar os estabelecimentos do CNES diretamente da API de Dados Abertos do Ministério da Saúde.
 * O script busca em lotes e salva num arquivo JSON ou CSV para que possam ser usados pelo sistema.
 */

const API_URL = 'https://apidadosabertos.saude.gov.br/cnes/estabelecimentos';
const OUTPUT_FILE = 'cnes_estabelecimentos.json';
const MAX_PAGES = 10; // Aumente este número para baixar mais estabelecimentos. (Cada página traz 20 registros por padrão)

async function fetchCnes() {
    console.log('Iniciando download dos estabelecimentos do CNES...');
    const allRecords = [];

    // Ignora erros de certificado SSL (comum em sites do gov)
    const agent = new https.Agent({  
        rejectUnauthorized: false
    });

    try {
        for (let offset = 0; offset < MAX_PAGES * 20; offset += 20) {
            console.log(`Buscando estabelecimentos (Offset: ${offset})...`);
            
            const response = await fetch(`${API_URL}?limit=20&offset=${offset}`, {
                agent: agent,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();

            if (data && data.estabelecimentos) {
                allRecords.push(...data.estabelecimentos);
            } else {
                console.log('Nenhum dado encontrado na resposta ou formato inesperado.');
                break;
            }

            // Aguarda 500ms entre as requisições para evitar rate limit da API do governo
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRecords, null, 2), 'utf-8');
        console.log(`\n✅ Sucesso! Baixados ${allRecords.length} estabelecimentos.`);
        console.log(`Os dados foram salvos em: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Erro ao baixar dados do CNES:');
        console.error(error.message);
    }
}

fetchCnes();
