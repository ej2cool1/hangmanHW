// createTable.js
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.DYNAMO_TABLE || 'HangmanPlayers';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeAccessKey',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretKey',
  },
});

async function main() {
  try {
    const cmd = new CreateTableCommand({
      TableName: TABLE,
      AttributeDefinitions: [
        { AttributeName: 'playerName', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'playerName', KeyType: 'HASH' }, // partition key
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });

    const resp = await client.send(cmd);
    console.log('Table created:', resp.TableDescription.TableName);
  } catch (err) {
    console.error('Error creating table:', err);
  }
}

main();
