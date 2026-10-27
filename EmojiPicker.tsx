const EMOJI = '😀 😁 😂 🤣 😊 😍 😘 😎 🤔 😅 😭 😢 😡 🥳 😴 🙌 👍 👎 👏 🙏 💪 👋 🔥 ✨ 🎉 ❤️ 💙 💯 ✅ ❌ 👀 🤝 🍕 ☕ 🎧 🚀 🌈 ☀️ 🌙 ⭐'.split(' ')

export function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <div role="dialog" aria-label="Emoji picker" className="absolute bottom-full left-0 z-20 mb-2 grid w-72 animate-pop grid-cols-8 gap-0.5 rounded-2xl border border-line bg-surface p-2 shadow-xl">
      {EMOJI.map((e) => (
        <button key={e} type="button" onClick={() => onPick(e)} className="grid h-8 w-8 place-items-center rounded-lg text-lg hover:bg-raised" aria-label={`Insert ${e}`}>{e}</button>
      ))}
    </div>
  )
}
