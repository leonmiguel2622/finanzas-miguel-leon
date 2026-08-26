// consent.js - Banner cookies + modal términos (sin JS inline)
document.addEventListener('DOMContentLoaded', ()=>{
  const banner = document.getElementById('cookie-banner');
  const modal = document.getElementById('terms-modal');
  const btnAccept = document.getElementById('cookie-accept');
  const btnDecline = document.getElementById('cookie-decline');
  const btnOpenTerms = document.getElementById('open-terms');
  const btnCloseModal = document.getElementById('close-terms');
  const btnCloseIcon = document.getElementById('close-terms-icon');
  const btnModalDecline = document.getElementById('modal-decline');
  const btnModalAccept = document.getElementById('modal-accept');
  const termsCheck = document.getElementById('terms-check');

  const CONSENT_KEY = 'cookie_consent'; // cookie

  function hasConsent(){
    return (typeof getCookie==='function' ? getCookie(CONSENT_KEY) : null) === 'true';
  }

  // Banner visible por defecto (sin hidden). Ocultar solo si ya hay consentimiento.
  if(banner && hasConsent()){
    banner.classList.add('hidden');
  }

  function acceptConsent(){
    if(typeof setCookie==='function') setCookie(CONSENT_KEY, 'true', 365);
    if(banner) banner.classList.add('hidden');
    if(termsCheck) termsCheck.checked = true;
  }
  function declineConsent(){
    // Mantener banner oculto solo sesión, no guarda cookie
    if(banner) banner.classList.add('hidden');
  }

  if(btnAccept) btnAccept.addEventListener('click', acceptConsent);
  if(btnDecline) btnDecline.addEventListener('click', declineConsent);
  if(btnModalAccept) btnModalAccept.addEventListener('click', ()=>{ acceptConsent(); closeModal(); });
  if(btnModalDecline) btnModalDecline.addEventListener('click', ()=>{ declineConsent(); closeModal(); });

  function openModal(){
    if(modal) modal.classList.add('open');
    document.body.style.overflow='hidden';
  }
  function closeModal(){
    if(modal) modal.classList.remove('open');
    document.body.style.overflow='';
  }

  if(btnOpenTerms) btnOpenTerms.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });
  // También link en register
  const termsLink = document.getElementById('terms-link');
  if(termsLink) termsLink.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });

  if(btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if(btnCloseIcon) btnCloseIcon.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal && modal.classList.contains('open')) closeModal(); });
});
