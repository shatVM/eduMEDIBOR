// public/js/modal.js
// Usage: showModal({ title: '...', body: '...', footer: '...' })
window.showModal = function({ title = '', body = '', footer = '' }) {
  document.getElementById('appModalLabel').innerHTML = title;
  document.getElementById('appModalBody').innerHTML = body;
  var footerEl = document.getElementById('appModalFooter');
  if (footerEl) {
    if (footer) {
      footerEl.innerHTML = footer;
      footerEl.style.display = '';
    } else {
      footerEl.innerHTML = '';
      footerEl.style.display = 'none';
    }
  }
  $('#appModal').modal('show');
};

// Optional: close modal on click outside or close button (Bootstrap handles this by default)
