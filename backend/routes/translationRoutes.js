const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @route   POST /api/translate/text
 * @desc    Translate text using HuggingFace AI4Bharat IndICTrans2
 * @access  Private (can be made public if needed)
 */
router.post('/text', async (req, res) => {
  const { text, targetLang, sourceLang = 'eng_Latn' } = req.body;
  
  // Validate input
  if (!text || !targetLang) {
    return res.status(400).json({ 
      success: false,
      error: 'Text and target language are required' 
    });
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/ai4bharat/indictrans2-en-indic-1B',
      {
        inputs: text,
        parameters: { 
          tgt_lang: targetLang, 
          src_lang: sourceLang 
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    // HuggingFace returns array with translation
    const translation = response.data[0]?.translation_text || text;
    
    res.json({ 
      success: true,
      translation,
      sourceLang,
      targetLang
    });
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    
    // Return original text as fallback
    res.status(500).json({ 
      success: false,
      error: 'Translation failed',
      translation: text, // Fallback to original text
      message: error.response?.data?.error || 'Translation service unavailable'
    });
  }
});

/**
 * @route   POST /api/translate/batch
 * @desc    Translate multiple texts in batch
 * @access  Private
 */
router.post('/batch', async (req, res) => {
  const { texts, targetLang, sourceLang = 'eng_Latn' } = req.body;
  
  if (!texts || !Array.isArray(texts) || !targetLang) {
    return res.status(400).json({ 
      success: false,
      error: 'Texts array and target language are required' 
    });
  }

  try {
    // Translate all texts in parallel
    const translationPromises = texts.map(text => 
      axios.post(
        'https://api-inference.huggingface.co/models/ai4bharat/indictrans2-en-indic-1B',
        {
          inputs: text,
          parameters: { tgt_lang: targetLang, src_lang: sourceLang }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )
    );

    const responses = await Promise.allSettled(translationPromises);
    
    const translations = responses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value.data[0]?.translation_text || texts[index];
      } else {
        return texts[index]; // Fallback to original
      }
    });

    res.json({ 
      success: true,
      translations,
      sourceLang,
      targetLang
    });
  } catch (error) {
    console.error('Batch translation error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Batch translation failed',
      translations: texts // Fallback to originals
    });
  }
});

/**
 * @route   GET /api/translate/languages
 * @desc    Get supported language codes for IndICTrans2
 * @access  Public
 */
router.get('/languages', (req, res) => {
  const supportedLanguages = {
    'eng_Latn': { name: 'English', nativeName: 'English' },
    'hin_Deva': { name: 'Hindi', nativeName: 'हिंदी' },
    'ben_Beng': { name: 'Bengali', nativeName: 'বাংলা' },
    'guj_Gujr': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
    'mar_Deva': { name: 'Marathi', nativeName: 'मराठी' },
    'tam_Taml': { name: 'Tamil', nativeName: 'தமிழ்' },
    'tel_Telu': { name: 'Telugu', nativeName: 'తెలుగు' },
    'kan_Knda': { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    'mal_Mlym': { name: 'Malayalam', nativeName: 'മലയാളം' },
    'pan_Guru': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    'ory_Orya': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    'asm_Beng': { name: 'Assamese', nativeName: 'অসমীয়া' }
  };

  res.json({ 
    success: true,
    languages: supportedLanguages 
  });
});

module.exports = router;
