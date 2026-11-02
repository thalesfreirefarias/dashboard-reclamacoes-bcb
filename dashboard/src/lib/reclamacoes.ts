import Papa from 'papaparse'

export type AnoSelecionado = number | 'todos'

export type Estrutura = 'antiga' | 'nova_1' | 'nova_2'
export interface Reclamacao {
  ano: number
  trimestre: number
  instituicao: string
  procedentes: number | null
  totalReclamacao: number | null
  totalCliente: number | null
  estrutura: Estrutura
}
const colunas = ['ano', 'trimestre', 'instituicao', 'procedentes', 'total_reclamacao', 'total_cliente', 'estrutura']

function inteiro(valor: string | undefined, campo: string, linha: number): number | null {
  const texto = valor?.trim() ?? ''
  if (!texto || /^(null|nan|na|n\/a)$/i.test(texto)) return null
  if (!/^\d+$/.test(texto) || !Number.isSafeInteger(Number(texto))) {
    throw new Error(`Valor inválido em ${campo}, linha ${linha}.`)
  }
  return Number(texto)
}

export function lerCsv(texto: string): Reclamacao[] {
  const resultado = Papa.parse<Record<string, string>>(texto, {
    header: true, skipEmptyLines: 'greedy', transformHeader: (nome) => nome.trim(),
  })
  if (resultado.errors.length) throw new Error(`CSV inválido: ${resultado.errors[0].message}`)
  if (!colunas.every((coluna) => resultado.meta.fields?.includes(coluna))) {
    throw new Error('O CSV não contém todas as colunas esperadas.')
  }
  if (!resultado.data.length) throw new Error('O arquivo de dados está vazio.')
  const chaves = new Set<string>()
  return resultado.data.map((registro, indice) => {
    const linha = indice + 2
    const ano = inteiro(registro.ano, 'ano', linha)
    const trimestre = /^[1-4]º$/.test(registro.trimestre?.trim()) ? Number(registro.trimestre.trim()[0]) : null
    const instituicao = registro.instituicao?.trim()
    const estrutura = registro.estrutura?.trim()
    if (ano === null || ano < 2017 || ano > 2026 || trimestre === null || !instituicao ||
      (estrutura !== 'antiga' && estrutura !== 'nova_1' && estrutura !== 'nova_2')) {
      throw new Error(`Identificação inválida na linha ${linha}.`)
    }
    const procedentes = inteiro(registro.procedentes, 'procedentes', linha)
    const totalReclamacao = inteiro(registro.total_reclamacao, 'total_reclamacao', linha)
    if (procedentes !== null && totalReclamacao !== null && procedentes > totalReclamacao) {
      throw new Error(`Procedentes excedem o total na linha ${linha}.`)
    }
    const chave = JSON.stringify([ano, trimestre, instituicao])
    if (chaves.has(chave)) throw new Error(`Registro duplicado na linha ${linha}.`)
    chaves.add(chave)
    return { ano, trimestre, instituicao, procedentes, totalReclamacao,
      totalCliente: inteiro(registro.total_cliente, 'total_cliente', linha), estrutura }
  })
}

export function somar(registros: Reclamacao[], campo: 'procedentes' | 'totalReclamacao'): number | null {
  if (!registros.length || registros.some((registro) => registro[campo] === null)) return null
  return registros.reduce((soma, registro) => soma + (registro[campo] as number), 0)
}

export function indicadores(dados: Reclamacao[], ano: AnoSelecionado) {
  const atuais = ano === 'todos' ? dados : dados.filter((registro) => registro.ano === ano)
  const anteriores = ano === 'todos' ? [] : dados.filter((registro) => registro.ano === ano - 1)
  const trimestres = [...new Set(atuais.map((registro) => registro.trimestre))].sort()
  const comuns = trimestres.filter((trimestre) => anteriores.some((registro) => registro.trimestre === trimestre))
  const total = somar(atuais, 'totalReclamacao')
  const procedentes = somar(atuais, 'procedentes')
  const atualComparavel = somar(atuais.filter((registro) => comuns.includes(registro.trimestre)), 'procedentes')
  const anteriorComparavel = somar(anteriores.filter((registro) => comuns.includes(registro.trimestre)), 'procedentes')
  let motivo = ''
  if (ano === 'todos') motivo = 'Não há comparação anual única para o período acumulado de 2017 a 2026.'
  else if (!anteriores.length) motivo = 'Não há dados do ano anterior para comparação.'
  else if (!comuns.length) motivo = 'Não há trimestres equivalentes nos dois anos.'
  else if (atualComparavel === null || anteriorComparavel === null) motivo = 'Há valores ausentes nos períodos comparados.'
  else if (anteriorComparavel === 0) motivo = 'A base do ano anterior é zero; a variação percentual é indefinida.'
  const variacao = motivo ? null : ((atualComparavel! / anteriorComparavel!) - 1) * 100
  return { total, procedentes, taxa: total !== null && total > 0 && procedentes !== null ? procedentes / total * 100 : null,
    variacao, motivo, trimestres, comuns, registros: atuais.length }
}

export function rankingInstituicoes(dados: Reclamacao[], ano: AnoSelecionado) {
  const grupos = new Map<string, Reclamacao[]>()
  for (const registro of dados) {
    if (ano !== 'todos' && registro.ano !== ano) continue
    const grupo = grupos.get(registro.instituicao)
    if (grupo) grupo.push(registro)
    else grupos.set(registro.instituicao, [registro])
  }
  const totais = [...grupos].map(([instituicao, registros]) => ({
    instituicao, total: somar(registros, 'totalReclamacao'),
  }))
  return {
    incompletas: totais.filter((item) => item.total === null).length,
    instituicoes: totais.filter((item): item is { instituicao: string; total: number } => item.total !== null)
      .sort((a, b) => b.total - a.total || a.instituicao.localeCompare(b.instituicao, 'pt-BR'))
      .slice(0, 10),
  }
}

export function reclamacoesPorTrimestre(dados: Reclamacao[], ano: AnoSelecionado) {
  const selecionados = ano === 'todos' ? dados : dados.filter((registro) => registro.ano === ano)
  if (!selecionados.length) return []
  const grupos = new Map<number, Reclamacao[]>()
  for (const registro of selecionados) {
    const chave = registro.ano * 4 + registro.trimestre - 1
    const grupo = grupos.get(chave)
    if (grupo) grupo.push(registro)
    else grupos.set(chave, [registro])
  }
  // No histórico, preenche apenas o eixo entre o primeiro e o último período
  // observado. Lacunas recebem null, nunca reclamações inventadas ou zero.
  const inicio = ano === 'todos' ? Math.min(...grupos.keys()) : ano * 4
  const fim = ano === 'todos' ? Math.max(...grupos.keys()) : ano * 4 + 3
  return Array.from({ length: fim - inicio + 1 }, (_, indice) => {
    const chave = inicio + indice
    const anoPeriodo = Math.floor(chave / 4)
    const trimestre = chave % 4 + 1
    const registros = grupos.get(chave) ?? []
    return {
      periodo: `${anoPeriodo} · ${trimestre}º tri`,
      rotulo: ano === 'todos' ? `${anoPeriodo} T${trimestre}` : `${trimestre}º tri`,
      total: somar(registros, 'totalReclamacao'),
      procedentes: somar(registros, 'procedentes'),
    }
  })
}
