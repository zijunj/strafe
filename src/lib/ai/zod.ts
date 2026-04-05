// Next bundles a compiled Zod runtime, which we can use here without adding a
// separate installed package during local development.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const zodRuntime = require("next/dist/compiled/zod");

export const z = (zodRuntime.z ?? zodRuntime.default ?? zodRuntime) as any;
