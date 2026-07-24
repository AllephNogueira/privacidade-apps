/**
 * Busca na lista de apps e realce leve de âncoras.
 */
(function initPrivacidadeSite() {
  const input = document.getElementById("busca");
  const cards = Array.from(document.querySelectorAll(".app-card"));
  if (input && cards.length) {
    input.addEventListener("input", function onSearch() {
      const q = String(input.value || "")
        .trim()
        .toLowerCase();
      cards.forEach(function (card) {
        const name = String(card.getAttribute("data-name") || "").toLowerCase();
        const pkg = String(card.getAttribute("data-pkg") || "").toLowerCase();
        const hit = !q || name.includes(q) || pkg.includes(q);
        card.classList.toggle("is-hidden", !hit);
      });
    });
  }
})();
