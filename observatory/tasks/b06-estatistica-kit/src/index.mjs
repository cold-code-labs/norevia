/**
 * Descriptive statistics kit.
 */
import { mean, median, mode, variance, stddev } from './central.mjs';
import { percentile, quantiles, iqr, fiveNumberSummary } from './percentile.mjs';
import { histogram, cumulative } from './histogram.mjs';

export { mean, median, mode, variance, stddev, percentile, quantiles, iqr, fiveNumberSummary, histogram, cumulative };

/**
 * describe(xs, { bins }) → summary used by the reports: n, mean, population
 * standard deviation, five-number summary and histogram with `bins` buckets.
 */
export function describe(xs, { bins = 5 } = {}) {
  return {
    n: xs.length,
    mean: mean(xs),
    stddev: stddev(xs),
    ...fiveNumberSummary(xs),
    histogram: histogram(xs, { bins }),
  };
}
