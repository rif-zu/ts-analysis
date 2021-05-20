var Twit = require('twit')
var keys = require('./keys')
const express = require('express');
const bodyParser = require('body-parser');
const skmeans = require("skmeans");
const path = require('path');
var Sentiment = require('sentiment');
var DataBaseOperations = require('./dbcreation');
var axios = require('axios');
var Twitter = require('twitter');
require('dotenv').config();
var sentiment = new Sentiment();
const port = process.env.PORT || 5000;
//database initialised
DataBaseOperations.DBCreation();

const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, './build')));
var T = new Twit({
    consumer_key: keys.consumer_key,
    consumer_secret: keys.consumer_secret,
    access_token: keys.access_token,
    access_token_secret: keys.access_token_secret,
});

DataBaseOperations.getKeys((result, err) => {
    if (err) {
        console.log(err);
         
        return;
    }
  var keysDB=result.keys;

    T = new Twit({
    consumer_key: keysDB.apikey,
    consumer_secret: keysDB.apisecret,
    access_token: keysDB.accesstoken,
    access_token_secret: keysDB.accesstokensecret,
});


});

// var countRecurse = 0;
// var UserIDsTweet=new Set();
// var Retweeted=0;
// var  TimeSentiment=new Map();
function getMoreTweets(max_id, query, countFetches, UserIDs, Retweeted, TimeSentiment, countRecurse, callback) {
    // console.log(countRecurse++);
    countRecurse++;
    if (countRecurse == countFetches) {
        countRecurse = 0;
        callback({
            texts: new Array()
        });
        return;
    }
    // console.log('maxxxx id', max_id,query);
    T.get('search/tweets', {
        q: query,
        include_entities: true,
        max_id: max_id,
        count: 200,
        result_type: 'recent'
    }, function (err, data, response) {
        // console.log(data.search_metadata, data.statuses.length);
        if (data == undefined || data.statuses == undefined || data.statuses.length == 0 || data.search_metadata == undefined || data.search_metadata.count == undefined || data.search_metadata.count == 0) {
            console.log("Error in ", countRecurse);
            console.log(data);
            countRecurse = 0;
            callback({
                texts: new Array()
            });
            return;
        }
        var max_idd = data.search_metadata.next_results.substr(8, 19);
        var texts = new Array();
        var statuses = data.statuses;
        for (let i = 0; i < statuses.length; i++) {

            texts.push(statuses[i].text);

            let status = statuses[i];
            UserIDs.add(status.user.id);
            Retweeted += Math.max(status.retweet_count, status.retweeted == true ? 1 : 0);
            if (!TimeSentiment.has(status.text)) {
                var already = new Array();
                already.push(new Date(status.created_at).getTime());
                TimeSentiment.set(status.text, already);
            } else {
                var newAlready = TimeSentiment.get(status.text);
                newAlready.push(new Date(status.created_at).getTime());
                TimeSentiment.set(status.text, newAlready);
            }

        }
        console.log("tweets in " + countRecurse + " attempt", texts.length);
        getMoreTweets(max_idd, query, countFetches, UserIDs, Retweeted, TimeSentiment, countRecurse, (dataReturned) => {
            for (let i = 0; i < dataReturned.texts.length; i++) {
                texts.push(dataReturned.texts[i]);
            }
            callback({
                texts: texts
            });
        })



    });

}



