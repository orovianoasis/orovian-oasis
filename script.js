/*
  Orovian Oasis Landing Page Script
  Rename this file to script.js when uploading to GitHub.

  n8n setup:
  1. Create a Webhook node in n8n.
  2. Copy the production webhook URL.
  3. Paste it into N8N_WEBHOOK_URL below.
*/

const N8N_WEBHOOK_URL = "PASTE_YOUR_N8N_WEBHOOK_URL_HERE";

const form = document.getElementById("propertyForm");
const formMessage = document.getElementById("formMessage");
const submitButton = document.querySelector(".submit-button");

function setMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function cleanPhone(phone) {
  return phone.replace(/[^0-9+]/g, "").trim();
}

function buildLeadPayload(formData) {
  return {
    propertyAddress: formData.get("propertyAddress")?.trim(),
    firstName: formData.get("firstName")?.trim(),
    phone: cleanPhone(formData.get("phone") || ""),
    email: formData.get("email")?.trim(),
    ownerStatus: formData.get("ownerStatus"),
    timeline: formData.get("timeline"),
    urgent: formData.get("urgent") === "on",
    submittedAt: new Date().toISOString(),
    source: "Orovian Oasis Website"
  };
}

function isLikelyValidLead(payload) {
  if (!payload.propertyAddress || payload.propertyAddress.length < 8) return false;
  if (!payload.firstName || payload.firstName.length < 2) return false;
  if (!payload.phone || payload.phone.length < 10) return false;
  return true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  // Honeypot spam check. Real users will never see this field.
  if (formData.get("companyWebsite")) {
    setMessage("Submission received.", "success");
    form.reset();
    return;
  }

  const payload = buildLeadPayload(formData);

  if (!isLikelyValidLead(payload)) {
    setMessage("Please check the required fields and try again.", "error");
    return;
  }

  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes("PASTE_YOUR")) {
    console.warn("Missing n8n webhook URL. Lead payload:", payload);
    setMessage("Form is ready, but the webhook URL still needs to be added.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setMessage("", "");

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    setMessage("Thank you. We received your property information and will follow up shortly.", "success");
    form.reset();
  } catch (error) {
    console.error("Lead submission failed:", error);
    setMessage("Something went wrong. Please call or email us directly.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Property";
  }
});

/*
  Optional Google Places Address Autocomplete
  This function works only after you uncomment the Google Maps script in index.html
  and replace YOUR_GOOGLE_MAPS_API_KEY with a real key.
*/
function initAddressAutocomplete() {
  const addressInput = document.getElementById("propertyAddress");

  if (!addressInput || !window.google || !google.maps || !google.maps.places) {
    return;
  }

  const autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ["address"],
    componentRestrictions: { country: "us" },
    fields: ["formatted_address", "address_components", "geometry"]
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (place && place.formatted_address) {
      addressInput.value = place.formatted_address;
    }
  });
}

window.initAddressAutocomplete = initAddressAutocomplete;
