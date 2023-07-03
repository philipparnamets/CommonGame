

const jsPsych = initJsPsych({
    on_finish: function(){
        window.location = "https://app.prolific.co/submissions/complete?cc=CLTJL3RC"
    },
    show_progress_bar: true
});
var timeline = [];

// capture from Prolific
const subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
const study_id = jsPsych.data.getURLVariable('STUDY_ID');
const session_id = jsPsych.data.getURLVariable('SESSION_ID');

jsPsych.data.addProperties({
    subject_id: subject_id,
    study_id: study_id,
    session_id: session_id
});

// control parameters
n_trials = 48; 
n_players_shown = 6;
durations = {
    "ITI": 1000,
    "display_agents": 1500,
    "display_behavior": 1500,
    "display_payout": 1500,
    "display_select": 1500
}
size_canvas = [440, 550];

// generate initials to show to folks
function generateRandomLetter() {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
      return alphabet[Math.floor(Math.random() * alphabet.length)]
    }

function generatePlayers(n_trials){
    var all_players = [];

    while (all_players.length < n_trials * n_players_shown){
        var letter1 = generateRandomLetter();
        var letter2 = generateRandomLetter();

        all_players.push( letter1+letter2);
        all_players = [... new Set(all_players)];
    }

    return all_players;
}   

var players = generatePlayers(n_trials);
var initials = [];  // needed for display

// generate behaviors to show to folks
/*
strategy here is to generate lists of A and B behaviors - these determine what will be selected for participants
for each set of A and B behaviors, numbers between 1 and 6, balanced - these determine how many of the selected behavior are also shown on that trial
number of selected behavior need to be shuffled independently among A and B to ensure payouts are not systematically biased
add payouts, evenly distributed among A and B behavior. 
then use function to shuffle all three in exactly same way - to generate unique trial sequences
*/
var trial_behavior = Array(n_trials/2).fill(["B"]).flat().concat(Array(n_trials/2).fill(["A"]).flat()); 
var temp_n = Array(Math.ceil(n_trials/n_players_shown/3)).fill([1,2,3,4,5,6]).flat()
var trial_n_behavior = jsPsych.randomization.repeat(temp_n, 1).concat(jsPsych.randomization.repeat(temp_n, 1)).concat(jsPsych.randomization.repeat(temp_n, 1));
var trial_payout = Array(Math.ceil(n_trials/3)).fill(["small", "large", "equal"]).flat();

//function to shuffle the image arrays in a way so multiple arrays shuffled same//
    //the following block of 23 lines of code is copy and pasted from https://stackoverflow.com/questions/18194745/shuffle-multiple-javascript-arrays-in-the-same-way ! //
    function shuffle(array, array2, array3) {
        var counter = array.length, temp, temp2, temp3, index;

         // "While there are elements in the array"
         while (counter > 0) {
            // "Pick a random index"
            //index = Math.floor(Math.random() * counter);
            index = Math.floor(Math.random() * counter);

            // "Decrease counter by 1"
            counter--;

            // "And swap the last element with it"
            temp = array[counter];
            temp2 = array2[counter];
            
            array[counter] = array[index];
            array2[counter] = array2[index];
            
            array[index] = temp;
            array2[index] = temp2;

            if (array3 != 0){
                temp3 = array3[counter];
                array3[counter] = array3[index];
                array3[index] = temp3;
            }
        }
        return array;
    }   

shuffle(trial_behavior, trial_n_behavior, trial_payout);
// console.log(trial_behavior, "\n", trial_n_behavior, "\n", trial_payout)

// payout generation
function generatePayout(sel_pay){
    var out = [];
    out.push(Math.floor(Math.random() * 10) + 1);
    
    if (sel_pay=="equal"){
        out.push(out[0]);
        return out;
    } else {
        out.push(Math.floor(Math.random() * 10) + 1);
        
        while (out[0]==out[1]){  // ensure payoffs are different
            out[1] = Math.floor(Math.random() * 10) + 1;
        }

        out.sort(function(a,b){return b-a});  //descending
        return out;
    }     

}
// console.log(generatePayout("equal"))
// console.log(generatePayout("large"))

