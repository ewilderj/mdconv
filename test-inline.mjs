// Test inline formatting directly
const text = "This is a regular sentence. *Bold text*. /Italic text/.";

function escapeHtml(t) {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let result = escapeHtml(text);
console.log("After escape:", result);

// Bold: *text* - the current regex
result = result.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<strong>$1</strong>');
console.log("After bold:", result);

// Italic: /text/
result = result.replace(/\/([^/\n]+)\//g, '<em>$1</em>');
console.log("After italic:", result);
