"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WalletLinker } from "@/components/wallet/wallet-linker";

/** The linked wallet on the account card, changeable in place */
export function AccountWallet({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [wallet, setWallet] = useState(initial);

  return (
    <WalletLinker
      current={wallet}
      onLinked={(address) => {
        setWallet(address);
        router.refresh();
      }}
    />
  );
}