app.get('/search/:q', (req, res) => {
    let countFetches = req.query.countFetches;
    let UserIDs = new Set();
    let Retweeted = 0;
    let TimeSentiment = new Map();
    let countRecurse = 0;

    let TimeLineValue = new Map();

    if (countFetches != undefined || countFetches != null || countFetches != 0) {
        countFetches = parseInt(countFetches);
    } else {
        countFetches = 3;
    }
    console.log(req.params.q);
    var q_again = encodeURI(req.params.q);

    var dateString = new Date()
    var currentMilliseconds = dateString.getTime();

    var newDate = new Date(currentMilliseconds);

    var omonth = newDate.getMonth().toString().length == 1 ? '0' + (newDate.getMonth() + 1) : (newDate.getMonth() + 1);
    var odate = newDate.getDate().toString().length == 1 ? '0' + (newDate.getDate()) : (newDate.getDate());

    var newDateFormatted = newDate.getFullYear() + '-' + omonth + '-' + odate;
    console.log(newDateFormatted);
    T.get('search/tweets', {
        q: req.params.q,
        count: 200,
        result_type: 'recent',
    }, function (err, data, response) {
        if (err) {
            res.send(err);
            return;
        }
        var texts = new Array();
        var totalscore = 0;
        var positiveScore = 0;
        var negativeScore = 0;
        var neutralScore = 0;
        var strongPositive = 0;
        var strongNegative = 0;
        var totalscoreStrength = 0;
        var positiveScoreStrength = 0;
        var negativeScoreStrength = 0;
        var neutralScoreStrength = 0;
        var strongPositiveStrength = 0;
        var strongNegativeStrength = 0;


        if (data.statuses == undefined || data.search_metadata == undefined || data.search_metadata.next_results == undefined || data.statuses.length == 0) {
            console.log("Error in first attempt");
            console.log(data);
            console.log(response.statusMessage);
            res.send({
                'texts': [],
                'total_score_count': 5,
                'total_score_strength': 5,
                'strong_positive_count': 1,
                'strong_positive_strength': 1,
                'strong_negative_count': 1,
                'strong_negative_strength': 1,
                'positive_count': 1,
                'positive_strength': 1,
                'negative_count': 1,
                'negative_strength': 1,
                'neutral_count': 1,
                'neutral_strength': 1,
                wordsUsed: Object.fromEntries(new Map()),
                error: 'Limit Exceded'
            });
            return;
        } else {
            // console.log(data.search_metadata);
            console.log('statuses in first attempt', data.statuses[0])
        }
        var max_id = data.search_metadata.next_results.substr(8, 19);

        var wordsUsed = new Map();
        getMoreTweets(max_id, req.params.q, countFetches, UserIDs, Retweeted, TimeSentiment, countRecurse, (dataReturned) => {

            var textSet = dataReturned.texts;
            var statuses = new Array();
            data.statuses.forEach((status) => {
                statuses.push(status.text);

                UserIDs.add(status.user.id);
                Retweeted += Math.max(status.retweet_count, status.retweeted == true ? 1 : 0);
                if (!TimeSentiment.has(status.text)) {
                    var already = new Array();
                    already.push(new Date(status.created_at).getTime());
                    TimeSentiment.set(status.text, already);
                } else {
                    var newAlready = TimeSentiment.get(status.text);
                    newAlready.push(new Date(status.created_at).getTime());
                    TimeSentiment.set(status.text, newAlready);
                }

            });
            textSet.forEach(text => statuses.push(text));




// var tweetTexts=new Array();
            for (let i = 0; i < statuses.length; i++) {

                var result = sentiment.analyze(statuses[i]);
                // tweetTexts.push(statuses[i]);
                var words = result.words;
                // console.log(words);
                if (words !== null && words != undefined && words.length != 0) {
                    for (let j = 0; j < words.length; j++) {
                        if (!wordsUsed.has(words[j])) {
                            wordsUsed.set(words[j], 1);
                        } else {
                            wordsUsed.set(words[j], wordsUsed.get(words[j]) + 1);
                        }
                    }
                }

                var resultingArray = TimeSentiment.get(statuses[i]);
                for (let k = 0; k < resultingArray.length; k++) {
                    // TimeLineValue.set(resultingArray[k],result);
                    if (!TimeLineValue.has(resultingArray[k])) {
                        var rr = {
                            positive: 0,
                            negative: 0,
                        }
                        if (result.score > 0) {
                            rr.positive += result.score;
                        } else {
                            rr.negative += Math.abs(result.score);
                        }
                        // console.log(new Date(resultingArray[k]).getTime());
                        TimeLineValue.set(resultingArray[k], rr);
                    } else {
                        var rr = TimeLineValue.get(resultingArray[k]);
                        // console.log(rr);
                        if (result.score > 0) {
                            rr.positive = rr.positive + result.score;
                        } else {
                            rr.negative = rr.negative + Math.abs(result.score);
                        }
                        // console.log(new Date(resultingArray[k]).getTime());
                        TimeLineValue.set(resultingArray[k], rr);
                    }
                }



                totalscore += 1;
                totalscoreStrength += result.score;
                if (result.score >= 4) {
                    strongPositive += 1;
                    strongPositiveStrength += result.score;
                    texts.push({
                        'text': statuses[i],
                        'label': 'Strong Positive'
                    });
                    continue;
                }
                if (result.score >= 1) {
                    positiveScore += 1;
                    positiveScoreStrength += result.score;
                    texts.push({
                        'text': statuses[i],
                        'label': 'Positive'
                    });
                    continue;
                }
                if (result.score == 0) {
                    neutralScore += 1;
                    neutralScoreStrength += result.score;
                    texts.push({
                        'text': statuses[i],
                        'label': 'Neutral'
                    });
                    continue;
                }
                if (result.score >= -3) {
                    negativeScore += 1;
                    negativeScoreStrength += result.score;
                    texts.push({
                        'text': statuses[i],
                        'label': 'Negative'
                    });
                    continue;
                }
                if (result.score >= -5) {
                    strongNegative += 1;
                    strongNegativeStrength += result.score;
                    texts.push({
                        'text': statuses[i],
                        'label': 'Strong Negative'
                    });
                    continue;
                }
            }
            // console.log(wordsUsed);
            var millis = new Array();
            var valls = new Array();
            TimeLineValue[Symbol.iterator] = function* () {
                yield*[...this.entries()].sort((a, b) => a[0] - b[0]);
            }
            for (let [key, value] of TimeLineValue) { // get data sorted
                // console.log(key + ' ' + value);
                millis.push(key);
                valls.push(value);
            }

            var newMillis = skmeans(millis, 7);
            console.log(newMillis);
            var idx = newMillis.idxs;
            var centroids = newMillis.centroids;
            for (let c = 0; c < centroids.length; c++) {
                centroids[c] = Math.ceil(centroids[c]);
            }
           var newValsPos=[0,0,0,0,0,0,0];
           var newValsNeg=[0,0,0,0,0,0,0];
            for (let c = 0; c < idx.length; c++) {
                newValsPos[idx[c] - 1] += valls[c].positive;
                newValsNeg[idx[c] - 1] += valls[c].negative;
            }
            var timelineNew={centroids:centroids,positives:newValsPos,negatives:newValsNeg};



            console.log(newMillis);

            res.send({
                'texts': texts,
                'total_score_count': totalscore,
                'total_score_strength': totalscoreStrength,
                'strong_positive_count': strongPositive,
                'strong_positive_strength': strongPositiveStrength,
                'strong_negative_count': strongNegative,
                'strong_negative_strength': strongNegativeStrength,
                'positive_count': positiveScore,
                'positive_strength': positiveScoreStrength,
                'negative_count': negativeScore,
                'negative_strength': negativeScoreStrength,
                'neutral_count': neutralScore,
                'neutral_strength': neutralScoreStrength,
                wordsUsed: Object.fromEntries(wordsUsed),
                'reach': UserIDs.size,
                'retweets': Retweeted,
                'timeline':timelineNew,
                    // 'tweets':tweetTexts
                // 'timesentiment':Object.fromEntries(TimeSentiment)
            });
            var resultScore = {
                totalscore,
                totalscoreStrength,
                strongPositive,
                strongPositiveStrength,
                strongNegative,
                strongNegativeStrength,
                positiveScore,
                positiveScoreStrength,
                negativeScore,
                negativeScoreStrength
            };
            var refreshUrl = data.search_metadata.refresh_url;
            var queryDate = newDateFormatted;
            var queryWords = req.params.q;
            var reach = UserIDs.size;
            var retweets = Retweeted;
            var timeline = Object.fromEntries(TimeLineValue);


            DataBaseOperations.insertQuery(queryWords, queryDate, refreshUrl, resultScore, countFetches, reach, retweets, timeline, (respp) => {


            });
            //now add this query and results to the mongodb

            return;
        });

    });

});
app.get('/ping', (req, res) => {
    res.status(200).send({
        success: 'ok'
    })
})
app.post('/updateKeys',(req,res)=>{
    console.log(req.body);
 DataBaseOperations.insertKeys(req.body ,(result,err)=>{
if(err){
    console.log(err);
    res.status(500).send({error:'DB Error'});
}

     res.send({success:true});
 }) 

});

