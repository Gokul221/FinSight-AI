"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RawHolding } from "@/lib/portfolio";

export default function AddHoldingDialog({
  onAdded,
  trigger,
}: {
  onAdded: (holding: RawHolding) => void;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTicker("");
    setName("");
    setSector("");
    setQuantity("");
    setAvgBuyPrice("");
    setError(null);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          name,
          sector,
          quantity: Number(quantity),
          avgBuyPrice: Number(avgBuyPrice),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onAdded(data.holding);
      resetForm();
      setOpen(false);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Holding
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a holding</DialogTitle>
          <DialogDescription>
            Enter the details of a stock you own. You can edit or remove it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ticker" className="text-xs font-medium text-slate-300">
                Ticker
              </label>
              <Input
                id="ticker"
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="TCS"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sector" className="text-xs font-medium text-slate-300">
                Sector
              </label>
              <Input
                id="sector"
                required
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="IT"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-slate-300">
              Company name
            </label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tata Consultancy Services"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="quantity" className="text-xs font-medium text-slate-300">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="avgBuyPrice" className="text-xs font-medium text-slate-300">
                Avg buy price (₹)
              </label>
              <Input
                id="avgBuyPrice"
                type="number"
                min="0"
                step="0.01"
                required
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                placeholder="3200"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {submitting ? "Adding..." : "Add Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
