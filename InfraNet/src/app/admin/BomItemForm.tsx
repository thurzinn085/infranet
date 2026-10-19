"use client";

import { useState } from "react";
import { bomPriceReferences } from "@/lib/bom-reference";

const inputClass =
  "min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink-900";
const buttonClass =
  "rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
};

export default function BomItemForm({ action }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  return (
    <form action={action} className="grid gap-3 rounded-md bg-ink-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700 sm:col-span-2 lg:col-span-5">
        Escolha um material de referência ou cadastre outro
        <select
          className={inputClass}
          value={selectedId}
          onChange={(event) => {
            const item = bomPriceReferences.find((reference) => reference.id === event.target.value);
            setSelectedId(event.target.value);
            setName(item?.name ?? "");
            setUnit(item?.unit ?? "");
            setEstimatedCost(item ? String(item.estimatedCost) : "");
          }}
        >
          <option value="">Outro material (preencha os dados)</option>
          {bomPriceReferences.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {item.estimatedCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}/{item.unit}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
        Material
        <input
          name="name"
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
        Unidade (m, unidade, caixa...)
        <input
          name="unit"
          className={inputClass}
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          required
          maxLength={40}
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
        Quantidade
        <input
          name="quantity"
          className={inputClass}
          type="number"
          min="0.01"
          step="any"
          defaultValue="1"
          required
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
        Custo por unidade (R$)
        <input
          name="estimatedCost"
          className={inputClass}
          type="number"
          min="0"
          step="any"
          value={estimatedCost}
          onChange={(event) => setEstimatedCost(event.target.value)}
          required
        />
      </label>
      <button className={`${buttonClass} self-end`}>Adicionar à lista</button>
    </form>
  );
}
