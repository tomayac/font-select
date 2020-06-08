const onChange = (e) => {
  const target = e.target;
  console.log('🤖 Value changed to', target.value);
  target.nextElementSibling.style.fontFamily = target.value;
};

document.querySelectorAll('font-select').forEach((fontSelect) => {
  fontSelect.addEventListener('change', onChange);
});
