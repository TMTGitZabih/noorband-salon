// public/js/booking.js
// Handles the booking form: loads live availability as the customer picks an
// artist/service/date, then submits the booking via AJAX. Bookings confirm
// immediately -- there is no verification step.

document.addEventListener('DOMContentLoaded', function () {
  wireBookingForm();
});

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
          submitBtn.textContent = 'Confirm Appointment';
          if (result.status === 409) refreshAvailability();
          return;
        }
        window.location.href = result.data.redirectTo;
      })
      .catch(function () {
        showAlert('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Appointment';
      });
  });
}
