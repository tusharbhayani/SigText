declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_RPC_URL: string;
      EXPO_PUBLIC_ELEVENLABS_API_KEY: string;
      EXPO_PUBLIC_ELEVENLABS_VOICE_ID: string;
      EXPO_PUBLIC_BLOCKCHAIN_NETWORK: string;
      EXPO_PUBLIC_CHAIN_ID: string;
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_NODELY_API_KEY: string;
      EXPO_PUBLIC_ALGORAND_NETWORK: string;
      EXPO_PUBLIC_ALGORAND_API_URL: string;
    }
  }
}

// Ensure this file is treated as a module
export {};
