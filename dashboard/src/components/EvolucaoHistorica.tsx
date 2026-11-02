import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { somar } from '../lib/reclamacoes'
import type { Reclamacao } from '../lib/reclamacoes'

const numero = new Intl.NumberFormat('pt-BR')
const anos = Array.from({ length: 10 }, (_, indice) => 2017 + indice)

export function EvolucaoHistorica({ dados }: { dados: Reclamacao[] }) {
  const historico = anos.map((ano) => ({
    ano,
    total: somar(dados.filter((registro) => registro.ano === ano), 'totalReclamacao'),
  }))

  return (
    <section className="history" aria-labelledby="historico-titulo" aria-describedby="historico-nota">
      <h2 id="historico-titulo">Evolução histórica das reclamações (2017–2026)</h2>
      <p className="history-subtitle">Total de reclamações por ano · Histórico completo, independente do filtro dos indicadores.</p>
      <div className="history-scroll" tabIndex={0} role="region" aria-label="Gráfico histórico; em telas pequenas, deslize horizontalmente para ver todos os anos">
        <div className="history-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico} margin={{ top: 20, right: 24, bottom: 12, left: 12 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" stroke="#dce5e9" vertical={false} />
              <XAxis dataKey="ano" interval={0} tickLine={false} tick={{ fontSize: 12, fill: '#536773' }} tickMargin={12} />
              <YAxis width={86} tickFormatter={(valor: number) => numero.format(valor)} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#536773' }} allowDecimals={false} domain={[0, 'auto']} />
              <Tooltip formatter={(valor) => [valor == null ? 'N/D' : numero.format(Number(valor)), 'Total de reclamações']} labelFormatter={(ano) => `Ano: ${ano}`} />
              <Line type="linear" dataKey="total" name="Total de reclamações" stroke="#08796e" strokeWidth={3} dot={{ r: 4, fill: '#08796e' }} activeDot={{ r: 6 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p id="historico-nota" className="context"><strong>Atenção à comparação histórica:</strong> 2022 não inclui o 2º trimestre. Em 2024 há mudança metodológica e estrutural; saltos na série não representam necessariamente crescimento real. Os dados de 2026 são parciais, com apenas o 1º e o 2º trimestres, e não devem ser comparados diretamente a anos completos. Valores ausentes não são substituídos por zero.</p>
    </section>
  )
}
