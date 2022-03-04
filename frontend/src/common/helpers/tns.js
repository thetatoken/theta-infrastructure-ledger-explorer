export function arrayUnique(array) {
  return [...new Set(array.filter(a => a != null))]
}

