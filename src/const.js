const SERVICES = [
  {
    name: 'Stable Diffusion',
    url: 'https://replicate.com/stability-ai/stable-diffusion',
    version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
    output_type: 'image',
    params: [
      { name: 'prompt', type: 'text' },
      { name: 'num_outputs', type: 'text', alias: 'no' },
      { name: 'negative_prompt', type: 'text', alias: 'np' },
      { name: 'num_inference_steps', type: 'text', alias: 'nis' },
      { name: 'guidance_scale', type: 'text', alias: 'gs' },
      { name: 'seed', type: 'text' },
    ],
    help: 'A latent text-to-image diffusion model capable of generating photo-realistic images given any text input.\n\nParams: prompt, np (negative_prompt), no (number of outputs | 1 or 4), nis (Number of denoising steps | 1-500 | =50), gs (Scale for classifier-free guidance | 1-20 | =7.5), seed (Random seed)',
  },
  {
    name: 'Open Journey',
    url: 'https://replicate.com/prompthero/openjourney',
    version: '9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
    output_type: 'image',
    params: [
      { name: 'prompt', type: 'text' },
      { name: 'num_outputs', type: 'text', alias: 'no' },
      { name: 'num_inference_steps', type: 'text', alias: 'nis' },
      { name: 'guidance_scale', type: 'text', alias: 'gs' },
      { name: 'seed', type: 'text' },
    ],
    help: 'Stable Diffusion fine tuned on Midjourney v4 images.\n\nParams: prompt, no (number of outputs | 1 or 4), nis (Number of denoising steps | 1-500 | =50), gs (Scale for classifier-free guidance | 1-20 | =7), seed (Random seed)',
  },
  {
    name: 'Blip(Img2Txt)',
    url: 'https://replicate.com/salesforce/blip',
    version: '2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
    output_type: 'text',
    params: [{ name: 'image', type: 'image' }],
    help: 'Bootstrapping Language-Image Pre-training',
  },
];

module.exports = {
  SERVICES,
};
