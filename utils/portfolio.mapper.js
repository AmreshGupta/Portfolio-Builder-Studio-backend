import { getFirst, toList } from "../validations/portfolio.validation.js";

export function toClientPortfolio(portfolio) {
  if (!portfolio) return null;

  const hero = getFirst(portfolio.hero);
  const about = getFirst(portfolio.about);
  const contact = getFirst(portfolio.contact);

  return {
    _id: portfolio._id,
    userId: portfolio.userId,
    slug: portfolio.slug,
    template: portfolio.template || "modern",
    resumeUrl: portfolio.resumeUrl || "",
    name: hero.fullName || "",
    title: hero.title || "",
    homeSubtitle: hero.description || "",
    profileImage: hero.image || "",
    about: about.description || "",
    skills: toList(about.skills),
    experience: toList(portfolio.experience),
    education: toList(portfolio.education).map((item) => ({
      institution: item.institution || "",
      degree: item.degree || "",
      year: item.duration || "",
      duration: item.duration || "",
      description: item.description || "",
    })),
    projects: toList(portfolio.projects).map((project) => ({
      title: project.name || "",
      name: project.name || "",
      description: project.description || "",
      tags: toList(project.technologies),
      technologies: toList(project.technologies),
      link: project.link || "",
      image: project.image || "",
    })),
    socialLinks: toList(contact.addLink).map((item, index) => ({
      id: `${item.title || "link"}-${index}`,
      label: item.title || "",
      url: item.url || "",
    })),
    contactEmail: contact.email || "",
    contactPhone: contact.phone || "",
    contactAddress: contact.location || "",
    isPublished: portfolio.isPublished ?? true,
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  };
}
