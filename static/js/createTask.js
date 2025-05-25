/* This file hosts different functions used to create the structure of your task.
These functions will ultimately call createTrial(), which actually pushes the trial
object to the timeline; additionally, they also set different parameters needed for
your trials. You can also push other trial objects to the timeline for introducing
a new block, or displaying how many points were earned. */

/*If you are importing a CSV, make sure this function takes an argument and returns
the updated timeline object. The argument is needed for promise chaining, and
the return statement is needed for the next then statement in your promise chain
when you run jsPsych.init.*/

const createPhase = function(csv) { // create a phase (e.g. training phase) of your task
  csv = csv.data;
  let seqs = {}; // convert 2D array into object
  seqs.allStims = csv[0];   // sequence of all stimuli across blocks
  seqs.corKey = csv[1];     // sequence of all correct key responses across blocks
  seqs.setSizes = csv[2];    // sequence of all set sizes across blocks
  seqs.allBlocks = csv[3];   // sequence of all block numbers across blocks
  seqs.imgFolders = csv[4]; // sequence of all image folders across blocks
  csv = [];

// =================================================================================
//                              PRACTICE SECTION
// =================================================================================


if (IS_RUN_PRACTICE) { // for debugging purposes
  createInstructions1();
  createPracticeBlock(1,seqs);
  createInstructions2();
  createPractice2(2,seqs); // second practice block
  createInstructions3();
}


// =================================================================================
//                              ACTUAL TASK SECTION
// =================================================================================

if (IS_RUN_TRAIN) { // for debugging purposes
  for (b = 3; b < NUM_BLOCKS + 1; b++) { // to index starting at 1
    createRevBlock(b,seqs); // create each block based on condition, set size, and stim image set
  }
}
  /*This trial comes after the end of the last block, and serves as buffer to
  give the server time to save the final data file. At the end of the predetermined time,
  e.g. 5 seconds, you can call a callback function to then mail off the data.*/
  timeline.push({
    on_start: trial => {
      let toSave = jsPsych.data.get(); // retrieve all data to save
      save_data_csv(file_name,toSave); // save final file as csv
    },
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<div class='center'><p>Saving data... please do not close this window. This will take a few seconds. </p></div>",
    choices: "NO_KEYS",
    trial_duration: 5000, // change this depending on how large your file is
    // on_finish: function() {
    //     jsPsych.data.displayData('csv');
    on_finish: data => {
      mail_data_csv(file_name); // mail the data file you just saved
    }
  });

  /*This trial comes at the very end, where you direct your participant back to
  Sona, or the next part of the experiment. Make sure your redirect link has
  "id=${subjID}" appended at the very end.*/
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class='center'><p>Data saved. Click <a href='${END_LINK}?id=${subjID}'>here</a> to proceed to the next task.</p></div>`,
    choices: "NO_KEYS",
  });

  return timeline;
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                    MAIN EXPERIMENTAL BLOCKS
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// create blocks with reversals
const createRevBlock = function(b,seqs) {
  // get folders, setsize, number of trials for this block
  let bStart = seqs.allBlocks.indexOf(b); // returns first trial of block b
  let setSize = seqs.setSizes[bStart];
  let folder = seqs.imgFolders[bStart];
  let numTrials = seqs.allBlocks.lastIndexOf(b)-bStart+1;

  // get reversal related variables
  let correct_counter_vec = [0,0];
  let reversal_pt_vec = [Math.floor(Math.random()*3)+2,Math.floor(Math.random()*3)+2];
  let correct_response_vec = [Math.floor(Math.random()*3),Math.floor(Math.random()*3)];
  while (correct_counter_vec.length < setSize){
    correct_counter_vec.push(0);
    reversal_pt_vec.push(Math.floor(Math.random()*3)+2);
    correct_response_vec.push(Math.floor(Math.random()*3));
  }

  // a helper function that adds all the image stimuli for this block. this allows the image files
  // to be dynamically created at the start of each block, so the images will be different to each block according to the image folder.
  const setStim = function(trial) {
    let stim = `<div class='exp'><p>Block ${b-2} of 21. <br><br> Take some time to identify the images below:</p><table class='center'>`;
    for (s=1; s < setSize+1; s++) {
      if (s%3 == 1) stim += '<tr>'
      stim += `<td><img class="disp" src="${imgP}images${folder}/image${s}.jpg"></td>`;
      if (s%3 == 0) stim += '</tr>'
    }
    trial.stimulus = `${stim}</table></div>`+CONTINUE;
    return trial;

  // push the instructions showing all block images to timeline before trials
  }
  timeline.push({
    stimulus: "",
    on_start: setStim,
    type: jsPsychHtmlKeyboardResponse,
    choices: [' '],
    // you may want to make this timed so participants can't stay on this trial forever
  });

  //  create trials, interleaving them with fixation
  for (t = 0; t < numTrials; t++) {
    timeline.push(fixation);
    let stim = seqs.allStims[bStart+t];
    //let cor = seqs.corKey[bStart+t];
    createRevTrial(b,t,folder,stim,bStart,correct_counter_vec,reversal_pt_vec,correct_response_vec);
  }

  /*A helper function that updates points earned for that block. It also saves all of the
  data if it's the last block, or data for just that block if it's not the last block.*/
  const setPoints = function(trial) {

    let toSave = jsPsych.data.get().filter({block: b}); // retrieve block data to save
    let blockFileName = `${file_name}_block_${b}`; // create new file name for block data
    save_data_csv(blockFileName, toSave); // save block data

    let pts = jsPsych.data.get().filter({block: b, correct: true}).count(); // calculate points
    // console.log(pts);
    trial.stimulus = `<div class="center"><p>End of block - you earned ${pts} points!</p>\
    <br><p>You have a 1 minute break before the next block begins, but you can press space to continue now.</p></div>`;
  }
  // push block end points and instructions
  timeline.push({
    stimulus: "",
    on_start: setPoints,
    type: jsPsychHtmlKeyboardResponse,
    choices: [' '],
    trial_duration: 60000,
  });
}

const createRevTrial = function (b, t, folder, stim, bStart,
                                 correct_counter_vec, reversal_pt_vec, correct_response_vec) {

  const istim = stim - 1;                       // 当前图片在 set 中的索引
  const cor   = correct_response_vec[istim];    // 目前这张图的正确键 (0 / 1 / 2)

  /** 反馈结束后更新计数器、产生反转、写数据 */
  const finishTrial = data => {
    data.key_press  = KEYS.indexOf(data.key_press);
    data.key_answer = cor;
    data.stimulus   = stim;

    if (data.key_press === cor) {
      correct_counter_vec[istim] += 1;
    } else {
      correct_counter_vec[istim]  = 0;
    }

    if (correct_counter_vec[istim] >= reversal_pt_vec[istim]) {
      correct_counter_vec[istim] = 0;
      reversal_pt_vec[istim]     = Math.floor(Math.random() * 3) + 2;

      const opts = [0, 1, 2].filter(x => x !== correct_response_vec[istim]);
      correct_response_vec[istim] = opts[Math.floor(Math.random() * opts.length)];
    }

    data.reversal_crit = reversal_pt_vec[istim];
    data.counter       = correct_counter_vec[istim];
    return data;
  };

  timeline.push({
    type: jsPsychCategorizeHtml,
    stimulus: () =>
        `<div class="exp"><img class="stim center"
             src="${imgP}images${folder}/image${stim}.jpg"></div>`,

    key_answer: KEYS[cor],
    choices:     KEYS,
    correct_text:   COR_FB,
    incorrect_text: INCOR_FB,
    timeout_message: TO_MSG,

    trial_duration:    TRIAL_DUR,
    feedback_duration: FB_DUR,
    show_feedback_on_timeout: true,
    show_stim_with_feedback: false,
    on_finish: finishTrial,

    data: { set: folder, block: b, trial: t + 1 }
  });
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                    SECOND PRACTICE BLOCK
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


// second practice w reversal that exits after they get two reversals
const createPractice2 = function(b,seqs) {
  // get folders, setsize, number of trials for this block
  let bStart = seqs.allBlocks.indexOf(b); // returns first trial of block b
  let setSize = seqs.setSizes[bStart];
  let folder = seqs.imgFolders[bStart];
  let numTrials = seqs.allBlocks.lastIndexOf(b)-bStart+1;

  // get reversal related variables
  let correct_counter_vec = [0];
  let reversal_pt_vec = [5];
  let correct_response_vec = [Math.floor(Math.random()*3)];
  let revcounter = [0];

  // a helper function that adds all the image stimuli for this block. this allows the image files
  // to be dynamically created at the start of each block, so the images will be different to each block according to the image folder.
  const setStim = function(trial) {
    let stim = "<div class='exp'><p>Take some time to identify the image below:</p><table class='center'>";
    for (s=1; s < setSize+1; s++) {
      if (s%3 == 1) stim += '<tr>'
      stim += `<td><img class="disp" src="${imgP}images${folder}/image${s}.jpg"></td>`;
      if (s%3 == 0) stim += '</tr>'
    }
    trial.stimulus = `${stim}</table></div>`+CONTINUE;
    return trial;

  // push the instructions showing all block images to timeline before trials
  }
  timeline.push({
    stimulus: "",
    on_start: setStim,
    type: jsPsychHtmlKeyboardResponse,
    choices: [' '],
    // you may want to make this timed so participants can't stay on this trial forever
  });

  //  create trials, interleaving them with fixation
  // var kill_practice = 0;

  for (t = 0; t < Math.floor(numTrials/2); t++) {
    // console.log("kill practice?")
    // console.log(kill_practice)
    // if (kill_practice == 0) {
      timeline.push(fixation);
      let stim = seqs.allStims[bStart+t];
      createPracticeRevTrial(b,t,folder,stim,bStart,correct_counter_vec,reversal_pt_vec,correct_response_vec,revcounter);
  }

  //intermediate feedback for trials
  const intermedFed = function(trial) {
    let nrevs = jsPsych.data.get().last().values()[0].nrevs[0]; // calculate points
    console.log(`n revs: ${nrevs}`);
    if (nrevs>=2) {
        trial.stimulus = `<div class="center"><p>It looks like you understand the task!</p>\
      <br><p>Here is one last practice round.</p></div>`;
    } else {
      trial.stimulus = `<div class="center"><p>Remember that there is always ONE correct answer per image.</p>\
      <br><p>This correct answer will change once in a while! Here is one last practice round. </p></div>`;
    }
  }
  timeline.push({
    stimulus: "",
    on_start: intermedFed,
    type: jsPsychHtmlKeyboardResponse,
    choices: [' '],
    trial_duration: 30000,
  });

  // get reversal related variables
  correct_counter_vec = [0];
  reversal_pt_vec = [5];
  correct_response_vec = [Math.floor(Math.random()*2)];
  revcounter = [0];

  for (t = Math.floor(numTrials/2)+1; t < numTrials; t++) {
    timeline.push(fixation);
    let stim = seqs.allStims[bStart+t]+2;
    // console.log(correct_response_vec[0]);
    createPracticeRevTrial1(b,t,folder,stim,bStart,correct_counter_vec,reversal_pt_vec,correct_response_vec,revcounter);
  }
}

const createPracticeRevTrial = function (b, t, folder, stim, bStart,
                                         correct_counter_vec, reversal_pt_vec,
                                         correct_response_vec, revcounter) {

  const cor = correct_response_vec[0];

  const finishTrial = data => {
    data.key_press  = KEYS.indexOf(data.key_press);
    data.key_answer = cor;
    data.stimulus   = stim;
    data.nrevs      = revcounter;

    if (data.key_press === cor) {
      correct_counter_vec[0] += 1;
    } else {
      correct_counter_vec[0]  = 0;
    }

    if (correct_counter_vec[0] >= reversal_pt_vec[0]) {
      correct_counter_vec[0] = 0;
      reversal_pt_vec[0]     = Math.floor(Math.random() * 3) + 3;
      const opts = [0, 1, 2].filter(x => x !== correct_response_vec[0]);
      correct_response_vec[0] = opts[Math.floor(Math.random() * opts.length)];
      revcounter[0]          += 1;
    }

    data.reversal_crit = reversal_pt_vec[0];
    data.counter       = correct_counter_vec[0];
    return data;
  };

  timeline.push({
    type: jsPsychCategorizeHtml,
    stimulus: () =>
        `<div class="exp"><img class="stim center"
             src="${imgP}images${folder}/image${stim}.jpg"></div>`,

    key_answer: KEYS[cor],
    choices:     KEYS,
    correct_text:   PRAC_COR_FB,
    incorrect_text: PRAC_INCOR_FB,
    timeout_message: TO_MSG,

    trial_duration:    TRIAL_DUR,
    feedback_duration: FB_DUR,
    show_feedback_on_timeout: true,
    show_stim_with_feedback: false,
    on_finish: finishTrial,

    data: { set: folder, block: b, trial: t + 1 }
  });
};

const createPracticeRevTrial1 = function (b, t, folder, stim, bStart,
                                          correct_counter_vec, reversal_pt_vec,
                                          correct_response_vec, revcounter) {

  const cor = correct_response_vec[0];

  const finishTrial = data => {
    data.key_press  = KEYS.indexOf(data.key_press);
    data.key_answer = cor;
    data.stimulus   = stim;
    data.nrevs      = revcounter;

    if (data.key_press === cor) {
      correct_counter_vec[0] += 1;
    } else {
      correct_counter_vec[0]  = 0;
    }

    if (correct_counter_vec[0] >= reversal_pt_vec[0]) {
      correct_counter_vec[0] = 0;
      reversal_pt_vec[0]     = Math.floor(Math.random() * 3) + 3;
      const opts = [0, 1, 2].filter(x => x !== correct_response_vec[0]);
      correct_response_vec[0] = opts[Math.floor(Math.random() * opts.length)];
      revcounter[0]          += 1;
    }

    data.reversal_crit = reversal_pt_vec[0];
    data.counter       = correct_counter_vec[0];
    return data;
  };

  timeline.push({
    type: jsPsychCategorizeHtml,
    stimulus: () =>
        `<div class="exp"><img class="stim center"
             src="${imgP}images${folder}/image${stim}.jpg"></div>`,

    key_answer: KEYS[cor],
    choices:     KEYS,
    correct_text:   COR_FB,
    incorrect_text: INCOR_FB,
    timeout_message: TO_MSG,

    trial_duration:    TRIAL_DUR,
    feedback_duration: FB_DUR,
    show_feedback_on_timeout: true,
    show_stim_with_feedback: false,
    on_finish: finishTrial,

    data: { set: folder, block: b, trial: t + 1 }
  });
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                            FIRST PRACTICE BLOCK
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const createPracticeTrial = function (b, t, folder, stim, cor) {
  timeline.push({
    type: jsPsychCategorizeHtml,
    stimulus: `<div class="exp"><img class="stim center"
             src="${imgP}images${folder}/image${stim}.jpg"></div>`,
    key_answer: KEYS[cor],
    choices:     KEYS,
    correct_text:   PRAC_COR_FB,
    incorrect_text: PRAC_INCOR_FB,
    timeout_message: TO_MSG,

    trial_duration:    TRIAL_DUR,
    feedback_duration: FB_DUR,
    show_feedback_on_timeout: true,
    show_stim_with_feedback: false,
    on_finish: data => {
      data.key_press  = KEYS.indexOf(data.key_press);
      data.key_answer = cor;
      data.stimulus   = stim;
      return data;
    },

    data: { set: folder, block: b, trial: t + 1 }
  });
};


const createPracticeTrial1 = function (b, t, folder, stim, cor) {

  timeline.push({
    type: jsPsychCategorizeHtml,
    stimulus: () =>
        `<div class="exp"><img class="stim center"
             src="${imgP}images${folder}/image${stim}.jpg"></div>`,

    key_answer: KEYS[cor],
    choices:     KEYS,
    correct_text:   COR_FB,
    incorrect_text: INCOR_FB,
    timeout_message: TO_MSG,

    trial_duration:    TRIAL_DUR,
    feedback_duration: FB_DUR,
    show_feedback_on_timeout: true,
    show_stim_with_feedback: false,
    on_finish: data => {
      data.key_press  = KEYS.indexOf(data.key_press);
      data.key_answer = cor;
      data.stimulus   = stim;
      return data;
    },

    data: { set: folder, block: b, trial: t + 1 }
  });
};


const createPracticeBlock = function(b,seqs) {
  // get folders, setsize, number of trials for this block
  let bStart = seqs.allBlocks.indexOf(b);
  let setSize = seqs.setSizes[bStart];
  let folder = seqs.imgFolders[bStart];
  let numTrials = seqs.allBlocks.lastIndexOf(b)-bStart+1;

  // a helper function that adds all the image stimuli for this block. this allows the image files
  // to be dynamically created at the start of each block, so the images will be different to each block according to the image folder.
  const setStim = function(trial) {
    let stim = "<div class='exp'><p>Take some time to identify the images below:</p><table class='center'>";
    for (s=1; s < setSize+1; s++) {
      if (s%3 == 1) stim += '<tr>'
      stim += `<td><img class="disp" src="${imgP}images${folder}/image${s}.jpg"></td>`;
      if (s%3 == 0) stim += '</tr>'
    }
    trial.stimulus = `${stim}</table></div>`+CONTINUE;
    return trial;

  // push the instructions showing all block images to timeline before trials
  }
  timeline.push({
    stimulus: "",
    on_start: setStim,
    type: jsPsychHtmlKeyboardResponse,
    choices: [' '],
    // you may want to make this timed so participants can't stay on this trial forever
  });

  //  create trials, interleaving them with fixation
  for (t = 0; t < Math.floor(numTrials/2); t++) {
    timeline.push(fixation);
    let stim = seqs.allStims[bStart+t];
    let cor = seqs.corKey[bStart+t];
    createPracticeTrial(b,t,folder,stim,cor,bStart);
  }

  //intermediate feedback for trials
  const intermedFed = function(trial) {
    let pts = jsPsych.data.get().last(10).filter({block: b, correct: true}).count(); // calculate points
    console.log(`points: ${pts}`);
    if (pts>=8) {
        trial.stimulus = `<div class="center"><p>Looks like you have a hang of it!</p>\
      <br><p>Here is another practice round.</p></div>`;
    } else {
      trial.stimulus = `<div class="center"><p>Remember that every image has ONE correct key.</p>\
      <br><p>Try out all the keys to find the correct one! Here is another practice round. </p></div>`;
    }
  }

  timeline.push({
    on_start: intermedFed,
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "",
    choices: [' '],
    trial_duration: 30000,
  });

  for (t = Math.floor(numTrials/2)+1; t < numTrials; t++) {
    timeline.push(fixation);
    let stim = seqs.allStims[bStart+t]+2;
    let cor = seqs.corKey[bStart+t];
    createPracticeTrial1(b,t,folder,stim,cor,bStart);
  }
}
