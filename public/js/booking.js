// public/js/booking.js
// Handles the booking form (dynamic availability + AJAX submit) and the
// OTP verification page (verify + resend). Both live under /public/js so a
// single file is loaded on both pages; each block checks the DOM exists
// before wiring up.

document.addEventListener('DOMContentLoaded', function () {
  wireBookingForm();
  wireVerifyForm();
});

// ---------------------------------------------------------------------
// Booking form (views/booking.ejs)
// ---------------------------------------------------------------------
function wireBookingForm() {
  var form = document.getElementById('bookingForm');
  if (!form) return;

  var artistSelect = document.getElementById('artistId');
  var serviceSelect = document.getElementById('serviceId');
  var dateInput = document.getElementById('date');
  var timeSelect = document.getElementById('time');
  var alertBox = document.getElementById('bookingAlert');
  var submitBtn = document.getElementById('bookingSubmit');

  // Prevent picking a past date.
  var today = new Date().toISOString().slice(0, 10);
  dateInput.setAttribute('min', today);

  var preselected = form.getAttribute('data-preselected-artist');
  if (preselected) artistSelect.value = preselected;

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.style.display = 'block';
  }
  function hideAlert() {
    alertBox.style.display = 'none';
  }

  function refreshAvailability() {
    var artistId = artistSelect.value;
    var serviceId = serviceSelect.value;
    var date = dateInput.value;

    timeSelect.innerHTML = '<option value="">Loading...</option>';
    timeSelect.disabled = true;

    if (!artistId || !serviceId || !date) {
      timeSelect.innerHTML = '<option value="">Select artist, service, and date first</option>';
      return;
    }

    var url = '/book/availability?artistId=' + encodeURIComponent(artistId) +
      '&serviceId=' + encodeURIComponent(serviceId) +
      '&date=' + encodeURIComponent(date);

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) {
          timeSelect.innerHTML = '<option value="">Unable to load times</option>';
          return;
        }
        if (!data.slots.length) {
          timeSelect.innerHTML = '<option value="">No available times on this date</option>';
          return;
        }
        timeSelect.innerHTML = '<option value="">Select a time</option>' +
          data.slots.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
        timeSelect.disabled = false;
      })
      .catch(function () {
        timeSelect.innerHTML = '<option value="">Unable to load times</option>';
      });
  }

  [artistSelect, serviceSelect, dateInput].forEach(function (el) {
    el.addEventListener('change', refreshAvailability);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    var payload = {};
    new FormData(form).forEach(function (value, key) { payload[key] = value; });

    fetch('/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (data) { return { status: r.status, data: data }; }); })
      .then(function (result) {
        if (!result.data.success) {
          showAlert(result.data.message || 'Something went wrong. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Request Appointment';
          if (result.status === 409) refreshAvailability();
          return;
        }
        window.location.href = result.data.redirectTo;
      })
      .catch(function () {
        showAlert('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Appointment';
      });
  });
}

// ---------------------------------------------------------------------
// OTP verification page (views/booking-verify.ejs)
// ---------------------------------------------------------------------
function wireVerifyForm() {
  var form = document.getElementById('verifyForm');
  if (!form) return;

  var alertBox = document.getElementById('verifyAlert');
  var resendBtn = document.getElementById('resendOtp');

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.style.display = 'block';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bookingId = form.getAttribute('data-booking-id');
    var otp = document.getElementById('otp').value.trim();

    fetch('/book/verify/' + bookingId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: otp })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) {
          showAlert(data.message || 'Invalid code. Please try again.');
          return;
        }
        window.location.href = data.redirectTo;
      })
      .catch(function () {
        showAlert('Network error. Please try again.');
      });
  });

  if (resendBtn) {
    resendBtn.addEventListener('click', function () {
      var bookingId = resendBtn.getAttribute('data-booking-id');
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';

      fetch('/book/verify/' + bookingId + '/resend', { method: 'POST' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Code';
          showAlert(data.message || (data.success ? 'A new code was sent.' : 'Could not resend code.'));
        })
        .catch(function () {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Code';
          showAlert('Network error. Please try again.');
        });
    });
  }
}
