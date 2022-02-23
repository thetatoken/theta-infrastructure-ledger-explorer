export function arrayUnique(array) {
    let a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j] || !a[j]) a.splice(j--, 1);
        }
    }
    return a;
}

