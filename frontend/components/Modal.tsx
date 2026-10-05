export default function Modal({ title, body, onYes, onNo, yes = "Confirm" }: { title: string; body: string; onYes: () => void; onNo: () => void; yes?: string }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6">
    <h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-neutral-400">{body}</p>
    <div className="mt-5 flex justify-end gap-2"><button onClick={onNo} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button><button onClick={onYes} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink">{yes}</button></div></div></div>;
}
