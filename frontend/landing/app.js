/**
 * Closira Landing Page — App Logic
 *
 * Handles:
 * - Auth modals (login / signup) with seamless transitions
 * - Client-side form validation with inline errors
 * - API integration with FastAPI backend (/auth/login, /auth/signup)
 * - JWT token storage in localStorage
 * - Scroll-triggered reveal animations (IntersectionObserver)
 * - Animated stat counters
 * - Navbar scroll state
 * - Mobile hamburger menu
 * - Password visibility toggle
 */

(function () {
  'use strict';

  // ─── Configuration ────────────────────────────────────────────────────────
  const API_BASE_URL = 'http://localhost:8000';
  const API_TIMEOUT_MS = 8000;

  const TOKEN_KEYS = {
    access: 'closira_access_token',
    refresh: 'closira_refresh_token',
  };

  // ─── DOM Cache ────────────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const navbar     = $('#navbar');
  const hamburger  = $('#hamburger');
  const mobileNav  = $('#mobileNav');

  const loginModal   = $('#loginModal');
  const signupModal  = $('#signupModal');
  const successModal = $('#successModal');

  const loginForm  = $('#loginForm');
  const signupForm = $('#signupForm');

  // ─── Modal Management ─────────────────────────────────────────────────────

  /** @param {'login'|'signup'|'success'} which */
  function openModal(which) {
    closeAllModals();

    // Close mobile nav if open
    closeMobileNav();

    const modal =
      which === 'login'  ? loginModal :
      which === 'signup' ? signupModal :
      which === 'success' ? successModal : null;

    if (!modal) return;

    document.body.style.overflow = 'hidden';
    modal.classList.add('open');

    // Focus the first input after the animation settles
    setTimeout(() => {
      const firstInput = modal.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 350);
  }

  function closeAllModals() {
    [loginModal, signupModal, successModal].forEach((m) => {
      if (m) m.classList.remove('open');
    });
    document.body.style.overflow = '';
    clearFormErrors(loginForm);
    clearFormErrors(signupForm);
    hideGlobalError('login');
    hideGlobalError('signup');
  }

  // Expose globally for inline onclick handlers
  window.openModal = openModal;
  window.closeAllModals = closeAllModals;

  // Close buttons
  $('#loginClose')?.addEventListener('click', closeAllModals);
  $('#signupClose')?.addEventListener('click', closeAllModals);

  // Backdrop click to close
  [loginModal, signupModal, successModal].forEach((overlay) => {
    if (!overlay) return;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Switch between login ↔ signup
  $('#loginToSignup')?.addEventListener('click', () => openModal('signup'));
  $('#signupToLogin')?.addEventListener('click', () => openModal('login'));

  // Nav buttons
  $('#navLoginBtn')?.addEventListener('click', () => openModal('login'));
  $('#navSignupBtn')?.addEventListener('click', () => openModal('signup'));
  $('#heroSignupBtn')?.addEventListener('click', () => openModal('signup'));
  $('#mobileLoginBtn')?.addEventListener('click', () => openModal('login'));
  $('#mobileSignupBtn')?.addEventListener('click', () => openModal('signup'));

  // ─── Password Toggle ──────────────────────────────────────────────────────

  $$('.form-toggle-pw').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');
      if (eyeOpen) eyeOpen.style.display = isPassword ? 'none' : 'block';
      if (eyeClosed) eyeClosed.style.display = isPassword ? 'block' : 'none';
    });
  });

  // ─── Form Validation ──────────────────────────────────────────────────────

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFieldError(errorId, message) {
    const el = document.getElementById(errorId);
    if (!el) return;
    el.classList.add('visible');
    const span = el.querySelector('span');
    if (span) span.textContent = message;

    // Also add error class to the sibling input
    const group = el.closest('.form-group');
    const input = group?.querySelector('.form-input');
    if (input) input.classList.add('error');
  }

  function clearFieldError(errorId) {
    const el = document.getElementById(errorId);
    if (!el) return;
    el.classList.remove('visible');

    const group = el.closest('.form-group');
    const input = group?.querySelector('.form-input');
    if (input) input.classList.remove('error');
  }

  function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.form-error').forEach((e) => e.classList.remove('visible'));
    form.querySelectorAll('.form-input').forEach((i) => i.classList.remove('error'));
  }

  function showGlobalError(type, message) {
    const banner = document.getElementById(`${type}Error`);
    const text = document.getElementById(`${type}ErrorText`);
    if (banner && text) {
      text.textContent = message;
      banner.classList.add('visible');
    }
  }

  function hideGlobalError(type) {
    const banner = document.getElementById(`${type}Error`);
    if (banner) banner.classList.remove('visible');
  }

  // ─── Login Form ────────────────────────────────────────────────────────────

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(loginForm);
    hideGlobalError('login');

    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;

    let valid = true;

    if (!email) {
      showFieldError('loginEmailError', 'Email is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError('loginEmailError', 'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError('loginPasswordError', 'Password is required.');
      valid = false;
    }

    if (!valid) {
      // Focus first errored input
      const firstError = loginForm.querySelector('.form-input.error');
      if (firstError) firstError.focus();
      return;
    }

    // Submit
    const submitBtn = $('#loginSubmit');
    setButtonLoading(submitBtn, true);

    try {
      const tokens = await authFetch('/auth/login', {
        email: email.toLowerCase(),
        password,
      });

      storeTokens(tokens.access_token, tokens.refresh_token);
      showSuccess('login');
    } catch (err) {
      showGlobalError('login', err.message || 'Login failed. Please try again.');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Clear errors on input
  $('#loginEmail')?.addEventListener('input', () => clearFieldError('loginEmailError'));
  $('#loginPassword')?.addEventListener('input', () => clearFieldError('loginPasswordError'));

  // ─── Signup Form ───────────────────────────────────────────────────────────

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(signupForm);
    hideGlobalError('signup');

    const fullName = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim();
    const password = $('#signupPassword').value;
    const confirm = $('#signupConfirm').value;

    let valid = true;

    if (!email) {
      showFieldError('signupEmailError', 'Email is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError('signupEmailError', 'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError('signupPasswordError', 'Password is required.');
      valid = false;
    } else if (password.length < 8) {
      showFieldError('signupPasswordError', 'Password must be at least 8 characters.');
      valid = false;
    }

    if (!confirm) {
      showFieldError('signupConfirmError', 'Please confirm your password.');
      valid = false;
    } else if (password && password !== confirm) {
      showFieldError('signupConfirmError', 'Passwords do not match.');
      valid = false;
    }

    if (!valid) {
      const firstError = signupForm.querySelector('.form-input.error');
      if (firstError) firstError.focus();
      return;
    }

    const submitBtn = $('#signupSubmit');
    setButtonLoading(submitBtn, true);

    try {
      const body = { email: email.toLowerCase(), password };
      if (fullName) body.full_name = fullName;

      const tokens = await authFetch('/auth/signup', body);

      storeTokens(tokens.access_token, tokens.refresh_token);
      showSuccess('signup');
    } catch (err) {
      showGlobalError('signup', err.message || 'Signup failed. Please try again.');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Clear errors on input
  $('#signupEmail')?.addEventListener('input', () => clearFieldError('signupEmailError'));
  $('#signupPassword')?.addEventListener('input', () => clearFieldError('signupPasswordError'));
  $('#signupConfirm')?.addEventListener('input', () => clearFieldError('signupConfirmError'));

  // ─── API Fetch ─────────────────────────────────────────────────────────────

  async function authFetch(path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.detail ??
          data?.error ??
          data?.errors?.[0]?.message ??
          `HTTP ${res.status}`;
        throw new Error(message);
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Token Storage ─────────────────────────────────────────────────────────

  function storeTokens(access, refresh) {
    try {
      localStorage.setItem(TOKEN_KEYS.access, access);
      localStorage.setItem(TOKEN_KEYS.refresh, refresh);
    } catch (_) {
      // localStorage unavailable — tokens won't persist
    }
  }

  // ─── Success ───────────────────────────────────────────────────────────────

  function showSuccess(type) {
    const text = $('#successText');
    if (text) {
      text.textContent =
        type === 'login'
          ? 'Welcome back! You have been signed in successfully.'
          : 'You are all set. Your account has been created successfully.';
    }
    openModal('success');
  }

  // ─── Button Loading State ──────────────────────────────────────────────────

  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    const label = btn.querySelector('.btn-label');

    if (isLoading) {
      btn.disabled = true;
      if (label) label.style.display = 'none';

      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      spinner.setAttribute('aria-label', 'Loading…');
      btn.appendChild(spinner);
    } else {
      btn.disabled = false;
      if (label) label.style.display = '';

      const spinner = btn.querySelector('.spinner');
      if (spinner) spinner.remove();
    }
  }

  // ─── Navbar Scroll State ───────────────────────────────────────────────────

  let lastScroll = 0;

  function handleNavScroll() {
    const y = window.scrollY;
    if (y > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // Initial check

  // ─── Mobile Hamburger ──────────────────────────────────────────────────────

  function closeMobileNav() {
    hamburger?.classList.remove('active');
    mobileNav?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('active');
    mobileNav?.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile nav on link click
  $$('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  // ─── Scroll Reveal (IntersectionObserver) ──────────────────────────────────

  function initReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Show everything immediately
      $$('.reveal').forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    $$('.reveal').forEach((el) => observer.observe(el));
  }

  // ─── Animated Stat Counters ────────────────────────────────────────────────

  function initCounters() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const counters = $$('.stat-value[data-count]');
    if (!counters.length) return;

    const formatNumber = (num) => {
      if (num >= 10000) return (num / 1000).toFixed(0) + 'K+';
      if (num >= 1000) return num.toLocaleString();
      return String(num);
    };

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';

      if (prefersReduced) {
        el.textContent = (target >= 10000 ? formatNumber(target) : String(target)) + suffix;
        return;
      }

      const duration = 2000;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);

        el.textContent = (current >= 10000 ? formatNumber(current) : String(current)) + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  // ─── Smooth Scroll for Anchor Links ────────────────────────────────────────

  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      closeMobileNav();

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ─── Initialize ────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initCounters();
  });

  // Also trigger for already-loaded pages
  if (document.readyState !== 'loading') {
    initReveal();
    initCounters();
  }
})();
