# Giross CEP

Sistema completo de busca e consulta de CEPs com API backend em NestJS e frontend em React.

## 📋 Descrição

Este projeto oferece uma solução completa para busca e manipulação de dados de CEP, permitindo:

- **🔍 Busca de CEPs**: Consulta informações detalhadas por código CEP
- **📍 Busca por proximidade**: Encontra CEPs próximos em um raio geográfico
- **📊 Processamento de dados**: Importação e manipulação de arquivos CSV com dados de CEP
- **🧮 Cálculo de distâncias**: Utiliza a fórmula de Haversine para precisão geográfica

### Componentes do Sistema

- **Backend**: API REST desenvolvida em NestJS com TypeScript
- **Frontend**: Interface web moderna desenvolvida em React com TypeScript  
- **Dados**: Base de dados CSV com informações georeferenciadas de CEPs

## 🏗️ Estrutura do Projeto

```
giross-cep/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── cep/               # Módulo principal de CEP
│   │   │   ├── cep.controller.ts    # Controlador REST
│   │   │   ├── cep.service.ts       # Lógica de negócio
│   │   │   ├── csv.service.ts       # Processamento CSV
│   │   │   └── haversine.util.ts    # Cálculos geográficos
│   │   ├── telemetry/         # Monitoramento
│   │   └── main.ts           # Configuração da aplicação
│   ├── data/                 # Arquivos CSV com dados
│   │   └── ceps.csv         # Base de dados de CEPs
│   └── README.md            # Documentação específica do backend
├── frontend/                # Aplicação React
│   ├── src/                # Código-fonte da interface
│   └── README.md          # Documentação específica do frontend
└── README.md              # Este arquivo
```

## ⚙️ Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**
- **Git** (para clonagem do repositório)

## 🚀 Instalação e Execução

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd giross-cep
```

### 2. Backend - API NestJS

#### Instalação
```bash
cd backend
npm install
```

#### Configuração
1. Certifique-se de que existe o arquivo `data/ceps.csv` com os dados dos CEPs
2. O arquivo CSV deve conter as colunas: `cep`, `logradouro`, `bairro`, `localidade`, `uf`, `latitude`, `longitude`

#### Executar em Desenvolvimento
```bash
# Modo watch (recarrega automaticamente ao salvar)
npm run start:dev

# Modo normal
npm run start
```

#### Executar em Produção
```bash
npm run build
npm run start:prod
```

A API estará disponível em: **http://localhost:3001**

### 3. Frontend - Aplicação React

#### Instalação
```bash
cd frontend
npm install
```

#### Executar em Desenvolvimento
```bash
npm run dev
```

#### Build para Produção
```bash
npm run build
npm run preview
```

A aplicação estará disponível em: **http://localhost:5173** (desenvolvimento)

## 🧪 Como Testar os Endpoints

### Swagger/OpenAPI Documentation
Acesse a documentação interativa da API em: **http://localhost:3001/api**

### Endpoints Disponíveis

#### 1. Buscar CEPs em Raio Geográfico

**Endpoint**: `GET /cep/search`

**Parâmetros**:
- `cep`: CEP de origem (string) - Ex: "01310100" ou "01310-100"
- `raioKm`: Raio em quilômetros (number) - Ex: 5

**Exemplo usando curl**:
```bash
curl "http://localhost:3001/cep/search?cep=01310100&raioKm=5"
```

**Exemplo usando navegador**:
```
http://localhost:3001/cep/search?cep=01310100&raioKm=5
```

**Resposta esperada**:
```json
[
  {
    "cep": "01310100",
    "logradouro": "Avenida Paulista",
    "bairro": "Bela Vista", 
    "localidade": "São Paulo",
    "uf": "SP",
    "distanciaKm": 0
  },
  {
    "cep": "01311000",
    "logradouro": "Rua Augusta",
    "bairro": "Consolação",
    "localidade": "São Paulo", 
    "uf": "SP",
    "distanciaKm": 1.234
  }
]
```

### Testando com Ferramentas

#### Usando Postman
1. Import: `GET http://localhost:3001/cep/search`
2. Adicione query params: `cep=01310100&raioKm=5`

#### Usando Swagger UI
1. Acesse: http://localhost:3001/api
2. Expanda o endpoint `/cep/search`
3. Clique em "Try it out"
4. Preencha os parâmetros
5. Execute a requisição

## 🧪 Executar Testes

### Backend
```bash
cd backend

# Testes unitários
npm run test

# Testes end-to-end
npm run test:e2e

# Cobertura de testes
npm run test:cov

# Modo watch (executa testes ao salvar)
npm run test:watch
```

### Frontend
```bash
cd frontend

# Executar testes
npm run test

# Verificação de código
npm run lint
```

## 📚 Documentação Específica

Para instruções mais detalhadas de cada componente:

- **Backend**: Consulte [backend/README.md](backend/README.md) para informações específicas da API
- **Frontend**: Consulte [frontend/README.md](frontend/README.md) para detalhes da interface

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS**: Framework Node.js progressivo
- **TypeScript**: Linguagem tipada
- **Swagger**: Documentação automática da API
- **CSV-Parse**: Processamento de arquivos CSV
- **Jest**: Framework de testes

### Frontend  
- **React 18**: Biblioteca de interface de usuário
- **TypeScript**: Tipagem estática
- **Vite**: Build tool moderna
- **ESLint**: Verificação de código

### Dados
- **CSV**: Arquivos com dados georeferenciados de CEPs
- **Haversine**: Fórmula para cálculo de distâncias geográficas

## 🌐 URLs do Sistema

Após execução completa:

- **API Backend**: http://localhost:3001
- **Documentação Swagger**: http://localhost:3001/api  
- **Frontend**: http://localhost:5173 (desenvolvimento)

## 📝 Notas de Desenvolvimento

- O backend processa dados em chunks para evitar bloqueio do event loop
- A API suporta múltiplas requisições simultâneas
- Os dados são carregados na memória para performance otimizada
- A interface frontend se conecta automaticamente à API backend