// functions draw players and setup
var coordinates = {
    x: [20, 20, 220, 220, 420, 420],
    y: [20, 260],
    w: 100,
    h: 100
}

var selected_behavior; //init
var selected_behavior_pos;
var n_selected;
var selected_payout;
var this_payout;
var behavior_list = [];
var payout_list = [];

function drawChoices(c, initials, behavior_list){
    // draws the box, initials and behaviors
    var ctx = c.getContext('2d');

    ctx.lineWidth = 3;
    for (let i = 0; i <n_players_shown; i++){
        ctx.strokeRect(coordinates.x[i], coordinates.y[i % 2], coordinates.w, coordinates.h);
        ctx.font = "20px sans-serif";
        ctx.fillText(initials[i], coordinates.x[i]+35, coordinates.y[i % 2]+ 50);            
        ctx.font = "44px sans-serif";
        ctx.fillText(behavior_list[i], coordinates.x[i], coordinates.y[i % 2] + coordinates.h + 40); 
    }
}

function drawPayout(c, payout_list){
    // draws the payouts
    var ctx = c.getContext('2d');

    ctx.lineWidth = 3;
    ctx.font = "44px sans-serif bold";
    for (let i = 0; i <n_players_shown; i++){
        ctx.fillText("$" + payout_list[i], coordinates.x[i]+48, coordinates.y[i % 2] + coordinates.h + 40);            
    }
}

function drawChoiceRect(c, i){
    // draws rect around selected behavior [i]
    var ctx = c.getContext('2d');

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#DD0000";
    ctx.strokeRect(coordinates.x[i]-7, coordinates.y[i % 2]- 7, coordinates.w + 35 , coordinates.h + 65)
}

// CONSENT

