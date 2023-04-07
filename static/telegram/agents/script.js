const API_PREFIX = 'https://ai.hoangv.me';

const App = () => {
  const params = new URLSearchParams(document.location.search);
  const [tools, setTools] = React.useState([]);
  const [selected, setSelected] = React.useState(
    (params.get('tools') || '').split(',')
  );

  React.useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const apiKey = params.get('apiKey') || '';
      const response = await axios.get(`${API_PREFIX}/api/tools`, {
        params: { apiKey },
      });
      const result = response.data;
      setTools(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelect = (itemName) => {
    if (selected.includes(itemName)) {
      setSelected(selected.filter((i) => i !== itemName));
    } else {
      setSelected([...selected, itemName]);
    }
  };

  const clear = () => {
    setSelected([]);
  };

  const submit = () => {
    window.Telegram.WebApp.sendData(
      JSON.stringify({
        tools: selected.join(','),
        _type: 'agents',
      })
    );
  };

  return (
    <div>
      <ul>
        {tools.map((item) => (
          <li
            key={item.name}
            onClick={() => handleSelect(item.name)}
            className={`${selected.includes(item.name) ? 'selected' : ''}`}
          >
            <strong>{item.name}</strong>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
      <div className="btns">
        {selected.length > 0 && (
          <button className="submit-btn" onClick={submit}>
            {selected.join(',')}
          </button>
        )}
        <button className="clear-btn" onClick={clear}>
          Unselect all
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
