import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Pusher from 'pusher';
import dbModel from './dbModel.js';

//app config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
  appId: '1078167',
  key: 'a63562cc7402f60abd25',
  secret: '24f9868b7cba9de5c6a1',
  cluster: 'us2',
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(cors());

//db config
const connectionUrl =
  'mongodb+srv://admin:MIja6k2S4LLNASxD@cluster0.wxwtz.mongodb.net/instaDB?retryWrites=true&w=majority';
mongoose.connect(connectionUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('DB connected');

  const changeStream = mongoose.connection.collection('posts').watch();
  changeStream.on('change', (change) => {
    console.log('Change Triggered on pusher...');
    console.log(change);
    console.log('End of change');

    if (change.operationType === 'insert') {
      console.log('Triggering Pusher ***IMG UPLOAD***');
      const postDetails = change.fullDocument;
      pusher.trigger('posts', 'inserted', {
        user: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log('Unknown trigger from pusher');
    }
  });
});

//api routes
app.get('/', (req, res) => res.status(200).send('hello bina'));
app.post('/upload', (req, res) => {
  const body = req.body;
  dbModel.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get('/sync', (req, res) => {
  dbModel.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//listener
app.listen(port, () => console.log(`listening on localhost: ${port}`));
