import { A_high, A_mid, A_low, A_haiku_high, A_opus_low } from './single.mjs';
import { A_low_loop } from './loop.mjs';
import { B_vote3, B_vote5 } from './vote.mjs';
import { B_pipeline } from './pipeline.mjs';
import { C_elastic } from './elastic.mjs';
import { C_decompose } from './decompose.mjs';
import { S_threshold, S_stigmergy, S_quorum } from './bio.mjs';
export const ARCHS = {
  'A-high': A_high, 'A-opus-low': A_opus_low, 'A-haiku-high': A_haiku_high, 'A-mid': A_mid, 'A-low': A_low, 'A-low-loop': A_low_loop,
  'B-vote3': B_vote3, 'B-vote5': B_vote5, 'B-pipeline': B_pipeline,
  'C-elastic': C_elastic, 'C-decompose': C_decompose,
  // budget-matched comparison (≤5 haiku/low calls): non-bio A-low-loop5 / B-vote5 vs bioinspired S-*
  'A-low-loop5': (ctx) => A_low_loop(ctx, { maxRounds: 5 }),
  'S-threshold': S_threshold, 'S-stigmergy': S_stigmergy, 'S-quorum': S_quorum,
};
