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

- **Consulta de CEP**: Busca informações detalhadas por CEP
- **Busca por proximidade**: Encontra CEPs próximos a uma localização
- **Processamento de CSV**: Importa dados de CEPs de arquivos CSV
- **Telemetria**: Interceptador para monitoramento de requisições

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

- `GET /cep/:cep` - Busca informações de um CEP específico
- `GET /cep/nearby` - Busca CEPs próximos a uma localização
- `POST /cep/import` - Importa dados de CEPs via CSV

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
