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
    /* Tablette et téléphone : un appui n'ouvre plus la vidéo (retour cliente).
       Sur ordinateur la pastille « SHOW REEEL » suit la souris et annonce
       l'interaction ; au doigt rien ne la signale, et le moindre appui de côté
       déclenchait une lecture. */
    if (window.innerWidth <= 950) return;
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

/* ============================================================
   MOBILE — en-tête escamotable.
   On descend : la barre s'efface. On remonte : elle revient.
   Uniquement sous 600 px ; au-dessus la barre reste toujours visible.
   ============================================================ */
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var SEUIL_ACTIF = 600;   /* même point de rupture que le CSS */
  var DECLENCHE   = 8;     /* mouvement minimal pris en compte, en px */
  var GARDE       = 90;    /* on ne cache jamais dans les tout premiers pixels */

  var dernier = window.pageYOffset || 0;
  var enCours = false;

  function majuscule() {
    enCours = false;
    if (window.innerWidth > SEUIL_ACTIF) {         /* bureau et tablette : rien */
      header.classList.remove('est-cache');
      dernier = window.pageYOffset || 0;
      return;
    }
    if (document.body.classList.contains('nav-open')) return;   /* menu déployé */

    var y = window.pageYOffset || 0;
    var delta = y - dernier;
    if (Math.abs(delta) < DECLENCHE) return;

    if (delta > 0 && y > GARDE) header.classList.add('est-cache');
    else if (delta < 0)         header.classList.remove('est-cache');
    dernier = y;
  }

  function auScroll() {
    if (enCours) return;
    enCours = true;
    requestAnimationFrame(majuscule);
  }

  window.addEventListener('scroll', auScroll, { passive: true });
  window.addEventListener('resize', function () {
    if (window.innerWidth > SEUIL_ACTIF) header.classList.remove('est-cache');
  });
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
  /* La barre doit être détachée du flux pour que ce calcul ait un sens.
     Elle est 'fixed' sur toutes les tailles d'écran depuis que le mobile a lui
     aussi un en-tête escamotable ; on accepte 'absolute' par sécurité. */
  var pos = getComputedStyle(header).position;
  if (pos !== 'fixed' && pos !== 'absolute') return;

  /* ---- Dégagement sous « +About », en fraction de la hauteur de fenêtre ----
     Le menu ayant grandi de 30 %, il descendait à 6 px seulement du haut de la
     galerie : beaucoup trop serré (retour client). On garantit désormais un
     dégagement proportionnel sous le bas du menu, sur TOUTES les pages à galerie
     — Sport, Food, Fashion, Motion, Événement, Communication, Réseaux Sociaux,
     Studio et Showreel. Validé sur Sport puis généralisé.
     L'accueil et About n'ont pas de .gallery-wrap : ce bloc entier les ignore
     (voir la sortie anticipée en tête de fonction), leur mise en page est
     calée séparément.
     POUR AJUSTER : une seule valeur, ci-dessous. */
  var DEGAGEMENT = 0.05;                    /* 5 % de la hauteur de fenêtre */

  function degagement() {
    return window.innerHeight * DEGAGEMENT;
  }

  function place() {
    var nav = header.querySelector('nav');
    var brand = header.querySelector('.brand');
    var bouton = header.querySelector('.menu-toggle');
    if (!nav) return;
    /* Mesure par offsetHeight et NON par getBoundingClientRect : la barre mobile
       est escamotable, un rect la donnerait hors écran quand elle est cachée.
       offsetHeight ignore les transformations et vaut 0 pour un élément masqué —
       ce qui est exactement le comportement voulu quand le menu est replié
       derrière le bouton « +Menu ». */
    var hautHeader = parseFloat(getComputedStyle(header).paddingTop) || 0;
    var bottom = hautHeader + Math.max(
      nav.offsetHeight,
      brand ? brand.offsetHeight : 0,
      bouton ? bouton.offsetHeight : 0
    );

    /* Maquette : la galerie commence à 8,880 % de la largeur de la page (456 px sur 5135).
       Sur un écran étroit, le menu — maintenu à une taille lisible — descend plus bas que
       ça : on prend alors le bas du menu + le dégagement, pour ne jamais le recouvrir.
       Le dégagement s'applique TOUJOURS sous le menu, y compris quand la valeur de la
       maquette est la plus grande : c'est lui qui fixe la distance sous « +About ». */
    var maquette = window.innerWidth * 0.0888;
    var top = Math.max(maquette, bottom) + degagement();

    var title = wrap.querySelector('.page-title');
    if (title) {
      var cs = getComputedStyle(title);
      top -= title.offsetHeight + (parseFloat(cs.marginBottom) || 0);
    }
    document.documentElement.style.setProperty('--gallery-top', Math.max(24, Math.round(top)) + 'px');
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  window.addEventListener('load', place);
  /* Recalcul IMMÉDIAT, cadence sur le rafraîchissement de l'écran. L'ancien
     réglage attendait 120 ms d'immobilité : la mise en page ne suivait pas le
     bord de la fenêtre et se remettait en place d'un coup, ce que la cliente
     voyait comme un saut. Ces mesures sont légères, les enchaîner ne coûte rien. */
  var enAttente = false;
  window.addEventListener('resize', function () {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(function () { enAttente = false; place(); });
  });
  place();
  requestAnimationFrame(place);
})();

