import './app.css'

const collaborators = [
  { name: 'A', areas: 'Story, dashboard, power puzzle presentation' },
  { name: 'B', areas: 'Mars map, art, interactions' },
  { name: 'C', areas: 'Simulation, centralized store, resources' },
  { name: 'D', areas: 'Missions, events, objective progression, NASA data' },
  { name: 'E', areas: 'Scientific research, content review, QA, documentation' },
]

export default function App() {
  return (
    <main className="setup-screen">
      <p className="eyebrow">AstroBai · Red Frontier</p>
      <h1>Mission control is getting ready.</h1>
      <p className="intro">
        The project scaffold is in place. The team can now build the Mars mission
        simulator one feature at a time.
      </p>
      <section aria-labelledby="team-heading" className="team-card">
        <h2 id="team-heading">Five collaborators, clear ownership</h2>
        <ul>
          {collaborators.map(({ name, areas }) => (
            <li key={name}>
              <span className="team-label">{name}</span>
              <span>{areas}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="status">Setup phase · Gameplay not implemented</p>
    </main>
  )
}
