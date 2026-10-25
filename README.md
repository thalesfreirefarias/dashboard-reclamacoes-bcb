# 📊 Dashboard de Reclamações Bancárias — BCB

Projeto de análise de reclamações bancárias entre 2017 e 2026, desenvolvido com React, TypeScript e dados do Banco Central.

## 📅 Dia 1 — Configuração do ambiente

**Comandos utilizados:**

```bash
node -v
npm -v
git clone https://github.com/thalesfreirefarias/dashboard-reclamacoes-bcb.git
cd dashboard-reclamacoes-bcb
npm create vite@latest dashboard -- --template react-ts
```

**Correção de dependências:**

```bash
cd dashboard
npm pkg set "devDependencies.typescript=~5.9.3"
npm install
npm run dev
```

**O que aprendi:**

- `node` e `npm`: executar ferramentas JavaScript e gerenciar bibliotecas.
- `git clone`: copiar um repositório do GitHub.
- `cd`: navegar entre pastas.
- `npm run dev`: iniciar a aplicação localmente.
- React: construir interfaces.
- TypeScript: trabalhar com tipos de dados.

---

## 📅 Dia 2 — Importação do CSV e KPIs

**1. Copiar a base de dados**

```bash
mkdir -p dashboard/public/data
cp ~/churn-bancario-brasil/data/raw/reclamacoes_historico.csv dashboard/public/data/
```

**2. Prompt utilizado para análise da base**

Solicitar ao Codex que examine o CSV antes de construir o dashboard, identificando colunas, tipos de dados, registros ausentes, duplicidades, períodos disponíveis e possíveis problemas metodológicos.

**3. Prompt utilizado para implementar os indicadores**

> Implemente o Dia 2 do dashboard de reclamações bancárias do Banco Central. Trabalhe apenas dentro da pasta dashboard e utilize o arquivo public/data/reclamacoes_historico.csv, que contém dados de 2017 a 2026.
>
> Construa uma página React + TypeScript responsiva com leitura do CSV usando Papa Parse, filtro anual de 2017 a 2026 (2025 como padrão) e quatro indicadores dinâmicos:
>
> - Total de reclamações.
> - Reclamações procedentes.
> - Taxa de procedência.
> - Variação percentual anual de procedentes.
>
> Compare apenas trimestres equivalentes. Sinalize o trimestre ausente de 2022, as mudanças metodológicas de 2024 e os dados parciais de 2026.
>
> Não crie gráficos ainda, não altere o README e não realize commits. Execute `npm run build` e `npm run lint` ao finalizar.

**4. Fórmulas aprendidas**

```typescript
const total = dados.reduce(
  (soma, linha) => soma + linha.total_reclamacao, 0
);

const taxa = total > 0
  ? (procedentes / total) * 100
  : null;
```

- `reduce()`: soma valores de vários registros.
- Taxa de procedência: reclamações procedentes ÷ reclamações totais × 100.
- Variação anual: `(valor atual / valor anterior - 1) × 100`.

*Os trechos acima são exemplos simplificados para revisão.*

**5. Testes e GitHub**

```bash
npm run build
npm run lint
git add dashboard
git commit -m "Implementa indicadores e filtro anual do dashboard"
git push origin main
```

**O que aprendi:**

- Importar e validar dados de um CSV.
- Criar indicadores de desempenho (KPIs).
- Comparar períodos equivalentes.
- Testar o código antes de publicar.
- Registrar e enviar alterações com Git.

**Resultado:** dashboard com quatro KPIs, filtro anual e 5.060 registros históricos.

---

**Próxima etapa:** Dia 3 — Gráficos interativos com Recharts.