// Sumário das páginas legais: monta a lista a partir dos <h2> do documento,
// abre fixo no desktop e marca a seção que está na tela.
(function () {
  var toc = document.querySelector('.doc-toc');
  var corpo = document.querySelector('.doc-body');
  if (!toc || !corpo) return;

  var lista = toc.querySelector('ol');
  var titulos = Array.prototype.slice.call(corpo.querySelectorAll('h2[id]'));
  var links = {};

  titulos.forEach(function (h) {
    var num = h.querySelector('.sec-num');
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.innerHTML = '<span class="toc-num">' + (num ? num.textContent : '') + '</span><span></span>';
    a.lastChild.textContent = h.textContent.replace(num ? num.textContent : '', '').trim();
    var li = document.createElement('li');
    li.appendChild(a);
    lista.appendChild(li);
    links[h.id] = a;
  });

  // Desktop: sumário sempre aberto. Mobile: fecha ao escolher uma seção.
  var desktop = window.matchMedia('(min-width: 1000px)');
  var ajustar = function () { if (desktop.matches) toc.setAttribute('open', ''); };
  ajustar();
  if (desktop.addEventListener) desktop.addEventListener('change', ajustar);
  lista.addEventListener('click', function (e) {
    if (e.target.closest('a') && !desktop.matches) toc.removeAttribute('open');
  });

  if (!('IntersectionObserver' in window)) return;
  var ativo = null;
  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      if (ativo) ativo.classList.remove('is-active');
      ativo = links[en.target.id];
      if (ativo) ativo.classList.add('is-active');
    });
  }, { rootMargin: '-80px 0px -70% 0px' });
  titulos.forEach(function (h) { obs.observe(h); });
})();
