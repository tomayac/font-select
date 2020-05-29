const fontSelect = document.querySelector('font-select');
const div = document.querySelector('div');

fontSelect.addEventListener('change', () => {
  div.style.fontFamily = fontSelect.value;
});
