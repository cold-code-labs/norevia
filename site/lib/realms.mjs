// Norevia — "Unseen · Seen · Beyond": the landing page's map of nature by what the naked eye can reach.
//   unseen — below the naked eye (cells, microbes, molecules)
//   seen   — everything the eye can follow on Earth (organisms, colonies, ecosystems)
//   beyond — off-planet and out of sight; physical dynamics only, always presented as analogy
// Each entry: [name, what nature does, what it suggests for agents, status]. Status:
//   'nat-…'            an archive card (linked; its evidence level lives on the card)
//   { pub, url }       a published result checked when this was written, not yet an archive card
//   null               candidate — sources being added to the archive (Norevia Library)
// Reviewed against the cards by Norevia Library (2026-11-08): every entry now has a card.
// Copy stays at the level of well-established mechanism; numbers and claims beyond that belong on the cards.

export const REALMS = [
  {
    key: 'unseen', n: '01', name: 'Unseen', scale: 'Below the naked eye',
    lead: 'Cells, microbes and molecules coordinate without a nervous system. Chemistry is their language; thresholds are their decisions.',
    items: [
      ['Quorum sensing', 'Bacteria release signal molecules; once density crosses a threshold, the whole population switches behaviour at once.', 'Mobilise only when enough evidence has accumulated.', 'nat-bacterial-quorum-sensing'],
      ['Clonal expansion', 'Immune cells multiply massively against an infection; most die once it clears and a small memory pool stays.', 'Expand for the task, contract after, keep only what is worth remembering.', 'nat-clonal-expansion-contraction'],
      ['Inflammation that resolves', 'Healing ends through an active stop programme, not by simply fading out.', 'Repair with a built-in stopping point.', 'nat-wound-healing-resolution'],
      ['Danger signals', 'A proposed model of immunity driven by signals of damage rather than by novelty.', 'React to harm, not to every change.', 'nat-danger-theory'],
      ['Sparse neurons', 'Every spike is costly, so only a small fraction of neurons can be highly active at once.', 'Keep most agents quiet; activity is the expensive part.', 'nat-brain-energy-sparse'],
      ['Neutrophil swarming', 'Immune cells amplify a damage signal by releasing it themselves, widening the recruitment zone — then desensitise and stop.', 'Recruit by relay, not by broadcast — and build in the stop.', 'nat-neutrophil-swarming'],
      ['Social amoebae', 'Starving Dictyostelium cells signal with pulses of cAMP and aggregate into a single body — which can harbour cheaters.', 'Temporary collectives need cheater control.', 'nat-dictyostelium-aggregation'],
      ['Hunting bacteria', 'Myxococcus xanthus feeds and preys in groups, on resources no single cell can break down alone.', 'Many small agents for a task no single one can finish.', 'nat-myxococcus-group-predation'],
      ['Run and tumble', 'E. coli keeps swimming while the attractant rises and tumbles otherwise, comparing only the last few seconds.', 'Search with a tiny memory and a local gradient.', 'nat-ecoli-run-and-tumble'],
      ['Dynamic instability', 'Microtubules coexist as growing and shrinking populations that occasionally switch, keeping the cell’s skeleton provisional.', 'Capacity that is cheap to build and cheap to drop.', 'nat-microtubule-dynamic-instability'],
    ],
  },
  {
    key: 'seen', n: '02', name: 'Seen', scale: 'What the eye can follow',
    lead: 'Insects, birds, fish, plants — even a single-celled slime mould big enough to hold. Here the collective behaviour is visible, measurable and experimentally tested.',
    items: [
      ['Stigmergy', 'Termites and ants coordinate through the state of the work left by others, not through messages.', 'Shared artefacts instead of chatter.', 'nat-stigmergy'],
      ['Evaporating trails', 'Trails reinforced by use and erased by evaporation find short paths without freezing on the first one.', 'Memory that decays unless it keeps being useful.', 'nat-pheromone-evaporation-aco'],
      ['Response thresholds', 'Each worker takes up a task only when its stimulus crosses a personal threshold.', 'Gradual recruitment proportional to demand.', 'nat-response-threshold'],
      ['Waggle dance', 'Bees dance longer for better sources, so recruitment scales with quality.', 'Advertise in proportion to verified quality.', 'nat-waggle-dance-recruitment'],
      ['Quorum, not consensus', 'Scouts commit once enough bees gather at one site; stop signals break ties between rivals.', 'Decide by local quorum; inhibit deadlocks.', 'nat-quorum-nest-bees'],
      ['Foraging by interaction rate', 'Harvester ants leave to forage based on how often foragers return with food.', 'Regulate effort from the rate of recent success.', 'nat-interaction-rate-foraging'],
      ['Idle reserve', 'Inactive ants quickly replace workers that are removed.', 'Keep a reserve — idleness is capacity.', 'nat-inactive-reserve'],
      ['Seven neighbours', 'Each starling follows six or seven neighbours, not the whole flock.', 'Bounded attention, collective motion.', 'nat-topological-neighbors'],
      ['The informed few', 'Moving groups follow a small informed minority without anyone knowing who knows.', 'A few informed agents can steer many.', 'nat-informed-leaders'],
      ['Physarum networks', 'A slime mould links food sources with tubes that thicken with flow and shrink without it.', 'Reinforce what carries flow; prune what does not.', 'nat-physarum-network'],
      ['Reflex tiers', 'The arm corrects perturbations in three tiers — spinal, transcortical, voluntary.', 'Answer fast and cheap first; escalate only when needed.', 'nat-reflex-vs-cortex'],
      ['Living bridges', 'Army ants build bridges out of their own bodies and shift them when they cost more workers than they save.', 'Build structure only while it pays.', 'nat-army-ant-living-bridges'],
      ['Marching locusts', 'Over a narrow range of density, scattered locust nymphs switch to aligned marching.', 'Watch for density-driven phase changes.', 'nat-locust-marching-transition'],
      ['Firefly synchrony', 'Some fireflies flash in unison with no leader — and synchrony makes the signal easier to read.', 'A shared rhythm without a central clock.', 'nat-firefly-synchrony'],
      ['V formation', 'Birds in V formation save energy and share the costly leading position, matching time in front with time behind.', 'Rotate the expensive role.', 'nat-v-formation-flight'],
      ['Penguin huddles', 'Emperor penguins move in small waves through the huddle, so each bird spends time inside, not only on the cold edge.', 'Rotate exposure to load.', 'nat-penguin-huddle'],
      ['Root foraging', 'Roots that meet a nutrient-rich patch often proliferate inside it.', 'Invest where the signal is.', 'nat-root-foraging'],
      ['Predator–prey cycles', 'Coupled populations rise and fall in cycles that emerge from the coupling itself.', 'Elastic capacity driven by feedback.', 'nat-predator-prey-cycles'],
    ],
    teams: { title: 'Teams, not swarms', text: 'Wolves and dolphins hunt in small groups. Some dolphin groups keep stable roles; wolf hunting success levels off beyond about four hunters. Not swarms — our counter-model for when a small team beats a crowd.', card: 'nat-teams-not-swarms' },
  },
  {
    key: 'beyond', n: '03', name: 'Beyond', scale: 'Off-planet and out of sight',
    lead: 'No agents and no intent — only dynamics. Every entry here is a physical analogy for stability, capacity and cascades, never evidence about agents.',
    items: [
      ['Orbital resonance', 'The same period ratio binds planets into stable chains and clears gaps in the asteroid belt.', 'The same coupling can stabilise or deplete.', 'nat-orbital-resonance'],
      ['Lagrange points', 'Some equilibria hold only under strict asymmetry; others need constant correction.', 'Know which balances need maintenance.', 'nat-lagrange-points'],
      ['Stellar thermostat', 'Self-gravitating systems heat up as they lose energy — stabilising in a star, runaway in dense clusters.', 'The feedback that saves one system can wreck another.', 'nat-stellar-thermostat'],
      ['Kessler cascade', 'Above a critical density in orbit, collisions create debris faster than it clears.', 'Cap density before failures feed themselves.', 'nat-kessler-cascade'],
      ['The cosmic web', 'A Physarum-inspired algorithm reconstructed the filaments between ~37,000 galaxies; hydrogen absorption seen by Hubble rises with the density it reconstructed.', 'One network logic, from a slime mould to the cosmos.', 'nat-cosmic-web-physarum'],
      ['Shepherd moons', 'Small moons confine planetary rings into narrow bands against their natural spreading.', 'A few light agents can keep a crowd in shape.', 'nat-shepherd-moons'],
      ['Protoplanetary discs', 'Dust grows by local collisions; the jump to planetesimals needs dense clumps that collapse under their own gravity.', 'Local aggregation, then a collective step change.', 'nat-accretion-planetesimals'],
      ['Dissolving clusters', 'Star clusters dissolve over time — faster in denser regions of their galaxy.', 'Even structures in the sky have a Dissolve stage.', 'nat-open-cluster-dissolution'],
      ['Satellite constellations', 'A large constellation reports tens of thousands of onboard collision-avoidance manoeuvres — engineered, not natural.', 'Autonomous avoidance at planetary scale.', 'nat-satellite-constellation-avoidance'],
    ],
  },
];

// Rules that cross realms: the same mechanism at three scales (the argument behind a general theory).
export const CROSSINGS = [
  ['Threshold → collective switch', ['Quorum sensing', 'unseen'], ['Nest-site quorum', 'seen'], ['Kessler critical density', 'beyond']],
  ['Reinforce with use, decay without', ['Clonal expansion & contraction', 'unseen'], ['Physarum & evaporating trails', 'seen'], ['The cosmic web, traced by a Physarum model', 'beyond']],
  ['Few steer many', ['Neutrophil relay', 'unseen'], ['The informed few', 'seen'], ['Shepherd moons', 'beyond']],
];
