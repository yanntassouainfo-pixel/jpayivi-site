/* Curseur "pastille SHOW REEEL" qui suit la souris — HOME + desktop uniquement */
(function () {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  // La pastille n'existe que sur la page d'accueil
  if (!document.body.classList.contains('home-page')) return;

  var el = document.querySelector('.pastille-cursor');
  if (!el) return;

  document.documentElement.classList.add('has-pastille');

  var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  var x = tx, y = ty, shown = false;

  // Zones où l'on rétablit le curseur normal (menus, images+catégories, contacts)
  var NORMAL = '.nav, .grid, .contact';

  window.addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; el.style.opacity = '1'; }
  });
  document.addEventListener('mouseleave', function () {
    el.style.opacity = '0'; shown = false;
  });

  window.addEventListener('mouseover', function (e) {
    // hors de .home = cadre gris autour -> curseur normal, pastille cachée
    if (e.target.closest(NORMAL) || !e.target.closest('.home')) {
      el.classList.add('over-menu');       // curseur normal, pastille cachée
      el.classList.remove('is-link');
    } else if (e.target.closest('a, button')) {
      el.classList.remove('over-menu');
      el.classList.add('is-link');
    } else {
      el.classList.remove('over-menu');
      el.classList.remove('is-link');
    }
  });
  window.addEventListener('mouseout', function (e) {
    if (e.target.closest(NORMAL) || !e.target.closest('.home')) el.classList.remove('over-menu');
    if (e.target.closest('a, button')) el.classList.remove('is-link');
  });

  (function loop() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%, -50%)';
    requestAnimationFrame(loop);
  })();
})();

/* ============================================================
   Modale Showreel — un clic sur l'accueil (hors liens/menus/images/vidéos)
   ouvre le showreel dans une fenêtre. Fermeture : croix, clic dehors, Échap.
   ============================================================ */
(function () {
  if (!document.body.classList.contains('home-page')) return;
  var modal = document.getElementById('reelModal');
  if (!modal) return;
  var vid = modal.querySelector('video');
  var closeBtn = modal.querySelector('.reel-close');

  function openReel() {
    modal.classList.add('open');
    document.body.classList.add('reel-open');   /* rétablit le curseur dans la fenêtre */
    modal.setAttribute('aria-hidden', 'false');
    if (vid) { try { vid.currentTime = 0; } catch (e) {} var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
  }
  function closeReel() {
    modal.classList.remove('open');
    document.body.classList.remove('reel-open');
    modal.setAttribute('aria-hidden', 'true');
    if (vid) vid.pause();
  }

  document.addEventListener('click', function (e) {
    if (modal.classList.contains('open')) return;
    if (e.target.closest('.reel-modal')) return;
    // on ignore tout élément interactif / média / menus / contacts
    if (e.target.closest('a, button, input, textarea, select, video, img, .nav, .grid, .contact, .pastille-cursor')) return;
    // uniquement dans la zone d'accueil (comme la pastille)
    if (!e.target.closest('.home')) return;
    openReel();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeReel);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeReel(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeReel(); });
})();

/* ============================================================
   Gestion des vidéos (pages intérieures)
   - une seule vidéo à la fois (la précédente s'arrête)
   - pause automatique quand la vidéo sort du champ / passe sous le menu
   ============================================================ */
(function () {
  // Une seule vidéo en lecture : quand une démarre, on met les autres en pause
  document.addEventListener('play', function (e) {
    if (!e.target || e.target.tagName !== 'VIDEO') return;
    if (e.target.hasAttribute('loop')) return;              // gif en boucle : ne coupe pas les autres
    var all = document.querySelectorAll('video');
    for (var i = 0; i < all.length; i++) {
      if (all[i] !== e.target && !all[i].hasAttribute('loop')) all[i].pause();
    }
  }, true);

  // Hors champ : pause. Les gifs (loop) reprennent quand ils reviennent en vue.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.intersectionRatio === 0) { if (!en.target.paused) en.target.pause(); }   // pause seulement hors champ complet
        else if (en.target.hasAttribute('loop')) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); }
      });
    }, { threshold: [0, 0.01] });
    document.querySelectorAll('video').forEach(function (v) { io.observe(v); });
  }
})();

/* ============================================================
   Menu mobile "+Menu" (accueil) : ouvre/ferme la liste en plein écran
   ============================================================ */
(function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;
  function closeMenu() {
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.textContent = '+Menu';
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    document.body.classList.toggle('nav-open', open);
    toggle.textContent = open ? '+Fermer' : '+Menu';
  });
  var links = nav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) links[i].addEventListener('click', closeMenu);
})();

/* Bouton play custom : clic sur la vidéo = lecture/pause, la pastille s'efface pendant la lecture */
(function () {
  var vids = document.querySelectorAll('.reel-media > video:not([loop]), .rs-media > video:not([loop])');
  for (var i = 0; i < vids.length; i++) {
    (function (v) {
      var box = v.parentNode;
      box.classList.add('has-play');
      function sync() { box.classList.toggle('is-playing', !v.paused && !v.ended); }
      v.addEventListener('play', sync);
      v.addEventListener('playing', sync);
      v.addEventListener('pause', sync);
      v.addEventListener('ended', sync);
      box.addEventListener('click', function () {
        if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); }
      });
    })(vids[i]);
  }
})();

/* ============================================================
   Logo : « Créateur d'images » justifié sur la largeur de « JP AYIVI »
   (interlettrage calculé, recalculé au redimensionnement / chargement des polices)
   ============================================================ */
(function () {
  function fitBrand() {
    var brands = document.querySelectorAll('.brand');
    for (var i = 0; i < brands.length; i++) {
      var name = brands[i].querySelector('.name');
      var sub = brands[i].querySelector('.sub');
      if (!name || !sub) continue;
      var chars = (sub.textContent || '').length;
      if (chars < 2) continue;
      sub.style.letterSpacing = 'normal';
      sub.style.marginRight = '';
      var nameW = name.getBoundingClientRect().width;
      var subW = sub.getBoundingClientRect().width;
      if (!nameW || !subW) continue;
      var ls = (nameW - subW) / chars;          /* chaque caractère porte l'écart */
      sub.style.letterSpacing = ls + 'px';
      sub.style.marginRight = (-ls) + 'px';     /* neutralise l'écart après le dernier caractère */
    }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBrand);
  window.addEventListener('load', fitBrand);
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fitBrand, 120); });
  fitBrand();
})();
