# FisioTrack — Sistema Web de Avaliação e Rastreio em Fisioterapia Esportiva

Aplicação web moderna e interativa para **Avaliação Pré-Participação (APP)**, **Anamnese Esportiva**, **Testes Funcionais com cálculo em tempo real do Índice de Simetria entre Membros (LSI %)** e **Testes Ortopédicos Especiais**.

## Stack Tecnológica
- **Framework:** Next.js (App Router) + TypeScript
- **Estilização:** Tailwind CSS (Paleta Emerald/Teal `#0D9488` / `#10B981` + Slate `#0F172A`)
- **Animações:** Framer Motion
- **Gráficos:** Recharts (Radar de Simetria Funcional, Comparativo Membro Direito vs. Esquerdo e Epidemiologia por Articulação)
- **Persistência:** Context API sincronizada com `localStorage` + restauração rápida dos dados de demonstração.

## Como Executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` no navegador.
