const axios = require('axios');
require('dotenv').config();

const token = process.env.CEP_ABERTO_TOKEN;

async function testToken() {
  if (!token || token === 'seu-token-aqui') {
    console.log('❌ Token não configurado no .env');
    return false;
  }

  console.log('🧪 Testando token do CEP Aberto...');
  console.log(`🔑 Token: ${token.substring(0, 8)}...`);

  try {
    // Testa busca por CEP
    const response = await axios.get('https://www.cepaberto.com/api/v3/cep', {
      params: { cep: '01310100' },
      headers: {
        Authorization: `Token token=${token}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data) {
      console.log('✅ Token funciona perfeitamente!');
      console.log('📍 Dados de teste (CEP 01310-100):');
      console.log(`   Endereço: ${response.data.address || 'N/A'}`);
      console.log(`   Bairro: ${response.data.neighborhood || 'N/A'}`);
      console.log(`   Cidade: ${response.data.city?.name || 'N/A'}`);
      console.log(`   Estado: ${response.data.state?.code || 'N/A'}`);
      console.log(`   Coordenadas: ${response.data.latitude}, ${response.data.longitude}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Erro ao testar token:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Dados: ${error.response.data}`);
      
      if (error.response.status === 401) {
        console.log('\n🔄 Token expirado ou inválido.');
        console.log('💡 Para obter um novo token:');
        console.log('1. Acesse: https://www.cepaberto.com/users/login');
        console.log('2. Faça login com suas credenciais');
        console.log('3. Procure por "API Key" no seu painel');
        console.log('4. Copie o novo token e atualize o arquivo .env');
      }
    } else {
      console.log(`   Erro: ${error.message}`);
    }
    return false;
  }
}

testToken();