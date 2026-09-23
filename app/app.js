const timestamp = document.getElementById("timestamp");

function updateTime() {
    timestamp.textContent = new Date().toLocaleString();
}
updateTime();
setInterval(updateTime, 1000);

// Load environment information from the active backend
async function loadEnvironment() {
    try {
        const response = await fetch("/config.json");
        const data = await response.json();

        document.getElementById("environment-small").textContent = data.environment;
        document.getElementById("version").textContent = data.version;

        if (data.environment === "BLUE") {
            document.getElementById("state-blue").textContent = "LIVE · 100% TRAFFIC";
            document.getElementById("state-green").textContent = "STANDBY · WARM";
        } else {
            document.getElementById("state-blue").textContent = "STANDBY · WARM";
            document.getElementById("state-green").textContent = "LIVE · 100% TRAFFIC";
        }

        document.getElementById("switch-log").textContent =
            `Traffic is currently routed to ${data.environment} (${data.version}).`;

        document.getElementById("pipeline-status").textContent = "DEPLOYED";

    } catch (err) {
        console.error(err);
        document.getElementById("pipeline-status").textContent = "ERROR";
    }
}

// Refresh every 5 seconds
loadEnvironment();
setInterval(loadEnvironment, 5000);