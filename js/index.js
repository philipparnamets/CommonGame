<script src="jspsych/jspsych.js"></script>
<script src="jspsych/plugin-html-keyboard-response.js"></script>
<script src="jspsych/plugin-html-button-response.js"></script>
<script src="jspsych/plugin-canvas-keyboard-response.js"></script>
<script src="jspsych/plugin-canvas-slider-response.js"></script>
<script src="jspsych/plugin-instructions.js"></script>
<link href="jspsych/jspsych.css" rel="stylesheet" type="text/css" />

const jsPsych = initJsPsych({
    on_finish: function(){
        jsPsych.data.displayData();
    },
    show_progress_bar: true
});
var timeline = [];

// control parameters
n_trials = 12; 
n_players_shown = 6;
durations = {
    "ITI": 1000,
    "display_agents": 2000,
    "display_behavior": 2000,
    "display_payout": 2000,
    "display_select": 2000
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
        ctx.font = "36px sans-serif";
        ctx.fillText(behavior_list[i], coordinates.x[i]+10, coordinates.y[i % 2] + coordinates.h + 40); 
    }
}

function drawPayout(c, payout_list){
    // draws the payouts
    var ctx = c.getContext('2d');

    ctx.lineWidth = 3;
    ctx.font = "36px sans-serif bold";
    for (let i = 0; i <n_players_shown; i++){
        ctx.fillText("$" + payout_list[i], coordinates.x[i]+50, coordinates.y[i % 2] + coordinates.h + 40);            
    }
}

function drawChoiceRect(c, i){
    // draws rect around selected behavior [i]
    var ctx = c.getContext('2d');

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#DD0000";
    ctx.strokeRect(coordinates.x[i]-7, coordinates.y[i % 2]- 7, coordinates.w + 13 , coordinates.h + 55)
}

// CONSENT

const provide_consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <div style='width:700px;'> <p> Dear Participant,</p>
        <p> We are happy that you are interest in this project, which is being conducted by a team 
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
                 Only the researchers involved in this study and those responsible for research oversight will have access to the information you provide. </li><br/>
            </ol>
        </div>
        <div style='width:700px;'> <p> We anticipate that your participation will require approximately 12 minutes. 
            In return for participating, we will pay you £2.00 in your Prolific account. You will receive the compensation after completing the study. </p> </div> `,
    choices: ['Yes, I consent to participate', 'No, I do not consent to participate'],
    data: {
        category: "consent",
    },
    on_finish: function(data){
        if(data.response==1){
            jsPsych.endExperiment('<p>You did not consent to participate. The session will now finish. Thank you for your time!</p>');
        }
    }
};

timeline.push(provide_consent);

// INSTRUCTIONS

let inst_img1 = "img/instruct_img_agent_displayed.jpg";
let inst_img2 = "img/instruct_img_agent_action_displayed.jpg";
let inst_img3 = "img/instruct_img_agent_action_reward_displayed.jpg";
let inst_img4 = "img/instruct_img_agent_selected.jpg";

const instructions_initial = {
    type: jsPsychInstructions,
    pages: [
    `<div style = 'width: 700px;'> <p> Welcome to this study! </p>
        <p> Please make sure that you sit comfortably and will be able to pay your full attention to the given instructions on the next number of pages. It is important that you read each page carefully.</p></div> `,
        `<div style = 'width:700px;'><p>On each trial, we will show you four pictures. Each of them will be presented for a few seconds and will switch automatically. 
            These behaviors come from an earlier experiment in which 240 participants were randomly divided into 40 groups of 6 participants in each group.
             After that, each group took part in one anonymous interaction. 
             In the beginning, each participant was given two dollars. </p>
             <p> In each interaction, each of the four participants had to make a choice between two options:
                 A and B, which provided them a different economical reward. 
                 The outcome of each individual depended on their own decision and the decision of other members of the group.</p>`,
        `<div style = 'width: 700px;'><p> We will now show you examples of the pictures you will see during each trial. First, you will be presented with the initials of 6 participants:</p> 
            <img src=${inst_img1} alt = 'Screenshot from experiment'> </img> </div>`,
        `<div style = 'width: 700px;'><p> 
            Then you will see which behavior each participant has chosen between A or B: </p>
            <img src=${inst_img2} alt = 'Screenshot from experiment'> </img></div>`,
        `<div style = 'width: 700px;'><p> 
            In the third picture you will observe the reward they have received for their choice: </p>
            <img src=${inst_img3} alt = 'Screenshot from experiment'> </img></div>`,
        `<div style = 'width: 700px;'><p> 
            Lastly, you will be asked to estimate your perception of the morality of the indicated participant's behavior. In this case, you would estimate the behavior of the participant with the initials LT: </p>
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

const trial_main_display = {
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
};

const trial_main_behavior = { // show behavior
    type: jsPsychCanvasKeyboardResponse,
    canvas_size: [440, 550],
    stimulus: function(c){
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
        data.payout_list = payout_list
    },
    data: {
        category: "choice",
    },
};

var procedure_main = {
    timeline: [trial_main_fix, trial_main_display, trial_main_behavior,
     trial_main_payout, trial_main_select, trial_main_choose],
    repetitions: n_trials
};
timeline.push(procedure_main);

// extra questions at the end

//In general, do you think the more common the behavior is the more moral such behavior becomes?”, and “Do you think the more rewarding the behavior is the more moral such behavior becomes?”

jsPsych.run(timeline);