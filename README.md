# EstudHub IA — Guia Interativo

Novo site de estudo criado a partir da apresentação **“Inteligência Artificial: o que é, como funciona e como foi utilizada no EstudHub”**.

## Objetivo

Transformar a apresentação em uma experiência de leitura e estudo, com:

- 91 tópicos organizados em trilhas;
- busca por conteúdo;
- favoritos;
- progresso de estudo;
- anotações locais;
- leitura completa de cada tópico em modal;
- revisão por questões;
- glossário clicável;
- curiosidades e conceitos complementares presentes no conteúdo;
- área especial sobre o EstudHub;
- fontes técnicas e institucionais;
- modo claro/escuro;
- responsividade;
- acessibilidade básica;
- respeito a `prefers-reduced-motion`.

## Arquivos

- `index.html`
- `style.css`
- `app.js`
- `content.js`
- `assets/favicon.svg`

## Dados e conteúdo

`content.js` contém os temas do Atlas. O material-base é a apresentação fornecida pelo usuário. O site também mantém tópicos complementares da versão anterior do Atlas, identificados pela própria arquitetura do conteúdo e pelas fontes externas.

## Anotações e progresso

Tudo é armazenado em `localStorage`. Nada é enviado a um servidor.

## Publicação

O projeto é estático e pode ser hospedado no GitHub Pages. Envie todos os arquivos preservando a pasta `assets/`.

## Observação acadêmica

O site diferencia documentação do projeto, exemplos hipotéticos e propostas futuras. Isso é importante especialmente para o EstudHub: uma arquitetura futura não deve ser apresentada como funcionalidade já implementada sem evidência.
