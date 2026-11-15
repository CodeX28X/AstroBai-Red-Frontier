import type { IceboundReadiness } from '../../missions/types/icebound'
import { weatherResults } from '../data/weatherResults'
import { WEATHER_SOURCES, WEATHER_SOURCE_CHECKED } from '../../../data/nasa/weatherContext'

export function WeatherResults({readiness}:{readiness?:Pick<IceboundReadiness,'weather'|'radiation'>}){
  const result=weatherResults(readiness)
  return <section className="weather-results" aria-label="Weather and space-weather briefing"><h3>Before we go outside</h3><p className="data-mode">Game scenario · no live weather measurements</p><p>{result.live}</p><div className="weather-cards">{(['surface','space'] as const).map(kind=>{const item=result[kind];return <article key={kind}><h4>{kind==='surface'?'Mars route weather':'Space Weather Advisory'}</h4><strong>{item.status}</strong><dl><dt>What we know</dt><dd>{item.observed}</dd><dt>What it means</dt><dd>{item.meaning}</dd><dt>Consider next</dt><dd>{item.next}</dd></dl></article>})}</div><p>Earth-orbit space-weather observations are not measurements of radiation on the Martian surface.</p><details><summary>NASA references and data status</summary><p>General science references checked {WEATHER_SOURCE_CHECKED}. No archived measurement or observation date is being presented.</p>{WEATHER_SOURCES.map(source=><p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></p>)}</details></section>
}
