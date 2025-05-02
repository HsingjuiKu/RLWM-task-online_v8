# RLWM Task Code – Online Version (jsPsych v8)

This repository contains the online implementation of the RLWM (Reinforcement Learning and Working Memory) task, built using [jsPsych v8.2.1](https://www.jspsych.org/8.2/). The experiment code is modular and supports randomized trial generation, instruction flow, dynamic reversal logic, and real-time feedback.

---

## 🔧 Getting Started

- Customize key configuration values in `initVars.js`, such as `KEYS`, `TRIAL_DUR`, `FB_DUR`, and feedback messages.
- All trial parameters (stimulus, correct response, etc.) are loaded dynamically from a CSV file (e.g., `sequence0.csv`) using `Papa.parsePromise`.
- Edit the `imgP` variable to ensure image paths resolve correctly.

---

## ✅ Key Features & Updates

### ✅ Upgrade to jsPsych v8.2.1
- Updated all core plugins:
  - `html-keyboard-response`
  - `categorize-html`
  - `image-keyboard-response`
  - `preload`
- All trials follow jsPsych v8 syntax.

### ✅ Instruction Management
- `createInstructions1()`: Introduces the basic task structure and key-mapping (J/K/L).
- `createInstructions2()`: Explains reversal logic introduced in the second practice block.
- `createInstructions3()`: Prepares participants for the full task (21 blocks).

### ✅ Reversal Learning Implementation
- For each stimulus, the correct response can change after a participant reaches a randomized criterion (e.g., 2–4 consecutive correct answers).
- Reversals are managed using `correct_counter_vec`, `reversal_pt_vec`, and `correct_response_vec`.

### ✅ Practice Blocks
- Two levels of practice:
  - **Block 1**: Static stimulus–response mapping.
  - **Block 2**: Introduces dynamic reversals and evaluates participant understanding.

### ✅ Task Flow and Data Handling
- `createRevBlock()` constructs main task blocks, with optional block-by-block feedback and data saving.
- End-of-block trial displays earned points and triggers data saving using `save_data_csv()`.
- Final trial saves all data and redirects the participant using `END_LINK`.

### ✅ Tab-Switch Monitoring
- The script tracks tab visibility changes and alerts the participant upon switching.
- If the participant leaves the page more than 3 times, the experiment ends with a termination message.

### ✅ Dynamic ID & Logging
- Subject ID is extracted from the URL (`?id=...`); if absent, it defaults to a pseudorandom fallback.
- File names include `subjID`, date, and start time for traceability.

---

## ⚠ Known Issues / Debugging Tips

- **Plugin Errors** (e.g., “must specify 'stimulus'” or “'key_answer'”):
  - Ensure `on_start` properly sets `trial.stimulus` and `trial.key_answer`.
  - Check that `KEYS[cor]` is always valid and not undefined.
- **Spacebar not advancing:** Make sure `choices: [' ']` is correctly assigned and no blocking overlay is covering the interface.
- **Slow image loading:** Confirm correct image path and preload all necessary images using `IMGS`.
- **Timeout issues:** Consider increasing `TRIAL_DUR` in `initVars.js` if participants frequently see “You took too long to respond!”

---

## 📎 References

- jsPsych: https://www.jspsych.org
- PapaParse: https://www.papaparse.com
