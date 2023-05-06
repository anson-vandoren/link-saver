import { showNotification } from './notification';
import { getElementById } from './utils';

type LoadLinksCallback = (page: number) => void | Promise<void>;
function createPaginationItem(pageNumber: number, currentPage: number, cb: LoadLinksCallback) {
  const listItem = document.createElement('li');
  const paginationLink = document.createElement('a');
  paginationLink.classList.add('pagination-link');
  paginationLink.textContent = `${pageNumber}`;
  paginationLink.setAttribute('aria-label', `Goto page ${pageNumber}`);
  if (pageNumber === currentPage) {
    paginationLink.classList.add('is-current');
    paginationLink.setAttribute('aria-current', 'page');
  } else {
    paginationLink.addEventListener('click', () => {
      const res = cb(pageNumber);
      if (res instanceof Promise) {
        res.catch((_err) => {
          showNotification('Failed to load links', 'danger');
        });
      }
    });
  }
  listItem.appendChild(paginationLink);
  return listItem;
}

function createEllipsis() {
  const listItem = document.createElement('li');
  const ellipsis = document.createElement('span');
  ellipsis.classList.add('pagination-ellipsis');
  ellipsis.innerHTML = '&hellip;';
  listItem.appendChild(ellipsis);
  return listItem;
}

/* Expected pagination layout:
 * 1 2 3 4 5 ... 10
 * 1 ... 4 5 6 ... 10
 * 1 ... 6 7 8 9 10
 */
export function updatePagination(currentPage: number, totalPages: number, cb: LoadLinksCallback) {
  const paginationList = document.querySelector('.pagination-list');
  if (!paginationList) {
    throw new Error('Could not find pagination list');
  }

  const prevBtn = document.querySelector('.pagination-previous');
  const nextBtn = document.querySelector('.pagination-next');
  if (!prevBtn || !nextBtn) {
    throw new Error('Could not find pagination buttons');
  }

  paginationList.innerHTML = '';
  if (totalPages <= 1) {
    getElementById('pagination-nav', HTMLElement)?.classList.add('is-hidden');
    return;
  }
  getElementById('pagination-nav', HTMLElement)?.classList.remove('is-hidden');

  const maxPagesToShow = 5; // Adjust this value to show more or fewer page buttons

  let startPage = Math.max(2, currentPage - Math.floor((maxPagesToShow - 2) / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);
  startPage = Math.max(2, endPage - (maxPagesToShow - 3));
  if (endPage < startPage) {
    endPage = startPage;
  }

  // Add the first page button
  paginationList.appendChild(createPaginationItem(1, currentPage, cb));

  // Add left ellipsis if necessary
  if (startPage > 2) {
    paginationList.appendChild(createEllipsis());
  } else {
    // if not an ellipsis, add the second page button
    paginationList.appendChild(createPaginationItem(2, currentPage, cb));
    startPage++;
    endPage++;
  }

  // if we won't be adding an ellipsis at the end, make startPage one sooner
  if (endPage === totalPages - 1) {
    startPage--;
  }

  // Add the page buttons
  for (let i = startPage; i <= endPage; i++) {
    const listItem = createPaginationItem(i, currentPage, cb);
    paginationList.appendChild(listItem);
  }

  // Add right ellipsis if necessary
  if (endPage < totalPages - 1) {
    paginationList.appendChild(createEllipsis());
  }

  // Add the last page button
  if (totalPages > 1) {
    paginationList.appendChild(createPaginationItem(totalPages, currentPage, cb));
  }


  // Add event listeners for previous and next buttons
  const prevBtnClone = prevBtn.cloneNode(true) as typeof prevBtn;
  const nextBtnClone = nextBtn.cloneNode(true) as typeof nextBtn;

  prevBtn.replaceWith(prevBtnClone);
  nextBtn.replaceWith(nextBtnClone);

  if (currentPage <= 1) {
    prevBtnClone.setAttribute('disabled', '');
  } else {
    prevBtnClone.removeAttribute('disabled');
    prevBtnClone.addEventListener('click', () => {
      const res = cb(currentPage - 1);
      if (res instanceof Promise) {
        res.catch((_err) => {
          showNotification('Failed to load links', 'danger');
        });
      }
    });
  }

  if (currentPage >= totalPages) {
    nextBtnClone.setAttribute('disabled', '');
  } else {
    nextBtnClone.removeAttribute('disabled');
    nextBtnClone.addEventListener('click', () => {
      const res = cb(currentPage + 1);
      if (res instanceof Promise) {
        res.catch((_err) => {
          showNotification('Failed to load links', 'danger');
        });
      }
    });
  }
}
