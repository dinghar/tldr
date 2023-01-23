import { Configuration, OpenAIApi } from "openai";

export async function generateSummary(transcript) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  if (!configuration.apiKey) {
    return "Oops! There was a problem with your request. Please try again later.";
  }

  try {
    const completion = await openai.createCompletion({
      model: process.env.OPENAI_MODEL,
      prompt: generatePrompt(transcript),
      temperature: 0.9,
      max_tokens: 250,
    });
    return completion.data.choices[0].text;
  } catch (error) {
    return `Oops! An error occurred: ${error}`;
  }
}

function generatePrompt(transcript) {
  return `In 3 - 5 sentences, summarize the following transcript: ${transcript}`;
}
