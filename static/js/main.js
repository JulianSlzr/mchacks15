(function($) {
	$(document).ready(function() {

		// ==== RENDER THE BPM SELECTOR ====

    	var spinner = $( "#bpm" ).spinner();

		// ==== RENDER THE STAFF OBJECT ====

		var staveCount = 0

		function createNewStave() {

			$(".countdown-row").append('<canvas class="staff" width="700" height="180"></canvas>');
			var canvas = $(".staff")[staveCount];
			var renderer = new Vex.Flow.Renderer(canvas,
			Vex.Flow.Renderer.Backends.CANVAS);

			var ctx = renderer.getContext();
			var bar1_treble;
			var bar1_bass;
			var bar2_treble;
			var bar2_bass;

			// bar 1
			var bar1_treble = new Vex.Flow.Stave(20, 0, 330);
			bar1_treble.addClef("treble");
			bar1_treble.setContext(ctx).draw();

			var bar1_bass = new Vex.Flow.Stave(20, 80, 330);
			bar1_bass.addClef("bass");
			bar1_bass.setContext(ctx).draw();

			var brace = new Vex.Flow.StaveConnector(bar1_treble, bar1_bass);
			brace.setType(Vex.Flow.StaveConnector.type.BRACE);
			brace.setContext(ctx).draw();

			// bar 2 - juxtaposing second bar next to first bar
			var bar2_treble = new Vex.Flow.Stave(bar1_treble.width + bar1_treble.x, bar1_treble.y, 330);
			bar2_treble.setContext(ctx).draw();
			var bar2_bass = new Vex.Flow.Stave(bar1_bass.width + bar1_bass.x, bar1_bass.y, 330);
			bar2_bass.setContext(ctx).draw();

			staveCount++;

		}

		createNewStave()

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

		// // ==== METRONOME CODE ====

    	var ticker;
    	var interval = spinner.value / 60.0;
    	var noteLength = 0.05;
    	// var tempo = 120.0;
    	var tickerCount = 0;

    	function metronome() {
			ticker = setInterval(function() {

				// create an oscillator
		        var osc = context.createOscillator();
		        osc.connect( context.destination );

				if (tickerCount % 4 == 0) {
					$('.beep').css("background-color", "orange");
					osc.frequency.value = 880.0;
				} else {
					$('.beep').css("background-color", "red");
					osc.frequency.value = 440.0;
				}

				setTimeout(function() {
					$('.beep').css("background-color", "black")
				}, 200)

				if (tickerCount < 8) {

			        osc.start( context.currentTime );
			        osc.stop( context.currentTime + noteLength );

			        $('#countdown span').html(8 - tickerCount);
			        $('#countdown span').css("background-color", "rgba(256, 256, 256, 0.7)");

			    } else {

			    	$('#countdown').css("visibility", "hidden");
			    	startRecord();

			    	if (tickerCount >= 16 && tickerCount % 8 == 0) {
			    		console.log("got here")
			    		createNewStave();
			    	}

			    }

		        tickerCount++;

		        // FLASH THINGY

		    }, (60.0 / $("#bpm").val()) * 1000);
    	}

		// ==== SET UP WEBSOCKET THINGY ====

		// CHANGE TO RELATIVE URL
		var ws = new WebSocket("ws://127.0.0.1:8000/submit");
		ws.onopen = function () {
		   console.log("Opened connection to websocket");
		};

		ws.onmessage = function(e) {
		   console.log(e.data);

		}

		// ==== SET UP MIC HANDLER ====

		var intervalKey;
		var rec;

		var hasStarted = false; 

		function startRecord() {

			if (hasStarted)
				return;

			hasStarted = true;

			console.log('a');

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
			}, 1000);

		}


    	$('i.fa-microphone').click(function() {


    		if ($(this).hasClass('recording')) {
    			console.log('b');
    			rec.stop();
				rec.clear();
				clearInterval(ticker);
				clearInterval(intervalKey);
    		} else {
    			metronome();
    		}

    		$(this).toggleClass('recording');

    		var notesTreble = [
			  new Vex.Flow.StaveNote({ keys: ["e/5"], duration: "q" }),
			  new Vex.Flow.StaveNote({ keys: ["d/5"], duration: "h" }),
			  new Vex.Flow.StaveNote({ keys: ["c/5", "e/5", "g/5"], duration: "q" })
			];

			var notesBass = [
			  new Vex.Flow.StaveNote({ keys: ["c/3"], duration: "h", clef: "bass" }),
			  new Vex.Flow.StaveNote({ keys: ["g/3"], duration: "h", clef: "bass" })
			];

			function create_4_4_voice(staff) {
			  return new Vex.Flow.Voice({
			    num_beats: 4,
			    beat_value: 4,
			    resolution: Vex.Flow.RESOLUTION
			  });
			}

			// var voiceTreble = create_4_4_voice().addTickables(notesTreble);
			// var voiceBass = create_4_4_voice().addTickables(notesBass);

			// var formatter = new Vex.Flow.Formatter()
			//   .joinVoices([voiceTreble, voiceBass])
			//   .format([voiceTreble, voiceBass], 330);

			// voiceTreble.draw(ctx, bar1_treble);
			// voiceBass.draw(ctx, bar1_bass);

			// var notesBar1 = [
			// new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "q" }),
			// new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "q" }),
			// new Vex.Flow.StaveNote({ keys: ["b/4"], duration: "qr" }),
			// new Vex.Flow.StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" })
			// ];

			// // Helper function to justify and draw a 4/4 voice
			// Vex.Flow.Formatter.FormatAndDraw(ctx, staveBar1, notesBar1);

			// var notesBar2 = [
			// new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "8" }),
			// new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "8" }),
			// new Vex.Flow.StaveNote({ keys: ["g/4"], duration: "8" }),
			// new Vex.Flow.StaveNote({ keys: ["e/4"], duration: "8" })
			// ];

			// // Helper function to justify and draw a 4/4 voice 
			// Vex.Flow.Formatter.FormatAndDraw(ctx, staveBar2, notesBar2);


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
