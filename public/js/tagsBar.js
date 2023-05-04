import { createTagLink } from './tags.js';
import { getTags } from './apiClient.js';

function generateTagsHtml(tags, onClick) {
  const groupedTags = tags.reduce((acc, tag) => {
    const firstChar = tag.charAt(0).toUpperCase();
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(tag);
    return acc;
  }, {});

  const tagsFragment = document.createDocumentFragment();

  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const char in groupedTags) {
    const block = document.createElement('div');
    block.classList.add('block');

    groupedTags[char].forEach((tag, index) => {
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

export async function loadTags(onClick) {
  const tags = await getTags();

  const tagsList = document.getElementById('tagsList');
  const tagsContainer = generateTagsHtml(tags, onClick);
  tagsList.innerHTML = '';
  tagsList.appendChild(tagsContainer);
}
