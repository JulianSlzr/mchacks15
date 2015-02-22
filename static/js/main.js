(function($) {
	$(document).ready(function() {

		// ==== RENDER THE BPM SELECTOR ====

    	var spinner = $( "#bpm" ).spinner();

		// ==== RENDER THE STAFF OBJECT ====

		var canvas = $("#staff")[0];
		var renderer = new Vex.Flow.Renderer(canvas,
		Vex.Flow.Renderer.Backends.CANVAS);

		var ctx = renderer.getContext();
		var stave = new Vex.Flow.Stave(10, 0, 700);
		stave.addClef("treble").setContext(ctx).draw();


		// ==== FREQUENCY VIEWER ====

		var context;
		var audioBuffer;
	    var sourceNode;
	    var analyser;
	    var javascriptNode;

		function gotStream(stream)
		{
		    // create the audio context (chrome only for now)
		    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    		context = new AudioContext();

		    // get the context from the canvas to draw on
		    var ctx = $("#frequency").get()[0].getContext("2d");

		    // create a gradient for the fill. Note the strange
		    // offset, since the gradient is calculated based on
		    // the canvas, not the specific element we draw
		    var gradient = ctx.createLinearGradient(0,0,0,45);
		    gradient.addColorStop(1,'#f3805c');
		    gradient.addColorStop(0,'#f3805c');

		    // load the sound
		    setupAudioNodes(stream);

		    function setupAudioNodes(stream) {

		        // setup a javascript node
		        javascriptNode = context.createScriptProcessor(2048, 1, 1);
		        // connect to destination, else it isn't called
		        javascriptNode.connect(context.destination);

		        // setup a analyzer
		        analyser = context.createAnalyser();
		        analyser.smoothingTimeConstant = 0.6;
		        analyser.fftSize = 128;

		        // create a source node
		        sourceNode = context.createMediaStreamSource(stream);
		        sourceNode.connect(analyser);
		        analyser.connect(javascriptNode);

		        start_time = new Date().getTime();

		    }

		    // when the javascript node is called
		    // we use information from the analyzer node
		    // to draw the volume
		    javascriptNode.onaudioprocess = function() {

		        // get the average for the first channel
		        var array =  new Uint8Array(analyser.frequencyBinCount);
		        analyser.getByteFrequencyData(array);

		        // clear the current state
		        ctx.clearRect(0, 0, 64, 45);

		        // set the fill style
		        ctx.fillStyle = gradient;
		        drawSpectrum(array);

		    }

		    function drawSpectrum(array) {
		        for (var i = 0; i < 8; i++ ){
		            var value = array[i]/325*20;
		            j = i;
		            if (i == 0 || i == 1)
		            	value = Math.max(0, value - 3);
		            if (i == 2)
		            	value = Math.max(0, value - 1);
		            ctx.fillRect(j*8, 44-value*3, 6, value*3+2);
		        }
		    };
		}
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
		navigator.getUserMedia({audio:true}, gotStream, function() {alert('error')});

		// ==== SET UP WEBSOCKET THINGY ====

		// CHANGE TO RELATIVE URL
		var ws = new WebSocket("ws://127.0.0.1:8000/submit");
		ws.onopen = function () {
		   console.log("Opened connection to websocket");
		};

		ws.onmessage = function(e) {
		   console.log("ayy lmao")
		}

		// ==== SET UP MIC HANDLER ====

		var intervalKey;
		var rec;

		function startRecord() {

			rec = new Recorder(sourceNode);

	        rec.record();
	        ws.send("start");

			// export a wav every second, so we can send it using websockets
			intervalKey = setInterval(function() {
			   rec.exportWAV(function(blob) {
			       rec.clear();
			       // console.log(blob);
			       ws.send(blob);
			   });
			}, 3000);

		}

    	$('i.fa-microphone').click(function() {

    		if ($(this).hasClass('recording')) {
    			console.log('b');
    			rec.stop();
				rec.clear();
				clearInterval(intervalKey);
    		} else {
    			console.log('a')
    			startRecord();
    		}

    		$(this).toggleClass('recording');

			// var notes = [
			//     // A quarter-note C.
			//     new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "q" }),
			//     new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "q" }),
			//     new Vex.Flow.StaveNote({ keys: ["e/4"], duration: "q" }),
			//     new Vex.Flow.StaveNote({ keys: ["f/4"], duration: "q" })
			// ]

			// // Create a voice in 4/4
			//   var voice = new Vex.Flow.Voice({
			//     num_beats: 4,
			//     beat_value: 4,
			//     resolution: Vex.Flow.RESOLUTION
			//   });

			//   // Add notes to voice
			//   voice.addTickables(notes);

			//   // Format and justify the notes to 700 pixels
			//   var formatter = new Vex.Flow.Formatter().
			//     joinVoices([voice]).format([voice], 700);

			// setTimeout(function() {
			// 	// Render voice
  	// 			voice.draw(ctx, stave);

			// }, 4000);

			// pulse_recording = setInterval(function(){
   //              $('i.fa-microphone').css({opacity: 1}, 1000);
   //          }, 2000);
		});
	
	});
})(jQuery);
