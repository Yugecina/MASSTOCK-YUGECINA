/**
 * Test direct de l'API Gemini pour debugger
 */

const axios = require('axios');

const API_KEY = 'AIzaSyC1I4JWJ9H7Pld6NJZfdux13s1xlZc8u8w';
const PROMPT = 'Portrait ultra-réaliste d\'un astronaute marchant dans une ruelle néon sous la pluie';

async function testGeminiAPI() {
  console.log('\n🧪 Test direct de l\'API Gemini\n');
  console.log('API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.substring(API_KEY.length - 4));
  console.log('Prompt:', PROMPT);
  console.log('\n');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

  const payload = {
    contents: [{
      parts: [{
        text: PROMPT
      }]
    }],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio: '1:1'
      }
    }
  };

  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\n🌐 Envoi de la requête...\n');

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'x-goog-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ Réponse reçue !');
    console.log('Status:', response.status);
    console.log('\n📦 Réponse complète:');
    console.log(JSON.stringify(response.data, null, 2));

    // Vérifier la structure
    if (response.data.candidates) {
      console.log('\n✅ Candidates trouvés:', response.data.candidates.length);

      const candidate = response.data.candidates[0];
      console.log('Candidate keys:', Object.keys(candidate));

      if (candidate.content) {
        console.log('Content keys:', Object.keys(candidate.content));

        if (candidate.content.parts) {
          console.log('Parts count:', candidate.content.parts.length);
          candidate.content.parts.forEach((part, i) => {
            console.log(`Part ${i} keys:`, Object.keys(part));
          });
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur !');
    console.error('Message:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

testGeminiAPI();
