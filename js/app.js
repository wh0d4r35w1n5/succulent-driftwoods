(function () {
  'use strict';

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

  // ── Gallery video: pause when out of view ──
  const galleryVideo = document.getElementById('gallery-video');
  if (galleryVideo) {
    const pauseObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          galleryVideo.play().catch(() => {});
        } else {
          galleryVideo.pause();
        }
      });
    }, { threshold: 0.15 });
    pauseObs.observe(galleryVideo);
  }

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

  // ── Booking form + Square payments ──
  const SQUARE_PAYMENT_LINKS = {
    '1 guest - $100': 'https://square.link/u/uqVOkXIn',
    '2 guests - $200': 'https://square.link/u/H0RSG1gA',
    '3 guests - $300': 'https://square.link/u/xCE5Ol4C',
    '4 guests - $400': 'https://square.link/u/mDzg0gam',
    '5+ guests - Linda will confirm': 'https://square.link/u/QNgVpvFE'
  };

  const form = document.getElementById('book-form');
  const submitBtn = document.getElementById('book-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const formError = document.getElementById('form-error');
  const bookingModal = document.getElementById('booking-modal');
  const bookingModalDetail = document.getElementById('booking-modal-detail');
  const bookingModalClose = document.getElementById('booking-modal-close');
  const bookingModalPay = document.getElementById('booking-modal-pay');

  function setFormLoading(loading) {
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnLoading.hidden = !loading;
  }

  function showBookingSuccess(detail, guestsKey) {
    bookingModalDetail.textContent = detail;
    const payUrl = SQUARE_PAYMENT_LINKS[guestsKey];
    if (payUrl) {
      bookingModalPay.href = payUrl;
      bookingModalPay.hidden = false;
      bookingModalPay.textContent = 'Pay Now';
    } else {
      bookingModalPay.hidden = true;
    }
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

      // Submit to Web3Forms (beauevansict@gmail.com)
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error('Submission failed');

      // Also submit to FormSubmit for Linda (silent BCC via hidden iframe)
      const bccForm = document.getElementById('bcc-form');
      bccForm.querySelector('[name="name"]').value = data.name || '';
      bccForm.querySelector('[name="email"]').value = data.email || '';
      bccForm.querySelector('[name="phone"]').value = data.phone || '';
      bccForm.querySelector('[name="workshop_date"]').value = data.workshop_date || '';
      bccForm.querySelector('[name="guests"]').value = data.guests || '';
      bccForm.querySelector('[name="message"]').value = data.message || '';
      bccForm.submit();

      showBookingSuccess(`${workshopDate} · ${guests}`, guests);
    } catch {
      setFormLoading(false);
      btnText.textContent = 'Confirm Booking';
      formError.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();
