// Dark or Light Logic

// ===== Dark Mode Toggle =====
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

// Load saved theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeIcon.textContent = "☀️";
  themeText.textContent = "Light";
}

// Toggle theme on click
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  themeIcon.textContent = isDark ? "☀️" : "🌙";
  themeText.textContent = isDark ? "Light" : "Dark";
});



// Get references to elements
const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const tiles = document.querySelectorAll(".tile");

// Helper: add a message to chat
function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";
  bubbleDiv.textContent = text;

  messageDiv.appendChild(bubbleDiv);
  chat.appendChild(messageDiv);

  chat.scrollTop = chat.scrollHeight;
}

sendBtn.addEventListener("click", async () => {
  const question = userInput.value.trim();
  if (!question) return;

  addMessage(question, "user");
  userInput.value = "";

  try {
    // Call backend
    const response = await fetch("https://cv-chatbot-backend-47t5.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: question })
    });

    const data = await response.json();

    // Show backend reply
    addTypingBotMessage(data.reply || "No reply received.");

  } catch (error) {
    addMessage(`Network error: ${error.message}`, "bot");
  }
});


function addTypingBotMessage(fullText) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message bot";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";
  bubbleDiv.textContent = "";

  messageDiv.appendChild(bubbleDiv);
  chat.appendChild(messageDiv);

  chat.scrollTop = chat.scrollHeight;

  const words = fullText.split(" ");
  let i = 0;

  const interval = setInterval(() => {
    bubbleDiv.textContent += (i === 0 ? "" : " ") + words[i];
    chat.scrollTop = chat.scrollHeight;
    i++;

    if (i >= words.length) {
      clearInterval(interval);

      // 👇 Add token-limit note at the end
      const note = document.createElement("div");
      note.style.marginTop = "8px";
      note.style.fontSize = "12px";
      note.style.color = "#666";
      note.style.fontStyle = "italic";

      note.textContent =
        "Note: This response may be shortened to reduce API usage and control costs.";

      bubbleDiv.appendChild(note);
    }
  }, 35);
}




// Handle Send button
sendBtn.addEventListener("click", () => {
  const question = userInput.value.trim();
  if (!question) return;

  addMessage(question, "user");
  userInput.value = "";

  setTimeout(() => {
    addMessage(fakeBotReply(question), "bot");
  }, 500);
});

// Handle Enter key
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

// Handle tile clicks
tiles.forEach(tile => {
  tile.addEventListener("click", () => {
    const question = tile.dataset.question;
    userInput.value = question;
    sendBtn.click();
  });
});

// Handle Reset chat
resetBtn.addEventListener("click", () => {
  chat.innerHTML = `
    <div class="message bot">
      <div class="bubble">
        Hi! I can answer questions only about Karthik’s CV. Click a tile or type your question below.
      </div>
    </div>
  `;
  userInput.value = "";
});
