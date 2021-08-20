const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
const Schema = mongoose.Schema;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

//connect to mongoose database
mongoose.connect('mongodb+srv://lsimon:dark20@cluster0.kvrdv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

console.log(mongoose.connection.readyState);
//create URL schema and model to store values into the db
const userSchema = new Schema({
  username: { type: String, required: true },
  id: {type: String, required: false},
  exercises: {type: Array, required: false}
});

var Muser = mongoose.model("User", userSchema);

app.get('/api/users', function(req,res){
  Muser.find({}, function(err, userdata){
    var userMap = [];
    userdata.forEach(function(user) {
      var Jsonuser = user;//{_id: user._id, username: user.username};
      userMap.push(Jsonuser)
    });
  res.send(userMap);
  });
});

app.post('/api/users/:_id/exercises', (req, res)=>{
  const userID = req.params._id;
  if (!req.body.description || !req.body.duration) res.json({error: "Missing parameters"});
  else {
    var desc = req.body.description;
    var dur = Number(req.body.duration);
  }
  if(!req.body.date) var dat = new Date().toString().slice(0,15);
  else var dat = new Date(req.body.date).toString().slice(0,15);

  Muser.findOne({id: userID}, (err,userfound)=>{
    if(!userfound) res.json({error: "Invalid user ID."});
    else{
      var user = userfound.username;
      var exercisetoset = userfound.exercises;
      exercisetoset.push({"description":desc,"duration":dur,"date":dat});
      Muser.findOneAndUpdate({id: userID},{exercises: exercisetoset}, {new: true});
      res.json({_id: userID, username: user, date: dat, duration: dur,  description: desc});
    }
  });
});

app.post('/api/users', function (req,res){
  var In_user = req.body.username;
  Muser.findOne({}).sort({_id: -1}).exec(function(err,savedusers){
    if(!savedusers) var userID = 1;
    else userID = savedusers._id;
    var newuser = new Muser({username: In_user, id: userID});
    //here could do findOneAndUpdate to replace existent urls
    newuser.save(function(err, data) {
    if (err) return console.error(err);
    });
    res.json({username: In_user, _id: userID}); 
  });
});

