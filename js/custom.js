Reveal.addEventListener( 'ready', function( event ) {
// Some of this code is horrible, so I apologise in advance.


// Simple speech synthesis
  document.querySelector('#synthesis1 button').onclick = function () {
    var txt = document.querySelector('#synthesis1 input').value,
        say = new SpeechSynthesisUtterance(txt);
    window.speechSynthesis.speak(say);
  };


// Changing pitch attribute of synthesis
  document.querySelector('#synthesis2 button').onclick = function () {
    var txt = document.querySelector('#synthesis2 input[type=text]').value,
        say = new SpeechSynthesisUtterance(txt);
    say.lang = 'en-GB';
    say.pitch = document.querySelector('#synthesis2 input[type=range]').value;
    // say.rate = 1.25;
    window.speechSynthesis.speak(say);
  };

// NeoSpeech third-party synthesis service

// Safely encode XML for page output
  function encodeXML (s) {
    return (s
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    );
  }

// Parse XML result from Neospeech
  function parseXML (r) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(r, 'application/xml');
    xmlDoc = xmlDoc.querySelector('response');
    return xmlDoc;
  }

// Neospeech account vars - you should get your own.
  var neoEmail = [EMAIL],
      neoAcctId = [ACCOUNT ID],
      neoPwd = [PASSWORD],
      neoURL = 'https://tts.neospeech.com/rest_1_1.php?method=';

// Async XHR with Promises syntax
  function get(url) {
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();
      req.open('GET', url);
      req.onload = function() {
        if (req.status == 200) {
          resolve(req.response);
        }
        else {
          reject(Error(req.statusText));
        }
      };

      req.onerror = function() {
        reject(Error('Network Error'));
      };

      req.send();
    });
  }

// Get the successfully converted sound file and play it
  function neoGetResponse (convNo) {
    var reqURL = neoURL + 'GetConversionStatus&email=' + neoEmail +  '&accountId=' + neoAcctId + '&conversionNumber=' + convNo;
    get(reqURL).then(function (response) {
      var responseSafe = encodeXML(response);
      document.querySelector('#neospeech #neo2').innerHTML = responseSafe;

      var xmlDoc = parseXML(response);
      if (xmlDoc.getAttribute('statusCode') !== 0) {
        var audioFile = xmlDoc.getAttribute('downloadUrl');
        var playFile = new Audio(audioFile);
        playFile.play();
      } else {
        console.log('Not ready');
      }
    }, function(error) {
      console.error('Failed!', error);
    });
  }

// Request a sound file with the supplied text
  function neoSendRequest () {
    var neoTxt = document.querySelector('#neospeech input').value;
    var reqOpts = {
      text : encodeURIComponent(neoTxt),
      voice : 'TTS_PAUL_DB'
    };
    var reqURL = neoURL + 'ConvertSimple&email=' + neoEmail + '&accountId=' + neoAcctId + '&loginKey=LoginKey&loginPassword=' + neoPwd + '&voice=' + reqOpts.voice + '&outputFormat=FORMAT_WAV&sampleRate=16&text=' + reqOpts.text;
    get(reqURL).then(function(response) {

      var xmlDoc = parseXML(response);
      var convNo = xmlDoc.getAttribute('conversionNumber');

      var responseSafe = encodeXML(response);
      document.querySelector('#neospeech #neo1').innerHTML = responseSafe;
      var responseBtn = document.createElement('button');
      responseBtn.classList.add('big');
      responseBtn.textContent = '2';
      responseBtn.addEventListener('click', function (e) {
        e.currentTarget.setAttribute('disabled',true);
        neoGetResponse(convNo);
      });
      document.getElementById('neospeech').appendChild(responseBtn);
    }, function(error) {
      console.error('Failed!', error);
    });
  }

// Run the request function
  document.querySelector('#neospeech #neoreq').onclick = function (e) {
    e.currentTarget.setAttribute('disabled',true);
    neoSendRequest();
  };

// Simple speech recognition
  var rec1 = new webkitSpeechRecognition();
  rec1.onresult = function (result) {
    document.querySelector('#recognition1 output').textContent = result.results[0][0].transcript;
    rec1.stop();
  };
  document.querySelector('#recognition1 .trigger').onclick = function () {
    rec1.start();
  };

// Speech recognition events
  var rec2 = new webkitSpeechRecognition();
  rec2.onstart = function () {
    Reveal.nextFragment();
  };
  rec2.onaudiostart = function () {
    Reveal.nextFragment();
  };
  rec2.onsoundstart = function () {
    Reveal.nextFragment();
  };
  rec2.onspeechstart = function () {
    Reveal.nextFragment();
  };
  rec2.onspeechend = function () {
    Reveal.nextFragment();
  };
  rec2.onsoundend = function () {
    Reveal.nextFragment();
  };
  rec2.onaudioend = function () {
    Reveal.nextFragment();
  };
  rec2.onend = function () {
    Reveal.nextFragment();
  };
  document.querySelector('#recognition2 .trigger').onclick = function () {
    rec2.start();
  };

// Speech recognition with interim results
  var rec3 = new webkitSpeechRecognition();
  rec3.interimResults = true;
  rec3.onresult = function (result) {
    if (result.results[0].isFinal) {
      rec3.stop();
    }
    document.querySelector('#recognition3 output').textContent = result.results[0][0].transcript;
  };
  document.querySelector('#recognition3 .trigger').onclick = function () {
    rec3.start();
  };

// Wit.ai third-party recognition; you will need to create an account, get your API key, create a new intent called name with the wit/contact entity
  var witAPIKey = [API KEY];

// Wit.ai format results
  function kv (k, v) {
    if (toString.call(v) !== '[object String]') {
      v = JSON.stringify(v);
    }
    return k + '=' + v + '\n';
  }

  function witResults (intent, entities) {
    var r = kv('intent', intent);

    for (var k in entities) {
      var e = entities[k];

      if (!(e instanceof Array)) {
        r += kv(k, e.value);
      } else {
        for (var i = 0; i < e.length; i++) {
          r += kv(k, e[i].value);
        }
      }
      return r;
    }
  }

// Wit.ai looks for a name intent
  function startWit1 () {

    var wit1 = new Wit.Microphone(document.querySelector('#wit1 #mic1'));

    wit1.onresult = function (intent, entities) {
      var r = witResults(intent, entities);
      document.querySelector('#wit1 output').innerHTML = r;
    };

    wit1.connect(witAPIKey);
  }

// Wit.ai looks for a name intent, replies with synthesis
  function startWit2 () {

    var wit2 = new Wit.Microphone(document.querySelector('#wit2 #mic2'));

    wit2.onresult = function (intent, entities) {
      console.log(entities.contact.value);
      var txt = 'Hello, ' + entities.contact.value,
          say = new SpeechSynthesisUtterance(txt);
      window.speechSynthesis.speak(say);
    };

    wit2.connect(witAPIKey);
  }

// Reveal.js slide-based events
  function fragWith (fragEvt) {
    Reveal.addEventListener('fragmentshown', function( fragEvt ) {
      if (fragEvt.fragment.localName === 'span') {
        Reveal.nextFragment();
      }
    });
  }

  Reveal.addEventListener('slidechanged', function( event ) {
    if (event.currentSlide.id === 'wit1') {
      startWit1();
    } else if (event.currentSlide.id === 'wit2') {
      startWit2();
    } else if (event.currentSlide.id === 'stat1') {
      fragWith(event);
    }
  });

//
});
