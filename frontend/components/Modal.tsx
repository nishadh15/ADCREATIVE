export default function Modal({ title, body, onYes, onNo, yes = "Confirm" }: { title: string; body: string; onYes: () => void; onNo: () => void; yes?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4">
      <div className="w-full max-w-md animate-rise border-[3px] border-ink bg-bone shadow-[10px_10px_0_0_#FF5A14]">
        <div className="border-b-[3px] border-ink bg-lime px-6 py-3"><h3 className="font-display text-2xl uppercase">{title}</h3></div>
        <div className="p-6">
          <p className="text-sm font-medium leading-relaxed">{body}</p>
          <div className="mt-7 flex justify-end gap-3">
            <button onClick={onNo} className="border-2 border-line px-5 py-2 text-sm">Cancel</button>
            <button onClick={onYes} className="bg-accent px-5 py-2 text-ink">{yes}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
