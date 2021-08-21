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
  exercises: {type: Array}
});

var Muser = mongoose.model("User", userSchema);

//&to=todate&limit=number
app.get('/api/users/:_id/logs',(req,res) =>{
  const userID = req.params._id;
  const fromdate = 
  !req.query.from ? new Date(0) : new Date(req.query.from);
  const todate = 
  !req.query.to ? new Date(8640000000000000) : new Date(req.query.to);
  const limit = !req.query.limit? 99999999999 : Number(req.query.limit);

  Muser.findOne({id: userID}, (err, userfound)=>{
    var ex_list = userfound.exercises;
    var short_list = [];
    
    for(let i=0; i< ex_list.length; i++){
      var ex_date = new Date(ex_list[i]['date']);
      if(todate >= ex_date && ex_date >= fromdate){
          short_list.push(ex_list[i]);
      }
    }
    var lim_list = short_list.slice(0, limit);
    res.json({_id: userID, username: userfound.username, from: fromdate.toString().slice(0,15), to: todate.toString().slice(0,15),count: lim_list.length, log: lim_list});
  }); 
});

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
  
    if(!req.body.date) var dat = new Date().toString().slice(0,15);
    else var dat = new Date(req.body.date).toString().slice(0,15);

    Muser.findOne({id: userID}, (err,userfound)=>{
      if(!userfound) res.json({error: "Invalid user ID."});
      else{
        var user = userfound.username;
        var exercisetoset = userfound.exercises;
        var count = exercisetoset.push({description: desc, duration: dur, date: dat});
        Muser.findOneAndUpdate({id: userfound.id},{exercises: exercisetoset}, { upsert: true });
          userfound.save();  
        res.json({_id: userID, username: user, date: dat, duration: dur,  description: desc});
      }
    });
  }
});

app.post('/api/users', function (req,res){
  var In_user = req.body.username;
  var newuser = new Muser({username: In_user, id: "", exercises: []});
    //here could do findOneAndUpdate to replace existent urls
  newuser.save(function(err, data) {
    if (err) return console.error(err);
    else{
      Muser.findByIdAndUpdate({_id: data._id}, {id: data._id}, {upsert: true, new: true}, (err,userfound)=>{
        userfound.save();
        res.json({username: userfound.username, _id: userfound.id});
      }); 
    }
    });
  
});


//app.post('/api/users', function (req,res){
 // var In_user = req.body.username;
  //Muser.findOne({}).sort({_id: -1}).exec(function(err,savedusers){
  //  if(!savedusers) var userID = 1;
   // else userID = savedusers._id;
   // var newuser = new Muser({username: In_user, id: userID, exercises: []});
    //here could do findOneAndUpdate to replace existent urls
    //newuser.save(function(err, data) {
    //if (err) return console.error(err);
    //});
    //res.json({username: In_user, _id: userID}); 
  //});
//});
