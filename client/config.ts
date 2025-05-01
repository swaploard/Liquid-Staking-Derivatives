import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'

const sepoliaRPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(sepoliaRPC),
  },
})