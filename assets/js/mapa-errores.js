(function () {
  "use strict";

  // ---------- Contenido (matriz de emparejamiento) ----------
  const CASOS = [
    {
      a: "Sofía avanza rapidísimo llenando las preguntas fáciles de un cuestionario. Cuando llega a la pregunta difícil que requiere análisis, la deja en blanco sintiendo que «ya avanzó bastante» y que su sesión de estudio fue muy productiva.",
      b: "Daño por facilidad",
      c: "Reconoce que ese progreso es una ilusión. Resolver lo que ya sabes se siente bien, pero no mueve nada en tu mente. Empieza por la pregunta difícil, porque ahí es donde ocurre el aprendizaje real."
    },
    {
      a: "Frente a un problema que no sabe cómo resolver, Sofía se queda mirando la hoja en blanco. Se niega a escribir algo hasta no estar 100% segura de que es la respuesta correcta, por miedo a equivocarse.",
      b: "Cerebro predictivo",
      c: "Atrévete a escribir una primera hipótesis, aunque esté incompleta. Tu mente no espera pasivamente: necesita adelantarse y generar una predicción para poder ajustarla y corregirla después."
    },
    {
      a: "Sofía intenta aplicar una fórmula matemática y el resultado es incorrecto. En lugar de detenerse a mirar en qué paso falló, borra todo y vuelve a aplicar exactamente la misma fórmula esperando que esta vez sí funcione.",
      b: "Control ejecutivo",
      c: "Usa tu capacidad de pausar y detectar el error. Si tu hipótesis falló, debes ajustar conscientemente el curso de acción en lugar de insistir en automático en lo mismo."
    },
    {
      a: "Cuando un tema le exige demasiada concentración y comete errores seguidos, Sofía suspira frustrada y dice: «Esto es demasiado agotador, se nota que no soy buena para esto, mi cerebro no da para más».",
      b: "Plasticidad cerebral",
      c: "Cambia tu perspectiva sobre el cansancio mental. Esa fricción e incomodidad que sientes al corregir errores es literalmente tu cerebro reorganizándose físicamente. El error no es un obstáculo, es la condición para que cambies."
    },
    {
      a: "Al empezar a leer sobre un tema técnico totalmente desconocido, Sofía se bloquea de inmediato argumentando: «No tengo ni idea de esto, no tengo cómo arrancar a entenderlo».",
      b: "Analogía y pensamiento asociativo",
      c: "No partes de cero. Busca en lo que ya conoces algo que se parezca o funcione de manera similar. Construye un puente desde lo familiar hacia lo desconocido."
    },
    {
      a: "Sofía está leyendo un texto complejo. A los cinco minutos, siente una incomodidad tremenda, cierra el libro y de repente siente la necesidad urgente de revisar su celular o ir a buscar algo de comer.",
      b: "Técnica Pomodoro",
      c: "No uses esta técnica solo para «producir más», úsala para resistir el abandono. Comprométete a tolerar esa incomodidad de la tarea difícil por solo 25 minutos sin escapar. Soporta el atascamiento."
    }
  ];

  const MSJ_EXITO = "¡Excelente, Arquitecto del Aprendizaje! Has diagnosticado correctamente a Sofía. Ahora ella tiene un mapa claro para entender que la fricción no es una señal para huir, sino la confirmación de que su cerebro está cambiando.";
  const MSJ_ERROR = "Espera un momento. Has caído en la misma trampa que Sofía. Recuerda que no todos los errores se solucionan con la misma estrategia. Vuelve a leer el comportamiento de Sofía: ¿está evitando por miedo a equivocarse, o está repitiendo en automático? Ajusta tu hipótesis e inténtalo de nuevo.";

  const TOTAL = CASOS.length * 2;
  const NOMBRE = { b: "diagnóstico", c: "tratamiento" };

  // ---------- Estado ----------
  let estado;              // { b: [pieceId|null x6], c: [...] }
  let bloqueados;          // { b: Set, c: Set } casillas correctas fijadas
  let marcas;              // { "b-2": "ok"|"bad" }
  let orden;               // orden aleatorio del banco
  let bancoActivo = "b";
  let seleccion = null;    // { tipo, id }
  let ultimoColocado = null;
  let completado = false;

  const $ = (s, c = document) => c.querySelector(s);
  const tablero = $("#tablero");
  const bancoLista = $("#bancoLista");

  function barajar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    // Evita que el orden coincida con el de los casos
    if (a.every((v, i) => v === i)) return barajar(arr);
    return a;
  }

  function iniciar() {
    estado = { b: Array(CASOS.length).fill(null), c: Array(CASOS.length).fill(null) };
    bloqueados = { b: new Set(), c: new Set() };
    marcas = {};
    const ids = CASOS.map((_, i) => i);
    orden = { b: barajar(ids), c: barajar(ids) };
    seleccion = null; completado = false;
    construirTablero();
    render();
  }

  function esc(t) { const d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  function construirTablero() {
    tablero.innerHTML = CASOS.map((caso, i) => `
      <article class="caso entra" data-caso="${i}" style="animation-delay:${i * 70}ms">
        <div class="caso-top">
          <span class="caso-num">${i + 1}</span>
          <span class="tag"><i class="bi bi-clipboard2-pulse"></i>Síntoma</span>
          <svg class="ecg" viewBox="0 0 74 24" aria-hidden="true"><path d="M1 12 H22 L27 4 L33 21 L38 8 L42 12 H73" /></svg>
        </div>
        <p class="sintoma">${esc(caso.a)}</p>
        <div class="caso-slots">
          <div class="slot" role="button" tabindex="0" data-tipo="b" data-caso="${i}" data-zona="slot"></div>
          <div class="slot" role="button" tabindex="0" data-tipo="c" data-caso="${i}" data-zona="slot"></div>
        </div>
      </article>`).join("");
  }

  function htmlPieza(tipo, id, opts = {}) {
    const texto = tipo === "b" ? CASOS[id].b : CASOS[id].c;
    const quitar = opts.enSlot && !opts.bloqueada ? '<i class="bi bi-x-lg quitar" data-quitar="1" aria-hidden="true"></i>' : "";
    const sel = seleccion && seleccion.tipo === tipo && seleccion.id === id ? " seleccionada" : "";
    const nueva = opts.nueva ? " nueva" : "";
    const tag = opts.enSlot ? "div" : "button";
    return `<${tag} class="pieza tipo-${tipo}${sel}${nueva}" data-tipo="${tipo}" data-id="${id}" ${opts.enSlot ? "" : 'type="button"'} ${opts.opcion ? 'data-opcion="1"' : ""}>${esc(texto)}${quitar}</${tag}>`;
  }

  function disponibles(tipo) {
    return orden[tipo].filter(id => !estado[tipo].includes(id));
  }

  function render() {
    // Casillas
    tablero.querySelectorAll(".slot").forEach(slot => {
      const tipo = slot.dataset.tipo, i = +slot.dataset.caso;
      const id = estado[tipo][i];
      const bloq = bloqueados[tipo].has(i);
      const marca = marcas[tipo + "-" + i];
      const icono = tipo === "b" ? "bi-search-heart" : "bi-capsule-pill";
      const etiqueta = tipo === "b" ? "Diagnóstico (concepto)" : "Tratamiento (recomendación)";
      slot.className = "slot" + (id !== null ? " lleno" : "") + (bloq ? " correcto" : "") + (marca === "bad" ? " incorrecto" : "") + (seleccion && seleccion.tipo === tipo && id === null ? " objetivo" : "");
      let estadoIco = "";
      if (bloq) estadoIco = '<span class="estado"><i class="bi bi-check-lg"></i></span>';
      else if (marca === "bad") estadoIco = '<span class="estado"><i class="bi bi-x-lg"></i></span>';
      slot.innerHTML = `<span class="slot-label"><i class="bi ${icono}"></i>${etiqueta}</span>` +
        (id === null
          ? `<span class="slot-vacio">${seleccion && seleccion.tipo === tipo ? "Haz clic aquí para ubicar la pieza seleccionada" : "Arrastra o toca para elegir el " + NOMBRE[tipo]}</span>`
          : htmlPieza(tipo, id, { enSlot: true, bloqueada: bloq, nueva: ultimoColocado === tipo + "-" + i })) + estadoIco;
      slot.setAttribute("aria-label", `Caso ${i + 1}, ${NOMBRE[tipo]}: ${id === null ? "vacío" : (tipo === "b" ? CASOS[id].b : CASOS[id].c)}`);
      slot.tabIndex = bloq ? -1 : 0;
    });
    ultimoColocado = null;

    // Casos completos / correctos
    tablero.querySelectorAll(".caso").forEach(c => {
      const i = +c.dataset.caso;
      c.classList.toggle("completo", estado.b[i] !== null && estado.c[i] !== null);
      c.classList.toggle("ok", bloqueados.b.has(i) && bloqueados.c.has(i));
    });

    // Banco
    $("#contB").textContent = disponibles("b").length;
    $("#contC").textContent = disponibles("c").length;
    document.querySelectorAll(".seg button").forEach(b => {
      const act = b.dataset.banco === bancoActivo;
      b.classList.toggle("activo", act); b.setAttribute("aria-selected", act);
    });
    const disp = disponibles(bancoActivo);
    bancoLista.innerHTML = disp.length
      ? disp.map(id => htmlPieza(bancoActivo, id)).join("")
      : `<div class="banco-vacio"><i class="bi bi-check2-all"></i>Ubicaste todos los ${bancoActivo === "b" ? "diagnósticos" : "tratamientos"}.${disponibles(bancoActivo === "b" ? "c" : "b").length ? "<br>Pasa a la otra pestaña." : ""}</div>`;

    // Progreso
    const llenas = estado.b.filter(v => v !== null).length + estado.c.filter(v => v !== null).length;
    $("#progTxt").textContent = `${llenas} de ${TOTAL}`;
    $("#progBar").style.width = (llenas / TOTAL * 100) + "%";
  }

  // ---------- Operaciones ----------
  function colocar(tipo, id, caso) {
    if (bloqueados[tipo].has(caso)) return;
    const origen = estado[tipo].indexOf(id);
    const previo = estado[tipo][caso];
    if (origen !== -1) estado[tipo][origen] = (origen === caso) ? id : previo; // intercambio entre casillas
    estado[tipo][caso] = id;
    delete marcas[tipo + "-" + caso];
    if (origen !== -1 && origen !== caso) delete marcas[tipo + "-" + origen];
    ultimoColocado = tipo + "-" + caso;
    seleccion = null;
    // Si se llenó todo el banco de un tipo, mostrar el otro
    if (!disponibles(bancoActivo).length && disponibles(bancoActivo === "b" ? "c" : "b").length) bancoActivo = bancoActivo === "b" ? "c" : "b";
    render();
  }

  function quitar(tipo, caso) {
    if (bloqueados[tipo].has(caso)) return;
    estado[tipo][caso] = null;
    delete marcas[tipo + "-" + caso];
    render();
  }

  // ---------- Aviso ----------
  let avisoT;
  function aviso(txt, icono = "bi-info-circle-fill") {
    const el = $("#aviso");
    el.querySelector("i").className = "bi " + icono;
    $("#avisoTxt").textContent = txt;
    el.classList.add("visible");
    clearTimeout(avisoT);
    avisoT = setTimeout(() => el.classList.remove("visible"), 3200);
  }

  // ---------- Selector (hoja) ----------
  let hojaDestino = null;
  function abrirHoja(tipo, caso) {
    hojaDestino = { tipo, caso };
    $("#hojaTitulo").textContent = tipo === "b" ? "Elige el diagnóstico" : "Elige el tratamiento";
    const resumen = CASOS[caso].a.length > 85 ? CASOS[caso].a.slice(0, 85).trim() + "…" : CASOS[caso].a;
    $("#hojaSub").textContent = `Caso ${caso + 1}: ${resumen}`;
    const disp = disponibles(tipo);
    $("#hojaLista").innerHTML = disp.length
      ? disp.map(id => htmlPieza(tipo, id, { opcion: true }).replace('class="pieza', 'class="pieza opcion')).join("")
      : `<div class="banco-vacio"><i class="bi bi-arrow-left-right"></i>No quedan piezas libres. Quita una de otra casilla para cambiarla.</div>`;
    $("#hojaQuitar").style.display = estado[tipo][caso] !== null ? "" : "none";
    const capa = $("#capaSelector");
    capa.classList.add("abierta"); capa.setAttribute("aria-hidden", "false");
    setTimeout(() => { const f = $("#hojaLista .opcion") || $("#hojaCerrar"); f.focus(); }, 60);
  }
  function cerrarHoja() {
    const capa = $("#capaSelector");
    capa.classList.remove("abierta"); capa.setAttribute("aria-hidden", "true");
    if (hojaDestino) {
      const s = tablero.querySelector(`.slot[data-tipo="${hojaDestino.tipo}"][data-caso="${hojaDestino.caso}"]`);
      if (s) s.focus();
    }
    hojaDestino = null;
  }
  $("#hojaCerrar").addEventListener("click", cerrarHoja);
  $("#capaSelector").addEventListener("click", e => { if (e.target.id === "capaSelector") cerrarHoja(); });
  $("#hojaLista").addEventListener("click", e => {
    const p = e.target.closest(".opcion"); if (!p || !hojaDestino) return;
    const { tipo, caso } = hojaDestino;
    colocar(tipo, +p.dataset.id, caso);
    cerrarHoja();
  });
  $("#hojaQuitar").addEventListener("click", () => { if (hojaDestino) { quitar(hojaDestino.tipo, hojaDestino.caso); cerrarHoja(); } });

  // ---------- Clic / teclado ----------
  function activarSlot(slot, e) {
    const tipo = slot.dataset.tipo, caso = +slot.dataset.caso;
    if (bloqueados[tipo].has(caso) || completado) return;
    if (e && e.target.closest("[data-quitar]")) { quitar(tipo, caso); return; }
    if (seleccion && seleccion.tipo === tipo) { colocar(tipo, seleccion.id, caso); return; }
    if (seleccion && seleccion.tipo !== tipo) { aviso(`Esa pieza es un ${NOMBRE[seleccion.tipo]}: ubícala en la casilla de ${NOMBRE[seleccion.tipo]}.`, "bi-exclamation-circle-fill"); return; }
    abrirHoja(tipo, caso);
  }

  tablero.addEventListener("click", e => {
    if (arrastreReciente) return;
    const slot = e.target.closest(".slot"); if (slot) activarSlot(slot, e);
  });
  tablero.addEventListener("keydown", e => {
    const slot = e.target.closest(".slot");
    if (slot && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activarSlot(slot); }
    if (slot && (e.key === "Delete" || e.key === "Backspace")) { quitar(slot.dataset.tipo, +slot.dataset.caso); slot.focus(); }
  });

  bancoLista.addEventListener("click", e => {
    if (arrastreReciente) return;
    const p = e.target.closest(".pieza"); if (!p) return;
    const tipo = p.dataset.tipo, id = +p.dataset.id;
    seleccion = (seleccion && seleccion.tipo === tipo && seleccion.id === id) ? null : { tipo, id };
    render();
    if (seleccion) aviso(`Pieza seleccionada. Ahora haz clic en la casilla de ${NOMBRE[tipo]} del caso que corresponda.`, "bi-hand-index-thumb-fill");
  });

  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
    bancoActivo = b.dataset.banco; seleccion = null; render();
  }));

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if ($("#capaSelector").classList.contains("abierta")) cerrarHoja();
      else if ($("#modalFeedback").classList.contains("abierta")) cerrarModal();
      else if (seleccion) { seleccion = null; render(); }
    }
  });

  // ---------- Arrastrar y soltar (mouse / lápiz) ----------
  let drag = null, arrastreReciente = false;

  document.addEventListener("pointerdown", e => {
    if (e.pointerType === "touch" || e.button !== 0 || completado) return;
    const p = e.target.closest("#seccion3 .pieza");
    if (!p || e.target.closest("[data-quitar]")) return;
    const enSlot = p.closest(".slot");
    if (enSlot && bloqueados[enSlot.dataset.tipo].has(+enSlot.dataset.caso)) return;
    drag = { el: p, tipo: p.dataset.tipo, id: +p.dataset.id, x0: e.clientX, y0: e.clientY, activo: false, ghost: null, sobre: null,
             dx: e.clientX - p.getBoundingClientRect().left, dy: e.clientY - p.getBoundingClientRect().top };
  });

  document.addEventListener("pointermove", e => {
    if (!drag) return;
    if (!drag.activo) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.activo = true;
      const g = drag.el.cloneNode(true);
      g.classList.add("fantasma"); g.classList.remove("seleccionada", "nueva");
      g.style.width = Math.min(320, drag.el.getBoundingClientRect().width) + "px";
      document.body.appendChild(g);
      drag.ghost = g;
      drag.el.classList.add("arrastrando");
      document.body.style.cursor = "grabbing";
      tablero.querySelectorAll(`.slot[data-tipo="${drag.tipo}"]`).forEach(s => { if (!bloqueados[drag.tipo].has(+s.dataset.caso)) s.classList.add("objetivo"); });
    }
    drag.ghost.style.left = (e.clientX - Math.min(drag.dx, 40)) + "px";
    drag.ghost.style.top = (e.clientY - Math.min(drag.dy, 30)) + "px";
    const bajo = document.elementFromPoint(e.clientX, e.clientY);
    const zona = bajo && bajo.closest('[data-zona]');
    if (drag.sobre && drag.sobre !== zona) drag.sobre.classList.remove("encima");
    drag.sobre = zona;
    if (zona && (zona.dataset.zona === "banco" || zona.dataset.tipo === drag.tipo)) zona.classList.add("encima");
    // Desplazamiento automático cerca de los bordes
    if (e.clientY < 140) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 12);
  });

  document.addEventListener("pointerup", e => {
    if (!drag) return;
    const d = drag; drag = null;
    document.body.style.cursor = "";
    if (!d.activo) return; // fue un clic: lo maneja el evento click
    d.ghost.remove();
    arrastreReciente = true; setTimeout(() => arrastreReciente = false, 60);
    const bajo = document.elementFromPoint(e.clientX, e.clientY);
    const zona = bajo && bajo.closest('[data-zona]');
    document.querySelectorAll(".encima,.objetivo").forEach(z => z.classList.remove("encima", "objetivo"));
    if (zona && zona.dataset.zona === "slot") {
      if (zona.dataset.tipo !== d.tipo) {
        aviso(`Esa pieza es un ${NOMBRE[d.tipo]}: va en la casilla de ${NOMBRE[d.tipo]}.`, "bi-exclamation-circle-fill");
        render(); return;
      }
      colocar(d.tipo, d.id, +zona.dataset.caso);
    } else if (zona && zona.dataset.zona === "banco") {
      const i = estado[d.tipo].indexOf(d.id);
      if (i !== -1) quitar(d.tipo, i); else render();
    } else {
      render();
    }
  });

  // ---------- Comprobar ----------
  $("#btnComprobar").addEventListener("click", () => {
    if (completado) { abrirExito(); return; }
    const vacias = [];
    ["b", "c"].forEach(t => estado[t].forEach((v, i) => { if (v === null) vacias.push(t + "-" + i); }));
    if (vacias.length) {
      aviso(`Te faltan ${vacias.length} ${vacias.length === 1 ? "casilla" : "casillas"} por completar.`, "bi-exclamation-triangle-fill");
      vacias.forEach(k => {
        const [t, i] = k.split("-");
        const s = tablero.querySelector(`.slot[data-tipo="${t}"][data-caso="${i}"]`);
        s.classList.remove("falta"); void s.offsetWidth; s.classList.add("falta");
      });
      const primera = vacias[0].split("-");
      tablero.querySelector(`.caso[data-caso="${primera[1]}"]`).scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    let buenas = 0;
    marcas = {};
    ["b", "c"].forEach(t => estado[t].forEach((id, i) => {
      if (id === i) { bloqueados[t].add(i); buenas++; }
      else marcas[t + "-" + i] = "bad";
    }));
    render();
    if (buenas === TOTAL) {
      completado = true;
      setTimeout(abrirExito, 500);
    } else {
      setTimeout(() => abrirError(buenas), 650);
    }
  });

  $("#btnReiniciar").addEventListener("click", () => {
    iniciar();
    actualizarTeaser(false);
    aviso("El mapa se reinició y las piezas se barajaron de nuevo.", "bi-arrow-repeat");
  });

  // ---------- Modales de retroalimentación ----------
  function abrirModal({ visual, titulo, puntaje, texto, acciones }) {
    $("#fbVisual").innerHTML = visual;
    $("#fbTitulo").textContent = titulo;
    $("#fbPuntaje").textContent = puntaje;
    $("#fbTexto").textContent = texto;
    $("#fbAcciones").innerHTML = "";
    acciones.forEach(a => {
      const b = document.createElement("button");
      b.className = "btn-mapa" + (a.secundario ? " secundario" : "");
      b.innerHTML = `<i class="bi ${a.icono}"></i> ${a.txt}`;
      b.addEventListener("click", a.fn);
      $("#fbAcciones").appendChild(b);
    });
    const m = $("#modalFeedback");
    m.classList.add("abierta"); m.setAttribute("aria-hidden", "false");
    setTimeout(() => $("#fbAcciones button").focus(), 80);
  }
  function cerrarModal() {
    const m = $("#modalFeedback");
    m.classList.remove("abierta"); m.setAttribute("aria-hidden", "true");
    detenerConfeti();
  }
  $("#modalFeedback").addEventListener("click", e => { if (e.target.id === "modalFeedback") cerrarModal(); });

  function abrirError(buenas) {
    abrirModal({
      visual: '<div class="modal-icono"><i class="bi bi-signpost-split-fill"></i></div>',
      titulo: "Revisa tu mapa",
      puntaje: `${buenas} de ${TOTAL} casillas correctas`,
      texto: MSJ_ERROR,
      acciones: [{
        txt: "Ajustar mi hipótesis", icono: "bi-arrow-repeat", fn: () => {
          ["b", "c"].forEach(t => estado[t].forEach((id, i) => { if (!bloqueados[t].has(i)) estado[t][i] = null; }));
          marcas = {};
          bancoActivo = disponibles("b").length ? "b" : "c";
          render(); cerrarModal();
          const primero = tablero.querySelector(".caso:not(.ok)");
          if (primero) primero.scrollIntoView({ behavior: "smooth", block: "center" });
          aviso("Las casillas correctas quedaron fijas en verde. Revisa las demás.", "bi-lightbulb-fill");
        }
      }]
    });
  }

  function abrirExito() {
    actualizarTeaser(true);
    abrirModal({
      visual: '<div class="modal-icono exito" role="img" aria-label="Actividad completada"><i class="bi bi-check-lg"></i></div>',
      titulo: "¡Mapa completo!",
      puntaje: `${TOTAL} de ${TOTAL} casillas correctas`,
      texto: MSJ_EXITO,
      acciones: [
        { txt: "Ver mi mapa", icono: "bi-map", fn: cerrarModal },
        { txt: "Volver a empezar", icono: "bi-arrow-repeat", secundario: true, fn: () => { cerrarModal(); iniciar(); actualizarTeaser(false); window.scrollTo({ top: 0, behavior: "smooth" }); } }
      ]
    });
    lanzarConfeti();
  }

  function actualizarTeaser(ganada) {
    $("#miniBadge").classList.toggle("ganada", ganada);
    $("#teaserTitulo").textContent = ganada ? "¡Ganaste la insignia «El mapa de errores»!" : "Insignia «El mapa de errores»";
    $("#teaserTexto").textContent = ganada ? "Sofía ya tiene un mapa claro para quedarse en la casilla difícil." : "Diagnostica correctamente los seis casos de Sofía para desbloquearla.";
  }

  // ---------- Confeti ----------
  const lienzo = $("#confeti"), ctx = lienzo.getContext("2d");
  let particulas = [], animId = null;
  function lanzarConfeti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lienzo.width = innerWidth; lienzo.height = innerHeight;
    const colores = ["#000087", "#3037bc", "#5882f8", "#f5b82e", "#ffffff", "#1f9d6b"];
    particulas = Array.from({ length: 180 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .45,
      vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6,
      r: Math.random() * 6 + 4, c: colores[Math.floor(Math.random() * colores.length)],
      rot: Math.random() * 6, vr: (Math.random() - .5) * .3, forma: Math.random() > .5
    }));
    const t0 = performance.now();
    cancelAnimationFrame(animId);
    (function paso(t) {
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      particulas.forEach(p => {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.forma) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2.4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      if (t - t0 < 4500) animId = requestAnimationFrame(paso); else detenerConfeti();
    })(t0);
  }
  function detenerConfeti() { cancelAnimationFrame(animId); ctx.clearRect(0, 0, lienzo.width, lienzo.height); }

  // ---------- Botón empezar (cambia a la pestaña de la actividad) ----------
  $("#btnEmpezar").addEventListener("click", () => {
    // El botón "Empezar" de la portada ya no hace falta una vez empieza la actividad
    const heroCta = document.getElementById("heroCta");
    if (heroCta) (heroCta.closest(".hero-in") || heroCta).style.display = "none";
    const li = document.getElementById("navActividad");
    if (li && li.classList.contains("nav-oculto")) { li.classList.remove("nav-oculto"); li.classList.add("nav-aparece"); }
    const link = document.querySelector('.tab-link[data-tab="seccion3"]');
    if (link) link.click();
    setTimeout(() => { if (window.AOS) AOS.refresh(); }, 120);
  });
  document.querySelectorAll(".tab-link").forEach(l => l.addEventListener("click", () => setTimeout(() => { if (window.AOS) AOS.refreshHard(); }, 120)));

  iniciar();
})();
