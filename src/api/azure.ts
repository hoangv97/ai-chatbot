import fs from 'fs';
import { AudioConfig, ResultReason, SpeechConfig, SpeechRecognizer, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk';

export const getVoices = async (locales: string[]) => {
  const speechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY || '', process.env.AZURE_SPEECH_REGION || '');

  // Create the speech synthesizer.
  const synthesizer = new SpeechSynthesizer(speechConfig);

  const result = await synthesizer.getVoicesAsync();
  const voices = result?.voices.filter(v => locales.includes(v.locale))
  voices.sort((a, b) => a.locale === b.locale ? 0 : a.locale < b.locale ? 1 : -1)
  return voices;
}

export const textToSpeech = async (text: string, outputFile: string, voiceName?: string) => {
  return new Promise((resolve, reject) => {
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY || '', process.env.AZURE_SPEECH_REGION || '');
    const audioConfig = AudioConfig.fromAudioFileOutput(outputFile);

    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = voiceName || "en-US-JennyNeural";

    // Create the speech synthesizer.
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer?.speakTextAsync(text,
      function (result) {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
          // console.log("synthesis finished.");
        } else {
          console.error("Speech synthesis canceled, " + result.errorDetails +
            "\nDid you set the speech resource key and region values?");
        }
        synthesizer?.close();
        resolve(result);
      },
      function (err) {
        console.trace("err - " + err);
        synthesizer?.close();
        reject(err);
      });
  });
}

export const speechToText = async (audioFile: string, language?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY || '', process.env.AZURE_SPEECH_REGION || '');
    speechConfig.speechRecognitionLanguage = language || "en-US";

    const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(audioFile));

    // Create the speech recognizer.
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(
      function (result) {
        recognizer.close();
        resolve(result.text);
      },
      function (err) {
        recognizer.close();
        reject(err);
      });
  })
}