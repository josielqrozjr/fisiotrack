# FisioTrack — Sistema Web de Avaliação e Rastreio em Fisioterapia Esportiva

Sistema web para **Avaliação Pré-Participação (APP)**, **Anamnese Esportiva**, **Mapeamento Anatômico de Lesões**, **Testes Funcionais com cálculo em tempo real do Índice de Simetria entre Membros (LSI %)** e **Testes Ortopédicos Especiais**, com persistência relacional em **SQLite + Prisma ORM**.

---

## 1. Pré-requisitos

- **Node.js** (versão 18.18+ ou 20/22/24 LTS)
- **npm** (incluso com o Node.js)
- Nenhuma instalação de banco externo ou Docker é necessária (o banco **SQLite** roda localmente no arquivo `prisma/dev.db`).

---

## 2. Passo a Passo para Executar o Projeto

### Opção A — Passo a Passo Completo (Recomendado no primeiro uso)

```bash
# 1. Clonar o repositório e acessar a pasta do projeto
git clone git@github.com:josielqrozjr/fisiotrack.git
cd fisiotrack

# 2. Instalar as dependências do projeto
npm install

# 3. Gerar o Prisma Client, sincronizar o schema SQLite (prisma/dev.db) e popular os 3 atletas iniciais
npm run db:setup

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

Após iniciar, abra no navegador:
- **Aplicação Web:** `http://localhost:3000`

### Opção B — Execução Direta (Usando o `prisma/dev.db` já incluso no repositório)

Como o banco `prisma/dev.db` já está versionado com os dados iniciais, você também pode rodar apenas:

```bash
npm install
npx prisma generate
npm run dev
```

---

## 3. Comandos Úteis de Banco de Dados e Apresentação

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Next.js em `http://localhost:3000` |
| `npm run db:setup` | Executa `npx prisma db push && npx prisma db seed` (cria/sincroniza o banco e insere os 3 atletas padrão) |
| `npx prisma db seed` | Reexecuta apenas o seed inicial limpando e repopulando os 3 casos clínicos |
| `npm run db:studio` | Abre o **Prisma Studio** em `http://localhost:5555` para visualizar e editar as tabelas SQLite no navegador |
| `npm run build` | Gera o build otimizado de produção do Next.js |

> **Dica para Apresentação à Banca:** Caso você cadastre, edite ou exclua atletas durante a demonstração ao vivo e queira voltar ao estado inicial imediatamente, basta clicar no botão **"Restaurar Seed SQL"** no rodapé da barra lateral esquerda do próprio sistema (sem precisar usar o terminal).

---

## 4. Estrutura Funcional e Rotas do Sistema

1. **Dashboard Clínico (`/`)**
   - Indicadores de **Índice de Simetria Médio (LSI %)**, **Índice de Prontidão Esportiva** e **Volume Semanal Monitorado**.
   - Gráfico comparativo individual de *Hop Test LSI* vs. *Simetria no Y-Balance* com linha de corte para alta esportiva (`RTS ≥ 90%`).
   - Tabela interativa de rastreio por atleta com filtro por modalidade e nível de risco.
   - Mapa consolidado de acometimento por articulação.

2. **Fluxo de Nova Avaliação / Edição em 4 Etapas (`/avaliacao/nova` e `/avaliacao/nova?edit=[id]`)**
   - **Etapa 01 — Identificação & Esporte:** Dados antropométricos (idade, massa, estatura, IMC automático, dominância), seleção do esporte principal, frequência semanal (1 a 7x/semana), duração da sessão e cadastro dinâmico de atividades complementares (ex: Musculação, Pilates).
   - **Etapa 02 — Histórico & Mapeamento Anatômico:** Mapa corporal interativo em SVG (clicar na articulação seleciona automaticamente a região e o lado anatômico), sugestões rápidas de diagnóstico e Escala Visual Analógica de dor (**EVA 0 a 10**).
   - **Etapa 03 — Testes Funcionais:** *Single Leg Hop Test*, *Y-Balance Test*, *Weight-Bearing Lunge Test* e *Prancha Isométrica (Core)* com cálculo em tempo real do **LSI %** -> `(Menor / Maior) × 100`.
   - **Etapa 04 — Testes Ortopédicos Especiais:** Avaliação separada por articulação (*Joelho*, *Tornozelo*, *Ombro* e *Quadril/Coluna*) com marcação rápida (`Negativo`, `Positivo`, `N/A`), seletor de lado, observações clínicas e prévia ao vivo do Score de Prontidão.

3. **Prontuário Completo e Laudo do Atleta (`/atleta/[id]`)**
   - Indicador de Prontidão (*Return-to-Play*) e Score de Risco.
   - Medidor semicircular de *Hop Test LSI*, gráfico comparativo bilateral (Membro Direito vs. Membro Esquerdo) e gráfico Radar multidimensional.
   - Parecer clínico automatizado com alertas biomecânicos e conduta fisioterapêutica baseada em evidências.
   - Ações de **CRUD completo**: adicionar nova lesão em modal rápido, editar toda a avaliação no SQLite, excluir prontuário com modal de confirmação (`onDelete: Cascade`) e exportar/imprimir laudo (`window.print()`).

---

## 5. Casos Clínicos Pré-Populados no Banco (`prisma/dev.db`)

- **Lucas Mendes (22 anos — Futebol 5x/sem + Musculação 2x/sem):** Pós-operatório de reconstrução de LCA no joelho direito (8 meses), *Hop Test* com LSI de **84%** (abaixo do corte de 90%) e Gaveta Anterior leve positiva à direita.
- **Mariana Costa (28 anos — Corrida de Rua 4x/sem + Pilates Clínico 2x/sem):** Histórico de entorse de tornozelo esquerdo Grau II, simetria adequada no salto (LSI **96,6%**), porém com restrição de dorsiflexão à esquerda no *Lunge Test* (`9,0 cm` E vs. `13,5 cm` D).
- **Rafael Oliveira (25 anos — Crossfit 6x/sem, sem atividade complementar):** Queixa álgica no ombro direito (**EVA 5/10**), *Teste de Neer* e *Teste de Jobe* positivos à direita.
