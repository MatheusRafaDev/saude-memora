const fs = require('fs');
const https = require('https');

/**
 * Script completo para baixar TODOS os estabelecimentos do CNES diretamente da API de Dados Abertos.
 * Como a API limita a 20 registros por vez, ele faz as requisições em lotes com um pequeno intervalo.
 * ATENÇÃO: Baixar a base completa (mais de 400.000 estabelecimentos) vai levar várias horas!
 */

const API_URL = 'https://apidadosabertos.saude.gov.br/cnes/estabelecimentos';
const OUTPUT_FILE = 'cnes_estabelecimentos_full.json';

async function fetchAllCnes() {
    console.log('Iniciando download COMPLETO dos estabelecimentos do CNES...');
    console.log('Aviso: Como a API do governo limita a 20 registros por página, esse processo pode demorar.');
    
    let allRecords = [];
    let offset = 0;
    const limit = 20;

    const agent = new https.Agent({ rejectUnauthorized: false });

    // Carrega progresso anterior, se existir (para evitar começar do zero se a internet cair)
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            allRecords = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
            offset = allRecords.length;
            console.log(`Retomando do registro ${offset}...`);
        } catch(e) {
            console.log('Arquivo existente inválido, começando do zero.');
        }
    }

    try {
        while (true) {
            console.log(`[CNES] Buscando estabelecimentos (Offset: ${offset})... Baixados: ${allRecords.length}`);
            
            const response = await fetch(`${API_URL}?limit=${limit}&offset=${offset}`, {
                agent: agent,
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.error(`Erro na requisição: HTTP ${response.status}. Tentando novamente em 5 segundos...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            const data = await response.json();

            if (data && data.estabelecimentos && data.estabelecimentos.length > 0) {
                allRecords.push(...data.estabelecimentos);
                offset += limit;
                
                // Salva o progresso no disco a cada 1000 registros
                if (allRecords.length % 1000 === 0) {
                    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRecords, null, 2), 'utf-8');
                    console.log('💾 Progresso salvo no disco!');
                }
            } else {
                console.log('Chegou ao fim da base de dados!');
                break;
            }

            // Aguarda 100ms para evitar bloqueio por Rate Limit na API do Ministério da Saúde
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRecords, null, 2), 'utf-8');
        console.log(`\n✅ FINALIZADO! Total: ${allRecords.length} estabelecimentos.`);

    } catch (error) {
        console.error('❌ Erro fatal durante a extração:', error.message);
        // Salva o que já baixou antes de sair
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRecords, null, 2), 'utf-8');
        console.log('Progresso parcial salvo!');
    }
}

fetchAllCnes();
