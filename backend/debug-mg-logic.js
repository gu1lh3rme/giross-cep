const axios = require('axios');

async function testMGLogic() {
  console.log('🔍 Testando se a lógica de MG está sendo ejecutada...\n');
  
  try {
    // 1. Primeiro testar o CEP origem
    console.log('1️⃣ Testando CEP de origem:');
    const originResponse = await axios.get('http://localhost:3001/cep/30110051', { timeout: 10000 });
    console.log(`   CEP: ${originResponse.data.cep}`);
    console.log(`   UF: ${originResponse.data.uf}`);
    console.log(`   Localidade: ${originResponse.data.localidade}`);
    console.log(`   Coordenadas: ${originResponse.data.latitude}, ${originResponse.data.longitude}`);

    // 2. Teste da busca por raio com logs
    console.log('\n2️⃣ Teste de busca por raio:');
    console.log('   Aguardando resposta (até 60s)...');
    
    const startTime = Date.now();
    const searchResponse = await axios.get('http://localhost:3001/cep/search', {
      params: { cep: '30110051', raioKm: 3 },
      timeout: 60000
    });
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`   Tempo: ${duration}s`);
    console.log(`   Resultados: ${searchResponse.data.length}`);
    console.log(`   Resposta: ${JSON.stringify(searchResponse.data)}`);

  } catch (error) {
    console.log('❌ Erro:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

testMGLogic();