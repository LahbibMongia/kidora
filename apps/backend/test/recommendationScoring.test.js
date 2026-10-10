const test = require("node:test");
const assert = require("node:assert/strict");
const { tokenize, buildTextScores, calculateRecommendationScore } = require("../services/recommendationScoring");

test("tokenize normalizes accents and case while retaining French words", () => {
  assert.deepEqual(tokenize("Éveil musical À Tunis"), ["eveil", "musical", "a", "tunis"]);
});

test("profile scoring ranks matching skills above unrelated profiles", () => {
  const sitters = [
    { _id: "music", experience: "Éveil musical et guitare" },
    { _id: "sports", experience: "Football et activités sportives" },
  ];
  const scores = buildTextScores(sitters, "eveil musical");

  assert.ok(scores.get("music") > scores.get("sports"));
  assert.ok(scores.get("music") > 0);
  assert.equal(scores.get("sports"), 0);
});

test("profile scoring includes location and certifications", () => {
  const sitters = [
    { _id: "a", adresse: "La Marsa", certif: "premiers secours" },
    { _id: "b", adresse: "Tunis", certif: "" },
  ];
  const scores = buildTextScores(sitters, "La Marsa premiers secours");

  assert.ok(scores.get("a") > scores.get("b"));
});

test("empty queries return no text scores", () => {
  assert.equal(buildTextScores([{ _id: "a", experience: "baby sitter" }], "  ").size, 0);
});

test("ranking blends text relevance with trust signals and preserves default ranking", () => {
  assert.equal(calculateRecommendationScore({ query: "guitar", textMatchScore: 1, trustScore: 50 }), 70);
  assert.equal(calculateRecommendationScore({ query: "", textMatchScore: 1, trustScore: 50 }), 50);
});