const provide_consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <div style='width:700px;'> <p> Dear Participant,</p>
        <p> We are happy that you are interested in this project, which is being conducted by a team 
            of researchers at Vrije Universiteit Amsterdam and Karolinska Institutet. We are conducting this study to 
            examine people's perceptions of other's behavior.  </p>
        <p> Before you can start, please read the following information carefully: </p> </div>
        <div style='width:600px;'>
            <ol>
            <li style ='text-align:left;'><span style="font-weight:bold">Eligibility: </span> To participate in the study, you must be between 18-65 years old.</li> <br/>
            <li style ='text-align:left;'> <span style="font-weight:bold"> Risks: </span> There are no anticipated risks associated with your participation in this study.</li> <br/>
            <li style ='text-align:left;'> <span style="font-weight:bold"> Participation: </span>Your involvement in this study is completely voluntary. You can decide to not participate or withdraw participation at any time.
                 There is no penalty for withdrawing.</li><br/>
            <li style ='text-align:left;'> <span style="font-weight:bold"> Confidentiality: </span> All of your responses will be anonymous (we will not ask for, or record, your name or other information that could lead back to you). 
                No names or other identifying information will be associated with this study or your Prolific ID. Neither will your IP address or geolocation be saved at any time.
             </li><br/>
            </ol>
        </div>
        <div style='width:700px;'> <p> We anticipate that your participation will require approximately 18 minutes.  You will receive the compensation indicated on Prolific after completing the study. </p>  
        <p> Responsible researcher is Bj&ouml;rn Lindstr&ouml;m, and can be reached on bjorn.lindstrom@ki.se . </p> </div> `,
    choices: ['Yes, I consent to participate', 'No, I do not consent to participate'],
    data: {
        category: "consent",
    },
    on_finish: function(data){
        if(data.response==1){
            jsPsych.endExperiment(`<p>You did not consent to participate. The session will now finish. Thank you for your time!</p>
            <p><a href="https://app.prolific.co/submissions/complete?cc=CYVR83CY">Click here to return to Prolific and return the study</a>.</p>`);
        }
    }
};

timeline.push(provide_consent);

// INSTRUCTIONS

// let inst_img1 = "img/instruct_img_agent_displayed.jpg";
let inst_img2 = "img/instruct_img_agent_action_displayed.jpg";
let inst_img3 = "img/instruct_img_agent_action_reward_displayed.jpg";
let inst_img4 = "img/instruct_img_agent_selected.jpg";

const instructions_initial = {
    type: jsPsychInstructions,
    pages: [
    `<div style = 'width: 700px;'> <p> Welcome to this study! </p>
        <p> Please make sure that you sit comfortably and will be able to pay your full attention to the given instructions on the next number of pages. It is important that you read each page carefully.</p></div> `,
        `<div style = 'width:700px;'><p>On each trial, we will show you four pictures. Each of them will be presented for a few seconds and will switch automatically. 
            These behaviors come from an earlier experiment in which 288 participants were randomly divided into 40 groups of 6 participants in each group.
             After that, each group took part in one anonymous interaction. 
             In the beginning, each participant was given two dollars. </p>
             <p> In each interaction, each of the four participants had to make a choice between two options:
                 A and B, which provided them with a different economical reward. 
                 <span style="font-weight:bold">The outcome of each individual depended on their own decision and the decision of other members of the group.</span></p>`,
        //`<div style = 'width: 700px;'><p> We will now show you examples of the pictures you will see during each trial. First, you will be presented with the initials of 6 participants:</p> 
         //   <img src=${inst_img1} alt = 'Screenshot from experiment'> </img> </div>`,
        `<div style = 'width: 700px;'><p> 
            First, you will be presented with the initials of 6 participants together with which behavior each participant has chosen between A or B: </p>
            <img src=${inst_img2} alt = 'Screenshot from experiment'> </img></div>`,
        `<div style = 'width: 700px;'><p> 
            In the second picture you will observe the reward they have received for their choice: </p>
            <img src=${inst_img3} alt = 'Screenshot from experiment'> </img></div>`,
        `<div style = 'width: 700px;'><p> 
            Lastly, <span style="font-weight:bold">you will be asked to estimate your perception of the morality of the indicated participant's behavior.</span> In this case, you would estimate the behavior of the participant with the initials LT: </p>
            <img src=${inst_img4} alt = 'Screenshot from experiment'> </img></div>`,
        `<div style = 'width: 700px;'><p> We are interested in how you evaluate the behaviors in these interactions, 
            in the absence of information about the rules of the interaction. 
            This would be similar to real-world situations where there are no clear rules, 
            but you see what other people are doing, and what consequences their decisions have for them.</p>
            <p> As we are interested in your perception there are no correct or incorrect answers.</p> </div>`,
        `<div style='width:700px;'><p> Please answer the questions as quickly as possible.</p>
            <p> You have read all the instructions now. After you click <b>Next</b> the experiment will begin. </p></div> `
    ],
    show_clickable_nav: true,
    data: {
        category: "instructions",
    },
};

timeline.push(instructions_initial);

// MAIN TRIAL LOOP
const trial_main_fix = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size: 48px;">+</p>',
    choices: "NO_KEYS",
    trial_duration: durations.ITI,
    data: {
        category: "misc",
    },
};

