// Small, dependency-free TF-IDF scorer for live sitter profiles.
function tokenize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];
}

function buildTextScores(sitters, query) {
  const queryTokens = tokenize(query).filter((token) => token.length > 1);
  if (!queryTokens.length) return new Map();

  const documents = sitters.map((sitter) => tokenize([
    sitter.name, sitter.adresse, sitter.experience, sitter.certif, sitter.availability,
  ].join(" ")).filter((token) => token.length > 1));
  const docFrequency = new Map();
  documents.forEach((tokens) => {
    for (const term of new Set(tokens)) docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
  });
  const idf = (term) => Math.log(1 + documents.length / (1 + (docFrequency.get(term) || 0)));
  const vector = (tokens) => {
    const counts = new Map();
    tokens.forEach((term) => counts.set(term, (counts.get(term) || 0) + 1));
    const result = new Map();
    for (const [term, count] of counts) result.set(term, (1 + Math.log(count)) * idf(term));
    return result;
  };
  const queryVector = vector(queryTokens);
  const magnitude = (v) => Math.sqrt([...v.values()].reduce((sum, weight) => sum + weight * weight, 0));
  const queryMagnitude = magnitude(queryVector);
  return new Map(sitters.map((sitter, index) => {
    const profileVector = vector(documents[index]);
    const dot = [...queryVector].reduce((sum, [term, weight]) => sum + weight * (profileVector.get(term) || 0), 0);
    const profileMagnitude = magnitude(profileVector);
    const cosine = queryMagnitude && profileMagnitude ? dot / (queryMagnitude * profileMagnitude) : 0;
    return [String(sitter._id), cosine];
  }));
}

function calculateRecommendationScore({ query, textMatchScore, trustScore }) {
  return Math.round(String(query || "").trim() ? textMatchScore * 40 + trustScore * 0.6 : trustScore);
}

module.exports = { tokenize, buildTextScores, calculateRecommendationScore };
