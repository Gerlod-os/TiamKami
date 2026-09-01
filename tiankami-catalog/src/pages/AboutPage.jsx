import { FaTwitch, FaYoutube, FaDiscord } from 'react-icons/fa'

const AboutPage = () => {
  return (
    <div>
      <h1 className="text-3xl mb-6">О канале</h1>
      <div className="bg-white/5 rounded-2xl p-6 border border-accent-purple/30 space-y-4">
        <p className="text-white/80 leading-relaxed">
          Привет! Я — <span className="text-accent-pink font-heading">Tiankami</span>, стример и фанат рогаликов.
          На этом сайте собраны все игры, которые я пробовал, с моими оценками, прогрессом и заметками.
          Люблю уютную атмосферу, но в играх показываю высокий скилл.
        </p>
        <p className="text-white/60">
          Если хочешь следить за стримами — заглядывай на Twitch, там же бывают многопользовательские интерактивы (МИ).
        </p>
        <div className="flex gap-4 pt-2">
          <a
            href="https://twitch.tv/tiankami"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
          >
            <FaTwitch size={24} /> Twitch
          </a>
          <a
            href="https://youtube.com/@tiankami"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
          >
            <FaYoutube size={24} /> YouTube
          </a>
          <a
            href="https://discord.gg/tiankami"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
          >
            <FaDiscord size={24} /> Discord
          </a>
        </div>
        <p className="text-xs text-white/40 mt-2">
          * Ссылки можно заменить на реальные позже.
        </p>
      </div>
    </div>
  )
}

export default AboutPage