/**
* Template Name: BizLand
* Template URL: https://bootstrapmade.com/bizland-bootstrap-business-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Las animaciones que se repiten (Sofía y la insignia) se pausan cuando
   * salen de la pantalla, para que el scroll no tenga trabajo extra.
   */
  if ('IntersectionObserver' in window) {
    const pausables = document.querySelectorAll('.sofia-avatar, .insignia-teaser');
    const vigia = new IntersectionObserver(entradas => {
      entradas.forEach(e => e.target.classList.toggle('en-pausa', !e.isIntersecting));
    });
    pausables.forEach(el => vigia.observe(el));
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop, { passive: true });

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

})();

 // Menú con tabs
  document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-link");
    const contents = document.querySelectorAll(".tab-content");

    contents.forEach(content => content.classList.remove("active"));
    document.getElementById("seccion2").classList.add("active");

    function setActiveTab(target) {
      tabs.forEach(tab => tab.classList.remove("active"));
      document.querySelector(`[data-tab="${target}"]`).classList.add("active");
    }

    setActiveTab("seccion2");

    tabs.forEach(tab => {
      tab.addEventListener("click", function (event) {
        event.preventDefault();
        const target = this.getAttribute("data-tab");

        // Desactivar todas las secciones
        contents.forEach(content => content.classList.remove("active"));

        // Activar la sección seleccionada
        document.getElementById(target).classList.add("active");

        // Marcar como tab activo
        setActiveTab(target);

        // Scrollear hacia arriba después del cambio
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "auto" // Usa "smooth" si prefieres una animación
          });
        }, 50); // Espera corta para asegurar que el contenido ya esté activo
      });
    });
  });
