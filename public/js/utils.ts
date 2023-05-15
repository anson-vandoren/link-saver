export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export function timeAgo(date: Date) {
  const pluralizeAndConcat = (n: number, word: string) => {
    let newWord = word;
    if (n > 1) newWord = `${word}s`;
    return `${n} ${newWord} ago`;
  };

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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

export function getToken(): string {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Expected token in storage but found none.');
  return token;
}

export function hasToken(): boolean {
  return localStorage.getItem('token') != null;
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

export function isDefined<T>(x: T | null): x is T {
  return x != null;
}

export function isInputElem(element: unknown): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

export function isFormElem(element: unknown): element is HTMLFormElement {
  return element instanceof HTMLFormElement;
}

export function getValuesOrThrow(elementIds: string[]): string[] {
  const values = elementIds.map((id) => {
    const elem = document.getElementById(id);
    if (!elem) throw new Error(`Could not find element with id ${id}`);
    if (!isInputElem(elem) && !(elem instanceof HTMLSelectElement)) throw new Error(`Element with id ${id} is not an input element`);
    return elem.value;
  });
  return values;
}

export function querySelector<T extends Element>(selector: string, type: new () => T): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  if (!(element instanceof type)) {
    throw new Error(`Element for selector "${selector}" is not of expected type: ${type.name}`);
  }

  return element;
}

type Selectable = Element | DocumentFragment;
export function querySelectorInFragment<T extends Selectable>(
  fragment: DocumentFragment | Element,
  selector: string,
  type: new () => T,
): T {
  const element = fragment.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found in fragment for selector: ${selector}`);
  }

  if (!(element instanceof type)) {
    throw new Error(`Element for selector "${selector}" in fragment is not of expected type: ${type.name}`);
  }

  return element;
}

export function getElementById<T extends HTMLElement>(id: string, type?: new () => T): T {
  if (!type) type = HTMLElement as new () => T;
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element not found for id: ${id}`);
  }

  if (!(element instanceof type)) {
    throw new Error(`Element with id "${id}" is not of expected type: ${type.name} - ${element.constructor.name}`);
  }

  return element;
}

type SetValueOrThrowArgs = {
  querySel: string;
  value: string | number;
}[];
export function setValuesOrThrow(args: SetValueOrThrowArgs, root?: Selectable): void {
  const rootElem = root || document;
  args.forEach(({ querySel, value }) => {
    const elem = rootElem.querySelector<HTMLInputElement>(querySel);
    if (!elem) throw new Error(`Could not find element with query selector ${querySel}`);
    if (!isInputElem(elem)) throw new Error(`Element with query selector ${querySel} is not an input element`);
    elem.value = `${value}`;
  });
}

export function getPropOrThrow<T, K extends keyof T>(obj: T, key: K): T[K] {
  const value = obj[key];
  if (value === undefined) throw new Error(`Expected object to have key "${String(key)}"`);
  return value;
}
