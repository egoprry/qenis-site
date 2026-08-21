(() => {
  'use strict';

  const toast = document.getElementById('toast');
  let toastTimer = 0;

  function showToast(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1800);
  }

  // Selection-based copy. Works on plain http and when the async clipboard
  // API rejects (unfocused document, denied permission).
  function copyViaSelection(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  async function copyText(text, label = 'Contract address') {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied`);
        return;
      } catch (error) {
        // Fall through to the selection-based path below.
      }
    }

    if (copyViaSelection(text)) {
      showToast(`${label} copied`);
    } else {
      showToast('Could not copy — press and hold the address instead');
    }
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!(dialog instanceof HTMLDialogElement)) return;
    document.querySelectorAll('dialog[open]').forEach((open) => open.close());
    dialog.showModal();
  }

  document.addEventListener('click', (event) => {
    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) {
      copyText(copyButton.dataset.copy || '', copyButton.dataset.copyLabel || 'Contract address');
      return;
    }

    const dialogTrigger = event.target.closest('[data-dialog]');
    if (dialogTrigger) {
      openDialog(dialogTrigger.dataset.dialog);
      return;
    }

    const closeButton = event.target.closest('[data-close-dialog]');
    if (closeButton) {
      const dialog = closeButton.closest('dialog');
      if (dialog instanceof HTMLDialogElement) dialog.close();
    }
  });

  // Click outside the panel closes the dialog.
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  // Keep Escape reliable across browsers, including when a scrollable dialog
  // panel rather than one of its buttons currently owns keyboard focus.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const dialog = document.querySelector('dialog[open]');
    if (dialog instanceof HTMLDialogElement) {
      event.preventDefault();
      dialog.close();
    }
  });

  /* ---------- Pointer parallax on the glass panel ----------
     Nudges the resting 3/4 tilt a few degrees toward the cursor. Skipped
     entirely for touch input, reduced-motion users, and narrow layouts,
     where the panel is deliberately flat. */

  const panel = document.querySelector('.panel');
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const wideEnough = window.matchMedia('(min-width: 921px)');

  const MAX_NUDGE_X = 3.2; // degrees, vertical pointer travel
  const MAX_NUDGE_Y = 5.5; // degrees, horizontal pointer travel

  let frame = 0;

  function restingAngle(name) {
    const raw = getComputedStyle(root).getPropertyValue(name).trim();
    return parseFloat(raw) || 0;
  }

  function tiltEnabled() {
    return panel && finePointer.matches && wideEnough.matches && !reduceMotion.matches;
  }

  function resetTilt() {
    root.style.removeProperty('--tilt-x');
    root.style.removeProperty('--tilt-y');
  }

  function onPointerMove(event) {
    if (!tiltEnabled()) return;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      // -1 .. 1 across the viewport, from the centre.
      const dx = (event.clientX / window.innerWidth) * 2 - 1;
      const dy = (event.clientY / window.innerHeight) * 2 - 1;
      root.style.setProperty('--tilt-x', `${restingAngle('--tilt-rest-x') - dy * MAX_NUDGE_X}deg`);
      root.style.setProperty('--tilt-y', `${restingAngle('--tilt-rest-y') + dx * MAX_NUDGE_Y}deg`);
    });
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', resetTilt, { passive: true });
  window.addEventListener('blur', resetTilt);

  // Drop any inline tilt when the conditions stop holding (resize across the
  // breakpoint, or the user turns on reduced motion).
  [reduceMotion, finePointer, wideEnough].forEach((query) => {
    const onChange = () => { if (!tiltEnabled()) resetTilt(); };
    if (query.addEventListener) query.addEventListener('change', onChange);
    else query.addListener(onChange);
  });
})();
