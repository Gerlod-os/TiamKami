import { useEffect } from "react";
import { FaTwitch, FaYoutube, FaDiscord } from "react-icons/fa";
import { BRAND } from "../config/branding.js";

const AboutPage = () => {
  useEffect(() => {
    document.title = `О канале — ${BRAND.name}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `О стримере Tiankami — рогалики, оценки, прогресс и заметки по всем пройденным играм.`,
      );
    }

    const setMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };
    setMeta("og:title", `О канале — ${BRAND.name}`);
    setMeta("og:description", `О стримере Tiankami — рогалики, оценки, прогресс и заметки по всем пройденным играм.`);
    setMeta("og:type", "website");
    setMeta("og:url", `${BRAND.siteUrl}/about`);
    setMeta("og:image", `${BRAND.siteUrl}/assets/hero-CLDdwZDr.png`);
  }, []);

  return (
    <div>
      <h1 className="text-3xl mb-6">О канале</h1>
      <div className="bg-white/5 rounded-2xl p-6 border border-accent-purple/30 space-y-4">
        <p className="text-white/80 leading-relaxed">
          Привет! Я —{" "}
          <span className="text-accent-pink font-heading">Tiankami</span>,
          стример и фанат рогаликов. На этом сайте собраны все игры, которые я
          пробовал, с моими оценками, прогрессом и заметками. Люблю уютную
          атмосферу, но в играх показываю высокий скилл.
        </p>
        <p className="text-white/60">
          Если хочешь следить за стримами — заглядывай на Twitch, там же бывают
          многопользовательские интерактивы (МИ).
        </p>
        <div className="flex gap-4 pt-2">
          <a
            href={BRAND.links.twitch}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
          >
            <FaTwitch size={24} /> Twitch
          </a>
          <a
            href={BRAND.links.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
          >
            <FaYoutube size={24} /> YouTube
          </a>
          <a
            href={BRAND.links.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
          >
            <FaDiscord size={24} /> Discord
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
