let snackbarHandler = null;

export const registerSnackbarHandler = (handler) => {
  snackbarHandler = handler;
  return () => {
    if (snackbarHandler === handler) {
      snackbarHandler = null;
    }
  };
};

export const emitSnackbar = (payload) => {
  if (typeof snackbarHandler === 'function') {
    snackbarHandler(payload);
    return true;
  }
  return false;
};
