const API_PREFIX = 'https://ai.hoangv.me';

const App = () => {
  const params = new URLSearchParams(document.location.search);
  const [tools, setTools] = React.useState([]);
  const [selected, setSelected] = React.useState(
    (params.get('tools') || '').split(',').filter((i) => i)
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
      <ul className="flex flex-col gap-3 mb-20">
        {tools.map((item) => (
          <li
            key={item.name}
            onClick={() => handleSelect(item.name)}
            className={`${
              selected.includes(item.name) ? 'ring-4' : ''
            } block w-full p-4 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700`}
          >
            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {item.name}
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
      <div className="fixed bottom-3 right-3 flex justify-end gap-3">
        {selected.length > 0 && (
          <button
            className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-3 py-2 text-center"
            onClick={submit}
          >
            {selected.join(',')}
          </button>
        )}
        <button
          className="text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-3 py-2 text-center"
          onClick={clear}
        >
          Unselect all
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
