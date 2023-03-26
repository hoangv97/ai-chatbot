const API_PREFIX = 'https://chat.hoangv.me/api/chat-system';

const App = () => {
  const [characters, setCharacters] = React.useState([]);
  const [filteredCharacters, setFilteredCharacters] = React.useState([]);
  const [search, setSearch] = React.useState(
    new URLSearchParams(document.location.search).get('s') || ''
  );

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
      const response = await axios.get(`${API_PREFIX}`);
      const result = response.data;
      result.sort((a, b) =>
        a.order === b.order ? 0 : a.order < b.order ? 1 : -1
      );
      setCharacters(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelect = (character) => {
    console.log(window.Telegram.WebApp);
    window.Telegram.WebApp.sendData(
      JSON.stringify({
        ...character,
        _type: 'character',
      })
    );
  };

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul>
        {filteredCharacters.map((character) => (
          <li key={character._id} onClick={() => handleSelect(character)}>
            <strong>
              {character.order} - {character.name}
            </strong>
            <p>{character.system}</p>
            <p>{character.user}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
