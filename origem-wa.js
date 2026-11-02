// Origem → CTAs WhatsApp de /servicos/. Só anexa UTM filtrada ao texto; sem UTM válida o href fica intacto. Arquivo externo porque a CSP só aceita script-src self. Não grava nem envia nada.
// ponytail: filtro barra e-mail, URL e 9+ dígitos; nome escrito em utm com hífen passa. Valor é rejeitado, nunca limpo, para não transformar e-mail em texto.
(()=>{
  const q = new URLSearchParams(location.search);
  const o = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .map(p => (q.get(p) || '').trim().toLowerCase())
    .filter(v => /^[a-z0-9][a-z0-9_-]{0,59}$/.test(v) && !/(\d[-_]?){9}/.test(v));
  while (o.join(' / ').length > 120) o.pop();
  if (!o.length) return;
  const sufixo = encodeURIComponent('\n\nOrigem: ' + o.join(' / '));
  document.querySelectorAll('a[href^="https://wa.me/"][href*="?text="]').forEach(a => a.setAttribute('href', a.getAttribute('href') + sufixo));
})();
