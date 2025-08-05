/**
 * Hash a password using SHA-256 before storing
 * This will replace plain-text passwords in future steps
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
// Example: Show install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("pwa-install-container").classList.remove("hidden");
});

document.getElementById("pwa-install-btn").addEventListener("click", () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  }
});

// Placeholder functions
function startAssessment(type) {
  alert(`Starting assessment: ${type}`);
}

function generateInterventionPlan() {
  alert("Generating intervention plan...");
}
