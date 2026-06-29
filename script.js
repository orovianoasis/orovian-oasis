const WEBHOOK_URL = "http://localhost:5678/webhook/orovian-oasis-lead";
const THANK_YOU_URL = "thank-you.html";

const form = document.getElementById("propertyForm");
const formMessage = document.getElementById("formMessage");
const year = document.getElementById("year");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("propertyAddress");
const googlePlaceIdInput = document.getElementById("googlePlaceId");
const googleFormattedAddressInput = document.getElementById("googleFormattedAddress");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (phoneInput) {
  phoneInput.addEventListener("input", function (event) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 10);

    if (digits.length > 6) {
      event.target.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      event.target.value = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      event.target.value = `(${digits}`;
    } else {
      event.target.value = "";
    }
  });
}

function setMessage(text, type = "") {
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`.trim();
}

function getFormData() {
  const data = new FormData(form);

  return {
    propertyAddress: data.get("propertyAddress")?.trim() || "",
    googlePlaceId: data.get("googlePlaceId") || "",
    googleFormattedAddress: data.get("googleFormattedAddress") || "",
    firstName: data.get("firstName")?.trim() || "",
    lastName: data.get("lastName")?.trim() || "",
    phone: data.get("phone")?.trim() || "",
    email: data.get("email")?.trim() || "",
    ownerStatus: data.get("ownerStatus") || "",
    timeline: data.get("timeline") || "",
    submittedAt: new Date().toISOString(),
    source: "Orovian Oasis Website"
  };
}

function validateLead(lead) {
  if (!lead.propertyAddress || !lead.firstName || !lead.lastName || !lead.phone || !lead.email) {
    return "Please complete the required fields.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(lead.email)) {
    return "Please enter a valid email address.";
  }

  const digitsOnly = lead.phone.replace(/\D/g, "");
  if (digitsOnly.length < 10) {
    return "Please enter a valid phone number.";
  }

  return "";
}

async function playSuccessAndRedirect(lead) {
  form.reset();
  setMessage("Thanks. We received your property information and will follow up shortly.", "success");

  if (window.OrovianEnhancements?.playSubmitSuccess) {
    await window.OrovianEnhancements.playSubmitSuccess({
      lead,
      redirectUrl: THANK_YOU_URL
    });
  }

  window.location.href = THANK_YOU_URL;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const lead = getFormData();
    const error = validateLead(lead);

    if (error) {
      setMessage(error, "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");

    if (!WEBHOOK_URL || WEBHOOK_URL.includes("PASTE_YOUR_N8N")) {
      console.log("Lead captured locally:", lead);
      setMessage("Form is ready. Add your n8n production webhook URL inside script.js to activate live submissions.", "success");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    setMessage("");

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      await playSuccessAndRedirect(lead);
    } catch (submissionError) {
      console.error(submissionError);
      setMessage("Something went wrong. Please call or email us directly.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Property";
    }
  });
}

// Google Places Autocomplete
// This function activates after you uncomment the Google script tag in index.html
// and replace the API key placeholder with your real restricted API key.
window.initAutocomplete = function initAutocomplete() {
  if (!addressInput || !window.google?.maps?.places) return;

  const autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ["address"],
    componentRestrictions: { country: "us" },
    fields: ["formatted_address", "place_id", "address_components", "geometry"]
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (place.formatted_address) {
      addressInput.value = place.formatted_address;
      googleFormattedAddressInput.value = place.formatted_address;
    }

    if (place.place_id) {
      googlePlaceIdInput.value = place.place_id;
    }
  });
};
