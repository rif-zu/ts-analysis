const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
require('dotenv').config();
// Connection URL
var mongodb = require('mongodb');

// Database Name
const dbName = 'TwitterSentiment';


module.exports = {
     url : process.env.DBURL,
    DBCreation: function () {
      
        MongoClient.connect(this.url, {
            poolSize: 10,
            bufferMaxEntries: 0,
            reconnectTries: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, function (err, db) {
            if (err) {
                console.log("Error while collecting collection names");
                throw err;
            }

            var dbo = db.db("TwitterSentiment");
            dbo.collections().then(result => {

                var collectionSet = new Set();
                for (let i = 0; i < result.length; i++) {
                    console.log(result[i].collectionName);
                    collectionSet.add(result[i].collectionName);
                }

                if (!collectionSet.has('queries')) {
                    dbo.createCollection("queries").then(result => {
                        console.log("queries Collection created.");
                    }).catch(err => {
                        console.log("Error while creating queries collection.");
                        throw err;
                    });


                } else {
                    console.log("queries collection already exists.!!");
                }
                if (!collectionSet.has('APIKeys')) {
                    dbo.createCollection("APIKeys").then(result => {
                        console.log("APIKeys Collection created.");
                    }).catch(err => {
                        console.log("Error while creating APIKeys collection.");
                        throw err;
                    });


                } else {
                    console.log("APIKeys collection already exists.!!");
                }
              setTimeout( ()=>{ db.close()},5000);

            });
        });
    },



    insertQuery: function (queryWords, queryDate, refreshUrl, resultScore, countFetches,reach,retweets,timeline,callback) {
        MongoClient.connect(this.url, {
            poolSize: 10,
            bufferMaxEntries: 0,
            reconnectTries: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, function (err, db) {
            if (err) {
                console.log("Error while collecting collection names");
                throw err;
            }

            var queryObj = {
                queryWords,
                queryDate,
                refreshUrl,
                resultScore,
                countFetches,
                reach,retweets,timeline
            }

            var dbo = db.db("TwitterSentiment");
            dbo.collection('queries').insertOne(queryObj).then((resp) => {
                console.log("inserted query into db");
                callback(resp);
            }).catch(err => {
                console.log("Error");
                callback(err);
            }).finally(()=>{
                db.close();
            })
        });


    },

    fetchAllQueries: function(callback){

    MongoClient.connect(this.url, {
            poolSize: 10,
            bufferMaxEntries: 0,
            reconnectTries: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        },function (err, db) {
            if (err) {
                console.log("Error while collecting collection names");
                throw err;
            }
            var dbo = db.db("TwitterSentiment");
            dbo.collection('queries').find({}).toArray(function(err, result) {
                if (err) throw err;
            
              callback({
                   'result':result
               });
                db.close();
              });
        //    var result = await dbo.collection('queries').find({}).toArray();
        //     db.close();
        //     console.log(result);
        //     return result;
            });


        },


        insertKeys:function(data,callback){

            MongoClient.connect(this.url, {
                poolSize: 10,
                bufferMaxEntries: 0,
                reconnectTries: 5000,
                useNewUrlParser: true,
                useUnifiedTopology: true
            },function (err, db) {
                if (err) {
                    console.log("Error while collecting collection names");
                    throw err;
                }
                var dbo = db.db("TwitterSentiment");
                dbo.collection('APIKeys').insertOne(data).then((result)=>{
                     
                
                  callback({
                       success:true
                   });
                
                  }).catch(err=>{
                      throw err;
                  }).finally(()=>{
                    db.close();
                })
        });
    },

    getKeys:function(callback){

        MongoClient.connect(this.url, {
            poolSize: 10,
            bufferMaxEntries: 0,
            reconnectTries: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        },function (err, db) {
            if (err) {
                console.log("Error while collecting collection names");
                throw err;
            }
            var dbo = db.db("TwitterSentiment");
            dbo.collection('APIKeys').findOne({}).then((result)=>{
                 console.log(result);
            
              callback({
                   keys:result
               });
               
              }).catch(err=>{
                  throw err;
              }).finally(()=>{
                db.close();
            })
    });


    }
,
    deleteAllPreviousQueries:function(callback){
        MongoClient.connect(this.url, {
            poolSize: 10,
            bufferMaxEntries: 0,
            reconnectTries: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        },function (err, db) {
            if (err) {
                console.log("Error while collecting collection names");
                throw err;
            }
            var dbo = db.db("TwitterSentiment");
            dbo.collection('queries').deleteMany({}).then((result)=>{
                console.log(result);
           
            callback(result);
             }).catch(err=>{
                 throw err;
             }).finally(()=>{
               db.close();
           })
            });



    },

    deleteSinglePreviousQueries:function(data,callback){
        MongoClient.connect(this.url, {
            poolSize: 10,
            bufferMaxEntries: 0,
            reconnectTries: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        },function (err, db) {
            if (err) {
                console.log("Error while collecting collection names");
                throw err;
            }
            var dbo = db.db("TwitterSentiment");
            dbo.collection('queries').deleteOne({_id:  new mongodb.ObjectID(data._id)}).then((result)=>{
                // console.log(result);
            
            callback(result);
             }).catch(err=>{
                 throw err;
             }).finally(()=>{
               db.close();
           })
            });



    }


};