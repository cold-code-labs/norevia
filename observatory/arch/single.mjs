// A-*: one single agent, one call, no test execution in the loop.
export const make = (model, effort) => async (ctx) => {
  const { files } = await ctx.solve({ model, effort });
  return { files };
};
export const A_high = make('opus', 'high');
export const A_mid = make('sonnet', 'medium');
export const A_low = make('haiku', 'low');
// complementary model × effort grid (maps "reasoning effort as a resource")
export const A_haiku_high = make('haiku', 'high');
export const A_opus_low = make('opus', 'low');