/* const trial_main_display = {
    type: jsPsychCanvasKeyboardResponse,
    canvas_size: size_canvas,
    stimulus: function(c){
        initials = players.splice(-n_players_shown, n_players_shown);
        
        // generate behaviors to view
        selected_behavior = trial_behavior.pop();
        n_selected = trial_n_behavior.pop();
        selected_payout = trial_payout.pop();
        this_payout = generatePayout(selected_payout);

        if (selected_behavior == "A"){   
            //behavior_list = ["A" * ]
            behavior_list = Array(n_selected).fill(["A"]).flat().concat(Array(n_players_shown - n_selected).fill(["B"]).flat()); 
        } else {
            behavior_list = Array(n_selected).fill(["B"]).flat().concat(Array(n_players_shown - n_selected).fill(["A"]).flat()); 
        }

        if (selected_payout=="large"){
            payout_list = Array(n_selected).fill([ this_payout[0] ]).flat().concat(Array(n_players_shown - n_selected).fill([ this_payout[1] ]).flat()); 
        } else {
            // reverse payouts to above
            // if equal any of the two works..
            payout_list = Array(n_selected).fill([ this_payout[1] ]).flat().concat(Array(n_players_shown - n_selected).fill([ this_payout[0] ]).flat()); 
        }
        
        shuffle(behavior_list, payout_list, 0);
        
        drawChoices(c, initials, Array(n_trials).fill([" "]).flat());
    },
    choices: "NO_KEYS",
    propmt: "",
    trial_duration: durations.display_agents,
    data: {
        category: "misc",
    },
}; */

const trial_main_behavior = { // show behavior
    type: jsPsychCanvasKeyboardResponse,
    canvas_size: [440, 550],
    stimulus: function(c){

        initials = players.splice(-n_players_shown, n_players_shown);
        
        // generate behaviors to view
        selected_behavior = trial_behavior.pop();
        n_selected = trial_n_behavior.pop();
        selected_payout = trial_payout.pop();
        this_payout = generatePayout(selected_payout);

        if (selected_behavior == "A"){   
            //behavior_list = ["A" * ]
            behavior_list = Array(n_selected).fill(["A"]).flat().concat(Array(n_players_shown - n_selected).fill(["B"]).flat()); 
        } else {
            behavior_list = Array(n_selected).fill(["B"]).flat().concat(Array(n_players_shown - n_selected).fill(["A"]).flat()); 
        }

        if (selected_payout=="large"){
            payout_list = Array(n_selected).fill([ this_payout[0] ]).flat().concat(Array(n_players_shown - n_selected).fill([ this_payout[1] ]).flat()); 
        } else {
            // reverse payouts to above
            // if equal any of the two works..
            payout_list = Array(n_selected).fill([ this_payout[1] ]).flat().concat(Array(n_players_shown - n_selected).fill([ this_payout[0] ]).flat()); 
        }
        
        shuffle(behavior_list, payout_list, 0);

        drawChoices(c, initials, behavior_list);
    },
    choices: "NO_KEYS",
    prompt: "",
    trial_duration: durations.display_behavior,
    data: {
        category: "misc",
    },
};

const trial_main_payout = { // show payoffs as well as behavior
    type: jsPsychCanvasKeyboardResponse,
    canvas_size: [440, 550],
    stimulus: function(c){
        drawChoices(c, initials, behavior_list);
        drawPayout(c, payout_list);            
    },
    choices: "NO_KEYS",
    prompt: "",
    trial_duration: durations.display_payout,
    data: {
        category: "misc",
    },
};

// define helper function
// gets all indexes of some value in array
function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

const trial_main_select = {
    type: jsPsychCanvasKeyboardResponse,
    canvas_size: [440, 550],
    stimulus: function(c){
        var indexes = getAllIndexes(behavior_list, selected_behavior);
        indexes = jsPsych.randomization.repeat(indexes, 1);
        selected_behavior_pos = indexes.pop()  // which behaviour to highlight

        drawChoices(c, initials, behavior_list);
        drawPayout(c, payout_list);
        drawChoiceRect(c, selected_behavior_pos);
    },
    choices: "NO_KEYS",
    prompt: "",
    trial_duration: durations.display_select,
    data: {
        category: "misc",
    },
};

