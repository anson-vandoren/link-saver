import { createTagLink } from './tags';
import { getTags } from './apiClient';
import { getElementById } from './utils';

function generateTagsHtml(tags: string[], onClick: () => void, group = true) {
  if (!group) {
    const tagsFragment = document.createDocumentFragment();
    tags.forEach((tag: string, index: number) => {
      const tagLink = createTagLink(tag.toLowerCase(), {
        shouldShowHash: false,
        isFirst: false,
        onClick,
      });
      tagLink.classList.add('tag-link'); // Add the class for styling
      if (index > 0) {
        tagLink.style.marginRight = '8px'; // Add space between tags
      }
      tagsFragment.appendChild(tagLink); // Add the tag link to the block
    });
    return tagsFragment;
  }
  const groupedTags = tags.reduce((acc, tag) => {
    const firstChar: string = tag.charAt(0).toUpperCase();
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(tag);
    return acc;
  }, {} as Record<string, string[]>);

  const tagsFragment = document.createDocumentFragment();

  for (const char of Object.keys(groupedTags)) {
    const block = document.createElement('div');
    block.classList.add('block');

    groupedTags[char].forEach((tag: string, index: number) => {
      const isFirst = index === 0;
      const tagLink = createTagLink(tag.toLowerCase(), {
        shouldShowHash: false,
        isFirst,
        onClick,
      });
      tagLink.classList.add('tag-link'); // Add the class for styling
      if (index > 0) {
        tagLink.style.marginRight = '8px'; // Add space between tags
      }
      block.appendChild(tagLink); // Add the tag link to the block
    });

    tagsFragment.appendChild(block);
  }

  return tagsFragment;
}

async function fetchAndRenderTags(onClick: () => void, order: 'name' | 'links') {
  const tagsList = document.getElementById('tagsList');
  if (!tagsList) return;
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput instanceof HTMLInputElement ? searchInput.value : '';
  const tags = await getTags(order, searchTerm);

  const group = order === 'name';
  const tagsContainer = generateTagsHtml(tags, onClick, group);
  tagsList.innerHTML = '';
  tagsList.appendChild(tagsContainer);
}

export async function loadTags(onClick: () => void) {
  const changeHandler = (e: Event) => {
    const target = e.target as HTMLInputElement;
    sortBy = target.checked ? 'links' : 'name';
    fetchAndRenderTags(onClick, sortBy);
    target.blur();
  }

  const toggleSort = getElementById('toggleSort', HTMLInputElement);
  let sortBy: 'name' | 'links' = 'name';

  sortBy = toggleSort.checked ? 'links' : 'name';
  toggleSort.addEventListener('change', changeHandler);

  await fetchAndRenderTags(onClick, sortBy);
}
