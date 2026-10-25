import { useEffect, useState } from 'react'
import { indicadores, lerCsv } from './lib/reclamacoes'
import type { Reclamacao } from './lib/reclamacoes'
import './App.css'

const numero = new Intl.NumberFormat('pt-BR')
const percentual = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatar = (valor: number | null) => valor === null ? 'N/D' : numero.format(valor)
const formatarTaxa = (valor: number | null) => valor === null ? 'N/D' : `${percentual.format(valor)}%`
const periodos = (valores: number[]) => valores.map((valor) => `${valor}º`).join(', ')

function App() {
  const [dados, setDados] = useState<Reclamacao[]>([])
  const [ano, setAno] = useState(2025)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function carregar() {
      try {
        const resposta = await fetch(`${import.meta.env.BASE_URL}data/reclamacoes_historico.csv`, { signal: controller.signal })
        if (!resposta.ok) throw new Error(`Não foi possível carregar o CSV (HTTP ${resposta.status}).`)
        const registros = lerCsv(await resposta.text())
        if (!controller.signal.aborted) {
          setDados(registros)
          setCarregando(false)
        }
      } catch (falha) {
        if (!controller.signal.aborted) {
          setErro(falha instanceof Error ? falha.message : 'Falha inesperada ao ler os dados.')
          setCarregando(false)
        }
      }
    }
    void carregar()
    return () => controller.abort()
  }, [tentativa])

  const anos = [...new Set(dados.map((registro) => registro.ano))].sort((a, b) => a - b)
  const resumo = indicadores(dados, ano)
  const disponivel = !carregando && !erro

  return (
    <main className="dashboard">
      <header>
        <p className="eyebrow">BANCO CENTRAL DO BRASIL · DADOS PÚBLICOS</p>
        <h1>Reclamações bancárias</h1>
        <p className="subtitle">Acompanhe os principais indicadores das instituições financeiras, de 2017 a 2026.</p>
      </header>

      <section className="toolbar" aria-label="Período de análise">
        <div><h2>Visão geral</h2><p>Indicadores agregados do período disponível.</p></div>
        <label htmlFor="ano">Ano de referência
          <select id="ano" value={ano} disabled={!disponivel} onChange={(evento) => setAno(Number(evento.target.value))}>
            {(anos.length ? anos : [2025]).map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
          </select>
        </label>
      </section>

      {carregando && <p className="status" role="status">Carregando e validando os dados…</p>}
      {erro && <div className="status error" role="alert"><p>{erro}</p><button onClick={() => {
        setErro(''); setCarregando(true); setTentativa((valor) => valor + 1)
      }}>Tentar novamente</button></div>}

      {disponivel && <section aria-label={`Indicadores de ${ano}`} aria-live="polite">
        <p className="coverage">{ano} · Trimestres: {periodos(resumo.trimestres)} · {numero.format(resumo.registros)} registros
          {resumo.trimestres.length < 4 && <span className="badge">Cobertura parcial</span>}</p>
        <div className="metrics">
          <article className="metric"><h3>Total de reclamações</h3><p className="value">{formatar(resumo.total)}</p><p>Soma das reclamações no período.</p></article>
          <article className="metric"><h3>Reclamações procedentes</h3><p className="value">{formatar(resumo.procedentes)}</p><p>Soma das reclamações procedentes.</p></article>
          <article className="metric"><h3>Taxa de procedência</h3><p className="value">{formatarTaxa(resumo.taxa)}</p><p>Procedentes ÷ total de reclamações × 100.</p></article>
          <article className="metric"><h3>Variação anual de procedentes</h3><p className="value">{resumo.variacao !== null && resumo.variacao > 0 ? '+' : ''}{formatarTaxa(resumo.variacao)}</p>
            <p>{resumo.motivo || `Trimestres ${periodos(resumo.comuns)} de ${ano} e ${ano - 1}.`}</p>
          </article>
        </div>
        {(ano === 2024 || ano === 2025) && <p className="context">A comparação {ano} × {ano - 1} envolve 2024, ano de mudança metodológica. O resultado é descritivo e pode refletir alterações de estrutura e cobertura.</p>}
        {(resumo.total === null || resumo.procedentes === null) && <p className="context">Há valores ausentes: os indicadores afetados aparecem como N/D, sem substituir ausências por zero.</p>}
        {resumo.total === 0 && <p className="context">Taxa de procedência indisponível: o total de reclamações é zero.</p>}
      </section>}

      <aside className="methodology" aria-labelledby="metodologia">
        <h2 id="metodologia">Como interpretar os dados</h2>
        <ul>
          <li><strong>2022 — trimestre ausente.</strong> O 2º trimestre não consta no arquivo. Os totais cobrem apenas o 1º, 3º e 4º trimestres.</li>
          <li><strong>2024 — mudança metodológica.</strong> O 1º trimestre usa a estrutura antiga, o 2º usa nova_1 e o 3º e 4º usam nova_2. A equivalência dos conceitos entre estruturas ainda precisa ser validada; saltos na série não representam necessariamente crescimento real.</li>
          <li><strong>2026 — dados parciais.</strong> Apenas o 1º e o 2º trimestres estão disponíveis. A variação considera os mesmos trimestres de 2025.</li>
          <li><strong>Comparação anual.</strong> Usamos somente os trimestres presentes nos dois anos. Isso também restringe a comparação de 2023 com 2022 ao 1º, 3º e 4º trimestres; os demais cartões mantêm a cobertura do ano selecionado.</li>
          <li><strong>Valores ausentes.</strong> Não são convertidos em zero. N/D indica cálculo indisponível; a taxa usa a razão entre as somas, sem média simples de percentuais.</li>
        </ul>
      </aside>
      <footer>Fonte: arquivo histórico de reclamações do Banco Central do Brasil · Valores relativos à cobertura disponível no CSV.</footer>
    </main>
  )
}
export default App
