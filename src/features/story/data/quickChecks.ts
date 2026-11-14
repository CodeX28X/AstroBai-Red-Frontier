// GDD Part2B V. Answers are presentation-only, not scored or shared.
export const quickChecks = [
  {question:'Why did the astronauts need power?',answers:['To run air, heat and the lab.','Only for the lights.','Only to charge the rover.'],reason:'Power runs the air machine, the shelter, the greenhouse and the lab.'},
  {question:'Why look for ice on Mars?',answers:['It could give future crews water.','It would warm Mars.','It is easy to cook with.'],reason:'Water is needed to drink and to grow plants.'},
  {question:'What happens in a solar storm?',answers:['The Sun sends bursts of energy and fast particles.','Mars freezes at once.','It rains on Mars.'],reason:'Crews need protection from those bursts.'},
  {question:'What do scientists do if the answer is “not sure”?',answers:['Collect more clues.','Give up.','Just guess.'],reason:'More clues make an answer stronger.'},
] as const
export const recapLogs = [
  {event:'We landed and kept the lights on. {gridLine}',learned:'A Mars outpost needs power, air, water and food.'},
  {event:'We found a bright clue and made a plan.',learned:'Water ice could help future crews live on Mars.'},
  {event:'We faced a solar storm. {stormLine}',learned:'The Sun can send bursts of energy. Shelter and shielding protect a crew.'},
  {event:'We tested the sample. {resultLine}',learned:'Scientists collect clues called evidence. Any answer teaches us something.'},
  {event:'We checked the outpost and finished the mission.',learned:'Every choice has a trade-off. Plan for tomorrow too.'},
] as const
