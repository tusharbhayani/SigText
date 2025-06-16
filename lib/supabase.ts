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
  if (!supabaseUrl) {
    // Mock response for development without Supabase
    return {
      data: {
        id: 'mock-id-' + Date.now(),
        ...orgData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert([orgData])
    .select()
    .single();

  return { data, error };
};

export const getOrganizations = async (verified_only = false) => {
  if (!supabaseUrl) {
    // Mock response for development without Supabase
    return {
      data: [
        {
          id: 'mock-org-1',
          name: 'Acme Bank',
          domain: 'acmebank.com',
          description: 'Trusted financial institution',
          wallet_address: '0x1111111111111111111111111111111111111111',
          public_key:
            '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd',
          verification_status: 'verified',
          logo_url:
            'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg',
          website_url: 'https://acmebank.com',
          contact_email: 'security@acmebank.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'mock-org-2',
          name: 'Tech Solutions Inc',
          domain: 'techsolutions.com',
          description: 'Leading technology company',
          wallet_address: '0x2222222222222222222222222222222222222222',
          public_key:
            '04b45c99f33d890e5f47c3d4c4d46a47eb17337f52d803fc93c7b67bd2d651e6ce',
          verification_status: 'verified',
          logo_url:
            'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
          website_url: 'https://techsolutions.com',
          contact_email: 'verify@techsolutions.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    };
  }

  let query = supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (verified_only) {
    query = query.eq('verification_status', 'verified');
  }

  const { data, error } = await query;
  return { data, error };
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
      error: { message: 'Permission denied - check your access rights' },
    };
  }

  return { error: { message: error?.message || 'Unknown database error' } };
};

// Enhanced getMessages with better error handling
export async function getMessages(limit = 50) {
  try {
    if (!supabaseUrl) {
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

// Mock messages for fallback
function getMockMessages() {
  return {
    data: [
      {
        id: 'mock-1',
        sender: 'Acme Bank',
        content:
          'Your account balance is $1,250.00. Transaction verified with blockchain signature.',
        signature:
          'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        timestamp: new Date().toISOString(),
        verified: true,
        organization_id: 'mock-org-1',
      },
      {
        id: 'mock-2',
        sender: 'Security Alert System',
        content:
          'New device login detected from IP 192.168.1.100. Please verify if this was you.',
        signature:
          '1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        verified: true,
        organization_id: 'mock-org-2',
      },
      {
        id: 'mock-3',
        sender: 'Payment Processor',
        content:
          'Payment of $50.00 received from John Doe. Transaction ID: TXN123456',
        signature:
          'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        verified: false,
        organization_id: null,
      },
    ],
    error: null,
  };
}

export const getOrganizationByWallet = async (walletAddress: string) => {
  if (!supabaseUrl) {
    // Mock response for development without Supabase
    if (walletAddress === '0x1111111111111111111111111111111111111111') {
      return {
        data: {
          id: 'mock-org-1',
          name: 'Acme Bank',
          verification_status: 'verified',
        },
        error: null,
      };
    }
    return { data: null, error: null };
  }

  const { data, error } = await supabase.rpc('get_organization_by_wallet', {
    wallet_addr: walletAddress,
  });

  return { data: data?.[0] || null, error };
};

export const updateOrganization = async (
  id: string,
  updates: Partial<Organization>
) => {
  if (!supabaseUrl) {
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

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

// Enhanced verification with better error handling
export const verifyMessage = async (
  messageContent: string,
  signature: string,
  senderAddress: string
) => {
  if (!supabaseUrl) {
    // Enhanced mock response
    return {
      data: {
        is_valid: signature.length >= 64 && messageContent.length > 0,
        organization_id: 'mock-org-1',
        organization_name: 'Mock Organization',
        verification_details: {
          timestamp: Date.now(),
          method: 'mock',
          signature_format: 'hex',
          message_hash: messageContent.substring(0, 8),
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
      return handleSupabaseError(error, 'message verification');
    }

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    return handleSupabaseError(error, 'message verification');
  }
};

export const saveVerifiedMessage = async (
  messageData: Partial<VerifiedMessage>
) => {
  if (!supabaseUrl) {
    // Mock response for development without Supabase
    return {
      data: {
        id: 'mock-msg-' + Date.now(),
        ...messageData,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('verified_messages')
    .insert([messageData])
    .select(
      `
      *,
      organization:organizations(*)
    `
    )
    .single();

  return { data, error };
};

export const getVerifiedMessages = async (limit = 50) => {
  if (!supabaseUrl) {
    // Mock response for development without Supabase
    return {
      data: [
        {
          id: 'mock-msg-1',
          message_content:
            'Your account balance is $1,250.00. Transaction ID: TX123456',
          signature:
            'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef123456',
          sender_address: '0x1111111111111111111111111111111111111111',
          verification_status: 'verified',
          created_at: new Date().toISOString(),
          organization: {
            name: 'Acme Bank',
            verification_status: 'verified',
          },
        },
        {
          id: 'mock-msg-2',
          message_content: 'Security alert: New device login detected',
          signature:
            '1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef',
          sender_address: '0x2222222222222222222222222222222222222222',
          verification_status: 'verified',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          organization: {
            name: 'Tech Solutions Inc',
            verification_status: 'verified',
          },
        },
      ],
      error: null,
    };
  }

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

  return { data, error };
};

export const recordVerificationAttempt = async (
  attemptData: Partial<MessageVerificationAttempt>
) => {
  if (!supabaseUrl) {
    // Mock response for development without Supabase
    return {
      data: {
        id: 'mock-attempt-' + Date.now(),
        ...attemptData,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('message_verification_attempts')
    .insert([attemptData])
    .select()
    .single();

  return { data, error };
};

// Real-time subscriptions
export const subscribeToVerifiedMessages = (
  callback: (payload: any) => void
) => {
  if (!supabaseUrl) {
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

// Utility functions for testing
export const addSampleOrganizations = async () => {
  const sampleOrgs = [
    {
      name: 'Acme Bank',
      domain: 'acmebank.com',
      description: 'Trusted financial institution',
      wallet_address: '0x1111111111111111111111111111111111111111',
      public_key:
        '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd',
      verification_status: 'verified' as const,
      logo_url:
        'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg',
      website_url: 'https://acmebank.com',
      contact_email: 'security@acmebank.com',
    },
    {
      name: 'Tech Solutions Inc',
      domain: 'techsolutions.com',
      description: 'Leading technology company',
      wallet_address: '0x2222222222222222222222222222222222222222',
      public_key:
        '04b45c99f33d890e5f47c3d4c4d46a47eb17337f52d803fc93c7b67bd2d651e6ce',
      verification_status: 'verified' as const,
      logo_url:
        'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
      website_url: 'https://techsolutions.com',
      contact_email: 'verify@techsolutions.com',
    },
    {
      name: 'Digital Identity Bureau',
      domain: 'digitalid.gov',
      description: 'Government digital identity services',
      wallet_address: '0x3333333333333333333333333333333333333333',
      public_key:
        '04c56d99f44e901f6f58d4e5d5e57b58fc28448g63e914gd04d8c78ce3e762f7df',
      verification_status: 'verified' as const,
      logo_url:
        'https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg',
      website_url: 'https://digitalid.gov',
      contact_email: 'support@digitalid.gov',
    },
  ];

  const results = [];
  for (const org of sampleOrgs) {
    const { data, error } = await createOrganization(org);
    results.push({ data, error });
  }

  return results;
};

// Add sample messages function
export const addSampleMessages = async () => {
  const sampleMessages = [
    {
      organization_id: null,
      message_content:
        'Your account balance is $1,250.00. Transaction ID: TX123456',
      signature:
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef123456',
      sender_address: '0x1111111111111111111111111111111111111111',
      verification_status: 'verified' as const,
      verification_details: {
        timestamp: Date.now(),
        method: 'blockchain',
      },
    },
    {
      organization_id: null,
      message_content: 'Security alert: New device login detected',
      signature:
        '1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef',
      sender_address: '0x2222222222222222222222222222222222222222',
      verification_status: 'verified' as const,
      verification_details: {
        timestamp: Date.now(),
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

// Test message verification
export const testMessageVerification = async () => {
  const testCases = [
    {
      message: 'Your account balance is $1,250.00. Transaction ID: TX123456',
      signature:
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef123456',
      sender: '0x1111111111111111111111111111111111111111',
    },
    {
      message: 'Security alert: New device login detected',
      signature:
        '1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef',
      sender: '0x2222222222222222222222222222222222222222',
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
