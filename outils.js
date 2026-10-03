/* StartupScan — outils.html : point mort et grille de fiche. */
(function () {
  const $ = id => document.getElementById(id);
  const fmt = n => n.toLocaleString('fr-BE', { maximumFractionDigits: 2 });

  function calc() {
    const fixed = +$('be-fixed').value || 0, price = +$('be-price').value || 0,
          cost = +$('be-cost').value || 0, days = Math.max(1, +$('be-days').value || 1);
    const margin = price - cost;
    $('be-margin').textContent = fmt(margin) + ' €';
    if (margin <= 0) { $('be-sales').textContent = '∞'; $('be-daily').textContent = '∞'; return; }
    const sales = Math.ceil(fixed / margin);
    $('be-sales').textContent = fmt(sales);
    $('be-daily').textContent = fmt(Math.ceil(sales / days));
  }
  ['be-fixed', 'be-price', 'be-cost', 'be-days'].forEach(id => $(id).addEventListener('input', calc));
  calc();

  const fields = ['mf-name', 'mf-place', 'mf-model', 'mf-desc', 'mf-flow', 'mf-facts', 'mf-moat'];
  try {
    const saved = JSON.parse(localStorage.getItem('ss-myfiche') || '{}');
    fields.forEach(f => { if (saved[f]) $(f).value = saved[f]; });
  } catch (e) {}
  fields.forEach(f => $(f).addEventListener('input', () => {
    try { const o = {}; fields.forEach(k => o[k] = $(k).value); localStorage.setItem('ss-myfiche', JSON.stringify(o)); } catch (e) {}
  }));
  $('mf-copy').addEventListener('click', async () => {
    const t = `${$('mf-name').value}\n${$('mf-place').value} · ${$('mf-model').value}\n\n${$('mf-desc').value}\n\nFlux d'argent : ${$('mf-flow').value}\n\nFaits chiffrés : ${$('mf-facts').value}\n\nDifficile à copier : ${$('mf-moat').value}\n\n— Fiche rédigée avec la grille StartupScan (startupscan.eu)`;
    try { await navigator.clipboard.writeText(t); $('mf-status').textContent = 'Copié dans le presse-papiers.'; }
    catch (e) { $('mf-status').textContent = 'Sélectionnez et copiez le texte manuellement.'; }
  });
})();
