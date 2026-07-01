/* ==========================================================================
   MILAN — site interactions
   Preloader, nav state, mobile menu, scroll-reveal, magnetic buttons,
   menu-page scrollspy. Vanilla JS, no dependencies.
   ========================================================================== */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  if(preloader){
    const finish = () => preloader.classList.add('done');
    if(document.readyState === 'complete'){
      setTimeout(finish, reduceMotion ? 0 : 500);
    } else {
      window.addEventListener('load', () => setTimeout(finish, reduceMotion ? 0 : 500));
    }
    // safety net so preloader never blocks content
    setTimeout(finish, 2200);
  }

  /* ---------- Nav scroll state ---------- */
  const nav = document.querySelector('.site-nav');
  const setNavState = () => {
    if(!nav) return;
    if(window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  setNavState();
  window.addEventListener('scroll', setNavState, { passive:true });

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Magnetic buttons ---------- */
  if(!reduceMotion && window.matchMedia('(hover: hover)').matches){
    document.querySelectorAll('.magnetic').forEach(el => {
      let bounds;
      el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', (e) => {
        if(!bounds) bounds = el.getBoundingClientRect();
        const relX = e.clientX - bounds.left - bounds.width/2;
        const relY = e.clientY - bounds.top - bounds.height/2;
        el.style.transform = `translate(${relX*0.22}px, ${relY*0.32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- Hero parallax (subtle, rAF throttled) ---------- */
  const heroBg = document.querySelector('.hero-bg');
  if(heroBg && !reduceMotion){
    let ticking = false;
    window.addEventListener('scroll', () => {
      if(!ticking){
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if(y < window.innerHeight){
            heroBg.style.transform = `translateY(${y * 0.18}px) scale(1.02)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive:true });
  }

  /* ---------- Menu page scrollspy ---------- */
  const menuNav = document.querySelector('.menu-nav');
  if(menuNav){
    const navLinks = [...menuNav.querySelectorAll('a')];
    const targets = navLinks.map(a => document.querySelector(a.getAttribute('href')));
    const spy = () => {
      let current = targets[0];
      const offset = 160;
      targets.forEach(t => {
        if(t && t.getBoundingClientRect().top - offset <= 0) current = t;
      });
      navLinks.forEach(a => a.classList.toggle('active', targets[navLinks.indexOf(a)] === current));
    };
    spy();
    window.addEventListener('scroll', spy, { passive:true });
  }

  /* ---------- Current year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
