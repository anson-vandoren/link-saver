/* Expected pagination layout:
 * 1 2 3 4 5 ... 10
 * 1 ... 4 5 6 ... 10
 * 1 ... 6 7 8 9 10
 */
export function updatePagination(currentPage, totalPages, loadLinksCb) {
  const paginationList = document.querySelector('.pagination-list');
  paginationList.innerHTML = '';

  const maxPagesToShow = 5; // Adjust this value to show more or fewer page buttons

  let startPage = Math.max(2, currentPage - Math.floor((maxPagesToShow - 2) / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);
  startPage = Math.max(2, endPage - (maxPagesToShow - 3));

  // Add the first page button
  paginationList.appendChild(createPaginationItem(1, currentPage, loadLinksCb));

  // Add left ellipsis if necessary
  if (startPage > 2) {
    paginationList.appendChild(createEllipsis());
  } else {
    // if not an ellipsis, add the second page button
    paginationList.appendChild(createPaginationItem(2, currentPage, loadLinksCb));
    startPage++;
    endPage++;
  }

  // if we won't be adding an ellipsis at the end, make startPage one sooner
  if (endPage === totalPages - 1) {
    startPage--;
  }

  // Add the page buttons
  for (let i = startPage; i <= endPage; i++) {
    const listItem = createPaginationItem(i, currentPage, loadLinksCb);
    paginationList.appendChild(listItem);
  }

  // Add right ellipsis if necessary
  if (endPage < totalPages - 1) {
    paginationList.appendChild(createEllipsis());
  }

  // Add the last page button
  if (totalPages > 1) {
    paginationList.appendChild(createPaginationItem(totalPages, currentPage, loadLinksCb));
  }

  // Add event listeners for previous and next buttons
  const prevBtn = document.querySelector('.pagination-previous');
  const nextBtn = document.querySelector('.pagination-next');

  const prevBtnClone = prevBtn.cloneNode(true);
  const nextBtnClone = nextBtn.cloneNode(true);

  prevBtn.replaceWith(prevBtnClone);
  nextBtn.replaceWith(nextBtnClone);

  if (currentPage <= 1) {
    prevBtnClone.setAttribute('disabled', '');
  } else {
    prevBtnClone.removeAttribute('disabled');
    prevBtnClone.addEventListener('click', () => {
      loadLinksCb(currentPage - 1);
    });
  }

  if (currentPage >= totalPages) {
    nextBtnClone.setAttribute('disabled', '');
  } else {
    nextBtnClone.removeAttribute('disabled');
    nextBtnClone.addEventListener('click', () => {
      loadLinksCb(currentPage + 1);
    });
  }
}

function createEllipsis() {
  const listItem = document.createElement('li');
  const ellipsis = document.createElement('span');
  ellipsis.classList.add('pagination-ellipsis');
  ellipsis.innerHTML = '&hellip;';
  listItem.appendChild(ellipsis);
  return listItem;
}

function createPaginationItem(pageNumber, currentPage, loadLinksCb) {
  const listItem = document.createElement('li');
  const paginationLink = document.createElement('a');
  paginationLink.classList.add('pagination-link');
  paginationLink.textContent = pageNumber;
  paginationLink.setAttribute('aria-label', `Goto page ${pageNumber}`);
  if (pageNumber === currentPage) {
    paginationLink.classList.add('is-current');
    paginationLink.setAttribute('aria-current', 'page');
  } else {
    paginationLink.addEventListener('click', () => {
      loadLinksCb(pageNumber);
    });
  }
  listItem.appendChild(paginationLink);
  return listItem;
}
