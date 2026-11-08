// Norevia — "Unseen · Seen · Beyond": the landing page's map of nature by what the naked eye can reach.
//   unseen — below the naked eye (cells, microbes, molecules)
//   seen   — everything the eye can follow on Earth (organisms, colonies, ecosystems)
//   beyond — off-planet and out of sight; physical dynamics only, always presented as analogy
// Each entry: [name, what nature does, what it suggests for agents, status]. Status:
//   'nat-…'            an archive card (linked; its evidence level lives on the card)
//   { pub, url }       a published result checked when this was written, not yet an archive card
//   null               candidate — sources being added to the archive (Norevia Library)
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
      ['Neutrophil swarming', 'Immune cells relay a chemical signal from cell to cell and converge on a wound.', 'Recruit by relay, not by broadcast.', null],
      ['Social amoebae', 'Starving Dictyostelium cells aggregate through waves of cAMP into a single body — and have to contain cheaters.', 'Temporary collectives need cheater control.', null],
      ['Hunting bacteria', 'Myxococcus xanthus moves and preys in groups — the "wolf pack" of microbes.', 'Many small agents for a task no single one can finish.', null],
      ['Run and tumble', 'E. coli swims straight while conditions improve and tumbles to a new direction when they do not, with a memory of seconds.', 'Search with a tiny memory and a local gradient.', null],
      ['Dynamic instability', 'Microtubules constantly grow and collapse, keeping the cell’s skeleton provisional.', 'Capacity that is cheap to build and cheap to drop.', null],
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
      ['Living bridges', 'Army ants build bridges out of their own bodies and shift them when they cost more workers than they save.', 'Build structure only while it pays.', { pub: 'Reid et al., PNAS 2015', url: 'https://www.princeton.edu/news/2015/11/30/ants-build-living-bridges-their-bodies-speak-volumes-about-group-intelligence' }],
      ['Marching locusts', 'Above a critical density, scattered locust nymphs suddenly march in order.', 'Watch for density-driven phase changes.', { pub: 'Buhl et al., Science 2006', url: 'https://doi.org/10.1126/science.1125142' }],
      ['Firefly synchrony', 'Some fireflies flash in unison with no conductor.', 'A shared rhythm without a central clock.', null],
      ['V formation', 'Migrating birds share the cost of flight and take turns at the front.', 'Rotate the expensive role.', null],
      ['Penguin huddles', 'Emperor penguins keep shifting, so no one stays on the cold edge for long.', 'Rotate exposure to load.', null],
      ['Root foraging', 'Roots proliferate where they find nutrients and stop growing where they do not.', 'Invest where the signal is.', null],
      ['Predator–prey cycles', 'Coupled populations rise and fall in cycles with no regulator.', 'Elastic capacity driven by feedback.', null],
    ],
    teams: { title: 'Teams, not swarms', text: 'Wolf packs, lion prides and dolphin pods hunt with few members, roles and individual recognition. They are not swarms — they are our counter-model for when a small team with roles beats a crowd.' },
  },
  {
    key: 'beyond', n: '03', name: 'Beyond', scale: 'Off-planet and out of sight',
    lead: 'No agents and no intent — only dynamics. Every entry here is a physical analogy for stability, capacity and cascades, never evidence about agents.',
    items: [
      ['Orbital resonance', 'The same period ratio binds planets into stable chains and clears gaps in the asteroid belt.', 'The same coupling can stabilise or deplete.', 'nat-orbital-resonance'],
      ['Lagrange points', 'Some equilibria hold only under strict asymmetry; others need constant correction.', 'Know which balances need maintenance.', 'nat-lagrange-points'],
      ['Stellar thermostat', 'Self-gravitating systems heat up as they lose energy — stabilising in a star, runaway in dense clusters.', 'The feedback that saves one system can wreck another.', 'nat-stellar-thermostat'],
      ['Kessler cascade', 'Above a critical density in orbit, collisions create debris faster than it clears.', 'Cap density before failures feed themselves.', 'nat-kessler-cascade'],
      ['The cosmic web', 'A Physarum-inspired algorithm traced filaments between ~37,000 galaxies; Hubble data then found gas where it predicted.', 'One network logic, from a slime mould to the cosmos.', { pub: 'Burchett et al., ApJL 2020', url: 'https://esahubble.org/news/heic2003/' }],
      ['Shepherd moons', 'Small moons confine planetary rings into narrow bands.', 'A few light agents can keep a crowd in shape.', null],
      ['Accretion discs', 'Dust and gas clump into planets through countless local collisions.', 'Large structure from local aggregation.', null],
      ['Dissolving clusters', 'Open star clusters drift apart over time.', 'Even structures in the sky have a Dissolve stage.', null],
      ['Satellite constellations', 'Large constellations manoeuvre to avoid collisions — the only real swarm in the sky, and we built it.', 'Engineered autonomy at planetary scale.', null],
    ],
  },
];

// Rules that cross realms: the same mechanism at three scales (the argument behind a general theory).
export const CROSSINGS = [
  ['Threshold → collective switch', ['Quorum sensing', 'unseen'], ['Nest-site quorum', 'seen'], ['Kessler critical density', 'beyond']],
  ['Reinforce with use, decay without', ['Clonal expansion & contraction', 'unseen'], ['Physarum & evaporating trails', 'seen'], ['The cosmic web, traced by a Physarum model', 'beyond']],
  ['Few steer many', ['Neutrophil relay', 'unseen'], ['The informed few', 'seen'], ['Shepherd moons', 'beyond']],
];
