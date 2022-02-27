const BASE_URL = 'https://api.challonge.com/v1/tournaments';
const BASE_URL_SUFFIX = '.json';

const express = require('express');
const url = require('url');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const app = express();

app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
  console.log(`
    ${new Date().toLocaleString()} 
    ${req.method} 
    ${req.originalUrl} 
    params:${JSON.stringify(req.params)} 
    body:${JSON.stringify(req.body)} 
    res:${res.statusCode}
  `);
  next();
});

app.get('/hello', async (req, res) => {
  res.status(200).json({ hello: true });
});

app.get('/tournaments', async (req, res) => {
  try {
    const parsed = url.parse(req.url, true).query;
    const params = new URLSearchParams(parsed);
    if (!params.has('subdomain')) {
      throw 'subdomain param is required';
    }
    if (!params.has('api_key')) {
      throw 'api_key param is required';
    }
    if (!params.has('created_after')) {
      throw 'created_after param is required';
    }
    const response = await axios({
      url: `${BASE_URL}${BASE_URL_SUFFIX}?${params}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// tournament by subdomain and name
// GET https://api.challonge.com/v1/tournaments/{tournament}.{json|xml}
app.get('/tournament', async (req, res) => {
  try {
    const parsed = url.parse(req.url, true).query;
    const params = new URLSearchParams(parsed);
    if (!params.has('subdomain')) {
      throw 'subdomain param is required';
    }
    if (!params.has('api_key')) {
      throw 'api_key param is required';
    }
    if (!params.has('name')) {
      throw 'name param is required';
    }
    const response = await axios({
      url: `${BASE_URL}/${params.get('subdomain')}-${params.get(
        'name'
      )}${BASE_URL_SUFFIX}?api_key=${params.get('api_key')}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// get all matches in a tournament
// GET https://api.challonge.com/v1/tournaments/{tournament}/matches.{json|xml}
app.get('/matches', async (req, res) => {
  try {
    const parsed = url.parse(req.url, true).query;
    const params = new URLSearchParams(parsed);
    if (!params.has('subdomain')) {
      throw 'subdomain param is required';
    }
    if (!params.has('api_key')) {
      throw 'api_key param is required';
    }
    if (!params.has('name')) {
      throw 'name param is required';
    }
    const response = await axios({
      url: `${BASE_URL}/${params.get('subdomain')}-${params.get(
        'name'
      )}/matches${BASE_URL_SUFFIX}?api_key=${params.get('api_key')}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// get all players in a tournament
app.get('/players', async (req, res) => {
  try {
    const parsed = url.parse(req.url, true).query;
    const params = new URLSearchParams(parsed);
    if (!params.has('subdomain')) {
      throw 'subdomain param is required';
    }
    if (!params.has('api_key')) {
      throw 'api_key param is required';
    }
    if (!params.has('name')) {
      throw 'name param is required';
    }
    const response = await axios({
      url: `${BASE_URL}/${params.get('subdomain')}-${params.get(
        'name'
      )}/participants${BASE_URL_SUFFIX}?api_key=${params.get('api_key')}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// get player lists for multiple tournaments
app.get('/players-multi', async (req, res) => {
  try {
    const parsed = url.parse(req.url, true).query;
    const params = new URLSearchParams(parsed);
    if (!params.has('subdomain')) {
      throw 'subdomain param is required';
    }
    if (!params.has('api_key')) {
      throw 'api_key param is required';
    }
    if (!params.has('name')) {
      throw 'name param is required';
    }
    const response = await axios({
      url: `${BASE_URL}/${params.get('subdomain')}-${params.get(
        'name'
      )}/participants${BASE_URL_SUFFIX}?api_key=${params.get('api_key')}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// update/submit match results and/or scores
// PUT https://api.challonge.com/v1/tournaments/{tournament}/matches/{match_id}.{json|xml}
app.put('/match', jsonParser, async (req, res) => {
  try {
    const { body: reqBody } = req;
    const { subdomain, api_key, name, match_id, winner_id, scores_csv } =
      reqBody;
    if (!subdomain) {
      throw 'subdomain param is required';
    }
    if (!api_key) {
      throw 'api_key param is required';
    }
    if (!name) {
      throw 'name param is required';
    }
    if (!match_id) {
      throw 'match_id param is required';
    }
    if (!winner_id) {
      throw 'winner_id param is required';
    }

    const putUrl = `${BASE_URL}/${subdomain}-${name}/matches/${match_id}${BASE_URL_SUFFIX}?api_key=${api_key}`;
    const putBody = {
      match: {
        winner_id,
        scores_csv: scores_csv || '0-0',
      },
    };

    const response = await axios.put(putUrl, putBody);
    if (response.status === 200) {
      return res.status(200).json({ success: true });
    }
    return res.status(500).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// reopen match by match_id
app.post('/match/reopen', jsonParser, async (req, res) => {
  try {
    const { body: reqBody } = req;
    const { subdomain, api_key, name, match_id } = reqBody;
    if (!subdomain) {
      throw 'subdomain param is required';
    }
    if (!api_key) {
      throw 'api_key param is required';
    }
    if (!name) {
      throw 'name param is required';
    }
    if (!match_id) {
      throw 'match_id param is required';
    }

    const postUrl = `${BASE_URL}/${subdomain}-${name}/matches/${match_id}/reopen${BASE_URL_SUFFIX}?api_key=${api_key}`;

    const response = await axios.post(postUrl);
    if (response.status === 200) {
      return res.status(200).json({ success: true });
    }
    return res.status(500).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

app.listen(3001);
