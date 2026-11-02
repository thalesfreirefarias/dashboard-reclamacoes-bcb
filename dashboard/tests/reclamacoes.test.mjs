import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { filtrarInstituicao, indicadores, lerCsv, rankingInstituicoes, reclamacoesPorTrimestre, somar } from '../src/lib/reclamacoes.ts'

const csv = readFileSync(new URL('../public/data/reclamacoes_historico.csv', import.meta.url), 'utf8')
const dados = lerCsv(csv)
const anos = [...Array.from({ length: 10 }, (_, i) => 2017 + i), 'todos']
const base = dados[0]

test('CSV real: cobertura e ausências preservadas', () => {
  assert.equal(dados.length, 5060)
  assert.equal(dados.filter(r => r.totalCliente === null).length, 16)
  assert.equal(dados.some(r => r.ano === 2022 && r.trimestre === 2), false)
  assert.deepEqual([...new Set(dados.filter(r => r.ano === 2026).map(r => r.trimestre))], [1, 2])
  assert.deepEqual([...new Set(dados.filter(r => r.ano === 2024).map(r => r.estrutura))], ['antiga', 'nova_1', 'nova_2'])
})

test('KPIs, ranking e série trimestral concordam com agregação independente em todos os filtros', () => {
  const nomes = [...new Set(dados.map(r => r.instituicao))]
  for (const nome of ['', ...nomes]) {
    const filtrados = filtrarInstituicao(dados, nome)
    for (const ano of anos) {
      const linhas = dados.filter(r => (!nome || r.instituicao === nome) && (ano === 'todos' || r.ano === ano))
      const resumo = indicadores(filtrados, ano)
      const total = linhas.length ? linhas.reduce((s, r) => s + r.totalReclamacao, 0) : null
      const procedentes = linhas.length ? linhas.reduce((s, r) => s + r.procedentes, 0) : null
      assert.equal(resumo.total, total)
      assert.equal(resumo.procedentes, procedentes)
      assert.equal(resumo.taxa, total > 0 ? procedentes / total * 100 : null)
      const grupos = new Map()
      for (const r of linhas) grupos.set(r.instituicao, (grupos.get(r.instituicao) ?? 0) + r.totalReclamacao)
      const esperado = [...grupos].map(([instituicao, total]) => ({ instituicao, total }))
        .sort((a, b) => b.total - a.total || a.instituicao.localeCompare(b.instituicao, 'pt-BR')).slice(0, 10)
      assert.deepEqual(rankingInstituicoes(filtrados, ano).instituicoes, esperado)
      const serie = reclamacoesPorTrimestre(filtrados, ano)
      if (linhas.length) {
        assert.equal(serie.reduce((s, r) => s + (r.total ?? 0), 0), total)
        assert.equal(serie.reduce((s, r) => s + (r.procedentes ?? 0), 0), procedentes)
      } else assert.deepEqual(serie, [])
    }
  }
})

test('variação usa trimestres comuns da mesma instituição, preservando o ano anterior', () => {
  for (const nome of ['', 'BRADESCO (conglomerado)', 'NU PAGAMENTOS (conglomerado)']) {
    const filtrados = filtrarInstituicao(dados, nome)
    for (const ano of anos.filter(a => a !== 'todos')) {
      const atuais = filtrados.filter(r => r.ano === ano)
      const anteriores = filtrados.filter(r => r.ano === ano - 1)
      const comuns = [...new Set(atuais.map(r => r.trimestre))].filter(t => anteriores.some(r => r.trimestre === t))
      const soma = linhas => linhas.filter(r => comuns.includes(r.trimestre)).reduce((s, r) => s + r.procedentes, 0)
      const esperado = comuns.length && soma(anteriores) > 0 ? (soma(atuais) / soma(anteriores) - 1) * 100 : null
      assert.equal(indicadores(filtrados, ano).variacao, esperado)
    }
  }
  assert.deepEqual(indicadores(dados, 2026).comuns, [1, 2])
  assert.deepEqual(indicadores(dados, 2023).comuns, [1, 3, 4])
  assert.equal(indicadores(dados, 'todos').variacao, null)
})

test('nomes diferentes não são unidos; troca de ano sem registros não resulta em zero', () => {
  const fixture = [{ ...base, instituicao: 'Banco A', ano: 2025 }, { ...base, instituicao: 'BANCO A', ano: 2025 }]
  assert.equal(filtrarInstituicao(fixture, 'Banco A').length, 1)
  const vazio = indicadores(filtrarInstituicao(fixture, 'Banco A'), 2026)
  for (const campo of ['total', 'procedentes', 'taxa', 'variacao']) assert.equal(vazio[campo], null)
  assert.match(vazio.motivo, /Não há registros/)
})

test('valores ausentes e base zero produzem N/D; zero real é preservado', () => {
  const fixture = [{ ...base, ano: 2025, procedentes: 0, totalReclamacao: 0 }, { ...base, ano: 2026, procedentes: null, totalReclamacao: 10 }]
  assert.equal(somar(fixture, 'procedentes'), null)
  assert.equal(indicadores(fixture, 2025).total, 0)
  assert.equal(indicadores(fixture, 2025).taxa, null)
  assert.equal(indicadores(fixture, 2026).variacao, null)
  assert.equal(rankingInstituicoes([{ ...base, totalReclamacao: null }], 'todos').incompletas, 1)
  assert.equal(reclamacoesPorTrimestre(fixture, 2026)[0].procedentes, null)
})

test('lacunas cronológicas não são preenchidas com valores artificiais', () => {
  const serie = reclamacoesPorTrimestre(dados, 'todos')
  assert.equal(serie.length, 38)
  assert.equal(serie[0].periodo, '2017 · 1º tri')
  assert.equal(serie.at(-1).periodo, '2026 · 2º tri')
  const lacuna = serie.find(r => r.periodo === '2022 · 2º tri')
  assert.equal(lacuna.total, null)
  assert.equal(lacuna.procedentes, null)
})

test('CSV inválido, duplicado ou inconsistente gera erro', () => {
  assert.throws(() => lerCsv('a,b\n1,2'), /colunas esperadas/)
  assert.throws(() => lerCsv(csv.replace('2017,1º', '2017,5º')), /Identificação inválida/)
  assert.throws(() => lerCsv(csv + '\n' + csv.split('\n')[1]), /duplicado/)
  assert.throws(() => lerCsv(csv.replace(',0,7,15653,', ',8,7,15653,')), /excedem/)
})
