/* Public widget only. Google secret is stored exclusively in Brevo. */
(() => {
  const form = document.querySelector('#newsletter-form');
  if (!form) return;
  const box = document.querySelector('#newsletter-captcha-widget');
  const note = document.querySelector('#newsletter-captcha-note');
  const response = document.createElement('input');
  response.type = 'hidden';
  response.name = 'g-recaptcha-response';
  form.append(response);
  const copy = {fr:'Veuillez valider la vérification antirobot. Si elle ne se charge pas, actualisez la page.',en:'Please complete the anti-bot check. If it does not load, refresh the page.',es:'Completa la verificación antirrobot. Si no carga, actualiza la página.',de:'Bitte bestätigen Sie die Sicherheitsprüfung. Falls sie nicht lädt, aktualisieren Sie die Seite.',it:'Completa la verifica antirobot. Se non si carica, aggiorna la pagina.',pt:'Conclua a verificação antirrobô. Se não carregar, atualize a página.',ja:'ロボットではないことを確認してください。表示されない場合はページを再読み込みしてください。',ko:'자동 입력 방지 확인을 완료해 주세요. 로드되지 않으면 페이지를 새로고침해 주세요.',zh:'请完成人机验证。如果未加载，请刷新页面。'};
  let widget, loading = false, requested = false;
  const dialog = form.closest("dialog");
  let challengeTimeout;
  function execute() {
    if (!requested || widget === undefined) return;
    // Google appends its interactive challenge to the document outside native modal dialogs.
    if (dialog.matches(":modal")) {
      dialog.close();
      dialog.show();
      dialog.classList.add("captcha-active");
    }
    challengeTimeout = setTimeout(() => { restore(); reset(); message(); }, 120000);
    window.grecaptcha.execute(widget);
  }
  function restore() {
    clearTimeout(challengeTimeout);
    requested = false;
    if (!dialog.classList.contains("captcha-active")) return;
    dialog.classList.remove("captcha-active");
    if (dialog.open) {
      dialog.close();
      dialog.showModal();
    }
  }
  const message = () => { note.textContent = copy[document.documentElement.lang] || copy.fr; };
  const reset = () => { response.value = ''; if (widget !== undefined) window.grecaptcha.reset(widget); };
  window.LEVCHIN_CAPTCHA = {reset, token: () => response.value};
  window.levchinCaptchaReady = () => {
    widget = window.grecaptcha.render(box, {
      sitekey: window.LEVCHIN_CONFIG.newsletterCaptchaSiteKey,
      theme: 'dark', size: 'invisible', badge: 'bottomright',
      callback: token => {
        restore();
        if (!dialog.open) { reset(); return; }
        response.value = token;
        note.textContent = '';
        form.requestSubmit();
      },
      'expired-callback': () => { restore(); response.value = ''; message(); },
      'error-callback': () => { restore(); response.value = ''; message(); }
    });
    execute();
  };
  const load = () => {
    if (loading) return;
    loading = true;
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=levchinCaptchaReady&render=explicit&hl=' + encodeURIComponent(document.documentElement.lang || 'fr');
    script.async = true; script.defer = true; script.onerror = () => { loading = false; restore(); message(); script.remove(); };
    document.head.append(script);
  };
  form.addEventListener('focusin', load, {once:true});
  document.querySelector('#newsletter-consent').addEventListener('change', load, {once:true});
  form.addEventListener('submit', event => {
    if (!response.value) { event.preventDefault(); event.stopImmediatePropagation(); if (requested) return; requested = true; load(); execute(); }
  }, true);
  dialog.addEventListener('close', () => { if (!dialog.open) { restore(); reset(); } });
  document.addEventListener('levchin:languagechange', () => { if (note.textContent) message(); });
})();
