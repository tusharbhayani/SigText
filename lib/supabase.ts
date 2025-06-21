import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using mock data.');
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Database types
export interface Organization {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  wallet_address: string;
  public_key: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface OrganizationWallet {
  id: string;
  organization_id: string;
  wallet_address: string;
  wallet_type: 'ethereum' | 'bitcoin' | 'solana' | 'polygon' | 'other';
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface VerifiedMessage {
  id: string;
  organization_id?: string;
  message_content: string;
  signature: string;
  sender_address: string;
  recipient_address?: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_details?: any;
  message_hash?: string;
  block_number?: number;
  transaction_hash?: string;
  chain_id?: number;
  created_at: string;
  verified_at?: string;
  organization?: Organization;
}

export interface Message {
  id: string;
  content: string;
  signature?: string;
  sender: string;
  timestamp: string;
  verified?: boolean;
  hash?: string;
  type?: string;
}

export interface MessageVerificationAttempt {
  id: string;
  message_id: string;
  attempted_by?: string;
  verification_method: string;
  success: boolean;
  error_message?: string;
  verification_data?: any;
  created_at: string;
}

// Helper function to generate realistic wallet addresses
const generateRealisticWalletAddress = (): string => {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to generate realistic public keys
const generateRealisticPublicKey = (): string => {
  const chars = '0123456789abcdef';
  let result = '04'; // Standard prefix for uncompressed public keys
  for (let i = 0; i < 126; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

// Organization management
export const createOrganization = async (orgData: Partial<Organization>) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock response for development without Supabase
    return {
      data: {
        id: 'org-' + Date.now(),
        ...orgData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    console.log('Creating organization with data:', orgData);

    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          ...orgData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase create organization error:', error);

      // Handle specific RLS error
      if (error.code === '42501') {
        return {
          data: null,
          error: {
            message:
              'Permission denied. Please check your Supabase Row Level Security policies or contact support.',
          },
        };
      }

      return { data: null, error };
    }

    console.log('Organization created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Exception in createOrganization:', error);
    return {
      data: null,
      error: { message: 'Failed to create organization: ' + error.message },
    };
  }
};

export const getOrganizations = async (verified_only = false) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return completely dynamic mock data - NO STATIC ADDRESSES
    const currentTime = Date.now();
    return {
      data: [
        {
          id: 'org-' + currentTime + '-1',
          name: 'CryptoSecure Technologies',
          domain: 'cryptosecure.tech',
          description: 'Advanced blockchain security solutions for enterprises',
          wallet_address: generateRealisticWalletAddress(),
          public_key: generateRealisticPublicKey(),
          verification_status: 'verified',
          logo_url:
            'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
          website_url: 'https://cryptosecure.tech',
          contact_email: 'security@cryptosecure.tech',
          created_at: new Date(currentTime - 86400000).toISOString(),
          updated_at: new Date(currentTime - 86400000).toISOString(),
        },
        {
          id: 'org-' + currentTime + '-2',
          name: 'FinanceFlow Digital',
          domain: 'financeflow.io',
          description: 'Digital banking and financial verification services',
          wallet_address: generateRealisticWalletAddress(),
          public_key: generateRealisticPublicKey(),
          verification_status: 'verified',
          logo_url:
            'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg',
          website_url: 'https://financeflow.io',
          contact_email: 'verify@financeflow.io',
          created_at: new Date(currentTime - 172800000).toISOString(),
          updated_at: new Date(currentTime - 172800000).toISOString(),
        },
        {
          id: 'org-' + currentTime + '-3',
          name: 'MedChain Innovations',
          domain: 'medchain.health',
          description:
            'Healthcare blockchain solutions and patient data verification',
          wallet_address: generateRealisticWalletAddress(),
          public_key: generateRealisticPublicKey(),
          verification_status: 'pending',
          logo_url:
            'https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg',
          website_url: 'https://medchain.health',
          contact_email: 'support@medchain.health',
          created_at: new Date(currentTime - 259200000).toISOString(),
          updated_at: new Date(currentTime - 259200000).toISOString(),
        },
      ],
      error: null,
    };
  }

  try {
    let query = supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (verified_only) {
      query = query.eq('verification_status', 'verified');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase get organizations error:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getOrganizations:', error);
    return { data: [], error: { message: 'Failed to fetch organizations' } };
  }
};

// Enhanced error handling wrapper
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);

  if (error?.code === 'PGRST116') {
    return { error: { message: 'No data found' } };
  }

  if (error?.code === '23505') {
    return { error: { message: 'Duplicate entry - record already exists' } };
  }

  if (error?.code === '42501') {
    return {
      error: {
        message: 'Permission denied - please check your database permissions',
      },
    };
  }

  return { error: { message: error?.message || 'Unknown database error' } };
};

// Enhanced getMessages with better error handling
export async function getMessages(limit = 50) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return getMockMessages();
    }

    // Try to get from verified_messages first
    const { data: verifiedData, error: verifiedError } = await supabase
      .from('verified_messages')
      .select(
        `
        *,
        organization:organizations(name, verification_status, logo_url)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (verifiedError) {
      console.error('Error fetching verified messages:', verifiedError);
      return getMockMessages();
    }

    // Convert verified_messages format to messages format
    const convertedData = (verifiedData || []).map((msg) => ({
      id: msg.id,
      sender: msg.organization?.name || msg.sender_address || 'Unknown',
      content: msg.message_content,
      signature: msg.signature,
      timestamp: msg.created_at,
      verified: msg.verification_status === 'verified',
      organization_id: msg.organization_id,
      verification_details: msg.verification_details,
    }));

    return { data: convertedData, error: null };
  } catch (e) {
    console.error('Exception in getMessages:', e);
    return getMockMessages();
  }
}

// Mock messages for fallback with completely dynamic data
function getMockMessages() {
  const currentTime = Date.now();
  const companies = [
    'CryptoSecure Technologies',
    'FinanceFlow Digital',
    'MedChain Innovations',
  ];

  return {
    data: [
      {
        id: 'msg-' + currentTime + '-1',
        sender: companies[0],
        content: `Account verification completed. Balance: $${(
          Math.random() * 50000 +
          1000
        ).toFixed(2)}. Ref: ${Math.random()
          .toString(36)
          .substr(2, 8)
          .toUpperCase()}`,
        signature:
          '0x' +
          Array.from({ length: 128 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
        timestamp: new Date(
          currentTime - Math.random() * 3600000
        ).toISOString(),
        verified: true,
        organization_id: 'org-' + currentTime + '-1',
      },
      {
        id: 'msg-' + currentTime + '-2',
        sender: companies[1],
        content: `Security Alert: Login from ${
          ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin'][
            Math.floor(Math.random() * 5)
          ]
        } at ${new Date().toLocaleTimeString()}`,
        signature:
          '0x' +
          Array.from({ length: 128 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
        timestamp: new Date(
          currentTime - Math.random() * 7200000
        ).toISOString(),
        verified: true,
        organization_id: 'org-' + currentTime + '-2',
      },
      {
        id: 'msg-' + currentTime + '-3',
        sender: companies[2],
        content: `Appointment confirmed for ${new Date(
          Date.now() + 86400000
        ).toLocaleDateString()} at ${
          Math.floor(Math.random() * 12) + 1
        }:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${
          Math.random() > 0.5 ? 'AM' : 'PM'
        }`,
        signature:
          '0x' +
          Array.from({ length: 128 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
        timestamp: new Date(
          currentTime - Math.random() * 10800000
        ).toISOString(),
        verified: false,
        organization_id: null,
      },
    ],
    error: null,
  };
}

export const getOrganizationByWallet = async (walletAddress: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock response with completely dynamic data
    const mockOrgs = [
      {
        id: 'org-' + Date.now() + '-1',
        name: 'CryptoSecure Technologies',
        verification_status: 'verified',
        wallet_address: generateRealisticWalletAddress(),
      },
      {
        id: 'org-' + Date.now() + '-2',
        name: 'FinanceFlow Digital',
        verification_status: 'verified',
        wallet_address: generateRealisticWalletAddress(),
      },
    ];

    const found = mockOrgs.find(
      (org) => org.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    );
    return { data: found || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching organization by wallet:', error);
      return { data: null, error };
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Exception in getOrganizationByWallet:', error);
    return { data: null, error: { message: 'Failed to fetch organization' } };
  }
};

export const updateOrganization = async (
  id: string,
  updates: Partial<Organization>
) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock response for development without Supabase
    return {
      data: {
        id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update organization error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception in updateOrganization:', error);
    return { data: null, error: { message: 'Failed to update organization' } };
  }
};

// Enhanced verification with better error handling
export const verifyMessage = async (
  messageContent: string,
  signature: string,
  senderAddress: string
) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Enhanced mock response with realistic verification
    const isValidSignature =
      signature.length >= 64 && messageContent.length > 0;
    const mockOrgId = 'org-' + Date.now() + '-1';

    return {
      data: {
        is_valid: isValidSignature,
        organization_id: isValidSignature ? mockOrgId : null,
        organization_name: isValidSignature
          ? 'CryptoSecure Technologies'
          : null,
        verification_details: {
          timestamp: Date.now(),
          method: 'mock',
          signature_format: 'hex',
          message_hash: Array.from({ length: 8 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
          sender_address: senderAddress,
        },
      },
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.rpc('verify_message_signature', {
      message_content: messageContent,
      signature: signature,
      sender_addr: senderAddress,
    });

    if (error) {
      console.error('Message verification error:', error);
      return handleSupabaseError(error, 'message verification');
    }

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Exception in verifyMessage:', error);
    return handleSupabaseError(error, 'message verification');
  }
};

export const saveVerifiedMessage = async (
  messageData: Partial<VerifiedMessage>
) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock response for development without Supabase
    return {
      data: {
        id: 'msg-' + Date.now(),
        ...messageData,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('verified_messages')
      .insert([
        {
          ...messageData,
          created_at: new Date().toISOString(),
        },
      ])
      .select(
        `
        *,
        organization:organizations(*)
      `
      )
      .single();

    if (error) {
      console.error('Error saving verified message:', error);

      // Handle RLS error specifically
      if (error.code === '42501') {
        return {
          data: null,
          error: {
            message:
              'Permission denied. Please check your database permissions.',
          },
        };
      }

      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception in saveVerifiedMessage:', error);
    return {
      data: null,
      error: { message: 'Failed to save verified message' },
    };
  }
};

export const getVerifiedMessages = async (limit = 50) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock response with completely dynamic data
    const currentTime = Date.now();
    const companies = [
      'CryptoSecure Technologies',
      'FinanceFlow Digital',
      'MedChain Innovations',
    ];

    return {
      data: [
        {
          id: 'msg-' + currentTime + '-1',
          message_content: `Account balance updated: $${(
            Math.random() * 50000 +
            1000
          ).toFixed(2)}. Transaction: ${Math.random()
            .toString(36)
            .substr(2, 8)
            .toUpperCase()}`,
          signature:
            '0x' +
            Array.from({ length: 128 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
          sender_address: generateRealisticWalletAddress(),
          verification_status: 'verified',
          created_at: new Date(
            currentTime - Math.random() * 86400000
          ).toISOString(),
          organization: {
            name: companies[0],
            verification_status: 'verified',
          },
        },
        {
          id: 'msg-' + currentTime + '-2',
          message_content: `Security notification: Device login from ${
            ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin'][
              Math.floor(Math.random() * 5)
            ]
          }`,
          signature:
            '0x' +
            Array.from({ length: 128 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
          sender_address: generateRealisticWalletAddress(),
          verification_status: 'verified',
          created_at: new Date(
            currentTime - Math.random() * 172800000
          ).toISOString(),
          organization: {
            name: companies[1],
            verification_status: 'verified',
          },
        },
      ],
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('verified_messages')
      .select(
        `
        *,
        organization:organizations(name, verification_status, logo_url)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching verified messages:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getVerifiedMessages:', error);
    return {
      data: [],
      error: { message: 'Failed to fetch verified messages' },
    };
  }
};

