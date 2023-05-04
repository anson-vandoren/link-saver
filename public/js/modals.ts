function initModals() {
  function openModal(el: HTMLElement) {
    el.classList.add('is-active');

    // set focus correctly on the Add Link modal
    if (el.id === 'add-link-modal') {
      const addLinkUrl = document.getElementById('add-link-url');
      if (!addLinkUrl) {
        throw new Error('Could not find add-link-url element');
      }
      addLinkUrl.focus();
    }
  }

  function closeModal(el: Element) {
    el.classList.remove('is-active');

    if (el.id === 'add-link-modal') {
      const addLinkForm = document.getElementById('add-link-form');
      if (!(addLinkForm instanceof HTMLFormElement)) {
        throw new Error('Could not find add-link-form element');
      }
      addLinkForm.reset();
    }
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach((modal) => {
      closeModal(modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach((trigger) => {
    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error('Could not find modal trigger element');
    }
    const modal = trigger.dataset.target;
    if (!modal) {
      throw new Error('Could not find modal target');
    }
    const target = document.getElementById(modal);
    if (!target) {
      throw new Error('Could not find modal target element');
    }
    trigger.addEventListener('click', () => {
      openModal(target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (
    document.querySelectorAll(
      '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button',
    ) || []
  ).forEach((close) => {
    const target = close.closest('.modal');
    if (!target) {
      throw new Error('Could not find modal target element');
    }

    close.addEventListener('click', () => {
      closeModal(target);
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
