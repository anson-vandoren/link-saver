function initModals() {
  function openModal($el) {
    $el.classList.add('is-active');

    // set focus correctly on the Add Link modal
    if ($el.id === 'add-link-modal') {
      document.getElementById('add-link-url').focus();
    }
  }

  function closeModal($el) {
    $el.classList.remove('is-active');

    if ($el.id === 'add-link-modal') {
      document.getElementById('add-link-form').reset();
    }
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (
    document.querySelectorAll(
      '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button',
    ) || []
  ).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    const e = event || window.event;

    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}
export default initModals;