/* ============================================================
   ACCUEIL — équilibre vertical de la maquette.
   Sur site_ordi_1.png, l'espace libre entre les trois blocs se
   répartit ainsi : 39,65 % au-dessus du bloc « JP AYIVI » et
   60,35 % en dessous (270 px et 411 px sur 2281 px de panneau).
   On applique ce même partage quelle que soit la fenêtre : le bloc
   titre reste à sa place relative et ne peut plus toucher la rangée
   d'images, même sur un écran beaucoup plus large que la maquette.
   ============================================================ */
(function () {
  var home = document.querySelector('.home');
  if (!home) return;
  var top = home.querySelector('.home-top');
  var hero = home.querySelector('.hero-wrap');
  var grid = home.querySelector('.grid');
  if (!top || !hero || !grid) return;

  var PART_HAUT = 0.3965;   /* 270 / (270 + 411) sur la maquette */

  /* ---- TÉLÉPHONE : trois espaces égaux ----
     Le client demande un écart identique entre le logo, le paragraphe, la ligne
     des métiers et les cartes — quatre éléments, donc trois espaces. Ils ne
     peuvent pas s'écrire en CSS : leur valeur dépend de la hauteur réellement
     occupée par les blocs, qui varie avec l'appareil. On la calcule ici et on la
     publie dans --ecart, que le CSS applique aux trois endroits.
     La marge haute du panneau (20 px) et le dégagement bas (62 px, qui écarte la
     barre de contacts) restent en dehors : ce sont les marges du panneau, pas
     des espaces de composition. */
  var ECART_MINI = 20;

  function placeMobile() {
    /* Dégagement sous la dernière carte : exactement la hauteur de la barre de
       contacts, qui est fixée par-dessus la page. La maquette montre la carte
       affleurant le bas du panneau, la barre juste en dessous. */
    var barre = document.querySelector('.home .contact');
    if (barre) home.style.setProperty('--barre-h', Math.ceil(barre.offsetHeight) + 'px');

    home.style.setProperty('--ecart-haut', '0px');
    home.style.setProperty('--ecart-bas',  '0px');
    home.style.removeProperty('--carte-h');
    home.style.removeProperty('--carte-mt');

    var cs = getComputedStyle(home);
    var dispo = home.clientHeight
              - parseFloat(cs.paddingTop || 0)
              - parseFloat(cs.paddingBottom || 0);
    var basGrille = parseFloat(getComputedStyle(grid).marginBottom) || 0;

    /* ---- Tout doit tenir sur UN écran (demande client) ----
       La maquette montre l'ensemble sans défilement. Les cartes sont le seul
       bloc compressible : si la somme dépasse, on les réduit juste assez, en
       gardant leurs proportions. Plancher à 72 % pour qu'elles restent lisibles ;
       en dessous on laisse la page défiler plutôt que de les écraser. */
    var CARTE = 0.169, BANDE = 0.098, PLANCHER = 0.72;
    var placeCartes = dispo - top.offsetHeight - hero.offsetHeight
                    - basGrille - 2 * ECART_MINI;
    if (grid.offsetHeight > placeCartes && grid.offsetHeight > 0) {
      var k = Math.max(PLANCHER, placeCartes / grid.offsetHeight);
      var hCarte = CARTE * k * 100;          /* hauteur totale d'une carte, en vh */
      var hBande = BANDE * k * 100;          /* part visible de chaque carte      */
      home.style.setProperty('--carte-h',  hCarte.toFixed(3) + 'vh');
      home.style.setProperty('--carte-mt', '-' + (hCarte - hBande).toFixed(3) + 'vh');
    }

    var libre = dispo - top.offsetHeight - hero.offsetHeight - grid.offsetHeight - basGrille;

    /* Partage relevé sur la maquette téléphone : 8,97 % de la hauteur du panneau
       au-dessus du bloc titre, 13,96 % en dessous, soit 39,1 % / 60,9 %.
       C'est le même parti pris que la maquette bureau (39,65 %) : le titre n'est
       pas centré, il est posé un peu haut. Plancher pour les écrans courts. */
    var haut = Math.max(ECART_MINI, Math.round(libre * 0.391));
    var bas  = Math.max(ECART_MINI, Math.round(libre * 0.609));
    home.style.setProperty('--ecart-haut', haut + 'px');
    home.style.setProperty('--ecart-bas',  bas  + 'px');
  }

  function place() {
    if (window.innerWidth <= 600) {          /* téléphone : trois écarts égaux */
      home.style.removeProperty('--hero-gap');
      home.style.removeProperty('--card-cap');
      home.style.removeProperty('--card-scale');
      placeMobile();
      return;
    }
    home.style.removeProperty('--ecart-haut');
    home.style.removeProperty('--ecart-bas');
    home.style.removeProperty('--barre-h');
    if (window.innerWidth <= 950) {          /* tablette : mise en page dédiée */
      home.style.removeProperty('--hero-gap');
      home.style.removeProperty('--card-cap');
      home.style.removeProperty('--card-scale');
      return;
    }
    home.style.setProperty('--hero-gap', '0px');
    var cs = getComputedStyle(home);
    var dispo = home.clientHeight
              - parseFloat(cs.paddingTop || 0)
              - parseFloat(cs.paddingBottom || 0);

    /* Plafond de sécurité : sur une fenêtre très basse, la rangée d'images
       ne doit jamais pousser le bloc titre. On calcule la place réellement
       disponible et on la donne au CSS ; tant qu'il y en a assez, c'est la
       forme relevée sur la maquette qui l'emporte. */
    var big = grid.querySelector('.card--fashion .thumb');
    if (big) {
      var horsImage = grid.offsetHeight - big.offsetHeight;   /* étiquette + écart */
      var place = dispo - top.offsetHeight - hero.offsetHeight - horsImage - dispo * 0.03;
      home.style.setProperty('--card-cap', Math.max(80, Math.round(place)) + 'px');
    }

    /* ---- Trop de blanc : on laisse les vignettes grandir ----
       Leur hauteur ne dépend que de la largeur du panneau. En rétrécissant la
       fenêtre elles maigrissent, alors que la hauteur disponible ne change pas :
       le vide atteignait 39 % du panneau contre 30 % sur la maquette.
       On mesure le blanc, et s'il dépasse ce seuil on donne l'excédent aux
       vignettes. Le facteur ne descend jamais sous 1 : la forme de la maquette
       reste le plancher, on ne fait que combler un vide excessif. */
    var BLANC_CIBLE = 0.30;      /* part de blanc voulue, relevée sur la maquette */
    var ECHELLE_MAX = 1.75;      /* garde-fou */
    home.style.setProperty('--card-scale', '1');
    var libre = dispo - top.offsetHeight - hero.offsetHeight - grid.offsetHeight;
    if (big) {
      var excedent = libre - dispo * BLANC_CIBLE;
      if (excedent > 0 && big.offsetHeight > 0) {
        var echelle = Math.min(ECHELLE_MAX, 1 + excedent / big.offsetHeight);
        home.style.setProperty('--card-scale', echelle.toFixed(4));
        libre = dispo - top.offsetHeight - hero.offsetHeight - grid.offsetHeight;
      }
    }

    var gap = Math.max(0, Math.round(libre * PART_HAUT));
    home.style.setProperty('--hero-gap', gap + 'px');
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  window.addEventListener('load', place);
  /* Recalcul immédiat, sans délai d'attente — voir la note du bloc précédent. */
  var enAttente = false;
  window.addEventListener('resize', function () {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(function () { enAttente = false; place(); });
  });
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
  /* Justification du logo : recalcul immédiat lui aussi. */
  var enAttenteLogo = false;
  window.addEventListener('resize', function () {
    if (enAttenteLogo) return;
    enAttenteLogo = true;
    requestAnimationFrame(function () { enAttenteLogo = false; fitBrand(); });
  });
  schedule();
})();
