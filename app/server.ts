const BASE_URL = 'https://api.challonge.com/v1/tournaments';
const BASE_URL_SUFFIX = '.json';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import axios from 'axios';
import bodyParser from 'body-parser';

const jsonParser = bodyParser.json();

const app = express();

app.use(helmet());
app.use(cors());

// logging middleware
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
    const params = req.query;
    if (!params['subdomain']) {
      throw 'subdomain param is required';
    }
    if (!params['api_key']) {
      throw 'api_key param is required';
    }
    if (!params['created_after']) {
      throw 'created_after param is required';
    }
    const subdomain = params['subdomain'];
    const api_key = params['api_key'];
    const created_after = params['created_after'];
    const response = await axios({
      url: `${BASE_URL}${BASE_URL_SUFFIX}?api_key=${api_key}&subdomain=${subdomain}&created_after=${created_after}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// get tournament by id or name
// - includes array of matches
// GET https://api.challonge.com/v1/tournaments/{tournament}.{json|xml}
app.get('/tournament', async (req, res) => {
  try {
    const params = req.query;
    if (!params['subdomain']) {
      throw 'subdomain param is required';
    }
    if (!params['api_key']) {
      throw 'api_key param is required';
    }
    // name or tournament id lookup. use id first
    if (!params['name'] && !params['tournament_id']) {
      throw 'tournament_id/name required';
    }
    let idPath = '';
    if (
      params['tournament_id'] &&
      typeof params['tournament_id'] === 'string'
    ) {
      idPath = params['tournament_id'];
    } else {
      idPath = `${params['subdomain']}-${params['name']}`;
    }
    const response = await axios({
      url: `${BASE_URL}/${idPath}${BASE_URL_SUFFIX}?api_key=${params['api_key']}&include_participants=0&include_matches=1`,
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
    const params = req.query;
    if (!params['subdomain']) {
      throw 'subdomain param is required';
    }
    if (!params['api_key']) {
      throw 'api_key param is required';
    }
    // name or tournament id lookup. use id first
    if (!params['name'] && !params['tournament_id']) {
      throw 'tournament_id/name required';
    }
    let idPath = '';
    if (
      params['tournament_id'] &&
      typeof params['tournament_id'] === 'string'
    ) {
      idPath = params['tournament_id'];
    } else {
      idPath = `${params['subdomain']}-${params['name']}`;
    }
    const response = await axios({
      url: `${BASE_URL}/${idPath}/matches${BASE_URL_SUFFIX}?api_key=${params['api_key']}`,
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
    const params = req.query;
    if (!params['subdomain']) {
      throw 'subdomain param is required';
    }
    if (!params['api_key']) {
      throw 'api_key param is required';
    }
    // name or tournament id lookup. use id first
    if (!params['name'] && !params['tournament_id']) {
      throw 'tournament_id/name required';
    }
    let idPath = '';
    if (
      params['tournament_id'] &&
      typeof params['tournament_id'] === 'string'
    ) {
      idPath = params['tournament_id'];
    } else {
      idPath = `${params['subdomain']}-${params['name']}`;
    }
    const response = await axios({
      url: `${BASE_URL}/${idPath}/participants${BASE_URL_SUFFIX}?api_key=${params['api_key']}`,
      method: 'get',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// get player lists for multiple tournaments
app.get('/players-set', async (req, res) => {
  try {
    const params = req.query;
    if (!params['tournament_ids']) {
      throw 'tournament_ids required';
    }
    if (!params['api_key']) {
      throw 'api_key param is required';
    }
    const ids = params['tournament_ids'];

    // create array of ids from comma-separated string param
    const idsArray = typeof ids === 'string' ? ids.split(',') : [];

    // create array of fetch promises from idsArray
    const reqArray: Promise<any>[] = [];
    idsArray.forEach((id) => {
      reqArray.push(
        axios.get(
          `${BASE_URL}/${id}/participants${BASE_URL_SUFFIX}?api_key=${params['api_key']}`
        )
      );
    });

    // extract all player data from each result
    // create "set" of unique player name strings and tournaments entered
    // name 'ebomb' found in two tournaments:
    // ex: "ebomb": [{ tournamentId: "12345", playerId: "11111"},
    //               { tournamentId: "67890", playerId: "22222"}]
    const resArray = await Promise.all(reqArray);
    const playerNames: string[] = [];
    const playerSet: {
      [k: string]: { tournamentId: string; playerId: string }[];
    } = {};

    // playerDict: lookup player name by id.
    // needed because playername has unique id per tournament.
    // more performant than re-querying each tournament and player set
    // then searching through the arrays for name/id match.
    const playerDict: { [pId: string]: string } = {};

    resArray.forEach((res) => {
      const { data: playerArr = [] } = res || {};
      playerArr.forEach((node: { participant: Record<string, any> }) => {
        const { participant: p } = node || {};
        if (playerSet.hasOwnProperty(p.name)) {
          playerSet[p.name].push({
            tournamentId: `${p.tournament_id}`,
            playerId: `${p.id}`,
          });
        } else {
          playerSet[p.name] = [
            { tournamentId: `${p.tournament_id}`, playerId: `${p.id}` },
          ];
          playerNames.push(p.name);
        }
        playerDict[p.id] = p.name;
      });
    });
    res.status(200).json({ entities: playerSet, names: playerNames, playerDict });
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
    const {
      api_key,
      match_id,
      name,
      scores_csv,
      subdomain,
      tournament_id,
      winner_id,
    } = reqBody;
    if (!subdomain) {
      throw new Error('subdomain param is required');
    }
    if (!api_key) {
      throw new Error('api_key param is required');
    }
    if (!name && !tournament_id) {
      throw new Error('tournament_id/name required');
    }
    if (!match_id) {
      throw new Error('match_id param is required');
    }
    if (!winner_id) {
      throw new Error('winner_id param is required');
    }
    let idPath = '';
    if (tournament_id) {
      idPath = tournament_id;
    } else {
      idPath = `${subdomain}-${name}`;
    }
    const putUrl = `${BASE_URL}/${idPath}/matches/${match_id}${BASE_URL_SUFFIX}?api_key=${api_key}`;
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
      throw new Error('subdomain param is required');
    }
    if (!api_key) {
      throw new Error('api_key param is required');
    }
    if (!name) {
      throw new Error('name param is required');
    }
    if (!match_id) {
      throw new Error('match_id param is required');
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

app.listen(3001, () => console.log('listening on port 3001'));
