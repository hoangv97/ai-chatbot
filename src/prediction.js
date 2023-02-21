import fetch from 'node-fetch'

async function postPrediction(version, input) {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input,
    }),
  });

  if (response.status !== 201) {
    let error = await response.json();
    console.error(error)
    return null;
  }

  const prediction = await response.json();
  return prediction;
}

async function getPrediction(id) { 
  const response = await fetch(
    "https://api.replicate.com/v1/predictions/" + id,
    {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (response.status !== 200) {
    let error = await response.json();
    console.error(error)
    return null;
  }

  const prediction = await response.json();
  return prediction
}

module.exports = {
  postPrediction,
  getPrediction,
}