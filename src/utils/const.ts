import {
  generateImage
} from '../models/openai';

export const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i
export const COMMAND_REGEX = /^[/.](?<command>\w+)(?:\s(?<content>.+))?/i

export const DOWNLOADS_PATH = './downloads';

export const Payload_Type = {
  Select_Service: 'Select_Service_',
  Select_Query_Option: 'Select_Query_Option_',
  Select_Url_Action: 'Select_Url_Action_',
  Select_Chat_System: 'Select_Chat_System_',
  Select_Chat_Suggestions: 'Select_Chat_Suggestions_',
  Select_View_Chat_Suggestions: 'Select_View_Chat_Suggestions_',
  Splitter: '|',
};

export const Service_Type = {
  Prediction: 'Prediction',
  Chat: 'chat',
  DallE: 'DallE',
};

export const Output_Type = {
  Image: 'image',
  SingleImage: 'single_image',
  Text: 'text',
  Transcription: 'transcription',
  Audio: 'audio',
};

export const URL_SERVICE_ID = -2;
export const DEFAULT_CHAT_SERVICE_ID = -1;
export const ASSISTANT_SERVICE_ID = 1;

export const CHAT_RESPONSE_SUGGESTIONS_SPLITTER = '-----suggestions-----'

export const SERVICES: any[] = [
  {
    name: 'ChatGPT',
    url: 'https://platform.openai.com/docs/guides/chat/introduction',
    imageUrl:
      'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjN8fHRlY2hub2xvZ3l8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
    type: Service_Type.Chat,
    title: 'Chat completion from OpenAI',
    help: 'Type `/c` to create new conversation.',
  },
  {
    name: 'Dall-E',
    url: 'https://platform.openai.com/docs/guides/images',
    imageUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8dGVjaG5vbG9neXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    type: Service_Type.DallE,
    getAnswer: generateImage,
    params: [
      { name: 'prompt', type: 'text' },
      { name: 'model', type: 'text', alias: 'm' },
      { name: 'n', type: 'text', alias: 'n' },
      { name: 'image', type: 'image' },
    ],
    title: 'Generate or manipulate images with DALL·E models.',
    help: 'Params: prompt, model (create, [e]dit, [v]ariation), n (number of outputs | 1-10), image (for edit and variation model)',
  },
  {
    name: 'Stable Diffusion',
    url: 'https://replicate.com/stability-ai/stable-diffusion',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/07ab2a80-df3b-4ed1-9ff2-545774b36dfa/stable-diffusion.jpeg',
    version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
    type: Service_Type.Prediction,
    output_type: Output_Type.Image,
    params: [
      { name: 'prompt', type: 'text' },
      { name: 'num_outputs', type: 'text', alias: 'no' },
      { name: 'negative_prompt', type: 'text', alias: 'np' },
      { name: 'num_inference_steps', type: 'text', alias: 'nis' },
      { name: 'guidance_scale', type: 'text', alias: 'gs' },
      {
        name: 'scheduler',
        type: 'select',
        options: [
          'DDIM',
          'K_EULER',
          'DPMSolverMultistep',
          'K_EULER_ANCESTRAL',
          'PNDM',
          'KLMS',
        ],
      },
      { name: 'seed', type: 'text' },
    ],
    title:
      'A latent text-to-image diffusion model capable of generating photo-realistic images given any text input.',
    help: 'Params: prompt, np (negative_prompt), no (number of outputs | 1 or 4), nis (Number of denoising steps | 1-500 | =50), gs (Scale for classifier-free guidance | 1-20 | =7.5), scheduler, seed (Random seed)',
  },
  {
    name: 'Open Journey',
    url: 'https://replicate.com/prompthero/openjourney',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/bf86b681-da40-4090-88bb-73a1f060dc5c/out-0-4.png',
    version: '9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
    type: Service_Type.Prediction,
    output_type: Output_Type.Image,
    params: [
      { name: 'prompt', type: 'text' },
      { name: 'num_outputs', type: 'text', alias: 'no' },
      { name: 'num_inference_steps', type: 'text', alias: 'nis' },
      { name: 'guidance_scale', type: 'text', alias: 'gs' },
      { name: 'seed', type: 'text' },
    ],
    title: 'Stable Diffusion fine tuned on Midjourney v4 images.',
    help: 'Params: prompt, no (number of outputs | 1 or 4), nis (Number of denoising steps | 1-500 | =50), gs (Scale for classifier-free guidance | 1-20 | =7), seed (Random seed)',
  },
  {
    name: 'Scribble Diffusion',
    url: 'https://replicate.com/jagilley/controlnet-scribble',
    imageUrl:
      'https://replicate.delivery/pbxt/3dbPD8n9bqbDLBZ6PwLbB23NFnmSLV3vhe6XLWpGEcvUODPIA/output_1.png',
    version: '435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117',
    type: Service_Type.Prediction,
    output_type: Output_Type.Image,
    params: [
      { name: 'image', type: 'image' },
      { name: 'prompt', type: 'text' },
      { name: 'num_samples', type: 'text', alias: 'ns' },
      { name: 'ddim_steps', type: 'text', alias: 'ds' },
      { name: 'scale', type: 'text' },
      { name: 'seed', type: 'text' },
      { name: 'a_prompt', type: 'text' },
      { name: 'n_prompt', type: 'text' },
    ],
    title: 'Generate detailed images from scribbled drawings.',
    help: 'Params: image, prompt, ns (number of samples | 1 or 4), ds (Ddim Steps | =20), scale (guidance scale | =9), seed (Random seed), a_prompt (added prompt), n_prompt (negative prompt)',
  },
  {
    name: 'Instruct-Pix2Pix',
    url: 'https://replicate.com/timothybrooks/instruct-pix2pix',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/ea2dabc5-4973-49e4-9f3a-f73b10ad4ca6/instruct-pix2pix.jpg',
    version: '30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f',
    type: Service_Type.Prediction,
    output_type: Output_Type.Image,
    params: [
      { name: 'prompt', type: 'text' },
      { name: 'image', type: 'image' },
      { name: 'negative_prompt', type: 'text', alias: 'np' },
      { name: 'num_outputs', type: 'text', alias: 'no' },
      { name: 'num_inference_steps', type: 'text', alias: 'nis' },
      { name: 'guidance_scale', type: 'text', alias: 'gs' },
      { name: 'image_guidance_scale', type: 'text', alias: 'igs' },
      {
        name: 'scheduler',
        type: 'select',
        options: [
          'DDIM',
          'K_EULER',
          'DPMSolverMultistep',
          'K_EULER_ANCESTRAL',
          'PNDM',
          'KLMS',
        ],
      },
      { name: 'seed', type: 'text' },
    ],
    title: `Edit images with human instructions.`,
    help: `Params: image, prompt, np (negative_prompt), no (number of outputs | 1 or 4), nis (Number of denoising steps | 1-500 | =100), gs (Scale for classifier-free guidance | 1-20 | =7.5), igs (push the generated image towards the inital image | =1.5), scheduler, seed (Random seed)`,
  },
  {
    name: 'Codeformer',
    url: 'https://replicate.com/sczhou/codeformer',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/0e31af92-963e-4ae3-b900-6104b22f4f7f/012.png',
    version: '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',
    type: Service_Type.Prediction,
    output_type: Output_Type.SingleImage,
    params: [
      { name: 'image', type: 'image' },
      { name: 'codeformer_fidelity', type: 'text', alias: 'cf' },
      { name: 'upscale', type: 'text', alias: 'up' },
    ],
    title: `Robust face restoration algorithm for old photos / AI-generated faces.`,
    help: `Params: image, cf (Balance the quality (lower number) and fidelity (higher number) | 0-1 | =0.7), up (The final upsampling scale of the image | =2)`,
  },
  {
    name: 'Styleclip',
    url: 'https://replicate.com/orpatashnik/styleclip',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/0bcd2b2e-1d38-42a3-bdaa-0c84c16e7c99/styleclip.jpg',
    version: '7af9a66f36f97fee2fece7dcc927551a951f0022cbdd23747b9212f23fc17021',
    type: Service_Type.Prediction,
    output_type: Output_Type.SingleImage,
    params: [
      { name: 'input', type: 'image' },
      { name: 'neutral', type: 'text', alias: 'n' },
      { name: 'target', type: 'text', alias: 't' },
      { name: 'manipulation_strength', type: 'text', alias: 'ms' },
      { name: 'disentanglement_threshold', type: 'text', alias: 'dt' },
    ],
    title: `Text-Driven Manipulation of StyleGAN Imagery.`,
    help: `Params: image, n (Neutral image description), t (Target image description), ms (manipulation strength | -10-10 | =4.1), dt (disentanglement threshold | 0.08-0.3 | =0.15)`,
  },
  {
    name: 'Whisper',
    url: 'https://replicate.com/openai/whisper',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/a32001ba-e8b7-4b6d-9bbf-50e901441425/whisper-diagram.jpeg',
    version: '30414ee7c4fffc37e260fcab7842b5be470b9b840f2b608f5baa9bbef9a259ed',
    type: Service_Type.Prediction,
    output_type: Output_Type.Transcription,
    params: [
      { name: 'audio', type: 'audio' },
      {
        name: 'model',
        type: 'select',
        options: ['tiny', 'base', 'small', 'medium', 'large'],
      },
      {
        name: 'transcription',
        type: 'select',
        options: ['plain text', 'srt', 'vtt'],
      },
      {
        name: 'language',
        type: 'select',
        options: ['Chinese', 'English', 'Japanese', 'Korean', 'Vietnamese'],
      },
    ],
    title: 'Convert speech in audio to text',
    help: 'Params: audio, model, transcription, language',
  },
  {
    name: 'audio-ldm',
    url: 'https://replicate.com/haoheliu/audio-ldm',
    imageUrl:
      'https://tjzk.replicate.delivery/models_models_cover_image/17f584de-98ae-489c-aea8-fdf366858ad6/640px-Spectrogram-19thC.png',
    version: 'b61392adecdd660326fc9cfc5398182437dbe5e97b5decfb36e1a36de68b5b95',
    type: Service_Type.Prediction,
    output_type: Output_Type.Audio,
    params: [
      { name: 'text', type: 'text' },
      {
        name: 'duration',
        type: 'text',
      },
      {
        name: 'guidance_scale',
        type: 'text',
        alias: 'gs'
      },
      {
        name: 'random_seed',
        type: 'text',
        alias: 'seed'
      },
      {
        name: 'n_candidates',
        type: 'text',
        alias: 'nc'
      },
    ],
    title: 'Text-to-audio generation with latent diffusion models',
    help: 'Params: text, duration, guidance_scale (gs), random_seed (seed), n_candidates (nc)',
  },
  {
    name: 'AnimeGAN',
    url: 'https://replicate.com/ptran1203/pytorch-animegan',
    imageUrl:
      'https://replicate.delivery/mgxm/cfc9360c-a94c-432f-bb10-5c662d18c1de/out.png',
    version: '7d44f1878a07e7b5a32af9727c1f6120cac04203d48f3f7b0432e28fa8e5c6b6',
    type: Service_Type.Prediction,
    output_type: Output_Type.SingleImage,
    params: [
      { name: 'image', type: 'image' },
      { name: 'model', type: 'select', options: ['Hayao', 'Shinkai'] },
    ],
    title: 'AnimeGAN for fast photo animation',
    help: 'Params: image, model',
  },
  {
    name: 'Blip (Img2Txt)',
    url: 'https://replicate.com/salesforce/blip',
    imageUrl:
      'https://bucketeer-be99e627-94e7-4e5b-a292-54eeb40ac303.s3.amazonaws.com/public/models_models_featured_image/b59b459c-c475-414f-ba67-c424a7e6e6ca/demo.jpg',
    version: '2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
    type: Service_Type.Prediction,
    output_type: Output_Type.Text,
    params: [{ name: 'image', type: 'image' }],
    title: 'Bootstrapping Language-Image Pre-training',
    help: '',
  },
].filter((item: any) => !item.hidden);