const trial_main_choose = {
    type: jsPsychCanvasSliderResponse,
    canvas_size: [440, 550],
    stimulus: function(c){
        drawChoices(c, initials, behavior_list);
        drawPayout(c, payout_list);
        drawChoiceRect(c, selected_behavior_pos);
    },
    min: 1,
    max: 9,
    step: 1,
    require_movement: true,
    slider_start: 5,
    labels: ['Morally<br>wrong','Morally<br>right'],
    prompt: "<p> How moral do you think the selected behavior is? </p>",
    on_finish: function(data){
        data.behaviors_shown = behavior_list,
        data.selected_behavior = selected_behavior,
        data.selected_behavior_pos = selected_behavior_pos,
        data.payout_list = payout_list,
        data.payout_condition = selected_payout,
        data.payout_large = this_payout[0],
        data.payout_small = this_payout[1]
    },
    data: {
        category: "choice",
    },
};

var procedure_main = {
    timeline: [trial_main_fix, trial_main_behavior,
     trial_main_payout, trial_main_select, trial_main_choose],
    repetitions: n_trials
};
timeline.push(procedure_main);

// extra questions at the end


const extra_Q_common = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "<div style='width:700px;'><p> In general, do you think the more <span style='font-weight:bold'> common </span> the behavior is the more moral such behavior becomes? </p></div>",
    choices: ['No', 'Yes'],
    data: {
        category: "extra_common_Q"
    }
};
timeline.push(extra_Q_common);

const extra_Q_reward = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "<div style='width:700px;'><p> In general, do you think the more <span style='font-weight:bold'> rewarding </span> the behavior is the more moral such behavior becomes? </p></div>",
    choices: ['No', 'Yes'],
    data: {
        category: "extra_reward_Q"
    }
};
timeline.push(extra_Q_reward);

let likert_scale = [
    "Strongly Disagree", 
    "Disagree", 
    "Neutral", 
    "Agree", 
    "Strongly Agree"
  ];

const moral_ID_scale = {
    type: jsPsychSurveyLikert,
    preamble: "<div style='width:700px;'><p> Please rate your level of agreement or disagreement with each of the statements below. </p></div>", 
    questions: [
        {prompt: "It would make me feel good to be a person who treats others fairly.", name: 'moralid_q1', labels: likert_scale, required: true},
        {prompt: "Being someone who treats others fairly is an important part of who I am.", name: 'moralid_q2', labels: likert_scale, required: true},
        {prompt: "A big part of my emotional well-being is tied up in being fair.", name: 'moralid_q3', labels: likert_scale, required: true},
        {prompt: "I would be ashamed to be a person who is fair.", name: 'moralid_q4', labels: likert_scale, required: true},
        {prompt: "Being fair is not really important to me.", name: 'moralid_q5', labels: likert_scale, required: true},
        {prompt: "Being fair is an important part of my sense of self.", name: 'moralid_q6', labels: likert_scale, required: true},
      ],
    data: {
        category: "extra_moralID"
    }
};
timeline.push(moral_ID_scale);

