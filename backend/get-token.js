const axios = require('axios');

// Credenciais do usuário
const credentials = {
  user: { // Algumas APIs esperam um objeto user
    email: 'gu1lh3rmesv',
    password: 'easy123'
  }
};

const alternativeCredentials = {
  email: 'gu1lh3rmesv',
  password: 'easy123'
};

async function getCepAbertoToken() {
  console.log('🔄 Investigando autenticação no CEP Aberto...');
  
  // URLs possíveis para API
  const possibleUrls = [
    'https://www.cepaberto.com/api/v3/token',
    'https://www.cepaberto.com/api/v3/authenticate',
    'https://www.cepaberto.com/api/v3/login',
    'https://www.cepaberto.com/api/token',
    'https://www.cepaberto.com/users/sign_in',
    'https://www.cepaberto.com/api/v3/sessions'
  ];

  for (const url of possibleUrls) {
    try {
      console.log(`\n🔍 Tentando: ${url}`);
      
      // Tenta com diferentes formatos de credenciais
      const attempts = [credentials, alternativeCredentials];
      
      for (const creds of attempts) {
        try {
          const response = await axios.post(url, creds, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          if (response.data && response.data.token) {
            console.log('✅ Token obtido com sucesso!');
            console.log(`📋 Token: ${response.data.token}`);
            return response.data.token;
          } else if (response.data) {
            console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
          }
        } catch (error) {
          // Continue tentando outras combinações
        }
      }
    } catch (error) {
      if (error.response && error.response.status !== 404 && error.response.status !== 405) {
        console.log(`❌ ${url}: ${error.response?.status} - ${error.response?.statusText}`);
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.length < 200) {
          console.log(`   Dados: ${error.response.data}`);
        }
      }
    }
  }

  console.log('\n🔍 Tentando buscar informações sobre a API...');
  
  // Tenta acessar um endpoint público para ver a estrutura da API
  try {
    const testResponse = await axios.get('https://www.cepaberto.com/api/v3/cep?cep=01310100', {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log('✅ Endpoint público funciona! Estrutura da resposta:');
    console.log(JSON.stringify(testResponse.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log(`📘 Resposta do servidor para busca sem auth: ${error.response.status}`);
      if (error.response.data) {
        console.log('📄 Dados:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  console.log('\n💡 Instruções alternativas:');
  console.log('1. Acesse https://www.cepaberto.com/users/login');
  console.log('2. Faça login com suas credenciais');
  console.log('3. Procure por "API Key" ou "Token" no painel do usuário');
  console.log('4. Copie o token e adicione no arquivo .env como CEP_ABERTO_TOKEN=seu_token');
  
  return null;
}

// Executa o script
getCepAbertoToken();