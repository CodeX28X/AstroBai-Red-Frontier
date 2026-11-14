import { useGame } from '../../../shared/store/useGame.ts'
import { iceboundMapCommand, selectIceboundExploration } from './iceboundExploration.ts'

export function useIceboundExploration() {
  const { state, dispatch } = useGame()
  return {
    ...selectIceboundExploration(state),
    feedback: state.feedback,
    selectSite: (siteId: string) => dispatch(iceboundMapCommand(state, siteId)),
    reconnoitre: () => dispatch(iceboundMapCommand(state)),
  }
}

