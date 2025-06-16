# 🚀 Complete Supabase Setup Guide for Web3 Message Verifier

## 📋 Table of Contents
1. [Initial Supabase Setup](#initial-supabase-setup)
2. [Database Schema Overview](#database-schema-overview)
3. [Environment Configuration](#environment-configuration)
4. [Adding Organizations](#adding-organizations)
5. [Testing Message Verification](#testing-message-verification)
6. [API Usage Examples](#api-usage-examples)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Initial Supabase Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - **Name**: `web3-message-verifier`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Wait for project initialization (2-3 minutes)

### Step 2: Get Project Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Configure Environment Variables
1. Create `.env` file in your project root:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🗄️ Database Schema Overview

The migration file creates these tables:

### 📊 Core Tables

#### 1. **organizations**
- Stores verified organizations that can send signed messages
- Fields: `id`, `name`, `domain`, `wallet_address`, `public_key`, `verification_status`

#### 2. **organization_wallets**
- Multiple wallet addresses per organization
- Fields: `organization_id`, `wallet_address`, `wallet_type`, `is_primary`

#### 3. **verified_messages**
- Stores all verified message signatures
- Fields: `message_content`, `signature`, `sender_address`, `verification_status`

#### 4. **message_verification_attempts**
- Tracks verification history and attempts
- Fields: `message_id`, `attempted_by`, `verification_method`, `success`

---

## ⚙️ Environment Configuration

### Step 4: Apply Database Migration
The migration is already in your project. To apply it:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the content from `supabase/migrations/20250613065427_silver_valley.sql`
3. Paste and run the SQL
4. Verify tables are created in **Table Editor**

### Step 5: Enable Row Level Security (RLS)
The migration automatically enables RLS with these policies:
- ✅ Public can view verified organizations
- ✅ Users can create and manage their organizations
- ✅ Public can view verified messages
- ✅ Users can track their verification attempts

---

## 🏢 Adding Organizations

### Method 1: Using Supabase Dashboard

1. Go to **Table Editor** → **organizations**
2. Click **Insert** → **Insert row**
3. Fill in the data:

```json
{
  "name": "Acme Bank",
  "domain": "acmebank.com",
  "description": "Trusted financial institution",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "public_key": "04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd",
  "verification_status": "verified",
  "logo_url": "https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg",
  "website_url": "https://acmebank.com",
  "contact_email": "security@acmebank.com"
}
```

### Method 2: Using SQL Insert

```sql
INSERT INTO organizations (
  name, 
  domain, 
  description, 
  wallet_address, 
  public_key, 
  verification_status,
  logo_url,
  website_url,
  contact_email
) VALUES (
  'Acme Bank',
  'acmebank.com',
  'Trusted financial institution',
  '0x1234567890123456789012345678901234567890',
  '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd',
  'verified',
  'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg',
  'https://acmebank.com',
  'security@acmebank.com'
);
```

### Method 3: Using the App (Programmatically)

```typescript
import { createOrganization } from '@/lib/supabase';

const addOrganization = async () => {
  const { data, error } = await createOrganization({
    name: 'Tech Corp',
    domain: 'techcorp.com',
    description: 'Leading technology company',
    wallet_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    public_key: '04b45c99f33d890e5f47c3d4c4d46a47eb17337f52d803fc93c7b67bd2d651e6ce',
    verification_status: 'pending',
    website_url: 'https://techcorp.com',
    contact_email: 'verify@techcorp.com'
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Organization created:', data);
  }
};
```

---

## 🧪 Testing Message Verification

### Step 6: Add Test Organizations

Add these sample organizations for testing:

```sql
-- Sample Bank
INSERT INTO organizations (name, wallet_address, public_key, verification_status) 
VALUES (
  'Sample Bank', 
  '0x1111111111111111111111111111111111111111',
  '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd',
  'verified'
);

-- Tech Company
INSERT INTO organizations (name, wallet_address, public_key, verification_status) 
VALUES (
  'Tech Solutions Inc', 
  '0x2222222222222222222222222222222222222222',
  '04b45c99f33d890e5f47c3d4c4d46a47eb17337f52d803fc93c7b67bd2d651e6ce',
  'verified'
);

-- Government Agency
INSERT INTO organizations (name, wallet_address, public_key, verification_status) 
VALUES (
  'Digital Identity Bureau', 
  '0x3333333333333333333333333333333333333333',
  '04c56d99f44e901f6f58d4e5d5e57b58fc28448g63e914gd04d8c78ce3e762f7df',
  'verified'
);
```

### Step 7: Test Message Verification

Use the app to test with these sample SMS messages:

```
Your account balance is $1,250.00. Transaction ID: TX123456 [SIG:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef123456]

Security alert: New device login detected [WEB3SIG:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef]

Your verification code is 789012 [SIGNATURE:SGVsbG8gV29ybGQgVGhpcyBJcyBBIFRlc3QgU2lnbmF0dXJlIEZvciBEZW1vbnN0cmF0aW9u]
```

---

## 🔌 API Usage Examples

### Verify Message Signature

```typescript
import { verifyMessage } from '@/lib/supabase';

const testVerification = async () => {
  const { data, error } = await verifyMessage(
    'Your account balance is $1,250.00',
    'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef123456',
    '0x1111111111111111111111111111111111111111'
  );
  
  console.log('Verification result:', data);
};
```

### Get All Organizations

```typescript
import { getOrganizations } from '@/lib/supabase';

const loadOrganizations = async () => {
  const { data, error } = await getOrganizations(true); // verified only
  console.log('Verified organizations:', data);
};
```

### Save Verified Message

```typescript
import { saveVerifiedMessage } from '@/lib/supabase';

const saveMessage = async () => {
  const { data, error } = await saveVerifiedMessage({
    organization_id: 'org-uuid-here',
    message_content: 'Your transaction is complete',
    signature: 'signature-here',
    sender_address: '0x1111111111111111111111111111111111111111',
    verification_status: 'verified'
  });
};
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **RLS Policy Errors**
```
Error: new row violates row-level security policy
```
**Solution**: Ensure user is authenticated or policy allows the operation

#### 2. **Invalid Signature Format**
```
Error: Invalid signature format
```
**Solution**: Ensure signature is hex format and at least 128 characters

#### 3. **Organization Not Found**
```
Error: Organization not found or not verified
```
**Solution**: Check wallet address and verification status

### Debugging Queries

#### Check Organization Status
```sql
SELECT name, wallet_address, verification_status 
FROM organizations 
WHERE wallet_address = '0x1111111111111111111111111111111111111111';
```

#### View Recent Verifications
```sql
SELECT vm.*, o.name as org_name
FROM verified_messages vm
LEFT JOIN organizations o ON vm.organization_id = o.id
ORDER BY vm.created_at DESC
LIMIT 10;
```

#### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 🎯 Next Steps

1. **Add Real Organizations**: Replace test data with actual verified organizations
2. **Implement Admin Panel**: Create interface for organization verification
3. **Add Webhook Integration**: Real-time verification updates
4. **Enhance Security**: Add additional signature validation
5. **Monitor Usage**: Set up analytics and logging

---

## 📞 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **SQL Reference**: [postgresql.org/docs](https://www.postgresql.org/docs/)
- **App Issues**: Check console logs and error messages

---

**🎉 Your Web3 Message Verifier is now ready with full Supabase integration!**