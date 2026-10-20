/*--------------------------------------------------------------
# Cabezote — red neuronal sutil y botón "Empezar"
#  - un solo canvas, a 30 cuadros por segundo como máximo,
#  - se detiene cuando la portada no se ve o la pestaña está oculta
#    (y también pausa las animaciones CSS de la portada),
#  - no anima nada si la persona pidió reducir el movimiento.
--------------------------------------------------------------*/
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FRAME_MS = 1000 / 30;

  function initNeural() {
    var hero = document.getElementById("seccion1");
    var canvas = document.getElementById("heroNeural");
    if (!hero || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var nodes = [], pulses = [];
    var w = 0, h = 0;
    var LINK = 130, LINK2 = LINK * LINK;
    var running = false, visible = true, last = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      var nw = canvas.offsetWidth, nh = canvas.offsetHeight;
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(30, (w * h) / 26000));
      nodes = []; pulses = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.7
        });
      }
      if (reduceMotion) draw();
    }

    function spawnPulse() {
      var a = nodes[Math.floor(Math.random() * nodes.length)];
      var best = null, bd = LINK2;
      for (var i = 0; i < nodes.length; i++) {
        var b = nodes[i];
        if (b === a) continue;
        var dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = b; }
      }
      if (best) pulses.push({ a: a, b: best, t: 0 });
    }

    function draw() {
      var i, j, n, m, dx, dy, d2;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (!reduceMotion) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        for (j = i + 1; j < nodes.length; j++) {
          m = nodes[j];
          dx = n.x - m.x; dy = n.y - m.y; d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx.strokeStyle = "rgba(140,205,255," + (0.18 * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(200,235,255,.6)";
      ctx.beginPath();
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        ctx.moveTo(n.x + n.r, n.y);
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      }
      ctx.fill();
      for (i = pulses.length - 1; i >= 0; i--) {
        var s = pulses[i];
        s.t += 0.03;
        if (s.t >= 1) { pulses.splice(i, 1); continue; }
        var x = s.a.x + (s.b.x - s.a.x) * s.t;
        var y = s.a.y + (s.b.y - s.a.y) * s.t;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 8);
        g.addColorStop(0, "rgba(210,245,255,.9)");
        g.addColorStop(1, "rgba(95,208,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion && Math.random() < 0.06 && pulses.length < 5 && nodes.length) spawnPulse();
    }

    function loop(now) {
      if (!visible || document.hidden) { running = false; return; }
      if (now - last >= FRAME_MS) { last = now; draw(); }
      requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      requestAnimationFrame(loop);
    }

    resize();
    if (reduceMotion) draw(); else start();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        hero.classList.toggle("en-pausa", !visible);
        if (visible) start();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      var t;
      window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(resize, 150); });
    }
  }

  function initCta() {
    var cta = document.getElementById("heroCta");
    var destino = document.getElementById("seccion2");
    if (!cta || !destino) return;
    cta.addEventListener("click", function () {
      var header = document.getElementById("header");
      var offset = header ? header.offsetHeight : 0;
      var top = destino.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNeural();
    initCta();
  });
})();
