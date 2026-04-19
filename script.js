const reveals = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  document.body.classList.add('motion-ready');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.18
  });

  reveals.forEach((item) => revealObserver.observe(item));
}

const counter = document.querySelector('[data-counter]');

if (counter) {
  const target = Number(counter.dataset.counter);
  const duration = 1400;
  const start = performance.now();

  const animateCounter = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(target * eased);

    counter.textContent = value.toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(animateCounter);
    }
  };

  requestAnimationFrame(animateCounter);
}

const copyButton = document.querySelector('[data-copy-target]');

if (copyButton) {
  const target = document.getElementById(copyButton.dataset.copyTarget);
  const targetText = target ? target.textContent.trim() : '';
  const hasRealCA = targetText && !/coming|drops at launch|soon|tbd/i.test(targetText);

  if (!hasRealCA) {
    copyButton.disabled = true;
  } else {
    copyButton.textContent = 'Copy CA';

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(targetText);
        copyButton.textContent = 'Copied';

        window.setTimeout(() => {
          copyButton.textContent = 'Copy CA';
        }, 1400);
      } catch {
        copyButton.textContent = 'Copy failed';
      }
    });
  }
}
