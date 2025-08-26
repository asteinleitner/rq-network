import React from "react";
import ConsoleApp from "./ConsoleApp";

export default function ConsoleAppAdapter({ activeNetworkId }: { activeNetworkId: string }) {
  (window as any).__ACTIVE_NETWORK_ID__ = activeNetworkId;
  return <ConsoleApp />;
}
