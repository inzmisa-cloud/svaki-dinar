"use client";

import { useActionState, useEffect, useRef } from "react";
import { dodajKredit, type FormState } from "@/app/actions";
import { formatDatum } from "@/lib/format";

export function FormaKredita({
  racuni,
  danasDatum,
}: {
  racuni: Array<{ id: number; naziv: string }>;
  danasDatum: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(dodajKredit, {});
  const formaRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formaRef.current?.reset();
  }, [state]);

  return (
    <form ref={formaRef} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="k-naziv">
          Naziv kredita
        </label>
        <input id="k-naziv" name="naziv" className="input" placeholder="npr. Refinansiranje" required />
      </div>
      <div>
        <label className="label" htmlFor="k-glavnica">
          Glavnica (RSD)
        </label>
        <input
          id="k-glavnica"
          name="glavnica"
          className="input tabular-nums"
          inputMode="decimal"
          placeholder="npr. 500.000"
        />
      </div>
      <div>
        <label className="label" htmlFor="k-stop">
          Kamatna stopa (% godišnje)
        </label>
        <input
          id="k-stop"
          name="kamatnaStopa"
          type="number"
          step="0.01"
          min="0"
          max="100"
          className="input tabular-nums"
          defaultValue="0"
        />
      </div>
      <div>
        <label className="label" htmlFor="k-rata">
          Mesečna rata (RSD)
        </label>
        <input
          id="k-rata"
          name="rata"
          className="input tabular-nums"
          inputMode="decimal"
          placeholder="npr. 15.000"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="k-ukupno">
          Ukupno rata
        </label>
        <input
          id="k-ukupno"
          name="ukupnoRata"
          type="number"
          min="1"
          className="input tabular-nums"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="k-placeno">
          Već plaćeno rata
        </label>
        <input
          id="k-placeno"
          name="placenoRata"
          type="number"
          min="0"
          defaultValue="0"
          className="input tabular-nums"
        />
      </div>
      <div>
        <label className="label" htmlFor="k-dan">
          Dan naplate (1–28)
        </label>
        <input
          id="k-dan"
          name="danNaplate"
          type="number"
          min="1"
          max="28"
          defaultValue="10"
          className="input tabular-nums"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="k-pocetak">
          Datum početka
        </label>
        <input
          id="k-pocetak"
          name="datumPocetka"
          className="input tabular-nums"
          inputMode="numeric"
          placeholder="DD-MM-YYYY"
          maxLength={10}
          defaultValue={formatDatum(danasDatum)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="k-racun">
          Račun za naplatu
        </label>
        <select id="k-racun" name="racunId" className="input" defaultValue="">
          <option value="">— prvi aktivan —</option>
          {racuni.map((r) => (
            <option key={r.id} value={r.id}>
              {r.naziv}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Čuvam…" : "Dodaj kredit"}
        </button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  );
}
