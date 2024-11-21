const socket = io({ autoConnect: false });

// Create an XMLHttpRequest object
const xhr = new XMLHttpRequest();

let uploadedBytes = 0, percentComplete;

function uploadFileChunk(file)
{
    const chunkSize = 1024 * 1000 * 100; // 100 MB
    const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);

    xhr.open('POST', `${window.location.href}upload`, true);
    xhr.setRequestHeader('x-filename', file.name);
    xhr.setRequestHeader('x-start-byte', uploadedBytes);

    xhr.onload = () =>
    {
        if (xhr.status === 200)
        {
            uploadedBytes += chunk.size;

            if (uploadedBytes < file.size)
            {
                uploadFileChunk(file); // Upload next chunk
            }

            else
            {
                console.log('Upload complete');
            }
        }
    };

    xhr.onerror = (e) =>
    {
        console.error(e);

        socket.emit('console', e);
    };

    xhr.send(chunk);

    percentComplete = (uploadedBytes / file.size) * 100;
    document.getElementById('progressBar').value = percentComplete;
}

document.getElementById('uploadForm').addEventListener('submit', (event) =>
{
    event.preventDefault(); // Prevent form submission from refreshing the page

    const fileInput = document.getElementById('fileInput');

    if (!fileInput.files.length)
    {
        document.getElementById('status').textContent = 'Please select a file!';
        return;
    }

    else
    {
        const file = fileInput.files[0];

        // On upload completion
        xhr.addEventListener('load', () =>
                {
            if (xhr.status === 200)
            {
                        document.getElementById('status').textContent = 'Upload complete!';
            }
            else
            {
                        document.getElementById('status').textContent = `Error: ${xhr.statusText}`;
            }
        });

        // On error
        xhr.addEventListener('error', () =>
        {
            document.getElementById('status').textContent = 'Upload failed!';
        });

        uploadFileChunk(file);
                
        socket.connect();
        const int = setInterval(() => 
        {
            socket.emit('progress', percentComplete);
                    
            if (percentComplete >= 100) clearInterval(int);
        }, 5000);
    }
});