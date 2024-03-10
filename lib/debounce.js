function debounce(func, wait) {
  let timeout;

  return function (...args) {
    const context = this;

    function callback() {
      timeout = null;
      func.apply(context, args);
    }

    clearTimeout(timeout);
    timeout = setTimeout(callback, wait);
  };
}

module.exports = { debounce };
