import type { GameAction, GameState } from '../../shared/types/game.ts'
export interface StageProps { state: GameState; send: (action: GameAction) => void }
export function Data({ value }: { value: unknown }) { return <pre>{JSON.stringify(value, null, 2)}</pre> }
export function Issues({ title, items }: { title: string; items: readonly { explanation: string }[] }) {
  return <section><h3>{title}</h3>{items.length ? <ul>{items.map((item, i) => <li key={i}>{item.explanation}</li>)}</ul> : <p>None.</p>}</section>
}

