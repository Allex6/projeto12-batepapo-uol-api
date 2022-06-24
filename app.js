
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const dayjs = require('dayjs');
const userSchema = require('./models/user');
const messageSchema = require('./models/message');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const serverPort = process.env.SERVER_PORT || 5000;

const mongoClient = new MongoClient(mongoURI);
let db;

(async ()=>{

    await mongoClient.connect();
    db = mongoClient.db('bate_papo_uol_api');

})();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next)=>{

    const participantsCollection = db.collection('participants');
    const messagesCollection = db.collection('messages');
    next();

});

app.get('/participants', (req, res, next)=>{



});

app.post('/participants', async (req, res, next)=>{

    const { name } = req.body;

    try {
        
        const {error, value} = userSchema.validate({ name });
        if(error) return res.status(422).send('name deve ser uma string não vazia.');

        const participant = await participantsCollection.find({ name })
        if(participant) return res.status(409).send('Esse nome já está sendo usado.');

        await participantsCollection.insertOne({
            name,
            lastStatus: Date.now()
        });

        await messagesCollection.insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:MM:SS')
        });

        res.sendStatus(201);

    } catch (err) {
        res.status(500).send('Ocorreu um erro desconhecido. Tente novamente.');
    }

});

app.get('/messages', (req, res, next)=>{



});

app.post('/messages', (req, res, next)=>{



});

app.post('/status', (req, res, next)=>{



});

app.listen(serverPort, () => console.log(`Servidor online na porta ${serverPort}`));