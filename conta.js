(() => {
'use strict';
const screen = document.body.dataset.screen;
if (screen === 'login') {
 const status = document.querySelector('#auth-status');
 const unavailable = name => { status.textContent = `${name}: integração ainda não configurada. Nenhum dado foi enviado.`; };
 document.querySelectorAll('[data-auth]').forEach(b => b.addEventListener('click', () => unavailable(b.dataset.auth)));
 document.querySelector('#login').addEventListener('submit', e => { e.preventDefault(); unavailable('Login por e-mail'); });
 document.querySelector('#toggle-password').addEventListener('click', e => {
  const field = document.querySelector('#password'), show = field.type === 'password';
  field.type = show ? 'text' : 'password'; e.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar';
  e.currentTarget.setAttribute('aria-pressed', String(show)); e.currentTarget.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
 });
 return;
}
// This is a public design preview, never an authentication or entitlement mechanism.
if (new URLSearchParams(location.search).get('preview') !== '1') {
 location.replace('../../entrar/'); return;
}
const toggle = document.querySelector('#sidebar-toggle'), sidebar = document.querySelector('#account-sidebar');
const mobile = matchMedia('(max-width:760px)');
const sync = () => { sidebar.inert = mobile.matches && !sidebar.classList.contains('is-open'); };
const close = () => { sidebar.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); sync(); };
mobile.addEventListener('change', close); sync();
toggle.addEventListener('click', () => {
 const open = !sidebar.classList.contains('is-open'); sidebar.classList.toggle('is-open',open);
 toggle.setAttribute('aria-expanded',String(open)); sync(); if(open) sidebar.querySelector('a').focus();
});
document.addEventListener('keydown', e => { if(e.key==='Escape' && sidebar.classList.contains('is-open')){close();toggle.focus();} if(e.key==='Tab' && mobile.matches && sidebar.classList.contains('is-open')){ const links = [...sidebar.querySelectorAll('a')]; if(e.shiftKey && document.activeElement===links[0]){e.preventDefault();links[links.length-1].focus();} else if(!e.shiftKey && document.activeElement===links[links.length-1]){e.preventDefault();links[0].focus();} } });
document.addEventListener('click', e => { if(!sidebar.contains(e.target)&&!toggle.contains(e.target)) close(); });
const offer = document.querySelector('#offer-dialog');
if(offer){document.querySelector('#offer-preview').addEventListener('click',()=>offer.showModal());offer.querySelectorAll('.dialog-close').forEach(b=>b.addEventListener('click',()=>offer.close()));}
})();
