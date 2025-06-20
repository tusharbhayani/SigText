# 🔐 Message Verifier

A secure mobile application for verifying Web3 message signatures and blockchain-based identity verification. Built with Expo Router, React Native, and integrated with Supabase for data management and Algorand blockchain for verification.

Mobile first Message Verifier

<td style="background:#222; text-align:center;"><img src="assets/images/bolt.png" width="250px"></td>
<td style="background:#222; text-align:center;"><img src="assets/images/algorand.png" width="250px"></td>
<td style="background:#222; text-align:center;"><img src="assets/images/elevenLabs.png" width="250px"></td>
<td style="background:#222; text-align:center;"><img src="assets/images/supabase.png" width="250px"></td>

## 🌟 Features

- **📱 SMS Message Verification**: Automatically detect and verify cryptographically signed SMS messages
- **📷 QR Code Scanner**: Scan QR codes containing signed messages for instant verification
- **🏢 Organization Management**: Manage verified organizations and their digital identities
- **🔗 Algorand Integration**: Explore Algorand blockchain accounts and transactions
- **🎤 Voice Feedback**: Audio confirmation of verification results using ElevenLabs or Web Speech API
- **🌙 Dark/Light Theme**: Beautiful adaptive UI with system theme support
- **📊 Real-time Dashboard**: Track verification statistics and message history
- **🔒 Secure Storage**: End-to-end encrypted message storage with Supabase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd web3-message-verifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - Web: Open `http://localhost:8081` in your browser
   - Mobile: Scan the QR code with Expo Go app

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs Voice API (Optional)
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
EXPO_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id

# Algorand Configuration via Nodely.io
# FREE TIER (No API key needed)
EXPO_PUBLIC_NODELY_API_KEY=
EXPO_PUBLIC_ALGORAND_NETWORK=testnet
EXPO_PUBLIC_ALGORAND_API_URL=https://testnet-api.4160.nodely.dev

# PAID TIER (With API key)
# EXPO_PUBLIC_NODELY_API_KEY=ndy_your_api_key_here
# EXPO_PUBLIC_ALGORAND_API_URL=https://algorand-testnet.nodely.io/v2

# Blockchain Configuration (Optional)
EXPO_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
EXPO_PUBLIC_CHAIN_ID=1
EXPO_PUBLIC_BLOCKCHAIN_NETWORK=mainnet
```

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### Step 2: Run Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the content from `supabase/migrations/20250613065427_silver_valley.sql`
3. Paste and execute the SQL
4. Verify tables are created in **Table Editor**

### Step 3: Add Sample Organizations

```sql
-- Add sample organizations for testing
INSERT INTO organizations (name, wallet_address, public_key, verification_status) VALUES
('Acme Bank', '0x1111111111111111111111111111111111111111', '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd', 'verified'),
('Tech Solutions Inc', '0x2222222222222222222222222222222222222222', '04b45c99f33d890e5f47c3d4c4d46a47eb17337f52d803fc93c7b67bd2d651e6ce', 'verified'),
('Digital Identity Bureau', '0x3333333333333333333333333333333333333333', '04c56d99f44e901f6f58d4e5d5e57b58fc28448g63e914gd04d8c78ce3e762f7df', 'verified');
```

## 🔗 External Service Setup

### 🎤 ElevenLabs Voice API (Optional)

1. **Sign up**: [elevenlabs.io](https://elevenlabs.io)
2. **Get API Key**: Dashboard → Profile → API Keys
3. **Choose Voice**: Browse voices and copy the Voice ID
4. **Add to .env**:
   ```env
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
   EXPO_PUBLIC_ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
   ```

### 🪙 Algorand via Nodely.io

#### FREE Tier (Recommended for Development)
- **No API key required**
- **Endpoints**: 
  - Testnet: `https://testnet-api.4160.nodely.dev`
  - Mainnet: `https://mainnet-api.4160.nodely.dev`
- **Configuration**:
  ```env
  EXPO_PUBLIC_NODELY_API_KEY=
  EXPO_PUBLIC_ALGORAND_NETWORK=testnet
  EXPO_PUBLIC_ALGORAND_API_URL=https://testnet-api.4160.nodely.dev
  ```

