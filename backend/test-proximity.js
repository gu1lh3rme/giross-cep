const axios = require('axios');

async function testProximitySearch() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testando sistema de busca por proximidade...\n');
  
  try {
    // 1. Testar dados básicos do CEP
    console.log('1. 📍 Buscando dados básicos do CEP 88010-001...');
    const cepResponse = await axios.get(`${baseUrl}/cep/88010-001`);
    console.log('   ✅ CEP encontrado:', JSON.stringify(cepResponse.data, null, 2));
    
    const { latitude, longitude } = cepResponse.data;
    console.log(`   📍 Coordenadas: ${latitude}, ${longitude}\n`);
    
    // 2. Testar busca por proximidade 5km
    console.log('2. 🔍 Testando busca por proximidade de 5km...');
    const search5km = await axios.get(`${baseUrl}/cep/search`, {
      params: { cep: '88010-001', raioKm: 5 }
    });
    console.log(`   📊 Encontrados ${search5km.data.length} CEPs em 5km`);
    if (search5km.data.length > 0) {
      search5km.data.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.cep} (${item.logradouro}) - ${item.distanciaKm}km`);
      });
    }
    console.log('');
    
    // 3. Testar busca por proximidade 20km
    console.log('3. 🔍 Testando busca por proximidade de 20km...');
    const search20km = await axios.get(`${baseUrl}/cep/search`, {
      params: { cep: '88010-001', raioKm: 20 }
    });
    console.log(`   📊 Encontrados ${search20km.data.length} CEPs em 20km`);
    if (search20km.data.length > 0) {
      search20km.data.slice(0, 10).forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.cep} (${item.logradouro}) - ${item.distanciaKm}km`);
      });
    }
    console.log('');
    
    // 4. Verificar se os CEPs próximos estão nos dados
    console.log('4. 🔍 Verificando CEPs específicos...');
    const expectedCeps = ['88010000', '88010002'];
    
    for (const cep of expectedCeps) {
      try {
        const response = await axios.get(`${baseUrl}/cep/${cep}`);
        console.log(`   ✅ ${cep} encontrado: ${response.data.logradouro}`);
      } catch (error) {
        console.log(`   ❌ ${cep} não encontrado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testProximitySearch();