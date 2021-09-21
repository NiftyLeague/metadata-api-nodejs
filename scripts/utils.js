function alignOutput(labelValuePairs) {
  const maxLabelLength = labelValuePairs
    .map(([l]) => l.length)
    .reduce((len, max) => (len > max ? len : max));
  // eslint-disable-next-line no-restricted-syntax
  for (const [label, value] of labelValuePairs) {
    console.log(label.padEnd(maxLabelLength + 1), value);
  }
}

module.exports = { alignOutput };
