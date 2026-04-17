# Backend - API Giross CEP

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

API REST desenvolvida em NestJS para busca e consulta de dados de CEP.

## Descrição

Esta API fornece endpoints para consulta de CEPs, incluindo funcionalidades de:

- Busca de CEP por código
- Busca de CEPs próximos por localização
- Importação e processamento de dados CSV
- Cálculo de distância usando fórmula de Haversine

## Funcionalidades

- **Consulta de CEP**: Busca informações detalhadas por CEP usando a API do CEP Aberto
- **Busca por proximidade**: Encontra CEPs próximos a uma localização geográfica  
- **Fallback inteligente**: Utiliza dados locais CSV quando a API externa não está disponível
- **Cache em memória**: Armazena resultados para melhor performance
- **Telemetria**: Interceptador para monitoramento de requisições

## 🔧 Configuração da API CEP Aberto

### 1. Obtenha seu Token de Acesso

1. Acesse: https://www.cepaberto.com/users/login
2. Faça login com suas credenciais:
   - **Usuário**: `gu1lh3rmesv`
   - **Senha**: `BobEsponja`
3. No painel do usuário, procure por "API Key" ou "Token"
4. Copie o token de acesso

### 2. Configure o Arquivo .env

Crie ou edite o arquivo `.env` na raiz do projeto backend:

```bash
# Token da API CEP Aberto
CEP_ABERTO_TOKEN=seu_token_aqui

# Configurações da aplicação
NODE_ENV=development
PORT=3001
```

### 3. Teste a Configuração

Execute o script de teste para verificar se o token está funcionando:

```bash
node test-token.js
```

Se o token estiver funcionando, você verá uma mensagem de sucesso com dados de teste.

## 🔄 Funcionamento Híbrido

A aplicação utiliza uma estratégia híbrida para garantir alta disponibilidade:

### 1. Fonte Principal: API CEP Aberto
- **Vantagem**: Dados atualizados e completos (1.1M+ CEPs)
- **Requisitos**: Token de acesso configurado e conexão com internet
- **Cobertura**: Todo o Brasil com coordenadas geográficas precisas

### 2. Fallback: Dados Locais CSV  
- **Vantagem**: Funciona offline, resposta rápida
- **Limitação**: Dados limitados à região de São Paulo (120+ CEPs)
- **Uso**: Quando a API externa falha ou não está configurada

### 3. Sistema de Cache
- **Cache em memória**: Resultados da API são armazenados temporariamente
- **Reduz requisições**: Melhora performance para CEPs consultados repetidamente
- **TTL configurável**: Através da variável `CACHE_TTL` no .env

## 🧪 Testando a Integração

### Teste Rápido via Browser
```
http://localhost:3001/cep/01310100
```

### Teste com curl
```bash
# Buscar CEP específico
curl "http://localhost:3001/cep/01310100"

# Buscar CEPs em raio de 5km  
curl "http://localhost:3001/cep/search?cep=01310100&raioKm=5"
```

### Teste via Swagger UI
Acesse: http://localhost:3001/api

## 🚨 Troubleshooting

### Problema: "CEP não encontrado"
**Solução**: 
1. Verifique se o token está configurado corretamente
2. Teste o token: `node test-token.js`
3. Se necessário, obtenha um novo token no site do CEP Aberto

### Problema: "Erro ao consultar API externa"  
**Solução**:
1. Verifique sua conexão com internet
2. Confirme se o token não expirou
3. A aplicação automaticamente usará dados locais como fallback

### Problema: "Token expirado"
**Solução**:
1. Acesse https://www.cepaberto.com/users/login
2. Faça login novamente
3. Obtenha um novo token no painel
4. Atualize o arquivo `.env` com o novo token

## Configuração do Projeto

```bash
$ npm install
```

## Executar o projeto

```bash
# desenvolvimento
$ npm run start

# modo watch (desenvolvimento com recarga automática)
$ npm run start:dev

# modo produção
$ npm run start:prod
```

## Executar testes

```bash
# testes unitários
$ npm run test

# testes e2e (end-to-end)
$ npm run test:e2e

# cobertura de testes
$ npm run test:cov
```

## Endpoints da API

### 1. Buscar CEPs em Raio Geográfico

**Endpoint**: `GET /cep/search`

**Parâmetros**:
- `cep`: CEP de origem (string) - Ex: "01310100" ou "01310-100"
- `raioKm`: Raio em quilômetros (number) - Ex: 5

**Exemplo**:
```bash
curl "http://localhost:3001/cep/search?cep=01310100&raioKm=5"
```

### 2. Buscar CEP Específico

**Endpoint**: `GET /cep/:cep`

**Parâmetros**:
- `cep`: Código CEP (parâmetro da URL) - Ex: "01310100"

**Exemplo**:
```bash
curl "http://localhost:3001/cep/01310100"
```

**Resposta**:
```json
{
  "cep": "01310100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "latitude": -23.5597000098,
  "longitude": -46.6487628251
}
```

## Estrutura do Projeto

```
src/
├── app.module.ts          # Módulo principal da aplicação
├── main.ts                # Arquivo de entrada da aplicação
├── cep/                   # Módulo de CEP
│   ├── cep.controller.ts  # Controlador com endpoints
│   ├── cep.service.ts     # Serviço com lógica de negócio
│   ├── csv.service.ts     # Serviço para processamento CSV
│   ├── haversine.util.ts  # Utilitário para cálculo de distância
│   └── dto/               # Objetos de transferência de dados
└── telemetry/             # Módulo de telemetria
    └── telemetry.interceptor.ts
```

## Deploy

Quando estiver pronto para fazer o deploy da aplicação NestJS em produção, existem algumas etapas importantes para garantir que ela execute de forma eficiente. Consulte a [documentação de deployment](https://docs.nestjs.com/deployment) para mais informações.

## Tecnologias Utilizadas

- **NestJS**: Framework Node.js progressivo
- **TypeScript**: Linguagem de programação
- **CSV Parser**: Para processamento de arquivos CSV
- **Jest**: Framework de testes

## Recursos

Recursos úteis para trabalhar com NestJS:

- Visite a [Documentação do NestJS](https://docs.nestjs.com) para aprender mais sobre o framework.
- Para dúvidas e suporte, visite nosso [canal do Discord](https://discord.gg/G7Qnnhy).
- Para se aprofundar e ter mais experiência prática, confira nossos [cursos oficiais](https://courses.nestjs.com/).

## Licença

Este projeto está licenciado sob a licença MIT.
