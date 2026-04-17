const axios = require('axios');
require('dotenv').config();

async function testMinasGeraisCep() {
  const token = process.env.CEP_ABERTO_TOKEN;
  const cepMG = '30110051'; // CEP de Belo Horizonte
  
  console.log('🔍 Testando CEP de Minas Gerais:', cepMG);
  
  try {
    // 1. Testa busca do CEP específico
    console.log('\n1️⃣ Testando busca do CEP específico...');
    const cepResponse = await axios.get('https://www.cepaberto.com/api/v3/cep', {
      params: { cep: cepMG },
      headers: {
        Authorization: `Token token=${token}`,
        'Accept': 'application/json'
      }
    });

    if (cepResponse.data) {
      console.log('✅ CEP encontrado:', JSON.stringify(cepResponse.data, null, 2));
      
      const lat = parseFloat(cepResponse.data.latitude);
      const lng = parseFloat(cepResponse.data.longitude);
      
      // 2. Testa busca por proximidade
      console.log('\n2️⃣ Testando busca por proximidade...');
      console.log(`   Coordenadas: ${lat}, ${lng}`);
      
      try {
        const nearbyResponse = await axios.get('https://www.cepaberto.com/api/v3/address', {
          params: {
            lat: lat,
            lng: lng,
            radius: 5000 // 5km em metros
          },
          headers: {
            Authorization: `Token token=${token}`,
            'Accept': 'application/json'
          }
        });

        if (nearbyResponse.data && Array.isArray(nearbyResponse.data)) {
          console.log(`✅ Encontrados ${nearbyResponse.data.length} CEPs próximos`);
          if (nearbyResponse.data.length > 0) {
            console.log('📍 Primeiros 3 resultados:');
            nearbyResponse.data.slice(0, 3).forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.cep} - ${item.logradouro}, ${item.bairro}`);
            });
          }
        } else {
          console.log('⚠️ Nenhum CEP próximo encontrado ou resposta não é array');
        }
        
      } catch (nearbyError) {
        console.log('❌ Erro na busca por proximidade:', nearbyError.response?.status, nearbyError.response?.data);
      }

      // 3. Testa endpoint local
      console.log('\n3️⃣ Testando endpoint local...');
      try {
        const localResponse = await axios.get(`http://localhost:3001/cep/${cepMG}`);
        console.log('✅ Endpoint local funciona:', localResponse.data);
      } catch (localError) {
        console.log('❌ Erro no endpoint local:', localError.response?.data || localError.message);
      }

    } else {
      console.log('❌ CEP não encontrado na API');
    }

  } catch (error) {
    console.log('❌ Erro ao buscar CEP:', error.response?.status, error.response?.data || error.message);
  }
}

testMinasGeraisCep();