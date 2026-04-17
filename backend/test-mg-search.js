const axios = require('axios');

async function testMGSearch() {
  console.log('🧪 Testando busca por raio em MG...\n');
  
  try {
    console.log('1️⃣ Testando o endpoint local de busca por raio:');
    const response = await axios.get('http://localhost:3001/cep/search', {
      params: {
        cep: '30110051',
        raioKm: 5
      },
      timeout: 30000
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Resultados encontrados: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('\n📍 Primeiros resultados:');
      response.data.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.cep} - ${item.logradouro} (${item.distanciaKm}km)`);
      });
    } else {
      console.log('📋 Nenhum resultado encontrado');
      
      // Vamos testar alguns CEPs manualmente de MG
      console.log('\n2️⃣ Testando CEPs próximos manualmente:');
      const testCeps = [
        '30110052', '30110053', '30110060', '30110070', 
        '30111000', '30112000', '30120000', '30130000'
      ];
      
      for (const testCep of testCeps) {
        try {
          const testResponse = await axios.get(`http://localhost:3001/cep/${testCep}`, { timeout: 5000 });
          if (testResponse.data && testResponse.data.cep) {
            console.log(`✅ ${testCep}: ${testResponse.data.logradouro} - ${testResponse.data.localidade}`);
          }
        } catch (error) {
          console.log(`❌ ${testCep}: Não encontrado`);
        }
      }
      
      // Teste com CEP de São Paulo para comparar
      console.log('\n3️⃣ Comparando com SP (que sabemos que funciona):');
      try {
        const spResponse = await axios.get('http://localhost:3001/cep/search', {
          params: { cep: '01310100', raioKm: 2 },
          timeout: 10000
        });
        console.log(`✅ SP encontrou ${spResponse.data.length} resultados`);
      } catch (error) {
        console.log(`❌ Erro em SP: ${error.message}`);
      }
    }

  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Dados: ${JSON.stringify(error.response.data)}`);
    }
  }
}

testMGSearch();