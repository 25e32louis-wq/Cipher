(() => {
  'use strict';

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Typewriter: BUILD first, then SIGNAL.
  const buildEl = qs('#typeBuild');
  const signalEl = qs('#typeSignal');
  const type = (el, text, delay, speed, done) => {
    if (!el) return;
    el.textContent = '';
    if (reduceMotion) { el.textContent = text; done?.(); return; }
    setTimeout(() => {
      let i = 0;
      const tick = () => {
        el.textContent = text.slice(0, i++);
        if (i <= text.length) setTimeout(tick, speed);
        else done?.();
      };
      tick();
    }, delay);
  };
  type(buildEl, 'BUILD', 250, 90, () => type(signalEl, 'SIGNAL', 80, 80));

  // Smooth single-page navigation + active section state.
  const topbar = qs('#topbar');
  const sections = qsa('[data-section]');
  const navLinks = qsa('[data-nav]');
  const setActive = (id) => navLinks.forEach(link => link.classList.toggle('active', link.dataset.nav === id));
  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - topbar.offsetHeight + 1;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      e.preventDefault();
      scrollToId(id);
      closeMobile();
      history.replaceState(null, '', `#${id}`);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > .25) setActive(entry.target.id);
    });
  }, { rootMargin: `-${topbar.offsetHeight + 24}px 0px -48% 0px`, threshold: [0.25, 0.5] });
  sections.forEach(s => observer.observe(s));

  // Mobile menu.
  const menu = qs('#mobileMenu');
  const toggle = qs('.menu-toggle');
  function closeMobile() {
    if (!menu) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle?.setAttribute('aria-expanded', 'false');
  }
  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Pointer depth on Cipher Core.
  const coreStage = qs('.core-stage');
  const core = qs('#coreAssembly');
  if (coreStage && core && !reduceMotion) {
    coreStage.addEventListener('pointermove', (e) => {
      const r = coreStage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      core.style.transform = `translateY(-6px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
    });
    coreStage.addEventListener('pointerleave', () => { core.style.transform = ''; });
  }

  // About interaction.
  qsa('.activate-row').forEach(row => row.addEventListener('click', () => {
    qsa('.activate-row').forEach(x => x.classList.remove('active'));
    row.classList.add('active');
  }));

  // Event filter + search.
  const filters = qsa('.filter');
  const cards = qsa('.event-card');
  const search = qs('#eventSearch');
  let currentFilter = 'ALL';
  const refreshEvents = () => {
    const needle = (search?.value || '').trim().toLowerCase();
    cards.forEach(card => {
      const matchesFilter = currentFilter === 'ALL' || card.dataset.category === currentFilter;
      const matchesSearch = !needle || (card.dataset.search || '').includes(needle) || card.textContent.toLowerCase().includes(needle);
      const visible = matchesFilter && matchesSearch;
      card.hidden = !visible;
    });
  };
  filters.forEach(filter => filter.addEventListener('click', () => {
    filters.forEach(x => x.classList.remove('active'));
    filter.classList.add('active');
    currentFilter = filter.dataset.filter;
    refreshEvents();
  }));
  search?.addEventListener('input', refreshEvents);

  // Event drawers.
  const overlay = qs('#overlay');
  const eventDrawer = qs('#eventDrawer');
  const profileDrawer = qs('#profileDrawer');
  const eventData = {
    lumiere: {
      kicker: 'COMMUNITY / BRANCH ENTRY', title: 'LUMIÈRE — THE GALA', date: '29 OCTOBER 2025', type: 'COMMUNITY', format: 'KALAM AUDITORIUM',
      text: 'The Department of Computer Science and Engineering held its branch entry programme, “Lumière — The Gala,” organised by the Cipher Association. The formal gathering used the theme “Where Glam Meets Glow,” with coordinated red, gold and black décor, floral arrangements, illuminated panels and a central Lumière backdrop.'
    },
    promptops: {
      kicker: 'COMPETITION / AI', title: 'PROMPT OPS-2K26', date: '25 MARCH 2026', type: 'COMPETITION', format: 'AGENTBLAZER CLUB × CIPHER',
      text: 'A technical competition focused on prompt engineering and AI tools. Track 1 covered invitation generation, logo recreation and image recreation. Track 2 covered JSON conversion, Python code debugging and a Gemini AI security prompt extraction challenge.'
    },
    reactnode: {
      kicker: 'WORKSHOP / WEB DEVELOPMENT', title: 'REACT.JS + NODE.JS', date: '21 NOVEMBER 2024', type: 'WORKSHOP', format: '09:00 AM — 04:00 PM',
      text: 'The Department of Computer Science and Engineering in association with CIPHER organised a workshop for third-year CSE B and C section students. Mr. Anish Shobith, alumnus of the 2024 batch, served as resource person.'
    },
    ballroom: {
      kicker: 'COMMUNITY / BRANCH ENTRY', title: 'BRANCH ENTRY — BALLROOM', date: '22 NOVEMBER 2022', type: 'COMMUNITY', format: 'CSE BRANCH ENTRY',
      text: 'A colourful and energetic branch entry programme organised for new joiners. The day included a senior welcome dance, emcee-led activities, spot games, refreshments and a senior flash mob, concluding with music and celebration.'
    }
  };
  const openDrawer = (drawer) => { overlay.classList.add('open'); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  const closeDrawers = () => { overlay.classList.remove('open'); [eventDrawer, profileDrawer].forEach(d => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); }); document.body.style.overflow = ''; };
  qsa('[data-open],[data-event-open]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const key = trigger.dataset.open || trigger.dataset.eventOpen;
      const data = eventData[key];
      if (!data) return;
      qs('#drawerKicker').textContent = data.kicker;
      qs('#drawerTitle').textContent = data.title;
      qs('#drawerText').textContent = data.text;
      qs('#drawerDate').textContent = data.date;
      qs('#drawerType').textContent = data.type;
      qs('#drawerFormat').textContent = data.format;
      openDrawer(eventDrawer);
    });
  });
  qsa('[data-profile]').forEach(card => card.addEventListener('click', () => {
    const name = card.dataset.profile;
    const role = card.dataset.role;
    qs('#profileTitle').textContent = name;
    qs('#profileRole').textContent = role.toUpperCase();
    qs('#profileAvatar').textContent = name.split(' ').map(part => part[0]).slice(0,2).join('');
    openDrawer(profileDrawer);
  }));
  qsa('[data-close]').forEach(btn => btn.addEventListener('click', closeDrawers));
  overlay?.addEventListener('click', closeDrawers);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawers(); closeMobile(); } });

  // Join form demo validation.
  const form = qs('#joinForm');
  const status = qs('#formStatus');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    if (!name || !email) { status.textContent = 'COMPLETE NAME + EMAIL'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = 'ENTER A VALID EMAIL'; return; }
    status.textContent = `SIGNAL RECEIVED / ${name.toUpperCase()}`;
    form.reset();
  });

  // Preserve deep link on load for #about etc.
  const initial = location.hash.replace('#','');
  if (initial && document.getElementById(initial)) setTimeout(() => scrollToId(initial), 50);
})();

/* =========================================================
   CIPHER INTRO PARTICLES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const intro = document.getElementById("cipher-intro");
    const particleContainer = document.querySelector(".intro-particles");

    if (!intro || !particleContainer) return;

    const particleCount = 90;

    for (let i = 0; i < particleCount; i++) {

        const particle = document.createElement("span");

        particle.className = "cipher-intro-particle";

        /*
         * Start particles randomly around the screen
         */
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;

        particle.style.left = startX + "%";
        particle.style.top = startY + "%";

        /*
         * Move particles toward the center
         */
        const moveX = (50 - startX) * 0.65;
        const moveY = (50 - startY) * 0.65;

        particle.style.setProperty("--move-x", moveX + "vw");
        particle.style.setProperty("--move-y", moveY + "vh");

        /*
         * Different timing for each particle
         */
        particle.style.animationDelay =
            (Math.random() * 0.55) + "s";

        /*
         * Slight size variation
         */
        const size = 1 + Math.random() * 2.5;

        particle.style.width = size + "px";
        particle.style.height = size + "px";

        particleContainer.appendChild(particle);
    }


    /*
     * Remove intro after animation
     */
    setTimeout(() => {

        if (intro) {
            intro.remove();
        }

    }, 3200);

});
