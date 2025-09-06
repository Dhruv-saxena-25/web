/* =========================
   AOS safe init
========================= */
document.addEventListener('DOMContentLoaded', function () {
  if (window.AOS && typeof AOS.init === 'function') {
    AOS.init({ once: true, duration: 600, easing: 'ease-out' });
  } else {
    document.querySelectorAll('[data-aos]').forEach(el => el.style.opacity = '1');
  }
});

/* =========================
   Section Show More/Less
   - Projects: first 3
   - Skills: first 6
========================= */
(function () {
  function setupSection(sectionEl, limit) {
    const list = sectionEl.querySelector('.project-list, .skills-list');
    if (!list) return;

    const cards = Array.from(list.children).filter(el => /(^|\s)col-/.test(el.className));
    const btn = sectionEl.querySelector('.show-more-btn');
    if (!btn) return;

    if (cards.length <= limit) {
      btn.style.display = 'none';
      return;
    }

    btn.addEventListener('click', function () {
      sectionEl.classList.toggle('expanded');
      btn.textContent = sectionEl.classList.contains('expanded') ? 'Show Less' : 'Show More';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.project-section').forEach(el => setupSection(el, 3));
    document.querySelectorAll('.skills-section').forEach(el => setupSection(el, 6));
  });
})();

/* =========================
   Per-card Read more/less
   - Truncate to 45 words
========================= */
(function () {
  const WORD_LIMIT = 45;

  function wordCount(str) {
    return (str.trim().match(/\S+/g) || []).length;
  }
  function truncateToWords(str, limit) {
    const words = (str.trim().match(/\S+/g) || []);
    if (words.length <= limit) return str.trim();
    return words.slice(0, limit).join(' ') + '…';
  }

  function collectTargets() {
    const skillParas = Array.from(document.querySelectorAll('.skills p'));
    const cardParas  = Array.from(document.querySelectorAll('.card-custom-content p'));
    return [...skillParas, ...cardParas];
  }

  function makeToggle(p) {
    const original = p.textContent;
    if (wordCount(original) <= WORD_LIMIT) return;

    const truncated = truncateToWords(original, WORD_LIMIT);
    p.setAttribute('data-fulltext', original);
    p.textContent = truncated;

    const btn = document.createElement('button');
    btn.className = 'read-more-btn linky';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Read more';
    p.insertAdjacentElement('afterend', btn);

    btn.addEventListener('click', function () {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        p.textContent = truncated;
        btn.textContent = 'Read more';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        p.textContent = p.getAttribute('data-fulltext');
        btn.textContent = 'Read less';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    collectTargets().forEach(makeToggle);
  });
})();

/* =========================
   CONTACT FORM VALIDATION + SUBMIT (Web3Forms)
========================= */
(function () {
  const form   = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('contactStatus');
  const btn    = document.getElementById('cf-submit');
  const nameEl = document.getElementById('cf-name');
  const emailEl= document.getElementById('cf-email');
  const msgEl  = document.getElementById('cf-message');

  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

  // helpers
  const setStatus = (type, text) => {
    // type: 'success' | 'danger' | 'warning' | 'info'
    status.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
  };

  const disableBtn = (d) => {
    if (!btn) return;
    btn.disabled = d;
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = d ? 'Sending…' : btn.dataset.originalText;
  };

  // Extra custom validation
  function validateCustom() {
    // Reset custom messages
    nameEl.setCustomValidity('');
    msgEl.setCustomValidity('');

    // Name pattern already enforced via HTML pattern
    // Message word count (>= 5 words) AND length >= 20
    const words = (msgEl.value.trim().match(/\S+/g) || []).length;
    if (words < 5 || msgEl.value.trim().length < 20) {
      msgEl.setCustomValidity('Please write at least 5 words (20+ characters).');
    }

    // Return overall validity
    return form.checkValidity();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Run validity checks
    const isValid = validateCustom();
    form.classList.add('was-validated');

    if (!isValid) {
      setStatus('warning', 'Please fix the highlighted fields and try again.');
      return;
    }

    // Prevent spam (honeypot checked)
    const botcheck = form.querySelector('input[name="botcheck"]');
    if (botcheck && botcheck.checked) {
      setStatus('danger', 'Spam detected. Please reload the page and try again.');
      return;
    }

    disableBtn(true);

    try {
      const formData = new FormData(form);
      // optional: reply-to header
      formData.append('replyto', emailEl.value);

      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const json = await res.json();

      if (json && (json.success || json.message === 'Submission successful')) {
        setStatus('success', 'Thanks! Your message has been sent successfully.');
        form.reset();
        form.classList.remove('was-validated');
      } else {
        const msg = (json && json.message) ? json.message : 'Something went wrong. Please try again later.';
        setStatus('danger', `Failed to send message: ${msg}`);
      }
    } catch (err) {
      setStatus('danger', 'Network error while sending the message. Please check your connection and try again.');
    } finally {
      disableBtn(false);
    }
  });
})();

