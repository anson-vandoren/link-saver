function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

function timeAgo(date) {
  const pluralizeAndConcat = (n, word) => {
    let newWord = word;
    if (n > 1) newWord = `${word}s`;
    return `${n} ${newWord} ago`;
  };

  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'year');
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'month');
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'day');
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'hour');
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'minute');
  }
  interval = Math.floor(seconds);
  return pluralizeAndConcat(interval, 'second');
}

export {
  scrollToTop,
  timeAgo,
};
