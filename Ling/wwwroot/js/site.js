﻿/* Tutorial used to get started with Recorder.js
 * https://addpipe.com/blog/using-recorder-js-to-capture-wav-audio-in-your-html5-web-site/
*/

/* Variables */

// Stream from getUserMedia()
let getUserMediaStream;
// Recorder.js object
let rec;
// MediaStreamAudioSourceNode we will be recording
let input;

// Shim for AudioContext when it's not audio video bridging. Shims allow for backwards compatibility by intercepting API calls and providing a layer of abstraction between a caller and a target.
let AudioContext = window.AudioContext || webkit.AudioContext;
// New audio context that helps us record
let audioContext;

// Grab DOM elements
const $recordButton = $('#recordButton');
const stopButton = document.getElementById("stopButton");

// Attach event listeners
recordButton.addEventListener("click", recordButtonHandler);
stopButton.addEventListener("click", stopRecording);


/* Event handlers */

// Pause, Resume, or Record based on classes on recordButton
function recordButtonHandler() {
    if ($recordButton.hasClass("inProgress")) {
        pauseOrResumeRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    // If there is a recording in the recordingsList, remove it. This way we keep only one recording in the list at a time.
    $('#recordingsList').empty();

    /*
      getUserMedia() is a promise-based method that prompts the user for permission to use a media input, which produces a MediaStream object with a specified list of a/v tracks. In our case, the stream wil have an audio track.
        https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */

    // Set request permissions for only audio
    const constraints = { audio: true, video: false };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        $recordButton.addClass("inProgress");
        toggleEnabledOnRecordButton();
        stopButton.disabled = false;

        console.log("permissions granted!! i'm in the promise!");

        // Assign our getUserMediaStream global variable to the recorded stream for later use
        getUserMediaStream = stream;

        // AudioContext can be created only after some user interaction
        // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
        audioContext = new AudioContext;

        // Use the stream
        input = audioContext.createMediaStreamSource(stream);

        // Create the Recorder object and configure it to record mono channel sound because dual channel will result in double the file size
        rec = new Recorder(input, { numChannels: 1 });

        // Begin recording
        rec.record();

        // Stop recording after 30 sec
        setTimeout(() => {
            stopRecording();
        }, 31000);

        // Set "Record" button text to "Pause"
        $recordButton.html("Pause");

        console.log("recording has started");
    }).catch((err) => {
        // Enable the "Record" button again if the recording fails
        stopButton.disabled = true;
    });
}

// TODO: When styling, the "enabled" class can have an active style... maybe pause icon versus play icon
function toggleEnabledOnRecordButton() {
    if ($recordButton.hasClass("enabled")) {
        $recordButton.removeClass("enabled");
    } else {
        $recordButton.addClass("enabled");
    }
}

// "Pause" or "Resume" a recording
function pauseOrResumeRecording() {
    // Make sure user can stop the recording at any time
    stopButton.disabled = false;
    const maxAudioClipLength = rec.context.currentTime < 200000;

    if (rec.recording && maxAudioClipLength) {
        console.log("pause hit on rec.recording =", rec.recording);
        // Pause
        rec.stop();
        // Change UI text of "Pause" button to "Resume"
        $recordButton.html("Resume");
        toggleEnabledOnRecordButton();
    } else if (maxAudioClipLength) {
        console.log("resume hit on rec.recording =", rec.recording);
        // Resume
        rec.record();
        $recordButton.html("Pause");
        toggleEnabledOnRecordButton();
    } else {
        stopRecording();
    }
}

// "Stop" a recording
function stopRecording() {
    console.log("Stop button clicked");

    // Disable the stop button
    stopButton.disabled = true;

    // Reset "Record" button text when recording is stopped
    $recordButton.html("Record");

    // Remove "inProgress" class to show recording is stopped
    $recordButton.removeClass("inProgress");

    // Get Recorder object to stop recording
    rec.stop();

    // Stop microphone access
    getUserMediaStream.getAudioTracks()[0].stop();

    // Create WAV blob and pass on to createDownloadLink
    rec.exportWAV(createDownloadLink);
}


/* Functions to call after audio has been recorded */

// Cited from Recorder.js tutorial. May be tweaked to our app if necessary.
function createDownloadLink(blob) {

    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');

    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //save to disk link
    link.href = url;
    link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
    link.innerHTML = "Save to disk";

    //add the new audio element to li
    li.appendChild(au);

    //add the filename to the li
    li.appendChild(document.createTextNode(filename + ".wav "))

    //add the save to disk link to li
    li.appendChild(link);

    //upload link
    var upload = document.createElement('a');
    upload.href = "#";
    upload.innerHTML = "Upload";
    upload.addEventListener("click", function (event) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function (e) {
            if (this.readyState === 4) {
                console.log("Server returned: ", e.target.responseText);
            }
        };
        var fd = new FormData();
        fd.append("audio_data", blob, filename);
        xhr.open("POST", "upload.php", true);
        xhr.send(fd);
    })
    li.appendChild(document.createTextNode(" "))//add a space in between
    li.appendChild(upload)//add the upload link to li

    //add the li element to the ol
    recordingsList.appendChild(li);

    uploadToServer(blobUrl);
}

function createDownloadLinkCondensed(blob) {

    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //link the a element to the blob
    link.href = url;
    link.download = new Date().toISOString() + '.wav';
    link.innerHTML = link.download;

    //add the new audio and a elements to the li element
    li.appendChild(au);
    li.appendChild(link);

    //add the li element to the ordered list
    recordingsList.appendChild(li);
}

// Make an AJAX POST request to create a new Recording object in the database
function uploadToServer(blobUrl) {
    e.preventDefault();

    $.ajax({
        url: '/Recording/Create',
        method: 'POST',
        data: {
            FileName: blobUrl,
        }
    });
}
