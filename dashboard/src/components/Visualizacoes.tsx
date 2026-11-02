import { EvolucaoHistorica } from './EvolucaoHistorica'
import { RankingInstituicoes } from './RankingInstituicoes'
import { ReclamacoesTrimestrais } from './ReclamacoesTrimestrais'
import type { AnoSelecionado, Reclamacao } from '../lib/reclamacoes'

export default function Visualizacoes({ dados, dadosInstituicao, ano, instituicao }: {
  dados: Reclamacao[]
  dadosInstituicao: Reclamacao[]
  ano: AnoSelecionado
  instituicao: string
}) {
  return <>
    <EvolucaoHistorica dados={dados} />
    <RankingInstituicoes dados={dadosInstituicao} ano={ano} instituicao={instituicao} />
    <ReclamacoesTrimestrais dados={dadosInstituicao} ano={ano} instituicao={instituicao} />
  </>
}
