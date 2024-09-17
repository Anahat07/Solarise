document.addEventListener('DOMContentLoaded', function () {
    const gridOverlay = document.getElementById('grid-overlay');
    const gridCells = [];
    const footer = document.querySelector('footer'); // Correctly select the footer element

    // Create grid cells
    createGridCells();

    // Define the correct cells corresponding to energy wastage areas
    const correctCells = [6, 10]; // Example: Cells in the top-left corner

    // Add event listener to each grid cell
    gridOverlay.addEventListener('click', function (event) {
        const clickedCell = event.target;
        if (clickedCell.classList.contains('cell')) {
            // Toggle selection state of the cell
            clickedCell.classList.toggle('selected');

            // Get the index of the clicked cell
            const index = gridCells.indexOf(clickedCell);

            // Check if the selected cell is correct
            if (correctCells.includes(index)) {
                // Add logic for correct selection (e.g., change cell color)
                clickedCell.classList.add('correct');
                // Display "Correct!" text
                showCorrectMessage(clickedCell);
                // Display the footer
                footer.style.display = 'flex';
            } else {
                // Add logic for incorrect selection (if needed)
            }
        }
    });

    function createGridCells() {
        const gridSize = 4; // Adjust the grid size as needed

        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gridOverlay.appendChild(cell);
            gridCells.push(cell);
        }
    }

    // Function to show "Correct!" message
    function showCorrectMessage(cell) {
        const correctMessage = document.createElement('span');
        correctMessage.classList.add('correct-message');
        correctMessage.textContent = 'Correct!';
        cell.appendChild(correctMessage);
    }
});
