let currentCharacter = '';

function speak(text) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    // Selecting a female voice, if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name === "Google UK English Female");
    if (femaleVoice) {
        speech.voice = femaleVoice;
    }
    window.speechSynthesis.speak(speech);
}

function chooseCharacter(character) {
    console.log('Character chosen:', character);  // Debugging log
    currentCharacter = character;
    speak(`Journey with ${character}`); // Speak aloud the chosen character
    if (character === 'timmy') {
        goToPage('timmyPage2');
    } else if (character === 'lily') {
        goToPage('lilyPage2');
    }
}

function goToPage(pageId) {
    console.log('Navigating to page:', pageId);  // Debugging log
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
        console.log('Hiding page:', page.id);  // Debugging log
    });

    // Show the selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block'; // Show the target page
        console.log('Showing page:', pageId);  // Debugging log
        // Speak aloud the content of the page
        const content = targetPage.querySelector('.content');
        if (content) {
            const text = content.textContent.trim();
            speak(text);
            // Add manual text for Lily on lilyPage2
            if (pageId === 'lilyPage2') {
                const manualText = "Lily finds herself in a room with the lights on. When she leaves, she isn’t sure whether she should leave them on like her friends always do, or turn them off and turn the room dark.";
                speak(manualText);
            }
        }
    } else {
        console.error('Page not found:', pageId);  // Debugging log
    }
}

function makeChoice(pageId, option) {
    console.log('User chose:', option);
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackText = document.getElementById('feedbackText');
    const modalContent = document.getElementById('modalContent');

    let message = '';
    let isCorrect = false;

    if (pageId === 'timmyPage2' || pageId === 'lilyPage2') {
        if (option === 'option1') {
            message = 'Correct! Turning off the lights saves energy.';
            isCorrect = true;
        } else {
            message = 'Wrong! Leaving the lights on wastes energy.';
        }
    } else if (pageId === 'timmyPage3' || pageId === 'lilyPage3') {
        if (option === 'option1') {
            message = 'Correct! Using natural ventilation or fans is more energy-efficient.';
            isCorrect = true;
        } else {
            message = 'Wrong! Air conditioners and heaters consume a lot of energy.';
        }
    } else if (pageId === 'timmyPage4' || pageId === 'lilyPage4') {
        if (option === 'option1') {
            message = 'Correct! Taking short showers saves water and energy.';
            isCorrect = true;
        } else {
            message = 'Wrong! Long showers use a lot of water and energy.';
        }
    }

    feedbackText.textContent = message;
    modalContent.style.backgroundColor = isCorrect ? 'green' : 'red';
    feedbackModal.style.display = 'block';
    speak(message);
}

function closeModal() {
    const feedbackModal = document.getElementById('feedbackModal');
    feedbackModal.style.display = 'none';
}

// Initialize the first page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    goToPage('page1');
});
