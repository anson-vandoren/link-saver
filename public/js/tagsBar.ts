import { createTagLink } from './tags';
import { getTags } from './apiClient';
import { Tag } from '../../shared/apiTypes';

function generateTagsHtml(tags: Tag[], onClick: () => void, group = true) {
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
  const tags = await getTags(order);

  const group = order === 'name';
  const tagsContainer = generateTagsHtml(tags, onClick, group);
  tagsList.innerHTML = '';
  tagsList.appendChild(tagsContainer);
}

export async function loadTags(onClick: () => void) {
  const toggleSort = document.getElementById('toggleSort');
  let sortBy: 'name' | 'links' = 'name';
  if (toggleSort instanceof HTMLInputElement) {
    sortBy = toggleSort.checked ? 'links' : 'name';
  }
  if (toggleSort instanceof HTMLInputElement) {
    toggleSort.addEventListener('change', () => {
      sortBy = toggleSort.checked ? 'links' : 'name';
      fetchAndRenderTags(onClick, sortBy);
    })
  }
  await fetchAndRenderTags(onClick, sortBy);
}
