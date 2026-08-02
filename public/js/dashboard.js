// public/js/dashboard.js
// Handles all AJAX button actions across the Artist and Admin dashboards,
// plus the mobile sidebar toggle.

document.addEventListener('DOMContentLoaded', function () {
  wireSidebarToggle();
  wireArtistDashboardActions();
  wireAdminArtistActions();
  wireAdminServiceActions();
  wireAdminBookingActions();
  wireAdminGalleryActions();
});

function wireSidebarToggle() {
  var toggle = document.getElementById('sidebarToggle');
  var sidebar = document.getElementById('dashboardSidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }
}

function postJSON(url, method, body) {
  return fetch(url, {
    method: method || 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) { return r.json(); });
}

// ---------------------------------------------------------------------
// Artist dashboard: mark completed / cancel own bookings
// ---------------------------------------------------------------------
function wireArtistDashboardActions() {
  document.querySelectorAll('[data-action="complete"], [data-action="cancel"]').forEach(function (btn) {
    // Only wire artist-scoped buttons (these live under /artist routes).
    if (!btn.closest('[data-booking-row]')) return;
    if (window.location.pathname.indexOf('/artist') !== 0) return;

    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-id');
      var action = btn.getAttribute('data-action');
      if (action === 'cancel' && !confirm('Cancel this appointment?')) return;

      postJSON('/artist/bookings/' + id + '/' + action)
        .then(function (data) {
          if (data.success) {
            location.reload();
          } else {
            alert(data.message || 'Something went wrong.');
          }
        });
    });
  });
}

// ---------------------------------------------------------------------
// Admin: artists (delete, reset password)
// ---------------------------------------------------------------------
function wireAdminArtistActions() {
  document.querySelectorAll('[data-action="delete-artist"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!confirm('Delete this artist account? This cannot be undone.')) return;
      var id = btn.getAttribute('data-id');
      fetch('/admin/artists/' + id, { method: 'DELETE' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            var row = document.querySelector('[data-artist-row="' + id + '"]');
            if (row) row.remove();
          } else {
            alert(data.message || 'Could not delete artist.');
          }
        });
    });
  });

  document.querySelectorAll('[data-action="reset-password"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!confirm('Reset this artist\'s password to a new temporary one?')) return;
      var id = btn.getAttribute('data-id');
      postJSON('/admin/artists/' + id + '/reset-password')
        .then(function (data) {
          if (data.success) {
            alert('New temporary password: ' + data.tempPassword + '\n\nShare this with the artist securely.');
          } else {
            alert(data.message || 'Could not reset password.');
          }
        });
    });
  });
}

// ---------------------------------------------------------------------
// Admin: services (delete)
// ---------------------------------------------------------------------
function wireAdminServiceActions() {
  document.querySelectorAll('[data-action="delete-service"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!confirm('Delete this service?')) return;
      var id = btn.getAttribute('data-id');
      fetch('/admin/services/' + id, { method: 'DELETE' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            var row = document.querySelector('[data-service-row="' + id + '"]');
            if (row) row.remove();
          } else {
            alert(data.message || 'Could not delete service.');
          }
        });
    });
  });
}

// ---------------------------------------------------------------------
// Admin: bookings (status changes)
// ---------------------------------------------------------------------
function wireAdminBookingActions() {
  document.querySelectorAll('[data-action="admin-status"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-id');
      var status = btn.getAttribute('data-status');
      if (!confirm('Mark this booking as "' + status + '"?')) return;

      postJSON('/admin/bookings/' + id + '/status', 'POST', { status: status })
        .then(function (data) {
          if (data.success) {
            location.reload();
          } else {
            alert(data.message || 'Could not update booking.');
          }
        });
    });
  });
}

// ---------------------------------------------------------------------
// Admin: gallery (delete)
// ---------------------------------------------------------------------
function wireAdminGalleryActions() {
  document.querySelectorAll('[data-action="delete-gallery"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!confirm('Remove this image from the gallery?')) return;
      var id = btn.getAttribute('data-id');
      fetch('/admin/gallery/' + id, { method: 'DELETE' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            var item = document.querySelector('[data-gallery-item="' + id + '"]');
            if (item) item.remove();
          } else {
            alert(data.message || 'Could not delete image.');
          }
        });
    });
  });
}
