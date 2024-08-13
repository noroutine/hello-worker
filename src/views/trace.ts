export function TraceView(data: string = ""): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Counter Trace</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <h1>Counter Trace</h1>
    <pre>${data}</pre>
    <a href="/">Back</a>
</html>
`;
};