export const recordVerificationAttempt = async (
  attemptData: Partial<MessageVerificationAttempt>
) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock response for development without Supabase
    return {
      data: {
        id: 'attempt-' + Date.now(),
        ...attemptData,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('message_verification_attempts')
      .insert([attemptData])
      .select()
      .single();

    if (error) {
      console.error('Error recording verification attempt:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception in recordVerificationAttempt:', error);
    return {
      data: null,
      error: { message: 'Failed to record verification attempt' },
    };
  }
};

// Real-time subscriptions
export const subscribeToVerifiedMessages = (
  callback: (payload: any) => void
) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock subscription for development without Supabase
    console.log('Mock subscription created (no Supabase URL)');
    return {
      unsubscribe: () => console.log('Mock unsubscribe called'),
    };
  }

  return supabase
    .channel('verified_messages')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'verified_messages',
      },
      callback
    )
    .subscribe();
};

// Utility functions for testing with completely dynamic data
export const addSampleOrganizations = async () => {
  const currentTime = Date.now();
  const sampleOrgs = [
    {
      name: 'CryptoSecure Technologies',
      domain: 'cryptosecure.tech',
      description: 'Advanced blockchain security solutions for enterprises',
      wallet_address: generateRealisticWalletAddress(),
      public_key: generateRealisticPublicKey(),
      verification_status: 'verified' as const,
      logo_url:
        'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
      website_url: 'https://cryptosecure.tech',
      contact_email: 'security@cryptosecure.tech',
    },
    {
      name: 'FinanceFlow Digital',
      domain: 'financeflow.io',
      description: 'Digital banking and financial verification services',
      wallet_address: generateRealisticWalletAddress(),
      public_key: generateRealisticPublicKey(),
      verification_status: 'verified' as const,
      logo_url:
        'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg',
      website_url: 'https://financeflow.io',
      contact_email: 'verify@financeflow.io',
    },
    {
      name: 'MedChain Innovations',
      domain: 'medchain.health',
      description:
        'Healthcare blockchain solutions and patient data verification',
      wallet_address: generateRealisticWalletAddress(),
      public_key: generateRealisticPublicKey(),
      verification_status: 'pending' as const,
      logo_url:
        'https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg',
      website_url: 'https://medchain.health',
      contact_email: 'support@medchain.health',
    },
  ];

  const results = [];
  for (const org of sampleOrgs) {
    const { data, error } = await createOrganization(org);
    results.push({ data, error });
  }

  return results;
};

