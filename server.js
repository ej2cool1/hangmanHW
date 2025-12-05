// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');                      // <--- NEW
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const app = express();
app.use(cors());                                   // <--- NEW
app.use(bodyParser.json());

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.DYNAMO_TABLE || 'HangmanPlayers';

// For local/dev: use dummy credentials unless real ones are set
const clientOptions = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeAccessKey',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretKey',
  },
};

// If using DynamoDB Local, set AWS_ENDPOINT and we'll point to it
if (process.env.AWS_ENDPOINT) {
  clientOptions.endpoint = process.env.AWS_ENDPOINT;
}

const client = new DynamoDBClient(clientOptions);
const ddbDocClient = DynamoDBDocumentClient.from(client);


// -------- GET /player?playerName=NAME -----------------------------
app.get('/player', async (req, res) => {
  const playerName = req.query.playerName;
  if (!playerName) {
    return res.status(400).json({ message: 'missing playerName' });
  }

  try {
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE,
        Key: { playerName },
      })
    );

    if (!result.Item) {
      return res.status(404).json({ message: 'player not found' });
    }

    const wins = result.Item.wins || 0;
    const losses = result.Item.losses || 0;
    const total = wins + losses;
    const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;

    return res.json({ ...result.Item, winPercentage });
  } catch (err) {
    console.error('GET /player error', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// -------- POST /player ---------------------------------------------
app.post('/player', async (req, res) => {
  const { playerName, wins = 0, losses = 0 } = req.body || {};
  if (!playerName) {
    return res.status(400).json({ message: 'playerName required' });
  }

  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: { playerName, wins, losses },
        ConditionExpression: 'attribute_not_exists(playerName)',
      })
    );

    const total = wins + losses;
    const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;

    return res.status(201).json({
      playerName,
      wins,
      losses,
      winPercentage,
    });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({ message: 'player already exists' });
    }
    console.error('POST /player error', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// -------- PUT /player ----------------------------------------------
app.put('/player', async (req, res) => {
  const { playerName, wins, losses } = req.body || {};
  if (!playerName || typeof wins !== 'number' || typeof losses !== 'number') {
    return res
      .status(400)
      .json({ message: 'playerName, wins, losses required (numbers)' });
  }

  try {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { playerName },
        UpdateExpression: 'SET wins = :w, losses = :l',
        ExpressionAttributeValues: { ':w': wins, ':l': losses },
        ReturnValues: 'ALL_NEW',
      })
    );

    const get = await ddbDocClient.send(
      new GetCommand({ TableName: TABLE, Key: { playerName } })
    );

    const item = get.Item || { playerName, wins, losses };
    const total = (item.wins || 0) + (item.losses || 0);
    const winPercentage = total > 0 ? Math.round((item.wins / total) * 100) : 0;

    return res.json({ ...item, winPercentage });
  } catch (err) {
    console.error('PUT /player error', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// health + root
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => {
  res.send('Hangman API is running');
});

// start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Hangman API listening on ${port} (table: ${TABLE})`);
});