app.get('/getPreviousQueries', (req, res) => {

    //fetch all queries from db
    DataBaseOperations.fetchAllQueries((result, err) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: err
            });
            return;
        }
        res.status(200).send({
            result: result
        });



    });
    // DataBaseOperations.fetchAllQueries((err,result)=>{
    // console.log('error',err);
    // console.log()
    // })


});


app.get('/getKeys', (req, res) => {

    //fetch all queries from db
    DataBaseOperations.getKeys((result, err) => {
        if (err) {
            console.log(err);
            res.status(500).send({
                error: err
            });
            return;
        }
        res.status(200).send(result);



    });
    // DataBaseOperations.fetchAllQueries((err,result)=>{
    // console.log('error',err);
    // console.log()
    // })


});

app.get('/deleteAll',(req,res)=>{

DataBaseOperations.deleteAllPreviousQueries((result,err)=>{
if(err){
    res.status(500).send({error:err.message});
    return;
}else{
    res.send({success:true});
}


});


});



app.post('/deleteSingle',(req,res)=>{
console.log(req.body.prop._id);
// res.status(500).send({eror:true});
    DataBaseOperations.deleteSinglePreviousQueries({_id:req.body.prop._id},(result,err)=>{
    if(err){
        res.status(500).send({error:err.message});
        return;
    }else{
        res.send({success:true,count:result.deletedCount});
    }
    
    
    });
    
    
    });
    

    
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, './build', 'index.html'));
});
app.listen(port, () => console.log(`Listening on port ${port}`));