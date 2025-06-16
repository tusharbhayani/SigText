
# 🚀 Nodely.io API Setup Guide for Algorand Integration

## 📋 Overview

This guide will help you get your Nodely.io API key and integrate it with the Web3 Message Verifier app for Algorand blockchain functionality.

## 🆓 **FREE TIER** - No API Key Required

For testing and development, you can use Nodely.io's free endpoints without any API key:

### Free Tier Endpoints:
- **Mainnet**: `https://mainnet-api.4160.nodely.dev`
- **Testnet**: `https://testnet-api.4160.nodely.dev`
- **Betanet**: `https://betanet-api.4160.nodely.dev`

### Free Tier Configuration:
```bash
# .env file for FREE tier
EXPO_PUBLIC_NODELY_API_KEY=
EXPO_PUBLIC_ALGORAND_NETWORK=testnet
EXPO_PUBLIC_ALGORAND_API_URL=https://testnet-api.4160.nodely.dev
```

### Free Tier Limitations:
- ⚠️ **Rate Limited**: Lower request limits
- ⚠️ **No SLA**: Best effort availability
- ⚠️ **Shared Infrastructure**: May experience slower response times
- ✅ **Perfect for Development**: Great for testing and prototyping

---

## 💎 **PAID TIER** - Get Your API Key

For production use, get unlimited access with a paid API key.

### Step 1: Visit Nodely.io
🔗 **Direct Link**: [https://nodely.io/](https://nodely.io/)

### Step 2: Sign Up for Paid Plan
1. Click **"Get Started"** or **"Pricing"**
2. Choose your plan:
   - **Starter**: $29/month
   - **Pro**: $99/month  
   - **Enterprise**: Custom pricing

### Step 3: Access Dashboard
1. After payment, log into your dashboard
2. Navigate to **"API Keys"** section
3. Click **"Create New API Key"**

### Step 4: Generate API Key
1. **Name your key**: e.g., "Web3 Message Verifier"
2. **Select services**: Choose "Algorand"
3. **Choose networks**: Mainnet, Testnet, or both
4. **Set permissions**: Read access (sufficient for this app)
5. **Generate key**

### Step 5: Copy Your API Key
⚠️ **IMPORTANT**: Copy and save your API key immediately!
- Format: `ndy_xxxxxxxxxxxxxxxxxxxxx`
- Store securely - you won't see it again

---

## ⚙️ Configuration

### For FREE Tier:
```bash
# .env file
EXPO_PUBLIC_NODELY_API_KEY=
EXPO_PUBLIC_ALGORAND_NETWORK=testnet
EXPO_PUBLIC_ALGORAND_API_URL=https://testnet-api.4160.nodely.dev
```

### For PAID Tier:
```bash
# .env file
EXPO_PUBLIC_NODELY_API_KEY=ndy_your_actual_api_key_here
EXPO_PUBLIC_ALGORAND_NETWORK=testnet
EXPO_PUBLIC_ALGORAND_API_URL=https://algorand-testnet.nodely.io/v2
```

### Paid Tier Endpoints:
- **Mainnet**: `https://algorand-mainnet.nodely.io/v2`
- **Testnet**: `https://algorand-testnet.nodely.io/v2`
- **Betanet**: `https://algorand-betanet.nodely.io/v2`

---

## 🧪 Testing Your Setup

### Step 1: Test Connection
1. Open the app and go to **"Algorand"** tab
2. Check the network status indicator
3. Should show: "Network: testnet • Round: [current_round]"

### Step 2: Test Account Lookup
Use these test addresses:

**Testnet Address**:
```
HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD9ZLDO5SA7UNAI
```

**Mainnet Address** (Algorand Foundation):
```
737777777777777777777777777777777777777777777777777UFEJ2CI
```

### Step 3: Verify Features
- ✅ Account balance display
- ✅ Transaction history
- ✅ Network status
- ✅ Address validation

---

## 🔧 Troubleshooting

### Free Tier Issues:

#### Rate Limiting
```
Error: HTTP error! status: 429
```
**Solution**: 
- Wait a few minutes between requests
- Consider upgrading to paid tier
- Implement request throttling in your app

#### Service Unavailable
```
Error: HTTP error! status: 503
```
**Solution**:
- Free tier has no SLA
- Try again later
- Consider paid tier for reliability

### Paid Tier Issues:

#### Invalid API Key
```
Error: HTTP error! status: 401
```
**Solution**: 
- Check API key in `.env` file
- Ensure no extra spaces
- Regenerate key if needed

#### Insufficient Permissions
```
Error: HTTP error! status: 403
```
**Solution**:
- Check API key permissions in dashboard
- Ensure Algorand service is enabled
- Verify network access (mainnet/testnet)

---

## 📊 API Limits Comparison

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Requests/Month** | Limited | Unlimited |
| **Rate Limit** | ~10 req/sec | ~1000 req/sec |
| **SLA** | None | 99.9% |
| **Support** | Community | Priority |
| **Networks** | All | All |
| **Caching** | Shared | Dedicated |

---

## 🔗 Important Links

- **Nodely.io Homepage**: [https://nodely.io/](https://nodely.io/)
- **Pricing**: [https://nodely.io/pricing](https://nodely.io/pricing)
- **Documentation**: [https://docs.nodely.io/](https://docs.nodely.io/)
- **Dashboard**: [https://app.nodely.io/](https://app.nodely.io/)
- **Support**: [https://nodely.io/support](https://nodely.io/support)

---

## 🎯 Recommendations

### For Development:
- ✅ Start with **FREE tier**
- ✅ Use **testnet** network
- ✅ Test all features thoroughly

### For Production:
- ✅ Upgrade to **PAID tier**
- ✅ Use **mainnet** network
- ✅ Implement proper error handling
- ✅ Add request caching
- ✅ Monitor usage in dashboard

---

**🎉 Your Algorand integration is now ready with Nodely.io!**

Whether you choose the free tier for development or the paid tier for production, you'll have full access to Algorand blockchain data through a reliable API service.