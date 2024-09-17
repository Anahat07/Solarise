const searchInput = document.getElementById('search');
const couponList = document.getElementById('company-list');
const couponItems = couponList.querySelectorAll('li');

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  couponItems.forEach((item) => {
    const productName = item.getAttribute('data-product').toLowerCase();
    if (productName.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
});