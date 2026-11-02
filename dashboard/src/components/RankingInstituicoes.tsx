import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts'
import { rankingInstituicoes } from '../lib/reclamacoes'
import type { AnoSelecionado, Reclamacao } from '../lib/reclamacoes'

const numero = new Intl.NumberFormat('pt-BR')

function NomeInstituicao({ x = 0, y = 0, payload }: {
  x?: number; y?: number; payload?: { value: string }
}) {
  return <Text x={x - 8} y={y} width={240} textAnchor="end" verticalAnchor="middle" fill="#405663" fontSize={12}>{payload?.value ?? ''}</Text>
}

export function RankingInstituicoes({ dados, ano, instituicao = '' }: { dados: Reclamacao[]; ano: AnoSelecionado; instituicao?: string }) {
  const ranking = rankingInstituicoes(dados, ano)
  const periodo = ano === 'todos' ? 'Todos os anos (2017–2026)' : String(ano)

  return (
    <section className="history" aria-labelledby="ranking-titulo" aria-describedby="ranking-nota">
      <h2 id="ranking-titulo">{instituicao ? 'Volume de reclamações da instituição selecionada' : 'Top 10 instituições por volume de reclamações'}</h2>
      <p className="history-subtitle">{periodo} · {instituicao || 'Todas as instituições'} · Soma de reclamações por instituição, do maior para o menor.</p>
      {instituicao && <p className="history-subtitle">O filtro restringe o ranking a uma instituição. A barra representa apenas seu volume, sem comparação com outras instituições.</p>}
      {ranking.incompletas > 0 && <p className="context">{numero.format(ranking.incompletas)} instituições com valores ausentes foram excluídas do ranking. Seus totais são desconhecidos e não foram convertidos em zero; a classificação considera apenas instituições com dados completos.</p>}
      {ranking.instituicoes.length ? <div className="history-scroll" tabIndex={0} role="region" aria-label={`Ranking de instituições — ${periodo}; em telas pequenas, deslize horizontalmente para ler os nomes completos`}>
        <div className="ranking-chart" style={{ height: Math.max(200, ranking.instituicoes.length * 90) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking.instituicoes} layout="vertical" margin={{ top: 12, right: 32, bottom: 16, left: 8 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" stroke="#dce5e9" horizontal={false} />
              <XAxis type="number" tickFormatter={(valor: number) => numero.format(valor)} allowDecimals={false} tick={{ fontSize: 12, fill: '#536773' }} tickLine={false} />
              <YAxis type="category" dataKey="instituicao" width={260} interval={0} tick={<NomeInstituicao />} tickLine={false} axisLine={false} />
              <Tooltip formatter={(valor) => [numero.format(Number(valor)), 'Total de reclamações']} labelStyle={{ overflowWrap: 'anywhere' }} wrapperStyle={{ maxWidth: 320 }} />
              <Bar dataKey="total" name="Total de reclamações" fill="#08796e" radius={[0, 4, 4, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div> : <p className="status">Não há dados completos para exibir o ranking neste período.</p>}
      <p id="ranking-nota" className="history-subtitle">Nomes diferentes permanecem separados, sem padronização automática. O ranking usa os trimestres disponíveis no período selecionado e mede volume absoluto de reclamações, sem ajuste pela base de clientes.</p>
    </section>
  )
}
