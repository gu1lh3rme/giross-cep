# Frontend - Giross CEP

Aplicação web desenvolvida em React + TypeScript + Vite para interface de usuário do sistema de consulta de CEPs.

## Descrição

Esta aplicação frontend fornece uma interface intuitiva para:

- Consulta de CEPs
- Visualização de informações de endereço
- Busca de CEPs próximos
- Interface responsiva e moderna

## Tecnologias Utilizadas

- **React 18**: Biblioteca para construção da interface
- **TypeScript**: Linguagem de programação tipada
- **Vite**: Ferramenta de build e desenvolvimento
- **ESLint**: Linting e formatação de código

## Configuração e Execução

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Visualizar build de produção
npm run preview
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila a aplicação para produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o ESLint para verificação de código

## Estrutura do Projeto

```
src/
├── App.tsx              # Componente principal
├── main.tsx            # Ponto de entrada da aplicação
├── App.css             # Estilos do componente principal
├── index.css           # Estilos globais
└── assets/             # Recursos estáticos
```

## Funcionalidades Planejadas

- Interface para busca de CEP
- Exibição de informações de endereço
- Mapa de localização
- Busca por CEPs próximos
- Histórico de consultas
- Interface responsiva

## Configuração da API

Para conectar com a API backend, configure a URL base da API no arquivo de configuração apropriado.

## Desenvolvimento

Esta aplicação foi criada com Vite para facilitar o desenvolvimento com:

- Hot Module Replacement (HMR)
- Build otimizado
- Suporte nativo ao TypeScript
- ESLint configurado

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Execute os testes e linting
5. Faça um pull request

## Licença

Este projeto está licenciado sob a licença MIT.