const conformity_scale = {
    type: jsPsychSurveyLikert,
    preamble: `<div style='width:700px;'><p> Please use the following scale to indicate the degree of your agreement or disagreement with each of the statements below. </p>  <p> Try to describe yourself accurately and generally (that is, the way you are actually in most situations - not the way you would hope to be). </p></div>`, 
    questions: [
        {prompt: "I often rely on, and act upon, the advice of others.", name: 'conf_q01', labels: likert_scale, required: true},
        {prompt: "I would like to be the last one to change my opinion in a heated argument on a controversial topic.", name: 'conf_q02', labels: likert_scale, required: true},
        {prompt: "Generally, I'd rather give in and go along for the sake of peace than struggle to have my way.", name: 'conf_q03', labels: likert_scale, required: true},
        {prompt: "I tend to follow family tradition in making political decisions.", name: 'conf_q04', labels: likert_scale, required: true},
        {prompt: "Basically, my friends are the ones who decide what we do together.", name: 'conf_q05', labels: likert_scale, required: true},
        {prompt: "A charismatic and eloquent speaker can easily influence and change my ideas.", name: 'conf_q06', labels: likert_scale, required: true},
        {prompt: "I am more independent than conforming in my ways.", name: 'conf_q07', labels: likert_scale, required: true},
        {prompt: "If someone is very persuasive, I tend to change my opinion and go along with them.", name: 'conf_q08', labels: likert_scale, required: true},
        {prompt: "I don't give in to others easily.", name: 'conf_q09', labels: likert_scale, required: true},
        {prompt: "I tend to rely on others when I have to make an important decision quickly.", name: 'conf_q10', labels: likert_scale, required: true},
        {prompt: "I prefer to make my own way in life rather than find a group I can follow.", name: 'conf_q11', labels: likert_scale, required: true},
      ],
    data: {
        category: "extra_conformity"
    }
};
timeline.push(conformity_scale);

const social_influence_scale = {
    type: jsPsychSurveyLikert,
    preamble: `<div style='width:700px;'><p>In daily life you experience many situations in which your behaviors affect others, and others behaviors affect you.
     Please indicate how the following  items describe the kinds of situations you <span style='font-weight:bold'> most frequently experience.</span>
     This can be situations you experience at work, with friends, or family. </p>
     <p>Please use the following scale to indicate the degree of your agreement or disagreement with each of the statements below. </p> 
     <p> I<span style='font-weight:bold'> most frequently experience situations</span> in which...  </p></div>`, 
    questions: [
        {prompt: "How each person behaves in <span style='font-weight:bold'>that situation</span> will have consequences for future outcomes.", name: 'sis_q01', labels: likert_scale, required: true},
        {prompt: "What each person does in that situation affects the other.", name: 'sis_q02', labels: likert_scale, required: true},
        {prompt: "Each person can both obtain their preferred outcomes.", name: 'sis_q03', labels: likert_scale, required: true},
        {prompt: "Future interactions are not affected by the outcomes of the situation.", name: 'sis_q04', labels: likert_scale, required: true},
        {prompt: "Whatever each person does in the situation, each persons' actions will not affect the other's outcomes.", name: 'sis_q05', labels: likert_scale, required: true},
        {prompt: "Each person knows what the other wants.", name: 'sis_q06', labels: likert_scale, required: true},
        {prompt: "Each persons' preferred outcomes in the situation are conflicting.", name: 'sis_q07', labels: likert_scale, required: true},
        {prompt: "I don't think the other(s) know what I want.", name: 'sis_q08', labels: likert_scale, required: true}
      ],
    data: {
        category: "extra_sis"
    }
};
timeline.push(social_influence_scale);

let likert_scale_myother = [
    "Definitely the other", 
    "Maybe the other", 
    "Neutral", 
    "Maybe myself", 
    "Definitely myself"
  ];
const social_influence_scale2 = {
    type: jsPsychSurveyLikert,
    preamble: `<div style='width:700px;'><p> Please indicate how the following  items describe the kinds of situations you <span style='font-weight:bold'> most frequently experience.</span></p>
    <p> Please indicate how the statement describes yourself and "the other(s)" in the kinds of situations you most frequently experience.  </p>
     <p> In each item "the other" refers to the person(s) in the situations you experience. </p> 
     <p> In <span style='font-weight:bold'> your most frequently experience situations... </span></p></div>`, 
    questions: [
        {prompt: "Who do you feel has more power to determine their own outcomes in these situations?", name: 'sis_q09', labels: likert_scale_myother, required: true},
        {prompt: "Who has the least amount of influence on the outcomes of these situations?", name: 'sis_q10', labels: likert_scale_myother, required: true}
      ],
    data: {
        category: "extra_sis"
    }
};
timeline.push(social_influence_scale2);


jsPsych.run(timeline);