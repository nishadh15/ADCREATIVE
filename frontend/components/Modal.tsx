export default function Modal({ title, body, onYes, onNo, yes = "Confirm" }: { title: string; body: string; onYes: () => void; onNo: () => void; yes?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xl animate-rise">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5">
        <div className="rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-7 shadow-core">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">{body}</p>
          <div className="mt-7 flex justify-end gap-2">
            <button onClick={onNo} className="rounded-full border border-line px-5 py-2 text-sm text-neutral-300">Cancel</button>
            <button onClick={onYes} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-ink">{yes}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
