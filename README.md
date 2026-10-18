# FisioTrack — Sistema Web de Avaliação e Rastreio em Fisioterapia Esportiva

Aplicação web moderna e interativa para **Avaliação Pré-Participação (APP)**, **Anamnese Esportiva**, **Testes Funcionais com cálculo em tempo real do Índice de Simetria entre Membros (LSI %)** e **Testes Ortopédicos Especiais**, com persistência real em banco de dados relacional **SQLite + Prisma ORM**.

## Stack Tecnológica
- **Framework:** Next.js 15 (App Router + Server Actions) + TypeScript
- **Banco de Dados & ORM:** SQLite (`prisma/dev.db`) + Prisma ORM v5 (`@prisma/client`)
- **Estilização:** Tailwind CSS (Paleta Emerald/Teal `#0D9488` / `#10B981` + Slate `#0F172A`)
- **Animações:** Framer Motion
- **Gráficos:** Recharts (Radar de Simetria Funcional, Comparativo Membro Direito vs. Esquerdo e Epidemiologia por Articulação)

## Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Criar banco SQLite (prisma/dev.db) e popular os 3 atletas iniciais (Seed)
npm run db:setup

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` no navegador.

### Visualizar o Banco de Dados (Prisma Studio)
Durante a apresentação para a banca, você pode abrir o **Prisma Studio** para mostrar as tabelas relacionais preenchidas em tempo real:

```bash
npm run db:studio
# ou: npx prisma studio
```
