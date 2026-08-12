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
