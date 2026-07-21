// Step 1: Select the form and input fields using the DOM
const form = document.querySelector('form');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');

// Step 2: Listen for the 'submit' event when the button is clicked
form.addEventListener('submit', function(event) {
    
    // Prevent the form from submitting and refreshing the page immediately
    event.preventDefault();

    // Get the text the user typed, removing any accidental spaces at the ends
    const titleValue = titleInput.value.trim();
    const contentValue = contentInput.value.trim();

    // Step 3: Check if the title is empty
    if (titleValue === "") {
        alert("Wait! Please enter a blog title.");
        titleInput.focus(); // Highlights the empty box
        return; // Stops the code here so the form doesn't submit
    }

    // Step 4: Check if the content is empty
    if (contentValue === "") {
        alert("Wait! Please write some content for your blog.");
        contentInput.focus();
        return;
    }

    // Step 5: If both boxes have text, success!
    alert("Success! Your blog post is ready to be published.");
    
    // Clear the form fields for the next post
    form.reset();
});