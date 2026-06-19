let ws;
const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const feedbackBox = document.getElementById("feedback-content");

// 🎚️ New: feedback delay dropdown
const feedbackDelaySelect = document.getElementById("feedbackDelay");

// Default delay (in seconds)
let feedbackDelay = parseFloat(feedbackDelaySelect ? feedbackDelaySelect.value : 0.7);

// If user changes the delay, send update to backend
if (feedbackDelaySelect) {
  feedbackDelaySelect.addEventListener("change", () => {
    feedbackDelay = parseFloat(feedbackDelaySelect.value);

    // Send command to backend only if socket is open
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        command: "update_delay",
        delay: feedbackDelay
      }));
      console.log(`🕒 Feedback delay updated to ${feedbackDelay}s`);
    }
  });
}

startBtn.addEventListener("click", () => {
  const pose = document.getElementById("poseSelect").value;
  const clientId = Date.now();
  ws = new WebSocket(`ws://127.0.0.1:8000/ws/${clientId}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ pose_type: pose }));

    // Also send the initial feedback delay to backend
    ws.send(JSON.stringify({
      command: "update_delay",
      delay: feedbackDelay
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.frame) {
      document.getElementById("welcome-message").style.display = "none";
      video.style.display = "block";
      video.src = "data:image/jpeg;base64," + data.frame;
    }

    if (data.feedback) {
      const sim = (data.feedback.similarity * 100).toFixed(2);
      feedbackBox.innerHTML = `<strong>Similarity:</strong> ${sim}%<br>
        <strong>Feedback:</strong><br>${data.feedback.feedback_text.replace(/\n/g, "<br>")}`;
    }
  };

  ws.onclose = () => console.log("WebSocket closed.");
});

stopBtn.addEventListener("click", () => {
  if (ws) {
    ws.send(JSON.stringify({ command: "stop" }));
    ws.close();
  }
  video.style.display = "none";
  feedbackBox.innerHTML = "Feedback and similarity score will appear here.";
  document.getElementById("welcome-message").style.display = "block";
});
