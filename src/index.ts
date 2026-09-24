export interface MimicSuite {
  url: string;
  devServer?: {
    command: string;
    url?: string;
  };
  variables?: Record<string, string | undefined>;
  tests: string[];
}

export function defineSuite(suite: MimicSuite) {
  return suite;
}
