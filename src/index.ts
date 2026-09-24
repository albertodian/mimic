export interface MimicSuite {
  url: string;
  variables?: Record<string, string | undefined>;
  tests: string[];
}

export function defineSuite(suite: MimicSuite) {
  return suite;
}
