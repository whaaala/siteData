const synonyms = {
    quick: "fast",
    brown: "dark",
    fox: "animal",
    jumps: "leaps",
    over: "above",
    lazy: "idle",
    dog: "canine"
};

function rewriteDocument(text) {
    return text
        .split(' ')
        .map(word => synonyms[word.toLowerCase()] || word)
        .join(' ');
}

// Example usage:
const original = "The quick brown fox jumps over the lazy dog.";
const rewritten = rewriteDocument(original);
console.log("Original:", original);
console.log("Rewritten:", rewritten);

module.exports = rewriteDocument;