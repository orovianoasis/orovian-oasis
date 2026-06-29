/*
  Orovian Oasis - Property Intake Logic
  -------------------------------------
  Switch testing/live mode by changing SUBMISSION_MODE only.

  local:
    Sends to your local n8n webhook on this computer.
    If local n8n is offline, it can save a browser backup for testing.

  production:
    Sends to your public n8n production webhook.
*/

const SUBMISSION_MODE = "local"; // "local" or "production"

const WEBHOOKS = {
  local: "http://localhost:5678/webhook/orovian-oasis-lead",
  production: "PASTE_YOUR_N8N_PRODUCTION_WEBHOOK_URL_HERE"
};

const SAVE_LOCAL_BACKUP_IF_LOCAL_WEBHOOK_FAILS = true;
const THANK_YOU_URL = "thank-you.html";
const LOCAL_BACKUP_KEY = "orovian_oasis_local_leads";

const WEBHOOK_URL = WEBHOOKS[SUBMISSION_MODE] || "";

const form = document.getElementById("propertyForm");
const formMessage = document.getElementById("formMessage");
const year = document.getElementById("year");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("propertyAddress");
const googlePlaceIdInput = document.getElementById("googlePlaceId");
const googleFormattedAddressInput = document.getElementById("googleFormattedAddress");
const manualAddressModeInput = document.getElementById("manualAddressMode");

let addressAutocomplete = null;
let formStartTracked = false;

function trackEvent(eventName, eventParams = {}) {
  if (typeof gtag === "function") {
    gtag("event", eventName, eventParams);
  }
}

if (year) {
  year.textContent = new Date().getFullYear();
}

if (addressInput) {
  addressInput.removeAttribute("readonly");
  addressInput.removeAttribute("disabled");

  addressInput.addEventListener("input", function () {
    if (googlePlaceIdInput) googlePlaceIdInput.value = "";
    if (googleFormattedAddressInput) googleFormattedAddressInput.value = "";
  });
}

