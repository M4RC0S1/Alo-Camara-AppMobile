# Alô Câmara 📢

**Alô Câmara** é um aplicativo mobile que conecta cidadãos e prefeituras. Através dele, o usuário pode abrir chamados (dicas, problemas ou solicitações) diretamente para a prefeitura da sua cidade e avaliar os políticos locais. Já a prefeitura, através do perfil de **administrador**, pode visualizar e responder aos chamados recebidos.

Projeto desenvolvido com [Expo](https://expo.dev) + [React Native](https://reactnative.dev), utilizando roteamento baseado em arquivos com [Expo Router](https://docs.expo.dev/router/introduction).

---

## ✨ Funcionalidades

**Usuário (Cidadão)**
- Cadastro e login
- Abrir chamados (dicas, problemas ou outras solicitações)
- Acompanhar status e histórico dos chamados
- Avaliar políticos da cidade
- Receber notificações de atualização dos chamados

**Administrador (Prefeitura)**
- Login administrativo
- Visualizar todos os chamados recebidos
- Responder e atualizar o status dos chamados

> Documentação completa do projeto (regras de negócio, modelo de dados e estrutura de telas) disponível em [`documentacao-alo-camara.md`](./documentacao-alo-camara.md).

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado (LTS recomendado)
- [Git](https://git-scm.com/) instalado
- App [Expo Go](https://expo.dev/go) no celular (para testar rapidamente) **ou** emulador Android/iOS configurado

### Passo a passo

1. Clone o repositório

   ```bash
   git clone https://github.com/GuilhermeDeCosta/AloCamara
   cd AloCamara
   ```

2. Instale as dependências

   ```bash
   npm install
   npx expo install @expo/vector-icons
   ```

3. Inicie o projeto

   ```bash
   npx expo start
   ```

No terminal, o Expo vai mostrar um QR Code e algumas opções para abrir o app:

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), para testar rapidamente sem precisar de build nativo

---

## 📂 Estrutura do projeto

O projeto usa **file-based routing** do Expo Router. As telas ficam dentro da pasta `app/`, organizadas por grupos de rotas:

```
app/
├── _layout.tsx          # Layout raiz (autenticação e redirecionamentos)
├── (auth)/               # Telas de login e cadastro
├── (user)/               # Telas do cidadão (chamados, políticos, perfil)
└── (admin)/              # Telas da prefeitura (gestão de chamados)

src/
├── components/           # Componentes reutilizáveis
├── constants/            # Constantes do projeto (cores, textos, etc.)
├── contexts/             # Contextos globais (ex: AuthContext)
├── hooks/                # Hooks customizados
├── services/             # Chamadas de API
├── types/                # Tipagens TypeScript
└── utils/                # Funções utilitárias
```

Para mais detalhes sobre o modelo de dados e regras de negócio, veja a [documentação do projeto](./documentacao-alo-camara.md).

---

## 🛠️ Tecnologias

- [React Native](https://reactnative.dev)
- [Expo](https://expo.dev)
- [Expo Router](https://docs.expo.dev/router/introduction) (navegação baseada em arquivos)
- [TypeScript](https://www.typescriptlang.org)

---

## ⚙️ Outras configurações

- Para configurar o **ESLint**, rode `npx expo lint`, ou siga o guia ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- Para configurar **testes unitários**, siga o guia ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Para saber mais sobre a configuração de **TypeScript** neste template, veja o guia ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

---

## 🤝 Contribuindo

Este é um projeto em equipe. Ao contribuir:

1. Crie uma branch a partir da `main` (ex: `feature/tela-de-chamados`)
2. Faça commits pequenos e descritivos
3. Abra um Pull Request explicando o que foi feito
4. Aguarde revisão de outro integrante antes do merge

---

## 📚 Saiba mais

- [Documentação do Expo](https://docs.expo.dev/): fundamentos e guias avançados
- [Documentação do Expo Router](https://docs.expo.dev/router/introduction/)
- [Tutorial oficial do Expo](https://docs.expo.dev/tutorial/introduction/)

## 🌐 Comunidade

- [Expo no GitHub](https://github.com/expo/expo)
- [Discord da Expo](https://chat.expo.dev)
