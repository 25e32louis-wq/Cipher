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

  // =========================================================
  // EVENT ARCHIVE — FLASH CARDS PERSPECTIVE STACK & DOSSIER
  // =========================================================

  const archiveDeckStage = qs('#archiveDeckStage');
  const archiveCards = qsa('.archive-card');
  const deckCurIdx = qs('#deckCurIdx');
  const deckPrevBtn = qs('#deckPrevBtn');
  const deckNextBtn = qs('#deckNextBtn');

  let activeCardIndex = 0;
  const totalCards = archiveCards.length;

  const updateDeck = (newIndex) => {
    activeCardIndex = (newIndex + totalCards) % totalCards;
    if (archiveDeckStage) {
      archiveDeckStage.dataset.active = String(activeCardIndex);
    }
    archiveCards.forEach((card, idx) => {
      const isActive = idx === activeCardIndex;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-expanded', String(isActive));
    });
    if (deckCurIdx) {
      deckCurIdx.textContent = String(activeCardIndex + 1).padStart(2, '0');
    }
  };

  archiveCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      if (idx !== activeCardIndex) {
        // Bring clicked card to center
        updateDeck(idx);
      } else {
        // Active center card clicked: open dossier
        const archiveId = card.dataset.archiveId;
        openDossier(archiveId);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (idx !== activeCardIndex) {
          updateDeck(idx);
        } else {
          openDossier(card.dataset.archiveId);
        }
      }
    });
  });

  deckPrevBtn?.addEventListener('click', () => updateDeck(activeCardIndex - 1));
  deckNextBtn?.addEventListener('click', () => updateDeck(activeCardIndex + 1));

  // Touch Swipe for mobile perspective deck
  let deckTouchStartX = 0;
  archiveDeckStage?.addEventListener('touchstart', (e) => {
    deckTouchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  archiveDeckStage?.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].screenX - deckTouchStartX;
    if (Math.abs(diffX) > 45) {
      if (diffX < 0) updateDeck(activeCardIndex + 1);
      else updateDeck(activeCardIndex - 1);
    }
  }, { passive: true });

  // =========================================================
  // DOSSIER SPECIFICATION DATA
  // =========================================================

  const dossierData = {
    lumiere: {
      idCode: 'ID: CP-2025-01',
      security: 'DECLASSIFIED // SJEC-CSE RECORD',
      entryIndex: 'ARCHIVE ENTRY 01',
      date: '29 OCTOBER 2025',
      title: 'LUMIÈRE — THE GALA',
      category: 'COMMUNITY / BRANCH ENTRY',
      poster: 'lumiere-poster.jpg',
      posterBadge: 'STAGE // KALAM AUDITORIUM',
      posterTime: '29 OCT 2025',
      statusText: 'ARCHIVED & VERIFIED',
      description: [
        'The Department of Computer Science and Engineering held its branch entry programme "Lumière – The Gala" on 29 October 2025 at the Kalam Auditorium.',
        'Organised by the Cipher Association, the programme welcomed first-year students into the department through the theme "Where Glam Meets Glow."',
        'The venue featured coordinated red, gold and black décor, floral arrangements, illuminated panels and a central Lumière backdrop.',
        'The event encouraged interaction among students and showcased the role of Cipher in building an active student community beyond academics.'
      ],
      stats: [
        { label: 'VENUE', val: 'Kalam Auditorium' },
        { label: 'THEME', val: 'Where Glam Meets Glow' },
        { label: 'ORGANISED BY', val: 'CIPHER Association' },
        { label: 'AUDIENCE', val: 'First-Year CSE Cohort' },
        { label: 'PURPOSE', val: 'Community & Student Onboarding' }
      ],
      hasGallery: true,
      galleryCountText: '[50 PHOTOS]',
      prevId: 'promptops',
      nextId: 'promptops'
    },
    promptops: {
      idCode: 'ID: CP-2026-02',
      security: 'TECHNICAL RECORD // AI COMPETITION',
      entryIndex: 'ARCHIVE ENTRY 02',
      date: '25 MARCH 2026',
      title: 'PROMPT OPS–2K26',
      category: 'AI / TECHNICAL COMPETITION',
      poster: 'prompt-ops-poster.jpg',
      posterBadge: 'AGENTBLAZER × CIPHER',
      posterTime: '25 MAR 2026',
      statusText: 'LOGGED & VERIFIED',
      description: [
        'Organised jointly by AgentBlazer Club and Cipher under the guidance of Ms. Nisha J Roche, Ms. Jaishma K and HOD Dr. Melwyn D\'Souza.',
        'Track 1 challenged first-year students in invitation generation, logo recreation and image recreation.',
        'Track 2 tested JSON conversion, Python debugging and Gemini AI security prompt extraction.',
        'The competition promoted prompt engineering, AI literacy and practical problem solving.'
      ],
      stats: [
        { label: 'STRUCTURE', val: '2 Specialized Tracks' },
        { label: 'CHALLENGES', val: 'Prompt Eng · JSON · Python' },
        { label: 'AI DEFENSE', val: 'Gemini Security Challenge' },
        { label: 'ORGANISERS', val: 'AgentBlazer Club × Cipher' },
        { label: 'FACULTY GUIDES', val: 'Ms. Nisha, Ms. Jaishma, Dr. Melwyn' }
      ],
      hasGallery: false,
      galleryCountText: '[PROTOCOL LOGGED]',
      prevId: 'lumiere',
      nextId: 'lumiere'
    }
  };

  // =========================================================
  // DOSSIER MODAL CONTROLLER
  // =========================================================

  const archiveDossierModal = qs('#archiveDossierModal');
  const dossierCloseBtn = qs('#dossierCloseBtn');
  const dossierBackdrop = qs('#dossierBackdrop');
  const dossierPosterImg = qs('#dossierPosterImg');
  const dossierPosterBadge = qs('#dossierPosterBadge');
  const dossierPosterTime = qs('#dossierPosterTime');
  const dossierSecurityTag = qs('#dossierSecurityTag');
  const dossierIdCode = qs('#dossierIdCode');
  const dossierStatusText = qs('#dossierStatusText');
  const dossierEntryIndex = qs('#dossierEntryIndex');
  const dossierEntryDate = qs('#dossierEntryDate');
  const dossierTitle = qs('#dossierTitle');
  const dossierCategory = qs('#dossierCategory');
  const dossierDescription = qs('#dossierDescription');
  const dossierStatsGrid = qs('#dossierStatsGrid');
  const dossierGalleryBtn = qs('#dossierGalleryBtn');
  const dossierGalleryCount = qs('#dossierGalleryCount');
  const dossierNavPrev = qs('#dossierNavPrev');
  const dossierNavNext = qs('#dossierNavNext');

  let currentDossierId = 'lumiere';

  const openDossier = (archiveId) => {
    const data = dossierData[archiveId];
    if (!data) return;
    currentDossierId = archiveId;

    // Populate Dossier
    if (dossierIdCode) dossierIdCode.textContent = data.idCode;
    if (dossierSecurityTag) dossierSecurityTag.textContent = data.security;
    if (dossierPosterImg) {
      dossierPosterImg.src = data.poster;
      dossierPosterImg.alt = `${data.title} visual archive`;
    }
    if (dossierPosterBadge) dossierPosterBadge.textContent = data.posterBadge;
    if (dossierPosterTime) dossierPosterTime.textContent = data.posterTime;
    if (dossierStatusText) dossierStatusText.textContent = data.statusText;
    if (dossierEntryIndex) dossierEntryIndex.textContent = data.entryIndex;
    if (dossierEntryDate) dossierEntryDate.textContent = data.date;
    if (dossierTitle) dossierTitle.textContent = data.title;
    if (dossierCategory) dossierCategory.textContent = data.category;

    // Description paragraphs
    if (dossierDescription) {
      dossierDescription.innerHTML = data.description.map(p => `<p>${p}</p>`).join('');
    }

    // Specifications Grid
    if (dossierStatsGrid) {
      dossierStatsGrid.innerHTML = data.stats.map(s => `
        <div class="dossier-stat-card">
          <span class="dossier-stat-label">${s.label}</span>
          <strong class="dossier-stat-val">${s.val}</strong>
        </div>
      `).join('');
    }

    // Gallery CTA button
    if (dossierGalleryBtn && dossierGalleryCount) {
      if (data.hasGallery) {
        dossierGalleryBtn.style.display = 'inline-flex';
        dossierGalleryCount.textContent = data.galleryCountText;
        dossierGalleryBtn.onclick = () => openGallery();
      } else {
        dossierGalleryBtn.style.display = 'none';
      }
    }

    // Sync deck active state with opened card
    const targetIdx = archiveId === 'lumiere' ? 0 : 1;
    updateDeck(targetIdx);

    // Open Modal
    archiveDossierModal?.classList.add('open');
    archiveDossierModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeDossier = () => {
    archiveDossierModal?.classList.remove('open');
    archiveDossierModal?.setAttribute('aria-hidden', 'true');
    if (!archiveGalleryModal?.classList.contains('open') && !galleryLightbox?.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  };

  dossierCloseBtn?.addEventListener('click', closeDossier);
  dossierBackdrop?.addEventListener('click', closeDossier);

  dossierNavPrev?.addEventListener('click', () => {
    const prev = dossierData[currentDossierId]?.prevId;
    if (prev) openDossier(prev);
  });
  dossierNavNext?.addEventListener('click', () => {
    const next = dossierData[currentDossierId]?.nextId;
    if (next) openDossier(next);
  });

  // =========================================================
  // ARCHIVE PHOTO GALLERY & LIGHTBOX
  // =========================================================

  const archiveGalleryModal = qs('#archiveGalleryModal');
  const galleryCloseBtn = qs('#galleryCloseBtn');
  const galleryModalBackdrop = qs('#galleryModalBackdrop');
  const galleryMasonryGrid = qs('#galleryMasonryGrid');
  const galleryLightbox = qs('#galleryLightbox');
  const lightboxBackdrop = qs('#lightboxBackdrop');
  const lightboxCloseBtn = qs('#lightboxCloseBtn');
  const lightboxImg = qs('#lightboxImg');
  const lightboxCounter = qs('#lightboxCounter');
  const lightboxFilename = qs('#lightboxFilename');
  const lightboxPrevBtn = qs('#lightboxPrevBtn');
  const lightboxNextBtn = qs('#lightboxNextBtn');
  const lightboxSpinner = qs('#lightboxSpinner');

  const galleryItems = window.LUMIERE_GALLERY || [];
  let currentPhotoIndex = 0;
  let galleryRendered = false;

  const renderGallery = () => {
    if (galleryRendered || !galleryMasonryGrid) return;
    galleryMasonryGrid.innerHTML = galleryItems.map((item, idx) => `
      <div class="gallery-item" data-photo-idx="${idx}" tabindex="0" role="button" aria-label="View photo ${item.title}">
        <img class="gallery-thumb" src="${item.thumb}" alt="Lumière Gala photo ${item.title}" loading="lazy">
        <div class="gallery-item-meta">
          <span class="gallery-item-title">${item.title}</span>
          <span class="gallery-item-inspect">[+] FULLSCREEN</span>
        </div>
      </div>
    `).join('');

    qsa('.gallery-item', galleryMasonryGrid).forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.photoIdx, 10);
        openLightbox(idx);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const idx = parseInt(el.dataset.photoIdx, 10);
          openLightbox(idx);
        }
      });
    });

    galleryRendered = true;
  };

  const openGallery = () => {
    renderGallery();
    archiveGalleryModal?.classList.add('open');
    archiveGalleryModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeGallery = () => {
    archiveGalleryModal?.classList.remove('open');
    archiveGalleryModal?.setAttribute('aria-hidden', 'true');
    if (!archiveDossierModal?.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  };

  galleryCloseBtn?.addEventListener('click', closeGallery);
  galleryModalBackdrop?.addEventListener('click', closeGallery);

  // Fullscreen Lightbox logic
  const openLightbox = (index) => {
    if (!galleryItems.length) return;
    currentPhotoIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentPhotoIndex];

    if (lightboxCounter) {
      lightboxCounter.textContent = `[${String(currentPhotoIndex + 1).padStart(2, '0')} / ${String(galleryItems.length).padStart(2, '0')}]`;
    }
    if (lightboxFilename) {
      lightboxFilename.textContent = item.title;
    }

    if (lightboxImg) {
      if (lightboxSpinner) lightboxSpinner.style.display = 'block';
      lightboxImg.style.opacity = '0';
      const tempImg = new Image();
      tempImg.onload = () => {
        lightboxImg.src = item.full;
        lightboxImg.style.opacity = '1';
        if (lightboxSpinner) lightboxSpinner.style.display = 'none';
      };
      tempImg.onerror = () => {
        // Fallback to thumbnail if full fails
        lightboxImg.src = item.thumb;
        lightboxImg.style.opacity = '1';
        if (lightboxSpinner) lightboxSpinner.style.display = 'none';
      };
      tempImg.src = item.full;
    }

    galleryLightbox?.classList.add('open');
    galleryLightbox?.setAttribute('aria-hidden', 'false');
  };

  const closeLightbox = () => {
    galleryLightbox?.classList.remove('open');
    galleryLightbox?.setAttribute('aria-hidden', 'true');
  };

  const nextLightboxPhoto = () => openLightbox(currentPhotoIndex + 1);
  const prevLightboxPhoto = () => openLightbox(currentPhotoIndex - 1);

  lightboxNextBtn?.addEventListener('click', nextLightboxPhoto);
  lightboxPrevBtn?.addEventListener('click', prevLightboxPhoto);
  lightboxCloseBtn?.addEventListener('click', closeLightbox);
  lightboxBackdrop?.addEventListener('click', closeLightbox);

  // Lightbox touch swipe
  let lbTouchStartX = 0;
  galleryLightbox?.addEventListener('touchstart', (e) => {
    lbTouchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  galleryLightbox?.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].screenX - lbTouchStartX;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) nextLightboxPhoto();
      else prevLightboxPhoto();
    }
  }, { passive: true });

  // Global Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (galleryLightbox?.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') nextLightboxPhoto();
      else if (e.key === 'ArrowLeft') prevLightboxPhoto();
    } else if (archiveGalleryModal?.classList.contains('open')) {
      if (e.key === 'Escape') closeGallery();
    } else if (archiveDossierModal?.classList.contains('open')) {
      if (e.key === 'Escape') closeDossier();
      else if (e.key === 'ArrowRight') dossierNavNext?.click();
      else if (e.key === 'ArrowLeft') dossierNavPrev?.click();
    }
  });

  // Reusable drawers (Profile drawer & legacy drawers)
  const overlay = qs('#overlay');
  const eventDrawer = qs('#eventDrawer');
  const profileDrawer = qs('#profileDrawer');

  const openDrawer = (drawer) => {
    overlay?.classList.add('open');
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawers = () => {
    overlay?.classList.remove('open');
    [eventDrawer, profileDrawer].forEach(d => {
      d?.classList.remove('open');
      d?.setAttribute('aria-hidden', 'true');
    });
    if (!archiveDossierModal?.classList.contains('open') && !archiveGalleryModal?.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  };

  // Hook Hero signal cards to the Event Archive Dossiers
  qsa('[data-open],[data-event-open]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const key = trigger.dataset.open || trigger.dataset.eventOpen;
      if (key === 'lumiere' || key === 'promptops') {
        scrollToId('events');
        openDossier(key);
      } else {
        const data = dossierData[key];
        if (!data) return;
        qs('#drawerKicker').textContent = data.category;
        qs('#drawerTitle').textContent = data.title;
        qs('#drawerText').textContent = data.description.join(' ');
        qs('#drawerDate').textContent = data.date;
        qs('#drawerType').textContent = 'ARCHIVE';
        qs('#drawerFormat').textContent = 'CIPHER SJEC';
        openDrawer(eventDrawer);
      }
    });
  });

  // =========================================================
  // TEAM PROFILE POPUP (CENTERED SQUARE DOSSIER)
  // =========================================================

  const teamProfiles = {
    'Elston Herold Pereira': {
      name: 'Elston Herold Pereira',
      role: 'President',
      photo: 'elston.jpg',
      quote: 'Building communities is as important as building software.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/cipher-sjec-567344337/'
      }
    },
    'Raynell Lewis': {
      name: 'Raynell Lewis',
      role: 'Vice President',
      photo: 'raynell.jpg',
      quote: 'Architecting systems that empower student innovation.',
      socials: {}
    },
    'Chaitra R M': {
      name: 'Chaitra R M',
      role: 'Secretary',
      photo: 'chaitra.jpg',
      quote: 'Precision in execution, continuity in every initiative.',
      socials: {}
    },
    'Nazmin Ziya': {
      name: 'Nazmin Ziya',
      role: 'Treasurer',
      photo: 'nazmin.jpg',
      quote: 'Disciplined allocation fuels ambitious engineering.',
      socials: {}
    },
    'Jeslin Ninora': {
      name: 'Jeslin Ninora',
      role: 'Joint Treasurer',
      photo: 'jeslin.jpg',
      quote: "Ensuring resources amplify every member's potential.",
      socials: {}
    },
    'Ruben Saldanha': {
      name: 'Ruben Saldanha',
      role: 'Operations Head',
      photo: 'ruben.jpg',
      quote: 'Seamless logistics power extraordinary experiences.',
      socials: {}
    },
    'Himansh Ullal': {
      name: 'Himansh Ullal',
      role: 'Design Head',
      photo: 'himansh.jpg',
      quote: 'Form follows function, aesthetics define identity.',
      socials: {}
    },
    'Shamitha KV': {
      name: 'Shamitha KV',
      role: 'Cultural Head',
      photo: 'shamitha.jpg',
      quote: 'Celebrating the vibrant spirit and creativity of CSE.',
      socials: {}
    },
    'Parthipan J': {
      name: 'Parthipan J',
      role: 'Content Head',
      photo: 'parthipan.jpg',
      quote: 'Telling the stories that define our engineering journey.',
      socials: {}
    }
  };

  const linkedinSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.75-.79 1.75-1.76s-.78-1.75-1.75-1.75c-.97 0-1.76.78-1.76 1.75s.79 1.76 1.76 1.76m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>`;
  const githubSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>`;
  const instagramSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;

  const profileModal = qs('#profileModal');
  const profileModalBackdrop = qs('#profileModalBackdrop');
  const profileModalCard = qs('#profileModalCard');
  const profileModalPhoto = qs('#profileModalPhoto');
  const profileModalName = qs('#profileModalName');
  const profileModalRole = qs('#profileModalRole');
  const profileModalQuote = qs('#profileModalQuote');
  const profileModalDivider = qs('#profileModalDivider');
  const profileModalSocials = qs('#profileModalSocials');
  const profileModalCloseBtn = qs('#profileModalCloseBtn');
  const profileModalFooterClose = qs('#profileModalFooterClose');

  const openProfileModal = (card, name) => {
    const data = teamProfiles[name] || {
      name: name,
      role: card.dataset.role || 'Member',
      photo: card.querySelector('.team-photo')?.getAttribute('src') || 'elston.jpg',
      quote: 'Building the signal at CIPHER SJEC.',
      socials: {}
    };

    if (profileModalPhoto) {
      profileModalPhoto.src = data.photo;
      profileModalPhoto.alt = `${data.name} — ${data.role}`;
    }
    if (profileModalName) profileModalName.textContent = data.name.toUpperCase();
    if (profileModalRole) profileModalRole.textContent = data.role.toUpperCase();
    if (profileModalQuote) profileModalQuote.textContent = `"${data.quote}"`;

    if (profileModalSocials) {
      profileModalSocials.innerHTML = '';
      const socials = data.socials || {};
      const socialKeys = Object.keys(socials);
      if (socialKeys.length > 0) {
        if (profileModalDivider) profileModalDivider.style.display = 'block';
        profileModalSocials.style.display = 'flex';
        if (socials.linkedin) {
          const a = document.createElement('a');
          a.className = 'profile-social-link';
          a.href = socials.linkedin;
          a.target = '_blank';
          a.rel = 'noopener';
          a.innerHTML = `${linkedinSvg}<span>LinkedIn</span>`;
          profileModalSocials.appendChild(a);
        }
        if (socials.github) {
          const a = document.createElement('a');
          a.className = 'profile-social-link';
          a.href = socials.github;
          a.target = '_blank';
          a.rel = 'noopener';
          a.innerHTML = `${githubSvg}<span>GitHub</span>`;
          profileModalSocials.appendChild(a);
        }
        if (socials.instagram) {
          const a = document.createElement('a');
          a.className = 'profile-social-link';
          a.href = socials.instagram;
          a.target = '_blank';
          a.rel = 'noopener';
          a.innerHTML = `${instagramSvg}<span>Instagram</span>`;
          profileModalSocials.appendChild(a);
        }
      } else {
        if (profileModalDivider) profileModalDivider.style.display = 'none';
        profileModalSocials.style.display = 'none';
      }
    }

    if (profileModal) {
      profileModal.classList.add('open');
      profileModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Framer Motion Animation
      const motion = window.Motion;
      if (motion && motion.animate && !reduceMotion) {
        // Card micro-scale
        motion.animate(card, { scale: [1, 1.03, 1] }, { duration: 0.25 });
        // Background blur and fade
        if (profileModalBackdrop) {
          motion.animate(profileModalBackdrop, { opacity: [0, 1] }, { duration: 0.25 });
        }
        // Modal fades upward
        if (profileModalCard) {
          motion.animate(profileModalCard, { opacity: [0, 1], y: [24, 0] }, { duration: 0.25, easing: [0.16, 1, 0.3, 1] });
        }
      }
    }
  };

  const closeProfileModal = () => {
    if (!profileModal || !profileModal.classList.contains('open')) return;

    const motion = window.Motion;
    if (motion && motion.animate && !reduceMotion) {
      const p1 = profileModalBackdrop ? motion.animate(profileModalBackdrop, { opacity: [1, 0] }, { duration: 0.25 }).finished : Promise.resolve();
      const p2 = profileModalCard ? motion.animate(profileModalCard, { opacity: [1, 0], y: [0, 20] }, { duration: 0.25 }).finished : Promise.resolve();

      Promise.all([p1, p2]).then(() => {
        profileModal.classList.remove('open');
        profileModal.setAttribute('aria-hidden', 'true');
        if (!archiveDossierModal?.classList.contains('open') && !archiveGalleryModal?.classList.contains('open')) {
          document.body.style.overflow = '';
        }
      });
    } else {
      profileModal.classList.remove('open');
      profileModal.setAttribute('aria-hidden', 'true');
      if (!archiveDossierModal?.classList.contains('open') && !archiveGalleryModal?.classList.contains('open')) {
        document.body.style.overflow = '';
      }
    }
  };

  qsa('[data-profile]').forEach(card => {
    card.addEventListener('click', () => {
      openProfileModal(card, card.dataset.profile);
    });
  });

  profileModalBackdrop?.addEventListener('click', closeProfileModal);
  profileModalCloseBtn?.addEventListener('click', closeProfileModal);
  profileModalFooterClose?.addEventListener('click', closeProfileModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileModal?.classList.contains('open')) {
      closeProfileModal();
    }
  });

  qsa('[data-close]').forEach(btn => btn.addEventListener('click', closeDrawers));
  overlay?.addEventListener('click', closeDrawers);

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
