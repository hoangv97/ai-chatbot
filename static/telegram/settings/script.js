const API_PREFIX = 'https://chat.hoangv.me/api';

const SPEECH_RECOGNITION_SERVICES = [
  { value: 'azure', label: 'Azure' },
  { value: 'whisper', label: 'Whisper' },
];

const AZURE_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-AU', label: 'English (Australia)' },
  { value: 'en-CA', label: 'English (Canada)' },
  { value: 'vi-VN', label: 'Vietnamese ' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'zh-CN', label: 'Chinese (Mandarin)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
];

const WHISPER_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Vietnamese ' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

const getAzureVoiceGender = (id) => ['Unknown', 'Female', 'Male'][id];

const App = () => {
  const params = new URLSearchParams(document.location.search);

  const [autoSpeak, setAutoSpeak] = React.useState(
    params.get('autoSpeak') === 'true'
  );

  const [azureVoices, setAzureVoices] = React.useState([]);
  const [azureVoiceName, setAzureVoiceName] = React.useState(
    params.get('azureVoiceName')
  );

  const [loadingVoices, setLoadingVoices] = React.useState(false);

  const [azureRecognitionLang, setAzureRecognitionLang] = React.useState(
    params.get('azureRecognitionLang')
  );

  const [whisperLang, setWhisperLang] = React.useState(
    params.get('whisperLang')
  );

  const [speechRecognitionService, setSpeechRecognitionService] =
    React.useState(params.get('speechRecognitionService'));

  const [agentsTools, setAgentsTools] = React.useState(
    params.get('agentsTools')
  );

  const getAzureVoices = async () => {
    setLoadingVoices(true);
    const response = await axios.get(`${API_PREFIX}/azure/voices`, {
      params: {
        locales: AZURE_LANGUAGES.map((item) => item.value).join(','),
      },
    });
    const { voices } = response.data;
    setAzureVoices(voices || []);
    setLoadingVoices(false);
  };

  React.useEffect(() => {
    getAzureVoices();
  }, []);

  const isValueEmpty = (value) =>
    value === undefined || value === null || value === '';

  const submit = () => {
    const settings = {};
    if (!!autoSpeak) {
      settings.autoSpeak = autoSpeak;
    }
    if (!isValueEmpty(azureVoiceName)) {
      settings.azureVoiceName = azureVoiceName;
    }
    if (!isValueEmpty(azureRecognitionLang)) {
      settings.azureRecognitionLang = azureRecognitionLang;
    }
    if (!isValueEmpty(whisperLang)) {
      settings.whisperLang = whisperLang;
    }
    if (!isValueEmpty(speechRecognitionService)) {
      settings.speechRecognitionService = speechRecognitionService;
    }
    if (!isValueEmpty(agentsTools)) {
      settings.agentsTools = agentsTools;
    }

    console.log(settings);
    window.Telegram.WebApp.sendData(
      JSON.stringify({
        settings,
        _type: 'settings',
      })
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={autoSpeak}
            onChange={() => setAutoSpeak(!autoSpeak)}
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span class="ml-3 text-sm font-medium">Auto speak when reply</span>
        </label>

        <div>
          <label
            for="azureVoiceName"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Azure voices {loadingVoices && ' (loading...)'}
          </label>
          <select
            id="azureVoiceName"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={azureVoiceName}
            onChange={(e) => setAzureVoiceName(e.target.value)}
          >
            <option value={''}>Choose a voice</option>
            {azureVoices.map((item) => (
              <option value={item.privShortName} key={item.privShortName}>
                {item.privLocalName} ({getAzureVoiceGender(item.privGender)}) -{' '}
                {item.privLocale}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            for="speechRecognitionService"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Speech Recognition Service
          </label>
          <select
            id="speechRecognitionService"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={speechRecognitionService}
            onChange={(e) => setSpeechRecognitionService(e.target.value)}
          >
            <option value={''}>Choose a service</option>
            {SPEECH_RECOGNITION_SERVICES.map((lang) => (
              <option value={lang.value} key={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            for="azureRecognitionLang"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Azure Recognition language
          </label>
          <select
            id="azureRecognitionLang"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={azureRecognitionLang}
            onChange={(e) => setAzureRecognitionLang(e.target.value)}
          >
            <option value={''}>Choose a language</option>
            {AZURE_LANGUAGES.map((lang) => (
              <option value={lang.value} key={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            for="whisperLang"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Whisper API language
          </label>
          <select
            id="whisperLang"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={whisperLang}
            onChange={(e) => setWhisperLang(e.target.value)}
          >
            <option value={''}>Choose a language</option>
            {WHISPER_LANGUAGES.map((lang) => (
              <option value={lang.value} key={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="absolute bottom-3 right-3 flex justify-end">
        <button
          className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-3 py-2 text-center"
          onClick={submit}
        >
          Save
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
