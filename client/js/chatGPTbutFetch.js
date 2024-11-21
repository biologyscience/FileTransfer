const socket = io({ autoConnect: false });

let uploadedBytes = 0, percentComplete = 0;

let chunkSize;

function uploadFile(file)
{
    const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);

    fetch(`${window.location.href}upload`, {method: 'POST', body: chunk, headers: {'x-filename': file.name, 'x-start-byte': uploadedBytes}})
    .then((x) =>
    {
        if (x.ok)
        {
            uploadedBytes += chunk.size;

            percentComplete = (uploadedBytes / file.size) * 100;
            document.getElementById('progressBar').value = percentComplete;

            if (uploadedBytes < file.size)
            {
                uploadFile(file); // Upload next chunk
            }

            else
            {
                console.log('Upload complete');
                console.timeEnd('uploadTime');
                document.getElementById('status').textContent = 'Upload complete!';
            }
        }

        else socket.emit('console', 'Client: Server did not say OK');
    })
    .catch((e) => socket.emit('console', e));
}

document.getElementById('uploadForm').addEventListener('submit', (event) =>
{
    event.preventDefault(); // Prevent form submission from refreshing the page

    const fileInput = document.getElementById('fileInput');

    if (fileInput.files.length === 0) return document.getElementById('status').textContent = 'Please select a file!';

    else
    {
        const file = fileInput.files[0];

        socket.connect();
        const int = setInterval(() => 
        {
            socket.emit('progress', percentComplete);
                    
            if (percentComplete >= 100) clearInterval(int);
        }, 5000);

        console.time('uploadTime');

        chunkSize = 1024 * 1000 * 10; // 1 MB

        uploadFile(file);
    }
});