#### PAID Tier (Production)
1. **Sign up**: [nodely.io](https://nodely.io)
2. **Choose plan**: Starter ($29/month) or Pro ($99/month)
3. **Get API Key**: Dashboard → API Keys → Create New
4. **Configuration**:
   ```env
   EXPO_PUBLIC_NODELY_API_KEY=ndy_your_api_key_here
   EXPO_PUBLIC_ALGORAND_NETWORK=testnet
   EXPO_PUBLIC_ALGORAND_API_URL=https://algorand-testnet.nodely.io/v2
   ```

### ⛓️ Ethereum RPC (Optional)

Choose one of these providers:

#### Alchemy (Recommended)
1. **Sign up**: [alchemy.com](https://alchemy.com)
2. **Create app**: Dashboard → Create App
3. **Get URL**: View Key → HTTP URL
4. **Add to .env**:
   ```env
   EXPO_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
   ```

#### Infura
1. **Sign up**: [infura.io](https://infura.io)
2. **Create project**: Dashboard → Create New Project
3. **Get endpoint**: Project Settings → Endpoints

#### QuickNode
1. **Sign up**: [quicknode.com](https://quicknode.com)
2. **Create endpoint**: Dashboard → Create Endpoint

## 📱 Usage Guide

### 🏠 Home Screen
- View verification statistics
- Quick access to main features
- Recent message history

### 📷 QR Scanner
- Scan QR codes containing signed messages
- Automatic signature verification
- Voice feedback for results

### 🏢 Organizations
- Browse verified organizations
- Add new organizations
- Manage organization details

### 🪙 Algorand Explorer
- Search Algorand accounts by address
- View account balances and transactions
- Test network connectivity

### 📱 SMS Messages
- View SMS messages with signatures
- Verify message authenticity
- Track verification history

### 💬 Messages
- Browse all verified messages
- View verification details
- Export message data

### ⚙️ Settings
- Configure voice feedback
- Test connections
- Manage app preferences

## 🧪 Testing

### Sample Test Data

#### Algorand Test Addresses
```
# Testnet
HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD9ZLDO5SA7UNAI

# Mainnet (Algorand Foundation)
737777777777777777777777777777777777777777777777777UFEJ2CI
```

#### Sample SMS Messages
```
Your account balance is $1,250.00. [SIG:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456]

Security alert: New device login detected [WEB3SIG:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef]

Your verification code is 789012 [SIGNATURE:SGVsbG8gV29ybGQgVGhpcyBJcyBBIFRlc3QgU2lnbmF0dXJl]
```

### Testing Voice Feedback
1. Go to Settings → Audio & Feedback
2. Enable "Voice Feedback"
3. Tap "Test Voice Feedback"
4. Should hear audio confirmation

### Testing Algorand Connection
1. Go to Algorand tab
2. Check network status indicator
3. Use sample addresses for testing
4. Tap refresh icon if connection fails

## 🏗️ Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── scanner.tsx    # QR Scanner
│   │   ├── organizations.tsx # Organizations
│   │   ├── algorand.tsx   # Algorand Explorer
│   │   ├── sms.tsx        # SMS Messages
│   │   ├── messages.tsx   # All Messages
│   │   ├── test.tsx       # Testing Panel
│   │   └── settings.tsx   # Settings
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts
├── services/              # API services
├── lib/                   # Utilities and Supabase client
├── supabase/             # Database migrations
└── types/                # TypeScript definitions
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for web
npm run build:web

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Adding New Features

1. **Create new screen**: Add file in `app/(tabs)/`
2. **Add to navigation**: Update `app/(tabs)/_layout.tsx`
3. **Create components**: Add reusable components in `components/`
4. **Add services**: Create API services in `services/`

## 🚀 Deployment

### Web Deployment

1. **Build the project**:
   ```bash
   npm run build:web
   ```

2. **Deploy to Netlify/Vercel**:
   - Connect your repository
   - Set build command: `npm run build:web`
   - Set publish directory: `dist`

### Mobile Deployment

1. **Create development build**:
   ```bash
   npx expo install --fix
   eas build --platform all
   ```

2. **Submit to app stores**:
   ```bash
   eas submit --platform all
   ```

## 🔍 Troubleshooting

### Common Issues

#### Voice Feedback Not Working
- **Web**: Ensure browser supports Web Speech API
- **Mobile**: Check device volume and permissions
- **ElevenLabs**: Verify API key is correct

#### Algorand Connection Failed
- **Free Tier**: Check network connectivity
- **Paid Tier**: Verify API key format (`ndy_...`)
- **Rate Limits**: Wait and retry

#### Supabase Connection Issues
- Verify project URL and anon key
- Check RLS policies are enabled
- Ensure migration was applied correctly

#### SMS Verification Not Working
- Check message contains valid signature format
- Verify organization exists in database
- Test with sample messages first

### Debug Mode

Enable debug logging by adding to `.env`:
```env
EXPO_PUBLIC_DEBUG=true
```

## 📚 API Reference

### Supabase Functions

```typescript
// Verify message signature
const { data, error } = await verifyMessage(
  'message content',
  'signature',
  'sender_address'
);

// Get organizations
const { data, error } = await getOrganizations(true); // verified only

// Save verified message
const { data, error } = await saveVerifiedMessage({
  message_content: 'content',
  signature: 'signature',
  sender_address: 'address'
});
```

### Algorand Service

```typescript
// Get account information
const account = await algorandService.getAccount(address);

// Get transactions
const { transactions } = await algorandService.getAccountTransactions(address);

// Test connection
const result = await algorandService.testConnection();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🔗 Useful Links

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Algorand Developer Portal**: [developer.algorand.org](https://developer.algorand.org)
- **ElevenLabs API Docs**: [elevenlabs.io/docs](https://elevenlabs.io/docs)
- **Nodely.io Documentation**: [docs.nodely.io](https://docs.nodely.io)

---

**Built with ❤️ using Expo, React Native, and Web3 technologies**

*Secure your digital communications with cryptographic verification*
