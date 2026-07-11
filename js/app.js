(function () {
  'use strict';

  const PHOTOS = [
    'photo_1_2026-07-07_19-43-48.jpg','photo_2_2026-07-07_19-43-48.jpg','photo_3_2026-07-07_19-43-48.jpg',
    'photo_4_2026-07-07_19-43-48.jpg','photo_5_2026-07-07_19-43-48.jpg','photo_6_2026-07-07_19-43-48.jpg',
    'photo_7_2026-07-07_19-43-48.jpg','photo_8_2026-07-07_19-43-48.jpg','photo_9_2026-07-07_19-43-48.jpg',
    'photo_10_2026-07-07_19-43-48.jpg','photo_11_2026-07-07_19-43-48.jpg','photo_12_2026-07-07_19-43-48.jpg',
    'photo_13_2026-07-07_19-43-48.jpg','photo_14_2026-07-07_19-43-48.jpg','photo_15_2026-07-07_19-43-48.jpg',
    'photo_16_2026-07-07_19-43-48.jpg','photo_17_2026-07-07_19-43-48.jpg','photo_18_2026-07-07_19-43-48.jpg',
    'photo_19_2026-07-07_19-43-48.jpg','photo_20_2026-07-07_19-43-48.jpg','photo_21_2026-07-07_19-43-48.jpg',
    'photo_22_2026-07-07_19-43-48.jpg','photo_23_2026-07-07_19-43-48.jpg','photo_24_2026-07-07_19-43-48.jpg',
    'photo_25_2026-07-07_19-43-48.jpg','photo_26_2026-07-07_19-43-48.jpg','photo_27_2026-07-07_19-43-48.jpg',
    'photo_28_2026-07-07_19-43-48.jpg','photo_29_2026-07-07_19-43-48.jpg','photo_30_2026-07-07_19-43-48.jpg',
    'photo_31_2026-07-07_19-43-48.jpg','photo_32_2026-07-07_19-43-48.jpg','photo_33_2026-07-07_19-43-48.jpg',
    'photo_34_2026-07-07_19-43-48.jpg','photo_35_2026-07-07_19-43-48.jpg','photo_36_2026-07-07_19-43-48.jpg',
    'photo_37_2026-07-07_19-43-48.jpg','photo_38_2026-07-07_19-43-48.jpg','photo_39_2026-07-07_19-43-48.jpg',
    'photo_40_2026-07-07_19-43-48.jpg','photo_41_2026-07-07_19-43-48.jpg','photo_42_2026-07-07_19-43-48.jpg',
    'photo_43_2026-07-07_19-43-48.jpg','photo_44_2026-07-07_19-43-48.jpg','photo_45_2026-07-07_19-43-48.jpg',
    'photo_46_2026-07-07_19-43-48.jpg','photo_47_2026-07-07_19-43-48.jpg','photo_48_2026-07-07_19-43-48.jpg',
    'photo_49_2026-07-07_19-43-48.jpg','photo_50_2026-07-07_19-43-48.jpg','photo_51_2026-07-07_19-43-48.jpg',
    'photo_52_2026-07-07_19-43-48.jpg','photo_53_2026-07-07_19-43-48.jpg','photo_54_2026-07-07_19-43-48.jpg',
    'photo_55_2026-07-07_19-43-48.jpg','photo_56_2026-07-07_19-43-48.jpg','photo_57_2026-07-07_19-43-48.png',
    'photo_58_2026-07-07_19-43-48.jpg','photo_59_2026-07-07_19-43-48.jpg','photo_60_2026-07-07_19-43-48.jpg',
    'photo_61_2026-07-07_19-43-48.jpg','photo_62_2026-07-07_19-43-48.jpg','photo_63_2026-07-07_19-43-48.jpg',
    'photo_64_2026-07-07_19-43-48.jpg','photo_65_2026-07-07_19-43-48.jpg','photo_66_2026-07-07_19-43-48.jpg',
    'photo_67_2026-07-07_19-43-48.jpg','photo_68_2026-07-07_19-43-48.jpg','photo_69_2026-07-07_19-43-48.jpg',
    'photo_70_2026-07-07_19-43-48.jpg','photo_71_2026-07-07_19-43-48.jpg','photo_72_2026-07-07_19-43-48.jpg',
    'photo_73_2026-07-07_19-43-48.jpg','photo_74_2026-07-07_19-43-48.jpg','photo_75_2026-07-07_19-43-48.jpg',
    'photo_76_2026-07-07_19-43-48.jpg','photo_77_2026-07-07_19-43-48.jpg','photo_78_2026-07-07_19-43-48.jpg',
    'photo_79_2026-07-07_19-43-48.jpg','photo_80_2026-07-07_19-43-48.jpg','photo_81_2026-07-07_19-43-48.jpg',
    'photo_82_2026-07-07_19-43-48.jpg','photo_83_2026-07-07_19-43-48.jpg','photo_84_2026-07-07_19-43-48.jpg',
    'photo_85_2026-07-07_19-43-48.jpg','photo_86_2026-07-07_19-43-48.jpg','photo_87_2026-07-07_19-43-48.jpg',
    'photo_88_2026-07-07_19-43-48.jpg','photo_89_2026-07-07_19-43-48.jpg','photo_90_2026-07-07_19-43-48.jpg',
    'photo_91_2026-07-07_19-43-48.jpg','photo_92_2026-07-07_19-43-48.jpg','photo_93_2026-07-07_19-43-48.jpg',
    'photo_94_2026-07-07_19-43-48.jpg','photo_95_2026-07-07_19-43-48.jpg','photo_96_2026-07-07_19-43-48.jpg',
    'photo_97_2026-07-07_19-43-48.jpg','photo_98_2026-07-07_19-43-48.jpg','photo_99_2026-07-07_19-43-48.jpg'
  ];

  const FIRST_SATURDAY = new Date(2026, 6, 25); // 25 July 2026
  const SATURDAY_COUNT = 52; // 1 year of Saturdays

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // ── Header scroll ──
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ── Mobile nav ──
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ── Hero slideshow ──
  const slides = document.querySelectorAll('.hero-slide');
  let slideIdx = 0;
  setInterval(() => {
    slides[slideIdx].classList.remove('active');
    slideIdx = (slideIdx + 1) % slides.length;
    slides[slideIdx].classList.add('active');
  }, 6000);

  // ── Scroll reveal ──
  const revealEls = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObs.observe(el));

  // ── Gallery ──
  const grid = document.getElementById('gallery-grid');
  const fragment = document.createDocumentFragment();

  PHOTOS.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'listitem');
    item.dataset.index = i;

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Workshop creation ${i + 1}`;
    img.loading = i < 12 ? 'eager' : 'lazy';
    img.decoding = 'async';

    item.appendChild(img);
    item.addEventListener('click', () => openLightbox(i));
    fragment.appendChild(item);
  });
  grid.appendChild(fragment);

  // ── Lightbox ──
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCounter = document.getElementById('lightbox-counter');
  let currentIdx = 0;

  function openLightbox(idx) {
    currentIdx = idx;
    updateLightbox();
    lightbox.removeAttribute('hidden');
    requestAnimationFrame(() => lightbox.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => lightbox.setAttribute('hidden', ''), 300);
  }

  function updateLightbox() {
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = PHOTOS[currentIdx];
      lbImg.alt = `Workshop creation ${currentIdx + 1}`;
      lbCounter.textContent = `${currentIdx + 1} / ${PHOTOS.length}`;
      lbImg.style.opacity = '1';
    }, 150);
  }

  function navLightbox(dir) {
    currentIdx = (currentIdx + dir + PHOTOS.length) % PHOTOS.length;
    updateLightbox();
  }

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => navLightbox(-1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => navLightbox(1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  });

  // ── Saturday date picker ──
  const dateSelect = document.getElementById('workshop_date');
  const formatter = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  for (let i = 0; i < SATURDAY_COUNT; i++) {
    const sat = new Date(FIRST_SATURDAY);
    sat.setDate(FIRST_SATURDAY.getDate() + i * 7);
    const label = `${formatter.format(sat)} · 10:00 AM – 12:00 PM`;
    const value = sat.toISOString().split('T')[0];
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    opt.dataset.iso = value;
    dateSelect.appendChild(opt);
  }

  // ── Booking form (Formsubmit.co) ──
  const form = document.getElementById('book-form');
  const submitBtn = document.getElementById('book-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const formError = document.getElementById('form-error');
  const bookingModal = document.getElementById('booking-modal');
  const bookingModalDetail = document.getElementById('booking-modal-detail');
  const bookingModalClose = document.getElementById('booking-modal-close');

  function setFormLoading(loading) {
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnLoading.hidden = !loading;
  }

  function showBookingSuccess(detail) {
    bookingModalDetail.textContent = detail;
    bookingModal.removeAttribute('hidden');
    requestAnimationFrame(() => bookingModal.classList.add('open'));
    document.body.style.overflow = 'hidden';
    submitBtn.disabled = true;
    btnText.textContent = 'Sent';
    btnText.hidden = false;
    btnLoading.hidden = true;
    form.reset();
  }

  function closeBookingModal() {
    bookingModal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      bookingModal.setAttribute('hidden', '');
      btnText.textContent = 'Confirm Booking';
      btnText.hidden = false;
      btnLoading.hidden = true;
      submitBtn.disabled = false;
    }, 300);
  }

  bookingModalClose.addEventListener('click', closeBookingModal);
  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBookingModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const workshopDate = formData.get('workshop_date');
    const guests = formData.get('guests');

    setFormLoading(true);

    try {
      const data = Object.fromEntries(formData.entries());

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error('Submission failed');

      showBookingSuccess(`${workshopDate} · ${guests}`);
    } catch {
      setFormLoading(false);
      btnText.textContent = 'Confirm Booking';
      formError.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();
