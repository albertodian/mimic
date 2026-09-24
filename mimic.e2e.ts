import { defineSuite } from "./src/index.js";

export default defineSuite({
  url: "http://localhost:3000",
  variables: { city: "Verona" },
  tests: [
    'Search for {{city}} and finish when "Results for {{city}}" appears.',
  ],
});
