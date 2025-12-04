export default function backtrack<T>(
  choices: Array<T>,
  reject: (path: Array<T>) => boolean,
  accept: (path: Array<T>) => boolean
) {
  const candidates: Array<Array<T>> = [];
  function explore(idx: number = 0, path: Array<T>) {
    if (reject(path)) return;
    if (accept(path)) {
      candidates.push([...path]);
      return;
    }

    for (let i = idx; i < choices.length; ++i) {
      path.push(choices[i]);
      explore(i + 1, path);
      path.pop();
    }
  }

  explore(0, []);
  return candidates;
}
