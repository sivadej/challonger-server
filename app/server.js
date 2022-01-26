// include dependencies
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(helmet());
app.use(cors());

function buildUrl(subdomain, tourneyName, key) {
  let tourneyUrl = '';
  if (subdomain) tourneyUrl = subdomain + '-';
  tourneyUrl += tourneyName;
  return `https://api.challonge.com/v1/tournaments/${tourneyUrl}.json?api_key=${key}`;
}

app.get('/tourney', async (req, res) => {
  try {
    const response = await axios({
      url: buildUrl(req.query.sub, req.query.name, req.query.key),
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

app.listen(3001);

// https://api.challonge.com/v1/tournaments/${domain}-${tourneyName}.json?api_key=${challongeKey}
