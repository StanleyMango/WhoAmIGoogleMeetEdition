// People in meeting details
document.querySelector('div[data-tab-id="1"]').click(); // View meeting participants

const people = Array.from(document.querySelectorAll('div[role="list"] div[role="listitem"]')) // You = [0]
    .map(participantMenuElm => ({
        id: participantMenuElm.getAttribute('data-participant-id'),
        name: participantMenuElm.querySelector('div:first-child span:first-child').innerText,
    }));


// Select participant video rectangle
div[data-initial-participant-id="spaces/X_lpMcF0uowB/devices/ff7bc17c-6f70-47a4-98d8-42659eac37e7"]
div[data-requested-participant-id="spaces/X_lpMcF0uowB/devices/ff7bc17c-6f70-47a4-98d8-42659eac37e7"]


// Select all participants video rectangle
document.querySelectorAll('div[data-initial-participant-id]')




[...document.querySelectorAll('div[data-initial-participant-id]')].map(elm => [
    elm,
    elm.getAttribute('data-initial-participant-id') === elm.getAttribute('data-requested-participant-id')
    // elm.getAttribute('data-initial-participant-id'),
    // elm.getAttribute('data-requested-participant-id'),
])

(() => {
    const array1 = ["window","self","document","name","location","customElements","history","locationbar","menubar","personalbar","scrollbars","statusbar","toolbar","status","closed","frames","length","top","opener","parent","frameElement","navigator","origin","external","screen","innerWidth","innerHeight","scrollX","pageXOffset","scrollY","pageYOffset","visualViewport","screenX","screenY","outerWidth","outerHeight","devicePixelRatio","clientInformation","screenLeft","screenTop","defaultStatus","defaultstatus","styleMedia","onsearch","isSecureContext","performance","onappinstalled","onbeforeinstallprompt","crypto","indexedDB","webkitStorageInfo","sessionStorage","localStorage","onabort","onblur","oncancel","oncanplay","oncanplaythrough","onchange","onclick","onclose","oncontextmenu","oncuechange","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onemptied","onended","onerror","onfocus","onformdata","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup","onmousewheel","onpause","onplay","onplaying","onprogress","onratechange","onreset","onresize","onscroll","onseeked","onseeking","onselect","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","onvolumechange","onwaiting","onwebkitanimationend","onwebkitanimationiteration","onwebkitanimationstart","onwebkittransitionend","onwheel","onauxclick","ongotpointercapture","onlostpointercapture","onpointerdown","onpointermove","onpointerup","onpointercancel","onpointerover","onpointerout","onpointerenter","onpointerleave","onselectstart","onselectionchange","onanimationend","onanimationiteration","onanimationstart","ontransitionrun","ontransitionstart","ontransitionend","ontransitioncancel","onafterprint","onbeforeprint","onbeforeunload","onhashchange","onlanguagechange","onmessage","onmessageerror","onoffline","ononline","onpagehide","onpageshow","onpopstate","onrejectionhandled","onstorage","onunhandledrejection","onunload","alert","atob","blur","btoa","cancelAnimationFrame","cancelIdleCallback","captureEvents","clearInterval","clearTimeout","close","confirm","createImageBitmap","fetch","find","focus","getComputedStyle","getSelection","matchMedia","moveBy","moveTo","open","postMessage","print","prompt","queueMicrotask","releaseEvents","requestAnimationFrame","requestIdleCallback","resizeBy","resizeTo","scroll","scrollBy","scrollTo","setInterval","setTimeout","stop","webkitCancelAnimationFrame","webkitRequestAnimationFrame","chrome","speechSynthesis","onpointerrawupdate","trustedTypes","crossOriginIsolated","openDatabase","webkitRequestFileSystem","webkitResolveLocalFileSystemURL"]
    const array2 = Object.keys(window);
    return array1.filter(value => array2.includes(value));
})()

(() => {
    const array1 = ["window","self","document","name","location","customElements","history","locationbar","menubar","personalbar","scrollbars","statusbar","toolbar","status","closed","frames","length","top","opener","parent","frameElement","navigator","origin","external","screen","innerWidth","innerHeight","scrollX","pageXOffset","scrollY","pageYOffset","visualViewport","screenX","screenY","outerWidth","outerHeight","devicePixelRatio","clientInformation","screenLeft","screenTop","defaultStatus","defaultstatus","styleMedia","onsearch","isSecureContext","performance","onappinstalled","onbeforeinstallprompt","crypto","indexedDB","webkitStorageInfo","sessionStorage","localStorage","onabort","onblur","oncancel","oncanplay","oncanplaythrough","onchange","onclick","onclose","oncontextmenu","oncuechange","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onemptied","onended","onerror","onfocus","onformdata","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup","onmousewheel","onpause","onplay","onplaying","onprogress","onratechange","onreset","onresize","onscroll","onseeked","onseeking","onselect","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","onvolumechange","onwaiting","onwebkitanimationend","onwebkitanimationiteration","onwebkitanimationstart","onwebkittransitionend","onwheel","onauxclick","ongotpointercapture","onlostpointercapture","onpointerdown","onpointermove","onpointerup","onpointercancel","onpointerover","onpointerout","onpointerenter","onpointerleave","onselectstart","onselectionchange","onanimationend","onanimationiteration","onanimationstart","ontransitionrun","ontransitionstart","ontransitionend","ontransitioncancel","onafterprint","onbeforeprint","onbeforeunload","onhashchange","onlanguagechange","onmessage","onmessageerror","onoffline","ononline","onpagehide","onpageshow","onpopstate","onrejectionhandled","onstorage","onunhandledrejection","onunload","alert","atob","blur","btoa","cancelAnimationFrame","cancelIdleCallback","captureEvents","clearInterval","clearTimeout","close","confirm","createImageBitmap","fetch","find","focus","getComputedStyle","getSelection","matchMedia","moveBy","moveTo","open","postMessage","print","prompt","queueMicrotask","releaseEvents","requestAnimationFrame","requestIdleCallback","resizeBy","resizeTo","scroll","scrollBy","scrollTo","setInterval","setTimeout","stop","webkitCancelAnimationFrame","webkitRequestAnimationFrame","chrome","speechSynthesis","onpointerrawupdate","trustedTypes","crossOriginIsolated","openDatabase","webkitRequestFileSystem","webkitResolveLocalFileSystemURL"]
    const array2 = Object.keys(window);
    return array2.filter(value => !array1.includes(value)).reduce((r, v) => { r[v] = window[v]; return r;}, {});
})()


/*
How a user uses it:
Click the extension button
Press play
The tiles on Google Meet show you who the other players are, who is guessing, and how many guesses each person has left
Guess when it's your turn and click a button to indicate you are done with your guess

Backend client side:
- Click the extension button
- Press play
Open the Google meet participants menu
Send your name, id, and meeting Id to the WebSocket server

- The tiles on Google Meet show you who the other players are
The server will send periodic updates of what images to show based on id's and the # of guesses each person has left
The server will send periodic updates on who is next and how many guesses each person has left

Backend websocket:
Whe someone joins, create a room if one doesn't exist for that meeting Id which contains {'roomId': { users[{id, name, remainingGuessesCount}], currentGuesser: 'id'} }

*/
