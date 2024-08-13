export function CounterView(names: string[], name: string = "", count: number = 0): string {
    let countSnippet = "";
    if (name) {
        countSnippet = `<p>Count: ${count}</p>`;
    }

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
            margin-right: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        input[type="submit"] {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <h1>Counters</h1>
    <p>Select a Durable Object to contact by using the <code>name</code> URL query string parameter, for example, <code>?name=A</code></p>
    <p>Controls below will do exactly that for you</p>
    <p>Known names:
    <ul>${names.map(name => `<li><a href="/?name=${name}">${name}</a></li>`).join('')}</ul>
    </p>
    <form action="/" method="get">
        <label for="step">Name:</label>
        <input type="text" id="name" name="name" value="${name}" />
        <input id="increment" type="submit" formaction="/increment" value="Increment" />
        <input id="decrement" type="submit" formaction="/decrement" value="Decrement">
        <input id="delete" type="submit" formaction="/delete" value="Delete" />
        <input id="trace" type="submit" formaction="/trace" value="Trace" />
    </form>
    ${countSnippet}
</html>
`;
};