// Transcribed from the supplied GDD v2.0 Part 2 feedback blocks. E review remains required.
export interface FeedbackCopy { readonly chosen?: string; readonly changed?: string; readonly why?: string; readonly next?: string; readonly summary?: string }
export const feedbackCopy: Readonly<Record<string, FeedbackCopy>> = {
  "fb_cargo_shield": {
    "chosen": "Shield Panels",
    "changed": "Shielding +20. Battery -15.",
    "why": "The panels are thick and heavy. Heavy cargo means less room for batteries.",
    "next": "Shielding helps when storms come. Will your battery be enough for repairs?"
  },
  "fb_cargo_parts": {
    "chosen": "Spare Parts Kit",
    "changed": "Repairs cost 5 less battery. Food -10.",
    "why": "Tools and parts take up the space food would use.",
    "next": "You will have less food. The greenhouse may matter more."
  },
  "fb_cargo_drill": {
    "chosen": "Ice Drill Kit",
    "changed": "ICEBOUND evidence +1. Water -10.",
    "why": "Drill pipes are heavy, so some water stayed on Earth.",
    "next": "Water must last 10 sols. Be careful with the greenhouse."
  },
  "fb_cruise_wait": {
    "chosen": "Wait for Earth",
    "changed": "Water -5. Earth advice learned: the Sol 4 life-support repair costs 5 less battery.",
    "why": "Earth took time to reply because of distance. The coolant ran while the crew waited.",
    "next": "Sometimes waiting is wise. Sometimes it costs time you do not have."
  },
  "fb_cruise_fix": {
    "chosen": "Fix it now",
    "changed": "Battery -8 (or -3 with Spare Parts Kit). Pump healthy.",
    "why": "The crew had the skills to decide alone. Tools and parts change how much power a repair needs.",
    "next": "Local decisions save time, but you carry the risk yourself."
  },
  "fb_cruise_safe": {
    "chosen": "Safe Mode",
    "changed": "Battery +5. The life-support pump is now \"worn\".",
    "why": "Systems that run stressed wear out faster. Turning things down saves energy but does not fix the problem.",
    "next": "A problem you do not fix can come back bigger."
  },
  "fb_landing_safe": {
    "chosen": "Redwall Basin (safe zone)",
    "changed": "Shielding +10. Later ICEBOUND trips cost more.",
    "why": "Crater walls block some dust and rays, but the ice is farther away, so trips use more battery or oxygen.",
    "next": "Safe is not free. Plan your ICEBOUND trip carefully."
  },
  "fb_landing_resource": {
    "chosen": "Frost Plain (resource zone)",
    "changed": "Water +20. ICEBOUND evidence +1. Shielding -10.",
    "why": "Ice is nearby and water is easy to reach, but open ground has little natural cover.",
    "next": "Protection will matter more. Keep the habitat powered."
  },
  "fb_reinforce_array": {
    "chosen": "Reinforce the Solar Array",
    "changed": "Array reinforced. Battery -5. 1 action used.",
    "why": "Stronger hinge pins can handle wind and dust.",
    "next": "Preventing a problem costs a little now, but may save you more later."
  },
  "fb_grid_repair": {
    "chosen": "Repair the array",
    "changed": "Array repaired. Power budget back to 100. Battery -{repairCost}. 1 action used.",
    "why": "Mending the hinge and panels lets the array collect full sunlight again.",
    "next": "More power helps every system. Which job will you save the action for tomorrow?"
  },
  "fb_grid_conserve": {
    "chosen": "Conserve energy",
    "changed": "Budget stays 70. No action and no battery used. Array stays damaged.",
    "why": "A damaged array catches less sunlight, so there is less energy to share.",
    "next": "Open the Power Plan and decide what to turn down. You can still repair it later."
  },
  "fb_grid_prevented": {
    "chosen": "Reinforcing the array on Sol 1",
    "changed": "No damage. Power budget stays 100. Event resolved automatically.",
    "why": "Stronger hinges kept the array working when wind and dust hit.",
    "next": "Prevention used an action early. It saved one now."
  },
  "fb_recon_done": {
    "chosen": "Survey the site with Scout",
    "changed": "Recon complete. Evidence +1. Battery -5. 1 action used.",
    "why": "Scout used radar and cameras to look for a bright, smooth layer under the dust.",
    "next": "Next, choose how to collect a sample. You will plan that on Sol 5."
  },
  "fb_ls_repair": {
    "chosen": "Repair the valve",
    "changed": "Life-support efficiency restored to 100%. Battery -{lsRepairCost}. 1 action used.",
    "why": "A fixed valve lets the air machine make all the oxygen the crew uses.",
    "next": "Oxygen is steady again. Check water and food for the next challenge."
  },
  "fb_ls_reroute": {
    "chosen": "Reroute resources",
    "changed": "Efficiency 80%. Greenhouse offline for 2 sols. Water -5. 1 action used.",
    "why": "Backup lines help the air machine but use water meant for the greenhouse.",
    "next": "Oxygen still drops a little. A full repair may still be needed."
  },
  "fb_ls_conserve": {
    "chosen": "Conserve",
    "changed": "Oxygen use is 6 per sol for 3 sols. Max 1 action per sol for 3 sols. Valve still broken.",
    "why": "Moving slowly makes the crew breathe less air, but also gets less work done.",
    "next": "You have fewer actions for ICEBOUND. Is a repair worth an action?"
  },
  "fb_assign_rover": {
    "chosen": "Rover only",
    "changed": "Plan set: Rover. 1 action used. Costs will be paid on sampling day.",
    "why": "Scout does not risk the crew, but its drill reaches only shallow layers.",
    "next": "You will keep oxygen and health. Is the evidence enough?"
  },
  "fb_assign_astronaut": {
    "chosen": "Astronaut only",
    "changed": "Plan set: Astronaut. 1 action used. Costs paid on sampling day.",
    "why": "A person can drill deeper and choose a better place, but spends oxygen and faces more risk.",
    "next": "Oxygen and crew health will matter. Protect them."
  },
  "fb_assign_combined": {
    "chosen": "Combined",
    "changed": "Plan set: Combined. Both actions used today. Costs paid on sampling day.",
    "why": "Working together gives the best science, but needs more planning and more of each resource.",
    "next": "You will need battery, oxygen and health at the same time. Keep them up."
  },
  "fb_storm_shelter_planned": {
    "chosen": "Shelter (expedition on hold)",
    "changed": "Exposure LOW. Battery -5. 1 action used. Field work paused today. No health loss.",
    "why": "Staying inside the habitat and shielding keeps the crew away from storm exposure. Pausing work costs time.",
    "next": "Sampling can happen tomorrow. You have 1 fewer action to use today."
  },
  "fb_storm_shelter_unplanned": {
    "chosen": "Shelter (no trip planned)",
    "changed": "Exposure LOW. Battery -5. 1 action used. No health loss.",
    "why": "Staying inside keeps the crew safe from storm exposure.",
    "next": "Plan ICEBOUND soon. Time is running out."
  },
  "fb_storm_continue_rover": {
    "chosen": "Continue with Rover",
    "changed": "Sample collected today. Battery: rover cost plus -10 for dust. Exposure HIGH, but no crew outside.",
    "why": "Scout works in the storm so no person is outside. Dust and cold use extra battery.",
    "next": "The sample is ready for the lab. Check the battery before tomorrow."
  },
  "fb_storm_continue_astronaut": {
    "chosen": "Continue with Astronaut",
    "changed": "Sample collected today. Oxygen -10 (or -13). Crew health -{healthLoss}. Exposure HIGH.",
    "why": "The astronaut worked outside during illustrative storm exposure. Better protection means less health loss.",
    "next": "Check crew health. Protect the crew tomorrow."
  },
  "fb_storm_continue_combined": {
    "chosen": "Continue with Combined",
    "changed": "Sample collected today. Costs of Combined. Crew health -{healthLoss}. Exposure HIGH.",
    "why": "Scout and a person worked together. The crew member spent less time outside, so health loss is smaller.",
    "next": "The team got the best sample. Watch battery, oxygen and health."
  },
  "fb_storm_continue_chores": {
    "chosen": "Continue with outdoor chores",
    "changed": "Battery +8. Crew health -{healthLoss}. Exposure HIGH.",
    "why": "Clean panels collect more sunlight, but the crew was outside in the storm.",
    "next": "A bigger reserve helps, but health matters too."
  },
  "fb_sample_rover": {
    "chosen": "Collect the sample with Rover",
    "changed": "Sample collected. Battery -{cost} (15, or 20 in safe zone). 1 action used.",
    "why": "Scout drilled a shallow hole and brought back dusty ice-rich soil. It cannot dig deep.",
    "next": "Lab power matters now. Make sure the lab has 15 or more."
  },
  "fb_sample_astronaut": {
    "chosen": "Collect the sample with an Astronaut",
    "changed": "Sample collected. Oxygen -{cost} (10, or 13 in safe zone). Health -5. 1 action used.",
    "why": "An astronaut can drill deeper and choose a better place, but spends air and faces field risk.",
    "next": "Check oxygen and crew health before the next big job."
  },
  "fb_sample_combined": {
    "chosen": "Collect the sample with Combined",
    "changed": "Sample collected. Battery -{cost1}, Oxygen -{cost2}, Health -3. 1 action used.",
    "why": "Scout and the astronaut worked together to get the best sample.",
    "next": "Give the lab good power for the best result."
  },
  "fb_result_positive": {
    "chosen": "Analyze the sample",
    "changed": "Result: POSITIVE. Evidence {evidence} of 5 or more. 1 action (or 2).",
    "why": "Your recon, your method and your lab power added up to strong evidence.",
    "next": "Positive results lead to new questions. How much ice? How deep?"
  },
  "fb_result_inconclusive": {
    "chosen": "Analyze the sample",
    "changed": "Result: INCONCLUSIVE. Evidence {evidence}. Not enough to be sure.",
    "why": "The sample shows some clues, but not enough for a clear answer.",
    "next": "A second run on Sol 9 adds 1 evidence if the lab has full power."
  },
  "fb_result_negative": {
    "chosen": "Analyze the sample",
    "changed": "Result: NEGATIVE. Evidence {evidence}. No ice found in this sample.",
    "why": "The sample showed no ice. Shallow or quick sampling can miss it.",
    "next": "A negative result still counts. What would you change next time?"
  },
  "fb_rerun_converted": {
    "chosen": "Re-run the analysis",
    "changed": "Evidence {evidence}. Result changed to POSITIVE. Battery -5. 1 action used.",
    "why": "A second run with full lab power added one more piece of evidence.",
    "next": "Extra checks can turn a maybe into a yes. Not every result changes."
  },
  "fb_rerun_still": {
    "chosen": "Re-run the analysis",
    "changed": "Evidence {evidence}. Result is still INCONCLUSIVE. Battery -5. 1 action used.",
    "why": "A second run helped, but the evidence is still short of 5.",
    "next": "Next time you could use a better method or more lab power."
  },
  "fb_sweep": {
    "chosen": "Maintenance sweep",
    "changed": "Shielding +5. Battery -5. 1 action used.",
    "why": "Sealing cracks and cleaning panels gives a little more protection.",
    "next": "Small upgrades add up. Protection is part of the return check."
  },
  "fb_ret_c1_fail": {
    "summary": "Someone is not well, or a supply is empty. The crew needs more care before travel."
  },
  "fb_ret_c2_fail": {
    "summary": "One supply is low: {lowResource}. The trip home needs enough in reserve."
  },
  "fb_ret_c3_fail": {
    "summary": "The battery is low. The ship needs energy to leave."
  },
  "fb_ret_c4_fail": {
    "summary": "Protection is low. The crew could face more risk on the way home."
  },
  "fb_ret_c5_fail": {
    "summary": "{brokenSystems} is still broken. It can be fixed with an action next time."
  },
  "fb_ret_c6_fail": {
    "summary": "We did not finish ICEBOUND. Next time, plan sampling earlier."
  },
  "fb_go_oxygen": {
    "summary": "The air ran out of reserve. The crew calls an emergency return and everyone is safe. Oxygen is the one thing we cannot go without. Next time, protect the air first."
  },
  "fb_go_water": {
    "summary": "The water ran out. The crew calls for help and returns safely. The greenhouse and recycling use water, so plan it carefully."
  },
  "fb_go_food": {
    "summary": "The food ran out. The crew returns early and safe. The greenhouse makes food over time, so start it early."
  },
  "fb_go_health": {
    "summary": "The crew was too tired and unwell to continue. They return safely for rest and care. Protection and supplies keep people healthy."
  },
  "fb_message_saved": {
    "chosen": "Your message",
    "changed": "Saved to your Mission Patch.",
    "why": "Explorers share what they learn.",
    "next": "The next crew will read your note."
  }
}
