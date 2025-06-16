/*
  # Create Organizations and Verification System

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text, organization name)
      - `domain` (text, verified domain)
      - `wallet_address` (text, primary wallet address)
      - `public_key` (text, public key for verification)
      - `verification_status` (enum: pending, verified, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
    
    - `organization_wallets`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `wallet_address` (text, wallet address)
      - `wallet_type` (text, e.g., 'ethereum', 'bitcoin')
      - `is_primary` (boolean)
      - `created_at` (timestamp)
    
    - `verified_messages`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `message_content` (text, original message)
      - `signature` (text, cryptographic signature)
      - `sender_address` (text, sender wallet address)
      - `verification_status` (enum: pending, verified, failed)
      - `verification_details` (jsonb, additional verification data)
      - `created_at` (timestamp)
      - `verified_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Organization creators can manage their organizations
    - Public read access for verified organizations

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints for wallet addresses
*/

-- Create custom types
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'failed');
CREATE TYPE wallet_type AS ENUM ('ethereum', 'bitcoin', 'solana', 'polygon', 'other');

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  description text,
  wallet_address text NOT NULL,
  public_key text NOT NULL,
  verification_status verification_status DEFAULT 'pending',
  logo_url text,
  website_url text,
  contact_email text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT organizations_wallet_address_unique UNIQUE (wallet_address),
  CONSTRAINT organizations_domain_unique UNIQUE (domain)
);

-- Organization wallets table (for multiple wallet support)
CREATE TABLE IF NOT EXISTS organization_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  wallet_type wallet_type DEFAULT 'ethereum',
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT organization_wallets_unique UNIQUE (organization_id, wallet_address)
);

-- Verified messages table
CREATE TABLE IF NOT EXISTS verified_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  message_content text NOT NULL,
  signature text NOT NULL,
  sender_address text NOT NULL,
  recipient_address text,
  verification_status verification_status DEFAULT 'pending',
  verification_details jsonb DEFAULT '{}',
  message_hash text,
  block_number bigint,
  transaction_hash text,
  chain_id integer,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  
  CONSTRAINT verified_messages_signature_unique UNIQUE (signature, message_hash)
);

-- Message verification attempts table (for tracking verification history)
CREATE TABLE IF NOT EXISTS message_verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES verified_messages(id) ON DELETE CASCADE,
  attempted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method text NOT NULL, -- 'sms', 'qr', 'manual'
  success boolean NOT NULL,
  error_message text,
  verification_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Organization verification requests table
CREATE TABLE IF NOT EXISTS organization_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL, -- 'domain', 'wallet', 'manual'
  verification_data jsonb NOT NULL,
  status verification_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_verification_requests ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Public can view verified organizations"
  ON organizations
  FOR SELECT
  TO public
  USING (verification_status = 'verified');

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization creators can update their organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Organization creators can delete their organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Organization wallets policies
CREATE POLICY "Public can view wallets of verified organizations"
  ON organization_wallets
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_wallets.organization_id 
      AND verification_status = 'verified'
    )
  );

CREATE POLICY "Organization creators can manage wallets"
  ON organization_wallets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_wallets.organization_id 
      AND created_by = auth.uid()
    )
  );

-- Verified messages policies
CREATE POLICY "Public can view verified messages"
  ON verified_messages
  FOR SELECT
  TO public
  USING (verification_status = 'verified');

CREATE POLICY "Authenticated users can create verification attempts"
  ON verified_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their verification attempts"
  ON verified_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_verification_attempts 
      WHERE message_id = verified_messages.id 
      AND attempted_by = auth.uid()
    )
  );

-- Message verification attempts policies
CREATE POLICY "Users can view their verification attempts"
  ON message_verification_attempts
  FOR SELECT
  TO authenticated
  USING (attempted_by = auth.uid());

CREATE POLICY "Users can create verification attempts"
  ON message_verification_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (attempted_by = auth.uid());

-- Organization verification requests policies
CREATE POLICY "Users can view their verification requests"
  ON organization_verification_requests
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Users can create verification requests"
  ON organization_verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_verification_status ON organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_organizations_wallet_address ON organizations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organization_wallets_address ON organization_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_verified_messages_sender ON verified_messages(sender_address);
CREATE INDEX IF NOT EXISTS idx_verified_messages_status ON verified_messages(verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_messages_org_id ON verified_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_message_attempts_message_id ON message_verification_attempts(message_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_organization_by_wallet(wallet_addr text)
RETURNS TABLE (
  id uuid,
  name text,
  verification_status verification_status,
  public_key text
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.verification_status, o.public_key
  FROM organizations o
  WHERE o.wallet_address = wallet_addr 
     OR EXISTS (
       SELECT 1 FROM organization_wallets ow 
       WHERE ow.organization_id = o.id 
       AND ow.wallet_address = wallet_addr 
       AND ow.is_active = true
     );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_message_signature(
  message_content text,
  signature text,
  sender_addr text
)
RETURNS TABLE (
  is_valid boolean,
  organization_id uuid,
  organization_name text,
  verification_details jsonb
) AS $$
DECLARE
  org_record RECORD;
  verification_result jsonb;
BEGIN
  -- Get organization by wallet address
  SELECT INTO org_record *
  FROM get_organization_by_wallet(sender_addr)
  WHERE verification_status = 'verified'
  LIMIT 1;
  
  IF org_record.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, '{"error": "Organization not found or not verified"}'::jsonb;
    RETURN;
  END IF;
  
  -- In a real implementation, this would perform actual cryptographic verification
  -- For now, we'll simulate verification based on signature format and length
  verification_result := jsonb_build_object(
    'signature_length', length(signature),
    'message_hash', encode(digest(message_content, 'sha256'), 'hex'),
    'verified_at', extract(epoch from now()),
    'verification_method', 'supabase_function'
  );
  
  -- Simple validation: signature should be hex and at least 128 characters
  IF signature ~ '^[0-9a-fA-F]{128,}$' THEN
    RETURN QUERY SELECT true, org_record.id, org_record.name, verification_result;
  ELSE
    RETURN QUERY SELECT false, org_record.id, org_record.name, 
      verification_result || '{"error": "Invalid signature format"}'::jsonb;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;