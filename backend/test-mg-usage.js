const axios = require('axios');

async function testMGDataUsage() {
  console.log('🔍 Testando uso dos dados de MG...\n');
  
  try {
    // 1. Testa alguns CEPs de MG que sabemos que existem no CSV
    console.log('1️⃣ Testando CEPs que deveriam estar no CSV de MG:');
    const mgCeps = ['30110001', '30110002', '30110005', '30110008'];
    
    for (const cep of mgCeps) {
      try {
        const response = await axios.get(`http://localhost:3001/cep/${cep}`, { timeout: 5000 });
        if (response.data && response.data.cep) {
          console.log(`✅ ${cep}: ${response.data.logradouro || 'sem logradouro'} - ${response.data.localidade}`);
        }
      } catch (error) {
        console.log(`❌ ${cep}: ${error.response?.status} - ${error.response?.data?.message || 'Não encontrado'}`);
      }
    }

    // 2. Testa se o servidor está fazendo busca individual
    console.log('\n2️⃣ Tentando busca por raio com timeout maior:');
    
    try {
      const searchResponse = await axios.get('http://localhost:3001/cep/search', {
        params: { cep: '30110051', raioKm: 3 },
        timeout: 60000 // 60 segundos
      });
      
      console.log(`📊 Resposta: ${JSON.stringify(searchResponse.data)}`);
      
    } catch (error) {
      console.log(`❌ Busca por raio falhou: ${error.message}`);
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testMGDataUsage();