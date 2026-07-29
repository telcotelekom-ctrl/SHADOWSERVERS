const steps = [
  "Company Basis",
  "Identity Update",
  "Produkt",
  "Prozess",
  "Export"
];

const STORAGE_KEY = "ucb-business-workspace-state";
let currentStep = 1;

const enterBtn = document.getElementById("enter-btn");
const clearBtn = document.getElementById("clear-btn");
const loader = document.getElementById("loader");
const wizardArea = document.getElementById("wizard-area");
const progressList = document.getElementById("progressList");
const resultBox = document.getElementById("resultBox");
const exportList = document.getElementById("exportList");
const form = document.getElementById("wizardForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function renderProgress() {
  progressList.innerHTML = "";
  steps.forEach((name, index) => {
    const li = document.createElement("li");
    li.textContent = name;
    const stepNumber = index + 1;
    if (stepNumber < currentStep) li.classList.add("done");
    if (stepNumber === currentStep) li.classList.add("current");
    progressList.appendChild(li);
  });
}

function showStep(step) {
  form.querySelectorAll(".step").forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.step) === step);
  });

  prevBtn.disabled = step === 1;
  nextBtn.textContent = step === steps.length ? "Flow ausführen" : "Weiter";
  renderProgress();
}

function validateActiveStep() {
  const activeStep = form.querySelector(".step.active");
  const requiredFields = activeStep ? activeStep.querySelectorAll("[required]") : [];
  for (const field of requiredFields) {
    if (!String(field.value || "").trim()) {
      field.focus();
      if (typeof field.reportValidity === "function") {
        field.reportValidity();
      }
      return false;
    }
  }
  return true;
}

