const fs = require('fs');
const { MongoClient } = require('mongodb');

/**
 * Script para ler o arquivo cnes_estabelecimentos.json e inserir
 * na coleção 'CnesCatalogo' do banco de dados MongoDB (saudeMemora).
 */

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DATABASE_NAME || 'saudeMemora';
const COLLECTION_NAME = 'CnesCatalogo';
const INPUT_FILE = process.argv[2] || 'cnes_estabelecimentos_full.json'; // Pega do argumento ou usa o full por padrão

async function run() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ O arquivo ${INPUT_FILE} não foi encontrado. Execute o download_cnes.js primeiro!`);
        return;
    }

    console.log(`Lendo o arquivo ${INPUT_FILE}...`);
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    let estabelecimentos = [];
    try {
        estabelecimentos = JSON.parse(rawData);
    } catch (e) {
        console.error('❌ Erro ao ler JSON. O arquivo pode estar corrompido.');
        return;
    }

    if (estabelecimentos.length === 0) {
        console.log('Nenhum estabelecimento para inserir.');
        return;
    }

    // Mapeia os dados da API para o formato esperado pela entidade CnesRegistro do C#
    const registrosCnes = estabelecimentos.map(est => ({
        codigo: est.codigo_cnes ? est.codigo_cnes.toString() : '',
        codigoNormalizado: est.codigo_cnes ? est.codigo_cnes.toString().trim() : '',
        descricao: est.nome_fantasia || est.nome_razao_social || 'Desconhecido',
        descricaoNormalizada: (est.nome_fantasia || est.nome_razao_social || 'Desconhecido').toUpperCase().trim(),
        categoria: est.descricao_natureza_juridica_estabelecimento || '',
        origem: 'API_GOV',
        importadoEm: new Date()
    })).filter(r => r.codigo !== ''); // Ignora os que não tem CNES

    console.log(`Preparados ${registrosCnes.length} registros para inserção. Conectando ao MongoDB...`);

    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Opcional: deletar os antigos antes de inserir para não duplicar (comentar caso queira apenas adicionar)
        // await collection.deleteMany({ origem: 'API_GOV' });
        
        console.log(`Inserindo dados na coleção '${COLLECTION_NAME}'...`);
        
        // Inserção em massa (bulk insert)
        const result = await collection.insertMany(registrosCnes);

        console.log(`✅ Sucesso! Foram inseridos ${result.insertedCount} estabelecimentos no MongoDB.`);

        // Cria índice (para buscar mais rápido) se já não existir
        await collection.createIndex({ codigoNormalizado: 1 }, { unique: true });
        await collection.createIndex({ descricaoNormalizada: "text" });
        console.log('✅ Índices criados/verificados com sucesso.');

    } catch (err) {
        if (err.code === 11000) {
            console.error('⚠️ Aviso: Alguns registros já existiam (código CNES duplicado). Considere limpar a base ou fazer um upsert.');
        } else {
            console.error('❌ Erro ao interagir com MongoDB:', err.message);
        }
    } finally {
        await client.close();
        console.log('Desconectado do banco.');
    }
}

run();
