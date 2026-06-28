const WEBHOOK_URL = "http://localhost:5678/webhook-test/orovian-oasis-lead";

const form = document.getElementById("propertyForm");
const formMessage = document.getElementById("formMessage");
const year = document.getElementById("year");
const addressInput = document.getElementById("propertyAddress");
const googlePlaceIdInput = document.getElementById("googlePlaceId");
const googleFormattedAddressInput = document.getElementById("googleFormattedAddress");

if (year) {
  year.textContent = new Date().getFullYear();
}

function setMessage(text, type = "") {
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const lead = getFormData();
  const error = validateLead(lead);

  if (error) {
    setMessage(error, "error");
    return;
  }

  if (!WEBHOOK_URL || WEBHOOK_URL === "PASTE_YOUR_N8N_WEBHOOK_URL_HERE") {
    console.log("Lead captured locally:", lead);
    setMessage("Form is ready. Add your n8n webhook URL inside script.js to activate submissions.", "success");
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
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

    form.reset();
    setMessage("Thanks. We received your property information and will follow up shortly.", "success");
  } catch (submissionError) {
    console.error(submissionError);
    setMessage("Something went wrong. Please call or email us directly.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Property";
  }
});


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
