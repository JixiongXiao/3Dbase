export const onLoaded = () => {
  window.parent.postMessage({ cmd: "onLoaded" }, "*");
};
