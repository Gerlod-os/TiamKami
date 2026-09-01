const SchedulePage = () => {
  return (
    <div>
      <h1 className="text-3xl mb-6">Расписание стримов</h1>
      <div className="bg-white/5 rounded-2xl p-8 text-center border border-accent-purple/30">
        <p className="text-2xl mb-2">📅</p>
        <p className="text-white/70">
          Расписание пока не настроено.
        </p>
        <p className="text-white/50 text-sm mt-2">
          В будущем здесь будет автоматически отображаться расписание с Twitch.
        </p>
      </div>
    </div>
  )
}

export default SchedulePage