function parseValues(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function getData() {
  const formData = new FormData(form);
  return {
    name: formData.get("name") || "",
    vision: formData.get("vision") || "",
    mission: formData.get("mission") || "",
    values: parseValues(formData.get("values")),
    philosophy: formData.get("philosophy") || "",
    logo_url: formData.get("logo_url") || "",
    primary_color: formData.get("primary_color") || "#1A1A1A",
    secondary_color: formData.get("secondary_color") || "#FF9900",
    font_family: formData.get("font_family") || "Segoe UI",
    product_name: formData.get("product_name") || "",
    product_description: formData.get("product_description") || "",
    price_model: formData.get("price_model") || "",
    process_name: formData.get("process_name") || "",
    process_type: formData.get("process_type") || "",
    formats: formData.getAll("formats")
  };
}

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildSummary(data) {
  return {
    company: {
      name: data.name,
      slug: makeSlug(data.name || "company") || "company",
      vision: data.vision,
      mission: data.mission,
      values: data.values,
      philosophy: data.philosophy
    },
    branding: {
      logo_url: data.logo_url,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      font_family: data.font_family
    },
    product: {
      name: data.product_name,
      description: data.product_description,
      price_model: data.price_model
    },
    process: {
      name: data.process_name,
      type: data.process_type,
      steps: ["Discover", "Design", "Launch"]
    },
    exports: data.formats
  };
}

function toMarkdown(summary) {
  return [
    `# ${summary.company.name}`,
    "",
    "## Vision",
    summary.company.vision,
    "",
    "## Mission",
    summary.company.mission,
    "",
    "## Values",
    summary.company.values.length ? summary.company.values.map((item) => `- ${item}`).join("\n") : "- None",
    "",
    "## Product",
    `- Name: ${summary.product.name}`,
    `- Price model: ${summary.product.price_model}`,
    "",
    "## Process",
    `- Name: ${summary.process.name}`,
    `- Type: ${summary.process.type}`
  ].join("\n");
}

function toHtml(summary) {
  const values = summary.company.values.length
    ? `<ul>${summary.company.values.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : "<p>None</p>";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${summary.company.name}</title></head><body><h1>${summary.company.name}</h1><h2>Vision</h2><p>${summary.company.vision}</p><h2>Mission</h2><p>${summary.company.mission}</p><h2>Values</h2>${values}</body></html>`;
}

function toText(summary) {
  return [
    `${summary.company.name}`,
    "",
    `Vision: ${summary.company.vision}`,
    `Mission: ${summary.company.mission}`,
    `Values: ${summary.company.values.length ? summary.company.values.join(", ") : "None"}`,
    `Product: ${summary.product.name}`,
    `Price model: ${summary.product.price_model || "n/a"}`,
    `Process: ${summary.process.name}`,
    `Process type: ${summary.process.type}`
  ].join("\n");
}

function makeDownloadLink(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.className = "download-link";
  link.href = url;
  link.download = filename;
  link.textContent = `Download ${filename}`;
  link.addEventListener("click", () => {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  return link;
}

function renderExports(summary) {
  exportList.innerHTML = "";

  const fileSpecs = [
    {
      format: "json",
      filename: `${summary.company.slug || "company"}.json`,
      content: JSON.stringify(summary, null, 2),
      mimeType: "application/json"
    },
    {
      format: "md",
      filename: `${summary.company.slug || "company"}.md`,
      content: toMarkdown(summary),
      mimeType: "text/markdown"
    },
    {
      format: "html",
      filename: `${summary.company.slug || "company"}.html`,
      content: toHtml(summary),
      mimeType: "text/html"
    },
    {
      format: "txt",
      filename: `${summary.company.slug || "company"}.txt`,
      content: toText(summary),
      mimeType: "text/plain"
    }
  ];

  fileSpecs.forEach((item) => {
    if (!summary.exports.includes(item.format)) {
      return;
    }

    const box = document.createElement("div");
    box.className = "export-item";
    box.innerHTML = `<h3>${item.format.toUpperCase()}</h3><p>${item.filename}</p>`;
    box.appendChild(makeDownloadLink(item.filename, item.content, item.mimeType));
    exportList.appendChild(box);
  });
}

function persistState() {
  const data = getData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    Object.entries(saved).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          const selector = `[name="${key}"][value="${item.replace(/\"/g, '\\\"')}"]`;
          const checkbox = form.querySelector(selector);
          if (checkbox) checkbox.checked = true;
        });
        return;
      }

      const field = form.elements.namedItem(key);
      if (field && typeof field.value !== "undefined") {
        field.value = value;
      }
    });
  } catch (error) {
    console.warn("Could not restore workspace state:", error);
  }
}

function executeFlow() {
  const data = getData();
  const summary = buildSummary(data);
  const exportCount = summary.exports.length;

  resultBox.textContent = JSON.stringify(
    {
      mode: "professional-workspace",
      company: summary.company.name,
      slug: summary.company.slug,
      branding: summary.branding,
      product: summary.product,
      process: summary.process,
      generated_exports: summary.exports,
      export_count: exportCount
    },
    null,
    2
  );

  renderExports(summary);
  persistState();
}

function openWizard() {
  loader.classList.remove("hidden");
  enterBtn.disabled = true;

  setTimeout(() => {
    loader.classList.add("hidden");
    wizardArea.classList.remove("hidden");
    wizardArea.scrollIntoView({ behavior: "smooth", block: "start" });
    enterBtn.disabled = false;
  }, 350);
}

enterBtn.addEventListener("click", openWizard);

clearBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  currentStep = 1;
  showStep(currentStep);
  resultBox.textContent = "Bereit.";
  exportList.innerHTML = "";
});

prevBtn.addEventListener("click", () => {
  currentStep = Math.max(1, currentStep - 1);
  showStep(currentStep);
});

nextBtn.addEventListener("click", () => {
  if (!validateActiveStep()) {
    return;
  }

  persistState();

  if (currentStep < steps.length) {
    currentStep += 1;
    showStep(currentStep);
    return;
  }

  executeFlow();
});

form.addEventListener("input", persistState);

restoreState();
renderProgress();
showStep(currentStep);
