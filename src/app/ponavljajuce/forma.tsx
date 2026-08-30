"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dodajStalnu, type FormState } from "@/app/actions";

export function FormaStalne({
  racuni,
  kategorije,
}: {
  racuni: Array<{ id: number; naziv: string }>;
  kategorije: Array<{ id: number; naziv: string; tip: string }>;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(dodajStalnu, {});
  const [tip, setTip] = useState<"rashod" | "prihod">("rashod");
  const formaRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formaRef.current?.reset();
  }, [state]);

  const filtrirane = kategorije.filter((k) => k.tip === tip);

  return (
    <form ref={formaRef} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="label" htmlFor="s-naziv">
          Naziv
        </label>
        <input id="s-naziv" name="naziv" className="input" placeholder="npr. Plata" required />
      </div>
      <div>
        <label className="label" htmlFor="s-tip">
          Tip
        </label>
        <select
          id="s-tip"
          name="tip"
          className="input"
          value={tip}
          onChange={(e) => setTip(e.target.value as "rashod" | "prihod")}
        >
          <option value="rashod">Rashod</option>
          <option value="prihod">Prihod</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="s-iznos">
          Iznos (RSD)
        </label>
        <input
          id="s-iznos"
          name="iznos"
          className="input tabular-nums"
          inputMode="decimal"
          placeholder="npr. 85.000"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="s-dan">
          Dan u mesecu (1–28)
        </label>
        <input
          id="s-dan"
          name="danUMesecu"
          type="number"
          min="1"
          max="28"
          defaultValue="1"
          className="input tabular-nums"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="s-kat">
          Kategorija
        </label>
        <select id="s-kat" name="kategorijaId" className="input" defaultValue="">
          <option value="">— bez kategorije —</option>
          {filtrirane.map((k) => (
            <option key={k.id} value={k.id}>
              {k.naziv}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="s-racun">
          Račun
        </label>
        <select id="s-racun" name="racunId" className="input" defaultValue="">
          <option value="">— prvi aktivan —</option>
          {racuni.map((r) => (
            <option key={r.id} value={r.id}>
              {r.naziv}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Čuvam…" : "Dodaj ponavljajuću stavku"}
        </button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  );
}
