const fontSelect = document.querySelector('font-select');
const div = document.querySelector('div');

fontSelect.addEventListener('change', () => {
  console.log('🤖 Value changed to', fontSelect.value);
  div.style.fontFamily = fontSelect.value;
});