// Add sample messages function with dynamic data
export const addSampleMessages = async () => {
  const currentTime = Date.now();
  const sampleMessages = [
    {
      organization_id: null,
      message_content: `Account balance updated: $${(
        Math.random() * 50000 +
        1000
      ).toFixed(2)}. Transaction: ${Math.random()
        .toString(36)
        .substr(2, 8)
        .toUpperCase()}`,
      signature:
        '0x' +
        Array.from({ length: 128 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
      sender_address: generateRealisticWalletAddress(),
      verification_status: 'verified' as const,
      verification_details: {
        timestamp: currentTime,
        method: 'blockchain',
      },
    },
    {
      organization_id: null,
      message_content: `Security alert: Login detected from ${
        ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin'][
          Math.floor(Math.random() * 5)
        ]
      }`,
      signature:
        '0x' +
        Array.from({ length: 128 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
      sender_address: generateRealisticWalletAddress(),
      verification_status: 'verified' as const,
      verification_details: {
        timestamp: currentTime,
        method: 'blockchain',
      },
    },
  ];

  const results = [];
  for (const msg of sampleMessages) {
    const { data, error } = await saveVerifiedMessage(msg);
    results.push({ data, error });
  }

  return results;
};

// Test message verification with dynamic data
export const testMessageVerification = async () => {
  const currentTime = Date.now();
  const testCases = [
    {
      message: `Account balance updated: $${(
        Math.random() * 50000 +
        1000
      ).toFixed(2)}. Transaction: ${Math.random()
        .toString(36)
        .substr(2, 8)
        .toUpperCase()}`,
      signature:
        '0x' +
        Array.from({ length: 128 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
      sender: generateRealisticWalletAddress(),
    },
    {
      message: `Security alert: Login detected from ${
        ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin'][
          Math.floor(Math.random() * 5)
        ]
      }`,
      signature:
        '0x' +
        Array.from({ length: 128 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
      sender: generateRealisticWalletAddress(),
    },
  ];

  const results = [];
  for (const test of testCases) {
    const { data, error } = await verifyMessage(
      test.message,
      test.signature,
      test.sender
    );
    results.push({ test, result: data, error });
  }

  return results;
};
