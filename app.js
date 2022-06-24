
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

    req.participantsCollection = db.collection('participants');
    req.messagesCollection = db.collection('messages');
    next();

});

app.get('/participants', async (req, res, next)=>{

    const participantsList = await req.participantsCollection.find({}).toArray();
    res.send(participantsList);

});

app.post('/participants', async (req, res, next)=>{

    const { name } = req.body;

    try {
        
        const {error} = userSchema.validate({ name });
        if(error) return res.status(422).send('name deve ser uma string não vazia.');

        const participant = await req.participantsCollection.findOne({ name })
        if(participant) return res.status(409).send('Esse nome já está sendo usado.');

        await req.participantsCollection.insertOne({
            name,
            lastStatus: Date.now()
        });

        await req.messagesCollection.insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:MM:SS')
        });

        res.sendStatus(201);

    } catch (err) {
        console.log('err', err);
        res.status(500).send('Ocorreu um erro desconhecido. Tente novamente.');
    }

});

app.get('/messages', async (req, res, next)=>{

    const { limit } = req.query;
    const user = req.headers['user'];

    if(!user) return res.status(422).send('Usuário não informado no header.');

    try {
        
        const query = {
            $or: [
                { from: user },
                { to: user }
            ]
        };

        let findResults = [];

        if(limit){

            const resultsLimit = parseInt(limit);
            findResults = await req.messagesCollection.find(query).sort({ length: -1 }).limit(resultsLimit).toArray();

        } else {

            findResults = await req.messagesCollection.find(query).sort({ length: -1 }).toArray();

        }

        res.send(findResults);

    } catch (err) {
        res.status(500).send('Ocorreu um erro desconhecido. Tente novamente.');
    }

});

app.post('/messages', async (req, res, next)=>{

    const { to, text, type } = req.body;
    const from = req.headers['user'];

    const { error } = messageSchema.validate({
        to,
        text,
        type
    });

    if(error) return res.status(422).send(error);
    if(!from) return res.status(422).send('Campo "from" não informado.');

    try {
        
        const participant = await req.participantsCollection.findOne({
            name: from
        });

        if(!participant) return res.status(422).send('Participante não encontrado.');

        await req.messagesCollection.insertOne({
            from,
            to,
            type,
            text,
            time: dayjs().format('HH:MM:SS')
        });

        res.sendStatus(201);

    } catch (err) {
        res.status(500).send('Ocorreu um erro desconhecido. Tente novamente.');
    }

});

app.post('/status', async (req, res, next)=>{

    const user = req.headers['user'];

    try {
        
        const updateResult = await req.participantsCollection.findOneAndUpdate(
            { name: user },
            { 
                $set: { lastStatus: Date.now() }
            }
        );

        if(!updateResult) return res.sendStatus(404);
        res.sendStatus(200);

    } catch (err) {
        console.log('err ', err);
        res.status(500).send('Ocorreu um erro desconhecido. Tente novamente.');
    }

});

setInterval(async ()=>{

    const now = Date.now();
    const inactiveLimit = 1000 * 10;

    await db.collection('participants').deleteMany({
        lastStatus: {
            $lt: (now - inactiveLimit)
        }
    });

}, 15000);

app.listen(serverPort, () => console.log(`Servidor online na porta ${serverPort}`));