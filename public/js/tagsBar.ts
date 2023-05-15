import { createTagLink } from './tags';
import { getTags } from './apiClient';
import { getElementById } from './utils';
import { removeFromSearch } from './search';
import { loadLinks } from './links';

function generateTagsHtml(tags: string[], onClick: () => void, group = true) {
  if (!group) {
    const tagsFragment = document.createDocumentFragment();
    const tagsBlock = document.createElement('div');
    tagsBlock.classList.add('tags');
    tags.forEach((tag: string) => {
      const tagLink = createTagLink(tag.toLowerCase(), {
        shouldShowHash: false,
        onClick,
      });
      tagLink.classList.add('tag-link', 'tag'); // Add the class for styling
      tagsBlock.appendChild(tagLink); // Add the tag link to the block
    });
    tagsFragment.appendChild(tagsBlock);
    return tagsFragment;
  }
  const groupedTags = tags.reduce((acc, tag) => {
    let firstChar: string = tag.charAt(0).toUpperCase();
    // group all numbers together under '0'
    if (Number.isInteger(parseInt(firstChar, 10))) {
      firstChar = '0';
    }
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(tag);
    return acc;
  }, {} as Record<string, string[]>);

  const tagsFragment = document.createDocumentFragment();

  for (const char of Object.keys(groupedTags)) {
    const block = document.createElement('div');
    block.classList.add('tags');
    groupedTags[char].forEach((tag: string, index: number) => {
      const isFirst = index === 0;
      const tagLink = createTagLink(tag.toLowerCase(), {
        shouldShowHash: false,
        onClick,
      });
      tagLink.classList.add('tag-link', 'tag'); // Add the class for styling
      if (isFirst) {
        tagLink.classList.add('is-dark');
      }
      block.appendChild(tagLink); // Add the tag link to the block
    });

    tagsFragment.appendChild(block);
  }

  return tagsFragment;
}

function addActiveTagsHtml(activeTags: string[]) {
  const activeTagsDiv = getElementById('active-tags-list', HTMLDivElement);
  if (!activeTags.length) {
    activeTagsDiv.classList.add('is-hidden');
    document.getElementById('active-tags-hr')?.classList.add('is-hidden');
    return;
  }
  const activeTagsParagraph = document.createElement('p');
  activeTagsParagraph.classList.add('tags', 'are-small');
  activeTags.forEach((tag) => {
    const tagLink = document.createElement('a');
    tagLink.classList.add('tag', 'is-info', 'is-light');
    tagLink.textContent = tag;
    tagLink.addEventListener('click', (e) => {
      e.preventDefault();
      removeFromSearch([tag]);
      loadLinks();
    });
    activeTagsParagraph.appendChild(tagLink);
  });
  // activeTagsDiv should have the tags followed by <hr />
  activeTagsDiv.innerHTML = '';
  activeTagsDiv.appendChild(activeTagsParagraph);
  activeTagsDiv.classList.remove('is-hidden');
  document.getElementById('active-tags-hr')?.classList.remove('is-hidden');
}

async function fetchAndRenderTags(onClick: () => void, order: 'name' | 'links') {
  const tagsList = getElementById('tagsList');
  const searchTerm = getElementById('search-input', HTMLInputElement).value
  const tags = (await getTags(order, searchTerm))
    .map((tag) => tag.toLowerCase())
    .filter((tag) => tag !== '');

  const tagsToSkip = searchTerm.split(' ')
    .filter((term) => term.startsWith('#'))
    .map((term) => term.slice(1));
  addActiveTagsHtml(tagsToSkip);
  const tagsToRenderLinks = tags.filter((tag) => !tagsToSkip.includes(tag));
  const group = order === 'name';
  const tagsContainer = generateTagsHtml(tagsToRenderLinks, onClick, group);
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
