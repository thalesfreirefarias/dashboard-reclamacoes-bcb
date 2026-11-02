import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { reclamacoesPorTrimestre } from '../lib/reclamacoes'
import type { AnoSelecionado, Reclamacao } from '../lib/reclamacoes'

const numero = new Intl.NumberFormat('pt-BR')

export function ReclamacoesTrimestrais({ dados, ano }: { dados: Reclamacao[]; ano: AnoSelecionado }) {
  const serie = reclamacoesPorTrimestre(dados, ano)
  const periodo = ano === 'todos' ? 'Todos os anos (2017–2026)' : String(ano)
  const incompletos = serie.filter((item) => item.total === null || item.procedentes === null)

  return (
    <section className="history" aria-labelledby="trimestral-titulo" aria-describedby="trimestral-nota">
      <h2 id="trimestral-titulo">Reclamações totais x procedentes por trimestre</h2>
      <p className="history-subtitle">{periodo} · Procedentes são um subconjunto das reclamações totais. As barras são exibidas lado a lado, sem empilhamento.</p>
      {serie.length ? <div className="history-scroll" tabIndex={0} role="region" aria-label={`Reclamações por trimestre — ${periodo}; deslize horizontalmente para ver todos os períodos`}>
        <div className="quarterly-chart" style={{ minWidth: Math.max(600, serie.length * 95) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ top: 16, right: 24, bottom: 16, left: 12 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" stroke="#dce5e9" vertical={false} />
              <XAxis dataKey="rotulo" interval={0} tick={{ fontSize: 12, fill: '#536773' }} tickLine={false} tickMargin={12} height={48} />
              <YAxis width={86} tickFormatter={(valor: number) => numero.format(valor)} allowDecimals={false} tick={{ fontSize: 12, fill: '#536773' }} tickLine={false} axisLine={false} />
              <Tooltip filterNull={false} formatter={(valor, nome) => [valor == null ? 'N/D' : numero.format(Number(valor)), nome]} />
              <Legend />
              <Bar dataKey="total" name="Reclamações totais" fill="#08796e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="procedentes" name="Reclamações procedentes" fill="#7053ad" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div> : <p className="status">Não há dados disponíveis para este período.</p>}
      {incompletos.length > 0 && <p className="context">Períodos sem dados completos: {incompletos.map((item) => item.periodo).join('; ')}. Valores ausentes são N/D: o eixo preserva o período, mas não desenha a barra da série afetada nem substitui o valor por zero.</p>}
      <p id="trimestral-nota" className="history-subtitle">2022 não inclui o 2º trimestre. Em 2024 houve mudança metodológica e estrutural, que pode afetar a comparação. Em 2026 estão disponíveis apenas o 1º e o 2º trimestres. No histórico completo, o eixo vai do primeiro ao último trimestre disponível no CSV.</p>
    </section>
  )
}