if (manualAddressModeInput && addressInput) {
  manualAddressModeInput.addEventListener("change", function () {
    const manualModeOn = manualAddressModeInput.checked;

    document.body.classList.toggle("manual-address-active", manualModeOn);

    if (googlePlaceIdInput) googlePlaceIdInput.value = "";
    if (googleFormattedAddressInput) googleFormattedAddressInput.value = "";

    addressInput.placeholder = manualModeOn
      ? "Enter address, city, state, ZIP"
      : "Start typing the property address";

    addressInput.removeAttribute("readonly");
    addressInput.removeAttribute("disabled");
    addressInput.focus();

    trackEvent("manual_address_toggle", {
      event_category: "Lead",
      manual_address_mode: manualModeOn ? "yes" : "no"
    });
  });
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

if (form) {
  form.addEventListener("input", function () {
    if (formStartTracked) return;

    formStartTracked = true;

    trackEvent("form_start", {
      event_category: "Lead",
      form_name: "property_intake"
    });
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
    manualAddressMode: manualAddressModeInput?.checked ? "yes" : "no",
    firstName: data.get("firstName")?.trim() || "",
    lastName: data.get("lastName")?.trim() || "",
    phone: data.get("phone")?.trim() || "",
    email: data.get("email")?.trim() || "",
    ownerStatus: data.get("ownerStatus") || "",
    timeline: data.get("timeline") || "",
    submittedAt: new Date().toISOString(),
    source: "Orovian Oasis Website",
    submissionMode: SUBMISSION_MODE
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

function getLocalBackups() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalBackup(lead) {
  const backups = getLocalBackups();
  const backupLead = {
    ...lead,
    localBackupId: `OO-${Date.now()}`,
    localBackupCreatedAt: new Date().toISOString()
  };

  backups.push(backupLead);
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(backups));
  console.log("Lead saved to browser local backup:", backupLead);
  return backupLead;
}

function downloadLocalBackups() {
  const backups = getLocalBackups();
  const blob = new Blob([JSON.stringify(backups, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `orovian-oasis-local-leads-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clearLocalBackups() {
  localStorage.removeItem(LOCAL_BACKUP_KEY);
}

async function playSuccessAndRedirect(lead) {
  setMessage("Thanks. We received your property information and will follow up shortly.", "success");

  trackEvent("lead_submit", {
    event_category: "Lead",
    property_address: lead.propertyAddress || "",
    owner_status: lead.ownerStatus || "",
    selling_timeline: lead.timeline || "",
    submission_mode: lead.submissionMode || ""
  });

  trackEvent("generate_lead", {
    currency: "USD",
    value: 1,
    property_address: lead.propertyAddress || "",
    owner_status: lead.ownerStatus || "",
    selling_timeline: lead.timeline || "",
    submission_mode: lead.submissionMode || ""
  });

  if (window.OrovianEnhancements?.playSubmitSuccess) {
    await window.OrovianEnhancements.playSubmitSuccess({
      lead,
      redirectUrl: THANK_YOU_URL
    });
  }

  window.location.href = THANK_YOU_URL;
}

async function submitToWebhook(lead) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }

  return response;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const lead = getFormData();
    const error = validateLead(lead);

    if (error) {
      trackEvent("form_error", {
        event_category: "Lead",
        error_message: error
      });

      setMessage(error, "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;

    const productionWebhookMissing =
      SUBMISSION_MODE === "production" &&
      (!WEBHOOK_URL || WEBHOOK_URL.includes("PASTE_YOUR_N8N_PRODUCTION_WEBHOOK_URL_HERE"));

    if (productionWebhookMissing) {
      trackEvent("form_error", {
        event_category: "Lead",
        error_message: "Production webhook missing"
      });

      setMessage("Production webhook is not connected yet. Add your n8n production URL in script.js.", "error");
      console.warn("Missing production webhook URL. Lead was not submitted:", lead);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    setMessage("");

    try {
      await submitToWebhook(lead);
      await playSuccessAndRedirect(lead);
    } catch (submissionError) {
      console.error(submissionError);

      trackEvent("form_error", {
        event_category: "Lead",
        error_message: "Webhook submission failed"
      });

      if (SUBMISSION_MODE === "local" && SAVE_LOCAL_BACKUP_IF_LOCAL_WEBHOOK_FAILS) {
        saveLocalBackup(lead);
        await playSuccessAndRedirect(lead);
        return;
      }

      setMessage("Something went wrong. Please call or email us directly.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

// Console helper for local testing.
// Run these in DevTools if you use local backup mode:
// OrovianLocalLeads.list()
// OrovianLocalLeads.download()
// OrovianLocalLeads.clear()
window.OrovianLocalLeads = {
  list: getLocalBackups,
  download: downloadLocalBackups,
  clear: clearLocalBackups,
  mode: () => SUBMISSION_MODE,
  webhook: () => WEBHOOK_URL
};

// Google Maps API failure handler.
// Google Places autocomplete stays enabled when it works.
// If Google fails, the seller can still type the address manually.
window.gm_authFailure = function gmAuthFailure() {
  console.warn("Google Maps/Places failed to load. Manual address entry is still allowed.");

  if (addressInput) {
    addressInput.removeAttribute("readonly");
    addressInput.removeAttribute("disabled");
    addressInput.placeholder = "Enter address, city, state, ZIP";
  }

  if (manualAddressModeInput) {
    manualAddressModeInput.checked = true;
  }

  document.body.classList.add("manual-address-active");

  trackEvent("google_places_error", {
    event_category: "Lead",
    error_type: "auth_failure"
  });
};

// Google Places Autocomplete
window.initAutocomplete = function initAutocomplete() {
  if (!addressInput) return;

  addressInput.removeAttribute("readonly");
  addressInput.removeAttribute("disabled");

  if (!window.google?.maps?.places) {
    console.warn("Google Places is not available. Manual address entry is still allowed.");

    trackEvent("google_places_error", {
      event_category: "Lead",
      error_type: "places_unavailable"
    });

    return;
  }

  addressAutocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ["address"],
    componentRestrictions: { country: "us" },
    fields: ["formatted_address", "place_id", "address_components", "geometry"]
  });

  addressAutocomplete.addListener("place_changed", () => {
    if (manualAddressModeInput?.checked) {
      if (googlePlaceIdInput) googlePlaceIdInput.value = "";
      if (googleFormattedAddressInput) googleFormattedAddressInput.value = "";
      return;
    }

    const place = addressAutocomplete.getPlace();

    if (place.formatted_address) {
      addressInput.value = place.formatted_address;
      if (googleFormattedAddressInput) googleFormattedAddressInput.value = place.formatted_address;
    }

    if (place.place_id && googlePlaceIdInput) {
      googlePlaceIdInput.value = place.place_id;
    }

    trackEvent("address_autocomplete_selected", {
      event_category: "Lead",
      address_source: "google_places"
    });
  });
};

// Expose tracking helper so inline HTML click events can use it.
window.trackEvent = trackEvent;
