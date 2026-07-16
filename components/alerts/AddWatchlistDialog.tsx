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
import type { RawWatchlistItem, WatchlistDirection } from "@/lib/watchlist";

export default function AddWatchlistDialog({
  onAdded,
}: {
  onAdded: (item: RawWatchlistItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<WatchlistDirection>("above");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTicker("");
    setName("");
    setTargetPrice("");
    setDirection("above");
    setError(null);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          name,
          targetPrice: Number(targetPrice),
          direction,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onAdded(data.item);
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Stock
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to watchlist</DialogTitle>
          <DialogDescription>
            Get notified when a stock crosses a target price you set.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wl-ticker" className="text-xs font-medium text-slate-300">
                Ticker
              </label>
              <Input
                id="wl-ticker"
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="INFY"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="wl-target" className="text-xs font-medium text-slate-300">
                Target price (₹)
              </label>
              <Input
                id="wl-target"
                type="number"
                min="0"
                step="0.01"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="1600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wl-name" className="text-xs font-medium text-slate-300">
              Company name
            </label>
            <Input
              id="wl-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Infosys"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wl-direction" className="text-xs font-medium text-slate-300">
              Alert me when price is
            </label>
            <select
              id="wl-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as WatchlistDirection)}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-slate-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="above" className="bg-slate-900">at or above target</option>
              <option value="below" className="bg-slate-900">at or below target</option>
            </select>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {submitting ? "Adding..." : "Add to watchlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
