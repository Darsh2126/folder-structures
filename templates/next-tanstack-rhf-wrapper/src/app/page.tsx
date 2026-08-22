'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBear } from "@/lib/stores/example-store";

export default function Home() {
  // zustand uses
  const bears = useBear((state) => state.bears)
  const increaseNumber = useBear((state) => state.increasePopulation)
  return (
    <div className="flex flex-col  items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Input placeholder="hello" className="max-w-50" />
      <span>bears number: {bears}</span>
      <Button onClick={increaseNumber}>Increase</Button>
    </div>
  );
}
