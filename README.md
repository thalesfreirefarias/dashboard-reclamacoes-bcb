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

## 📅 Dia 3 — Visualização e análise de dados

**O que foi implementado**

Nesta etapa, ampliei a análise com a opção **Todos os anos (2017–2026)** no filtro, mantendo 2025 como seleção inicial. No histórico acumulado, os KPIs somam as reclamações totais e procedentes, e a taxa é calculada pela razão entre essas somas. A variação anual aparece como **N/D**, pois não há uma comparação anual única para o período completo.

Com o Recharts, foram adicionadas três visualizações alimentadas pelo CSV real:

- **Evolução histórica das reclamações:** soma das reclamações por ano, exibindo 2017 a 2026 independentemente do filtro dos KPIs.
- **Top 10 instituições por volume de reclamações:** acompanha o filtro, agrupa pelo nome da instituição, soma os volumes e apresenta os dez maiores em barras horizontais.
- **Reclamações totais x procedentes por trimestre:** acompanha o filtro e compara as duas séries por trimestre. Em Todos os anos, mantém cada combinação de ano e trimestre em ordem cronológica. Procedentes são um subconjunto do total; as barras ficam lado a lado, sem empilhamento.

**Conceitos que comecei a explorar**

Agrupar dados significa reunir registros com uma chave em comum, como ano, trimestre ou instituição. Essa ideia aparece como `groupby` no Python/Pandas e `GROUP BY` no SQL. Depois do agrupamento, a soma dos valores corresponde a `sum`/`SUM`. No dashboard, essas operações foram implementadas em TypeScript; as referências a Pandas e SQL ajudam a relacionar o raciocínio entre ferramentas.

No ranking, a ordenação decrescente permite selecionar os maiores volumes após a soma, em vez de escolher apenas os maiores registros individuais. Nas séries temporais, ordenar por ano e trimestre preserva a sequência dos acontecimentos e evita misturar o mesmo trimestre de anos diferentes.

Também comecei a entender melhor a escolha dos gráficos: linhas ajudam a observar a evolução no tempo; barras horizontais facilitam a leitura de nomes e posições em um ranking; barras lado a lado permitem comparar totais e procedentes sem somar duas medidas que se sobrepõem.

Um cuidado importante foi representar períodos ausentes como `null`, sem inventar valores ou convertê-los em zero. O período permanece identificado no eixo, mas a série afetada fica sem barra. Interpretar os dados exige considerar a cobertura e as mudanças metodológicas antes de concluir que uma alta ou queda representa uma mudança real.

**Como posso aplicar essas ideias no trabalho**

Na análise de produtividade de esteiras, posso agrupar volumes por esteira e período para acompanhar entregas e identificar variações que merecem investigação. Um ranking de operações pode mostrar quais concentram mais volume, lembrando que volume absoluto não mede sozinho qualidade ou eficiência.

No acompanhamento de indicadores, posso comparar o total de operações com um subconjunto, como operações concluídas ou aprovadas, e calcular a taxa pela razão entre as somas. Séries temporais também podem apoiar o acompanhamento de metas e tendências, desde que os períodos comparados tenham cobertura equivalente e definições consistentes.

**Limitações da análise**

- **2022:** o segundo trimestre está ausente no CSV; os totais do ano não representam quatro trimestres completos.
- **2024:** houve mudança metodológica e estrutural. A equivalência dos conceitos entre versões ainda precisa ser validada, e os saltos da série exigem cautela.
- **2026:** os dados são parciais, com apenas o primeiro e o segundo trimestres disponíveis; não devem ser comparados diretamente a um ano completo.
- **Instituições:** os nomes não foram normalizados. Nomes diferentes permanecem separados, inclusive no histórico acumulado; uni-los exigiria uma regra de padronização documentada.

**Reflexão sobre o aprendizado**

A implementação foi realizada com auxílio do Codex. Consegui acompanhar as decisões e começar a relacionar agrupamento, soma, ordenação e visualização, mas isso ainda não significa domínio completo dos conceitos. Vou aprofundar esse aprendizado com exercícios de Python/Pandas, reproduzindo os agrupamentos, conferindo as somas e rankings e explorando o tratamento de valores e períodos ausentes.

---

## 📅 Dia 4 — Interatividade e refinamento (planejado)

A próxima etapa será adicionar o filtro por instituição financeira, refinar o layout e a responsividade e validar os cálculos e resultados. Quero observar como os filtros afetam cada análise e praticar a interpretação dos indicadores.

## 📅 Dia 5 — Publicação e apresentação (planejado)

O planejamento segue com a publicação do dashboard na Vercel, a atualização do README com imagem e link, a revisão do repositório no GitHub e a apresentação do projeto no LinkedIn.
