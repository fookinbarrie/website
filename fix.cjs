const fs = require('fs');
const content = fs.readFileSync('src/PasswordPage.jsx', 'utf-8');

// Find the first export default PasswordPage;
const marker = 'export default PasswordPage;';
let idx = content.indexOf(marker);

if (idx !== -1) {
  // Keep everything up to the marker + its length + newlines
  const endIdx = idx + marker.length;
  // Let's add the closing newline if possible, but slicing at endIdx is enough
  const newContent = content.slice(0, endIdx) + '\n';
  fs.writeFileSync('src/PasswordPage.jsx', newContent, 'utf-8');
  console.log("Fixed. Sliced file at index", endIdx, "Original length was", content.length);
} else {
  console.log("Marker not found!");
}
