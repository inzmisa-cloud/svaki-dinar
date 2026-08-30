"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dodajTransakciju, type FormState } from "@/app/actions";
import { formatDatum } from "@/lib/format";

export function FormaTransakcije({
  racuni,
  kategorije,
  podrazumevaniDatum,
}: {
  racuni: Array<{ id: number; naziv: string }>;
  kategorije: Array<{ id: number; naziv: string; tip: string }>;
  podrazumevaniDatum: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    dodajTransakciju,
    {},
  );
  const [tip, setTip] = useState<"rashod" | "prihod">("rashod");
  const formaRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formaRef.current?.reset();
    }
  }, [state]);

  const filtrirane = kategorije.filter((k) => k.tip === tip);

  return (
    <form ref={formaRef} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="label" htmlFor="tip">
          Tip
        </label>
        <select
          id="tip"
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
        <label className="label" htmlFor="iznos">
          Iznos (RSD)
        </label>
        <input
          id="iznos"
          name="iznos"
          className="input tabular-nums"
          inputMode="decimal"
          placeholder="npr. 1.250,50"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="kategorijaId">
          Kategorija
        </label>
        <select id="kategorijaId" name="kategorijaId" className="input" defaultValue="">
          <option value="">— bez kategorije —</option>
          {filtrirane.map((k) => (
            <option key={k.id} value={k.id}>
              {k.naziv}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="racunId">
          Račun
        </label>
        <select id="racunId" name="racunId" className="input" required>
          {racuni.map((r) => (
            <option key={r.id} value={r.id}>
              {r.naziv}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="datum">
          Datum
        </label>
        <input
          id="datum"
          name="datum"
          className="input tabular-nums"
          inputMode="numeric"
          placeholder="DD-MM-YYYY"
          maxLength={10}
          defaultValue={formatDatum(podrazumevaniDatum)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="opis">
          Opis
        </label>
        <input id="opis" name="opis" className="input" placeholder="npr. pijaca" maxLength={200} />
      </div>

      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Čuvam…" : "Zabeleži transakciju"}
        </button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  );
}
