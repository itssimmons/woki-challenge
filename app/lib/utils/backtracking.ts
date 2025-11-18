export default function backtrack<T>(
  choices: Array<T>,
  reject: (path: Array<T>) => boolean,
  accept: (path: Array<T>) => boolean,
) {
  const candidates: Array<Array<T>> = [];

  function explore(path: Array<T>) {
    if (reject(path)) return;
    if (accept(path)) {
      candidates.push([...path]);
      return;
    }

    for (const choice of choices) {
      path.push(choice);
      explore(path);
      path.pop();
    }
  }

  explore([]);
  return candidates;
}
