"use client";

import { useActionState, useEffect, useRef } from "react";
import { postaviBudzet, type FormState } from "@/app/actions";

export function FormaBudzeta({
  mesec,
  kategorije,
}: {
  mesec: string;
  kategorije: Array<{ id: number; naziv: string }>;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(postaviBudzet, {});
  const formaRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formaRef.current?.reset();
  }, [state]);

  return (
    <form ref={formaRef} action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="mesec" value={mesec} />
      <div>
        <label className="label" htmlFor="b-kat">
          Kategorija rashoda
        </label>
        <select id="b-kat" name="kategorijaId" className="input" required>
          {kategorije.map((k) => (
            <option key={k.id} value={k.id}>
              {k.naziv}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="b-limit">
          Mesečni limit (RSD)
        </label>
        <input
          id="b-limit"
          name="limit"
          className="input tabular-nums"
          inputMode="decimal"
          placeholder="npr. 30.000"
          required
        />
      </div>
      <div className="flex items-end gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Čuvam…" : "Postavi budžet"}
        </button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  );
}
