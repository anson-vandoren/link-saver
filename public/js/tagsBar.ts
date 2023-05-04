import { createTagLink } from './tags';
import { getTags } from './apiClient';
import { Tag } from '../../shared/apiTypes';

function generateTagsHtml(tags: Tag[], onClick: () => void) {
  const groupedTags = tags.reduce((acc, tag) => {
    const firstChar: string = tag.charAt(0).toUpperCase();
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(tag);
    return acc;
  }, {} as Record<string, string[]>);

  const tagsFragment = document.createDocumentFragment();

  // TODO: verify the change from const char in groupedTags
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

export async function loadTags(onClick: () => void) {
  const tagsList = document.getElementById('tagsList');
  if (!tagsList) return;
  const tags = await getTags();

  const tagsContainer = generateTagsHtml(tags, onClick);
  tagsList.innerHTML = '';
  tagsList.appendChild(tagsContainer);
}
