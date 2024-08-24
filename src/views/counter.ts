import { SecureSession } from './../session';
function ifGod(str: string, godMode: boolean): string {
    return godMode ? str : "";
}

export function CounterView(session: SecureSession, names: string[], sessions: string[], name: string = "", count: number = 0, dataUrl: string = "/", godMode: boolean = false, tracker: string = ''): string {
    let countSnippet = "";
    if (name) {
        countSnippet = `<p>Count: ${count}</p>`;
    }

    let namesList = names.map(name =>
        `<li style="margin: 0.5em">` +
        `<a class="op-link" href="/?name=${name}">⚙️</a>` +
        `<a class="op-link" href="/increment?name=${name}">➕</a>` +
        ifGod(`<a class="op-link" href="/decrement?name=${name}">➖</a>`, godMode) +
        ifGod(`<a class="op-link" href="/trace?name=${name}">🔎</a>`, godMode) +
        ifGod(`<a class="op-link op-danger" style="" href="/delete?name=${name}">❌</a>`, godMode) +
        `<a class="op-link" href="/${name}">🔗</a>` +
        `<a class="op-link copy-link" href="/${name}">📑</a>` +
        `<span style="margin-left: 1em;"><code>${name}</code></span>` +
        `<span class="name-message"></span>` +
        `</li>`
    ).join('')

    let sessionsList = sessions.map(name =>
        `<li style="margin: 0.5em">` +
        `<span style="margin-left: 1em;"><code>${name}</code></span>` +
        `</li>`
    ).join('')

    let currentSessionSnippet = `<p>Session ID: <code>${session.id}</code>, Persisted: <code>${session.persisted}</code></p>`
    let sessionsListSnippet = sessions.length > 0 ? `<p>Known persisted sessions: <ul style="list-style: none; padding-left: 0;">${sessionsList}</ul></p>` : `<p>No persisted sessions</p>`

    let pixel = (tracker) ? `<img src="https://nrtn.me/${tracker}" />`: '';

    return `<!DOCTYPE html>
<html>
<head>
    <title>Counters</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        form {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        input[type="text"] {
            width: 200px;
            padding: 10px;
            margin-right: 0.5em;
            margin-left: 0.5em;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .btn {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn:hover {
            background-color: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="submit"].btn-danger {
            background-color: #dc3545;
        }

        input[type="submit"].btn-danger:hover {
            background-color: #c82333;
        }

        .op-link {
            text-decoration: none;
            // margin-left: 0.3em;
            padding: 8px;
            border-radius: 8px;
        }

        .op-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        // .op-danger {
        //     margin-left: 1em;
        //     margin-right: 1em;
        // }

        .copy-link.clicked {
            // background-color: #28a745;
            transform: scale(0.95);
        }
        .name-message {
            margin-left: 1rem;
            font-weight: bold;
            // height: 1.5em;
        }
    </style>
</head>
<body>
    <h1>Counters</h1>
    <p>Select a Durable Object to contact by using the <code>name</code> URL query string parameter, for example, <code>?name=A</code></p>
    <p>Controls below will do exactly that for you</p>
    <form action="/" method="get">
        <label for="name">Name:</label><input type="text" id="name" name="name" value="${name}" />
        ${ifGod(`<label for="url">URL:</label><input type="text" id="url" name="url" value="${dataUrl}" />`, godMode)}
        <input id="increment" type="submit" class="btn" formaction="/increment" value="Increment" />
        ${ifGod(`<input id="decrement" type="submit" class="btn" formaction="/decrement" value="Decrement">`, godMode)}
        ${ifGod(`<input id="update" type="submit" class="btn" formaction="/update" value="Update">`, godMode)}
        ${ifGod(`<input id="trace" type="submit" class="btn" formaction="/trace" value="Trace" />`, godMode)}
        ${ifGod(`<input id="delete" type="submit" class="btn btn-danger" formaction="/delete" value="Delete" />`, godMode)}
        ${countSnippet}
    </form>
    <p>Known names:
    <ul style="list-style: none; padding-left: 0;">${namesList}</ul>
    </p>
    
    ${currentSessionSnippet}
    ${ifGod(sessionsListSnippet, godMode)}

    <script>
        // Function to copy link to clipboard
        function copyLinkToClipboard(link, messageElement) {
            navigator.clipboard.writeText(link)
                .then(() => {
                    console.log('Link copied to clipboard successfully!');
                    messageElement.textContent = 'Link copied successfully!';
                    setTimeout(() => {
                        messageElement.textContent = '';
                    }, 1000);
                })
                .catch(err => {
                    console.error('Failed to copy link: ', err);
                    messageElement.textContent = 'Failed to copy link.';
                });
        }

        // Add click event listeners to all elements with class 'copy-link'
        document.querySelectorAll('.copy-link').forEach(link => {
            // console.log(link)
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent the default action of following the link
                const linkToCopy = this.href; // Get the href attribute of the clicked link
                const messageElement = this.parentNode.querySelector('.name-message');
                
                // Add visual feedback
                this.classList.add('clicked');
                
                // Remove the 'clicked' class after a short delay
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 300);

                copyLinkToClipboard(linkToCopy, messageElement);
            });
        });
    </script>
    ${pixel}
</html>
`;
};