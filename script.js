/*
  Orovian Oasis Landing Page Script

  n8n setup:
  1. Create a Webhook node in n8n.
  2. Copy the production webhook URL.
  3. Paste it into N8N_WEBHOOK_URL below.
*/

const N8N_WEBHOOK_URL = "PASTE_YOUR_N8N_WEBHOOK_URL_HERE";

const form = document.getElementById("propertyForm");
const formMessage = document.getElementById("formMessage");
const submitButton = document.querySelector(".submit-button");
const originalButtonText = submitButton.textContent;

function setMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = type ? `form-message ${type}` : "form-message";
}

function cleanPhone(phone) {
  return phone.replace(/[^0-9+]/g, "").trim();
}

function buildLeadPayload(formData) {
  return {
    propertyAddress: formData.get("propertyAddress")?.trim(),
    firstName: formData.get("firstName")?.trim(),
    lastName: formData.get("lastName")?.trim(),
    phone: cleanPhone(formData.get("phone") || ""),
    email: formData.get("email")?.trim(),
    ownerStatus: formData.get("ownerStatus"),
    timeline: formData.get("timeline"),
    urgent: formData.get("urgent") === "on",
    submittedAt: new Date().toISOString(),
    source: "Orovian Oasis Website"
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLikelyValidLead(payload) {
  if (!payload.propertyAddress || payload.propertyAddress.length < 8) return false;
  if (!payload.firstName || payload.firstName.length < 2) return false;
  if (!payload.lastName || payload.lastName.length < 2) return false;
  if (!payload.phone || payload.phone.length < 10) return false;
  if (!payload.email || !isValidEmail(payload.email)) return false;
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
    setMessage("Form is ready, but the n8n webhook URL still needs to be added.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setMessage("");

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

    setMessage("Submission received. We’ll review it and follow up shortly.", "success");
    form.reset();
  } catch (error) {
    console.error("Submission error:", error);
    setMessage("Something went wrong. Please try again or contact us directly.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});

/*
  Optional Google Places Autocomplete setup:

  1. Add your Google Maps JavaScript API script to index.html before script.js.
  2. Enable Places API in Google Cloud.
  3. Uncomment the function below.

function initAutocomplete() {
  const input = document.getElementById("propertyAddress");
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["address"],
    componentRestrictions: { country: "us" }
  });
}
*/
