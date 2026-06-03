const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const URL_REGEX = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}[\w\-._~:/?#[\]@!$&'()*+,;=.]*$/i;

export function normalizeSlug(value = "") {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toList(value) {
  return Array.isArray(value) ? value : [];
}

export function getFirst(value, fallback = {}) {
  return Array.isArray(value) ? value[0] || fallback : fallback;
}

export function digitsOnly(value = "") {
  return value.toString().replace(/\D/g, "");
}

function normalizeImageValue(value = "") {
  const image = value?.toString().trim() || "";

  if (!image) return "";
  if (/^data:image\/[^;]+;base64,/i.test(image)) return "";
  if (/^https?:\/\//i.test(image) && !/\/uploads\/portfolio\//i.test(image)) return image;

  return image
    .replace(/^https?:\/\/[^/]+\/uploads\/portfolio\//i, "")
    .replace(/^\/?uploads\/portfolio\//i, "")
    .split(/[\\/]/)
    .pop();
}

export function buildPortfolioPayload(body, userId) {
  const hero = getFirst(body.hero);
  const about = getFirst(body.about);
  const contact = getFirst(body.contact);
  const name = body.name || hero.fullName || "";
  const socialLinks = toList(body.socialLinks);
  const contactLinks = toList(contact.addLink);

  return {
    userId,
    slug: normalizeSlug(body.slug || name),
    template: body.template || "modern",
    isPublished: body.isPublished ?? true,
    resumeUrl: body.resumeUrl || "",
    hero: [
      {
        fullName: name,
        title: body.title || hero.title || "",
        description: body.homeSubtitle || hero.description || "",
        image: normalizeImageValue(body.profileImage || hero.image),
      },
    ],
    about: [
      {
        description: body.about || about.description || "",
        skills: toList(body.skills || about.skills).filter(Boolean),
      },
    ],
    experience: toList(body.experience).map((item) => ({
      company: item.company || "",
      role: item.role || "",
      duration: item.duration || "",
      description: item.description || "",
    })),
    education: toList(body.education).map((item) => ({
      institution: item.institution || "",
      degree: item.degree || "",
      duration: item.duration || item.year || "",
      description: item.description || "",
    })),
    projects: toList(body.projects).map((project) => ({
      name: project.name || project.title || "",
      description: project.description || "",
      technologies: toList(project.technologies || project.tags).filter(Boolean),
      link: project.link || "",
      image: normalizeImageValue(project.image),
    })),
    contact: [
      {
        email: body.contactEmail || contact.email || "",
        phone: digitsOnly(body.contactPhone || contact.phone),
        location: body.contactAddress || contact.location || "",
        addLink: socialLinks.length
          ? socialLinks.map((item) => ({
              title: item.label || item.title || "",
              url: item.url || "",
            }))
          : contactLinks,
      },
    ],
  };
}

export function validatePortfolioPayload(payload) {
  const contact = getFirst(payload.contact);
  const email = contact.email?.trim();
  const phone = digitsOnly(contact.phone || "");
  const resumeUrl = payload.resumeUrl?.trim();

  if (!payload.slug) {
    return "Portfolio URL slug is required";
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return "Please enter a valid contact email address";
  }

  if (phone && !INDIAN_PHONE_REGEX.test(phone)) {
    return "Please enter a valid 10-digit Indian phone number";
  }

  if (resumeUrl && !URL_REGEX.test(resumeUrl)) {
    return "Please enter a valid resume URL";
  }

  const invalidEmailLink = toList(contact.addLink).find((item) => {
    const title = item.title?.toLowerCase() || "";
    const url = item.url?.trim() || "";
    const emailValue = url.replace(/^mailto:/i, "");

    return (title.includes("email") || title.includes("mail")) && !EMAIL_REGEX.test(emailValue);
  });

  if (invalidEmailLink) {
    return "Please enter a valid email address for email links";
  }

  return "";
}

export function validatePortfolioMessage(body = {}) {
  const name = body.name?.toString().trim();
  const email = body.email?.toString().trim().toLowerCase();
  const message = body.message?.toString().trim();

  if (!name || !email || !message) {
    return {
      error: "Name, email, and message are required",
      value: null,
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      error: "Please enter a valid email address",
      value: null,
    };
  }

  return {
    error: "",
    value: { name, email, message },
  };
}
