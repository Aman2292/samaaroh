# HuggingFace Translation API Setup Guide

## Quick Start

This platform uses **HuggingFace's AI4Bharat IndICTrans2** model for Indian language translations.

### 1. Get Your HuggingFace API Key

1. Visit: https://huggingface.co/
2. Sign up or log in to your account
3. Go to Settings → Access Tokens: https://huggingface.co/settings/tokens
4. Click "New token"
5. Name it (e.g., "Samaaroh Translation")
6. Select "Read" permission (sufficient for API inference)
7. Copy the generated token

### 2. Add API Key to Backend

Create or update `.env` file in the backend directory:

```env
# HuggingFace API for Translation
HUGGINGFACE_API_KEY=hf_your_api_key_here

# Other existing environment variables...
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5001
```

### 3. Restart Backend Server

```bash
cd backend
npm run dev
```

The server will pick up the new environment variable.

---

## API Endpoints

### 1. Translate Text
**POST** `/api/translate/text`

```json
{
  "text": "Welcome to Samaaroh",
  "targetLang": "hin_Deva",
  "sourceLang": "eng_Latn"
}
```

**Response:**
```json
{
  "success": true,
  "translation": "समारोह में आपका स्वागत है",
  "sourceLang": "eng_Latn",
  "targetLang": "hin_Deva"
}
```

### 2. Batch Translation
**POST** `/api/translate/batch`

```json
{
  "texts": ["Hello", "Goodbye", "Thank you"],
  "targetLang": "hin_Deva",
  "sourceLang": "eng_Latn"
}
```

### 3. Get Supported Languages
**GET** `/api/translate/languages`

Returns list of all supported language codes.

---

## Language Codes (IndICTrans2)

| Code | Language | Native Script |
|------|----------|---------------|
| `eng_Latn` | English | English |
| `hin_Deva` | Hindi | हिंदी |
| `ben_Beng` | Bengali | বাংলা |
| `guj_Gujr` | Gujarati | ગુજરાતી |
| `mar_Deva` | Marathi | मराठी |
| `tam_Taml` | Tamil | தமிழ் |
| `tel_Telu` | Telugu | తెలుగు |
| `kan_Knda` | Kannada | ಕನ್ನಡ |
| `mal_Mlym` | Malayalam | മലയാളം |
| `pan_Guru` | Punjabi | ਪੰਜਾਬੀ |
| `ory_Orya` | Odia | ଓଡ଼ିଆ |
| `asm_Beng` | Assamese | অসমীয়া |

---

## Features

### Profile Language Selector ✅
- Users can change language from Profile page
- Changes apply immediately without refresh
- Preference saved to database and localStorage

### Translation API ✅
- Single text translation
- Batch translation for multiple strings
- Automatic fallback to original text on error
- 30-second timeout for API calls

### Future Enhancements (Optional)
- Real-time translation of user-generated content
- Translation caching to reduce API calls
- Speech-to-text integration
- Text-to-speech for accessibility

---

## Testing

### 1. Test Profile Language Selector
1. Log in to the platform
2. Navigate to Profile page
3. Find "Language & Region" section
4. Select different language
5. Verify UI updates immediately
6. Refresh page - language should persist

### 2. Test Translation API (Optional - Postman/curl)

```bash
curl -X POST https://samaaroh-1.onrender.com/api/translate/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello World",
    "targetLang": "hin_Deva",
    "sourceLang": "eng_Latn"
  }'
```

---

## Pricing & Limits

- **FREE** for HuggingFace accounts
- Rate limits apply (varies by account type)
- Community models may have occasional loading delays
- Consider upgrading to HuggingFace Pro for production use

---

## Alternative: Bhashini (Government of India)

If you prefer:
- Government-backed solution
- No rate limits
- Official support

Visit: https://bhashini.gov.in for API access

Both APIs can work with the same codebase structure!

---

## Troubleshooting

**Error: "Translation service unavailable"**
- Check if HUGGINGFACE_API_KEY is set in .env
- Verify API key is valid
- Check internet connection
- Model may be loading (first request can take 20-30 seconds)

**Error: "Translation failed"**
- Original text returned as fallback
- Check language  codes are correct
- Verify text is not too long (limit: ~512 tokens)

**UI not updating after language change**
- Clear browser cache
- Check browser console for errors
- Verify backend is running
- Check userInfo in localStorage

---

## Support

For issues with:
- **HuggingFace API**: https://huggingface.co/docs
- **IndICTrans2 Model**: https://huggingface.co/ai4bharat/indictrans2-en-indic-1B
- **Samaaroh Platform**: Contact your development team
