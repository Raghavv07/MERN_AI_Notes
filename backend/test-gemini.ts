import dotenv from 'dotenv';
dotenv.config();

// Original model
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  console.log('Testing Gemini API...');
  console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND');

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined');
    return;
  }

  try {
    console.log('Making API call...');
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Say "Hello" in JSON format like {"message": "Hello"}',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testGemini();
