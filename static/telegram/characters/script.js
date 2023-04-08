const API_PREFIX = 'https://chat.hoangv.me/api/characters';

const App = () => {
  const params = new URLSearchParams(document.location.search);

  const [characters, setCharacters] = React.useState([]);
  const [filteredCharacters, setFilteredCharacters] = React.useState([]);
  const [search, setSearch] = React.useState(params.get('s') || '');

  React.useEffect(() => {
    fetchCharacters();
  }, []);

  React.useEffect(() => {
    setFilteredCharacters(
      characters.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [characters, search]);

  const fetchCharacters = async () => {
    try {
      const response = await axios.get(`${API_PREFIX}`, {
        params: { apiKey: params.get('apiKey') },
      });
      const result = response.data;
      setCharacters(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelect = (character) => {
    window.Telegram.WebApp.sendData(
      JSON.stringify({
        ...character,
        _type: 'character',
      })
    );
  };

  return (
    <div>
      <div class="relative w-full mb-3">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            aria-hidden="true"
            class="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        <input
          type="text"
          id="simple-search"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul className="flex flex-col gap-3">
        {filteredCharacters.map((character) => (
          <li
            key={character._id}
            onClick={() => handleSelect(character)}
            className={`block w-full p-4 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer`}
          >
            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {character.order} - {character.name}
            </h5>
            <p className="font-bold text-gray-700 dark:text-gray-400">
              {character.system}
            </p>
            <p className="mt-2 font-normal text-gray-700 dark:text-gray-400">
              {character.user}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
