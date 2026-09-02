import { useEffect, useState } from 'react'
import { BRAND } from '../config/branding.js'

// Кэш: статус 5 минут, аватар 24 часа (защита от блокировок DecAPI)
const STATUS_TTL = 5 * 60 * 1000
const AVATAR_TTL = 24 * 60 * 60 * 1000

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

export default function TwitchWidget() {
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // Аватарка: раз в сутки
      let avatar = safeGet('tk_avatar')
      const avatarTime = parseInt(safeGet('tk_avatar_time') || '0')
      if (!avatar || Date.now() - avatarTime > AVATAR_TTL) {
        try {
          const res = await fetch(`https://decapi.me/twitch/avatar/${BRAND.twitchLogin}`, {
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok) {
            const url = (await res.text()).trim()
            if (url.startsWith('http')) {
              avatar = url
              safeSet('tk_avatar', url)
              safeSet('tk_avatar_time', String(Date.now()))
            }
          }
        } catch { /* остаёмся с заглушкой */ }
      }

      // Статус: раз в 5 минут
      let live = false, title = ''
      const statusTime = parseInt(safeGet('tk_status_time') || '0')
      const cachedStatus = safeGet('tk_status')
      if (cachedStatus !== null && Date.now() - statusTime < STATUS_TTL) {
        live = cachedStatus === 'live'
      } else {
        try {
          const res = await fetch(`https://decapi.me/twitch/status/${BRAND.twitchLogin}`, {
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok) {
            const text = await res.text()
            // Статус-эндпоинт возвращает "offline" или текст стрима
            live = text.trim() !== '' && text.trim().toLowerCase() !== 'offline'
            title = live ? text.trim() : ''
            safeSet('tk_status', live ? 'live' : 'offline')
            safeSet('tk_status_time', String(Date.now()))
          }
        } catch { /* показываем заглушку */ }
      }

      if (!cancelled) setState({ loading: false, live, title, avatar })
    }

    load()
    return () => { cancelled = true }
  }, [])

  const { loading, live, title, avatar } = state

  return (
    <section className="bg-white/5 rounded-2xl p-6 border border-accent-purple/30 flex items-center gap-4">
      {/* Аватарка с индикатором Live */}
      <div className="relative shrink-0">
        {avatar ? (
          <img src={avatar} alt={BRAND.name} className="w-14 h-14 rounded-full border-2 border-accent-purple/50" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-accent-purple/30 flex items-center justify-center text-2xl" aria-hidden="true">🎮</div>
        )}
        {live && (
          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            Live
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-white/70 text-sm flex items-center gap-1.5">
          Twitch
          {live && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" aria-hidden="true" />}
        </p>
        {loading ? (
          <p className="font-heading text-white/50">Проверяем канал…</p>
        ) : live ? (
          <>
            <p className="font-heading text-white truncate" title={title}>{title || 'В эфире!'}</p>
            <a
              href={BRAND.links.twitch}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-pink hover:text-white text-sm transition-colors"
            >
              Смотреть стрим →
            </a>
          </>
        ) : (
          <>
            <p className="font-heading text-white/80">Канал оффлайн</p>
            <a
              href={BRAND.links.twitch}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-accent-pink text-sm transition-colors"
            >
              Заглянуть на канал →
            </a>
          </>
        )}
      </div>
    </section>
  )
}
