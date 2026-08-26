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
   Rythme vertical des maquettes : la galerie démarre juste sous
   la ligne « About » du menu (bas du menu + 1,19 % de la largeur).
   Sur les pages avec titre, on déduit la hauteur du titre pour que
   les IMAGES tombent elles aussi au niveau de « About ».
   ============================================================ */
(function () {
  var header = document.querySelector('.site-header');
  var wrap = document.querySelector('.gallery-wrap');
  if (!header || !wrap) return;
  if (getComputedStyle(header).position !== 'fixed') return;

  function place() {
    var nav = header.querySelector('nav');
    var brand = header.querySelector('.brand');
    if (!nav) return;
    var bottom = nav.getBoundingClientRect().bottom;          /* barre fixe : constant au scroll */
    if (brand) bottom = Math.max(bottom, brand.getBoundingClientRect().bottom);

    /* Maquette : la galerie commence à 8,880 % de la largeur de la page (456 px sur 5135).
       Sur un écran étroit, le menu — maintenu à une taille lisible — descend plus bas que
       ça : on prend alors le bas du menu + une petite marge, pour ne jamais le recouvrir.
       Au-delà d'environ 1750 px, c'est la valeur de la maquette qui s'applique telle quelle. */
    var maquette = window.innerWidth * 0.0888;
    var top = Math.max(maquette, bottom + 6);

    var title = wrap.querySelector('.page-title');
    if (title) {
      var cs = getComputedStyle(title);
      top -= title.offsetHeight + (parseFloat(cs.marginBottom) || 0);
    }
    document.documentElement.style.setProperty('--gallery-top', Math.max(24, Math.round(top)) + 'px');
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  window.addEventListener('load', place);
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(place, 120); });
  place();
  requestAnimationFrame(place);
})();

/* ============================================================
   Logo + menu : ils s'estompent quand une image ou une vidéo
   passe derrière eux (pages intérieures, barre fixe).
   ============================================================ */
(function () {
  var header = document.querySelector('.site-header');
  if (!header || getComputedStyle(header).position !== 'fixed') return;
  var brand = header.querySelector('.brand');
  var nav = header.querySelector('nav');
  var medias = document.querySelectorAll('.gallery-wrap img, .gallery-wrap video');
  if (!medias.length) return;

  function hits(zone) {
    if (!zone) return false;
    var z = zone.getBoundingClientRect();
    if (z.width === 0) return false;
    for (var i = 0; i < medias.length; i++) {
      var m = medias[i].getBoundingClientRect();
      if (m.bottom < 0 || m.top > window.innerHeight) continue;   /* hors écran */
      if (m.top < z.bottom && m.bottom > z.top &&
          m.left < z.right && m.right > z.left) return true;
    }
    return false;
  }

  var busy = false;
  function update() {
    busy = false;
    header.classList.toggle('brand-dim', hits(brand));
    header.classList.toggle('nav-dim', hits(nav));
  }
  function onScroll() {
    if (busy) return;
    busy = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  update();
})();

/* ============================================================
   Logo : « Créateur d'images » justifié sur la largeur de « JP AYIVI »
   (interlettrage calculé, recalculé au redimensionnement / chargement des polices)
   ============================================================ */
(function () {
  /* Largeur du TEXTE (et non du bloc qui le contient) : indispensable, car .name
     est un bloc qui s'etire a la largeur du plus large des deux elements. */
  function textWidth(el) {
    if (!el.firstChild) return 0;
    try {
      var r = document.createRange();
      r.selectNodeContents(el);
      var w = r.getBoundingClientRect().width;
      r.detach && r.detach();
      return w;
    } catch (e) {
      return el.getBoundingClientRect().width;
    }
  }

  function fitBrand() {
    var brands = document.querySelectorAll('.brand');
    for (var i = 0; i < brands.length; i++) {
      var name = brands[i].querySelector('.name');
      var sub = brands[i].querySelector('.sub');
      if (!name || !sub) continue;
      var chars = (sub.textContent || '').length;
      if (chars < 2) continue;

      /* largeur reelle du texte « JP AYIVI », espacement final deduit */
      var nameLS = parseFloat(getComputedStyle(name).letterSpacing);
      if (isNaN(nameLS)) nameLS = 0;
      var target = textWidth(name) - nameLS;

      /* largeur naturelle du sous-titre, interlettrage neutralise */
      sub.style.letterSpacing = 'normal';
      sub.style.marginRight = '';
      var natural = textWidth(sub);
      if (target <= 0 || natural <= 0) continue;

      /* l'ecart se repartit sur les n-1 intervalles visibles */
      var ls = (target - natural) / (chars - 1);
      sub.style.letterSpacing = ls + 'px';
      sub.style.marginRight = (-ls) + 'px';   /* annule l'espacement apres la derniere lettre */

      markLogoR(sub);
    }
  }

  /* Position horizontale du « r » final de « Créateu-r » : sert de bord gauche
     a la galerie Reseaux Sociaux (retrait identique a droite). */
  function markLogoR(sub) {
    var txt = sub.textContent || '';
    var i = txt.indexOf(' ');                 /* fin du mot « Créateur » */
    if (i < 1) i = 8;
    var node = sub.firstChild;
    if (!node || node.nodeType !== 3) return;
    try {
      var r = document.createRange();
      r.setStart(node, 0);
      r.setEnd(node, i - 1);                  /* jusqu'au debut du « r » final */
      var w = r.getBoundingClientRect().width;
      r.detach && r.detach();
      var left = sub.getBoundingClientRect().left + w;
      if (left > 0) {
        document.documentElement.style.setProperty('--logo-r', Math.round(left) + 'px');
      }
    } catch (e) {}
  }

  /* On recalcule a chaque etape ou la police peut changer (evite le decalage
     entre la police de secours et Jumper une fois chargee). */
  function schedule() {
    fitBrand();
    requestAnimationFrame(fitBrand);
  }

  if (document.fonts) {
    /* on attend explicitement les deux graisses utilisees par le logo */
    var wanted = ['900 40px Jumper', '300 20px Jumper'];
    for (var k = 0; k < wanted.length; k++) {
      try { document.fonts.load(wanted[k]).then(schedule); } catch (e) {}
    }
    if (document.fonts.ready) document.fonts.ready.then(schedule);
    if (document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', schedule);
    }
  }
  window.addEventListener('load', schedule);
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t); t = setTimeout(fitBrand, 120);
  });
  schedule();
})();
