document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    sendBtn.addEventListener('click', async () => {
        const userMessage = userInput.value;
        if (userMessage.trim() === '') return;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${errorText}`);
            }

            const data = await response.text();
            appendMessage('User', userMessage);
            appendMessage('Beamy', data); // Change "ChatGPT" to "Blaze" here
            userInput.value = '';
        } catch (error) {
            console.error('Error:', error);
            appendMessage('Error', 'Failed to get response from server.');
        }
    });

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
