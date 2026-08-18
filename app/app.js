// Blue-Green deployment console
// Two environments (BLUE / GREEN) share one router. Only one takes
// production traffic at a time; the other sits warm on standby,
// already running the next release candidate.

const deployment = {
    active: "BLUE",
    envs: {
        BLUE: { version: "v1.0.0", state: "LIVE" },
        GREEN: { version: "v0.9.4", state: "STANDBY" }
    },
    health: "Healthy",
    cutoverInProgress: false
};

const el = {
    track: document.getElementById("track"),
    statusPill: document.getElementById("status-pill"),
    statusText: document.getElementById("status-text"),
    cutoverBtn: document.getElementById("cutover-btn"),
    switchLog: document.getElementById("switch-log"),

    versionBlue: document.getElementById("version-blue"),
    stateBlue: document.getElementById("state-blue"),
    stationBlue: document.getElementById("station-blue"),

    versionGreen: document.getElementById("version-green"),
    stateGreen: document.getElementById("state-green"),
    stationGreen: document.getElementById("station-green"),

    environmentSmall: document.getElementById("environment-small"),
    version: document.getElementById("version"),
    healthValue: document.getElementById("health-value"),
    rollbackValue: document.getElementById("rollback-value"),

    pipelineStatus: document.getElementById("pipeline-status"),
    pipeline: document.getElementById("pipeline"),

    timestamp: document.getElementById("timestamp")
};

const standbyOf = (envName) => (envName === "BLUE" ? "GREEN" : "BLUE");

function bumpPatchVersion(version) {
    const parts = version.replace("v", "").split(".").map(Number);
    parts[2] += 1;
    return `v${parts.join(".")}`;
}

function render() {
    const activeName = deployment.active;
    const standbyName = standbyOf(activeName);
    const active = deployment.envs[activeName];
    const standby = deployment.envs[standbyName];

    el.versionBlue.textContent = deployment.envs.BLUE.version;
    el.versionGreen.textContent = deployment.envs.GREEN.version;

    el.stateBlue.textContent = deployment.envs.BLUE.state === "LIVE"
        ? "LIVE \u00b7 100% TRAFFIC"
        : "STANDBY \u00b7 WARM";
    el.stateGreen.textContent = deployment.envs.GREEN.state === "LIVE"
        ? "LIVE \u00b7 100% TRAFFIC"
        : "STANDBY \u00b7 WARM";

    el.stationBlue.classList.toggle("standby", deployment.envs.BLUE.state !== "LIVE");
    el.stationGreen.classList.toggle("standby", deployment.envs.GREEN.state !== "LIVE");

    el.track.classList.toggle("env-green", activeName === "GREEN");

    el.environmentSmall.textContent = activeName;
    el.version.textContent = active.version;
    el.healthValue.textContent = deployment.health;

    document.title = `${activeName} \u00b7 ${active.version} \u00b7 Blue-Green Deploy`;
}

function runCutover() {
    if (deployment.cutoverInProgress) return;
    deployment.cutoverInProgress = true;

    const fromName = deployment.active;
    const toName = standbyOf(fromName);

    el.cutoverBtn.disabled = true;
    el.cutoverBtn.classList.add("spin");
    el.statusText.textContent = "CUTOVER IN PROGRESS";
    el.switchLog.textContent = `Draining ${fromName}\u2026 routing new connections to ${toName}.`;
    setPipelineRunning(true);

    console.log(`[cutover] starting: ${fromName} -> ${toName}`);

    setTimeout(() => {
        // Standby becomes live; the environment that was live goes to
        // standby and gets primed with the next release candidate.
        deployment.envs[toName].state = "LIVE";
        deployment.envs[fromName].state = "STANDBY";
        deployment.envs[fromName].version = bumpPatchVersion(deployment.envs[fromName].version);
        deployment.active = toName;

        render();
        setPipelineRunning(false);

        el.statusText.textContent = "ALL SYSTEMS NOMINAL";
        el.switchLog.textContent =
            `Cutover complete. ${toName} is now serving 100% of production traffic. ` +
            `${fromName} is warm on standby at ${deployment.envs[fromName].version}, ready for the next release.`;

        console.log(`[cutover] complete: ${toName} is now LIVE at ${deployment.envs[toName].version}`);

        el.cutoverBtn.disabled = false;
        el.cutoverBtn.classList.remove("spin");
        deployment.cutoverInProgress = false;
    }, 1600);
}

function setPipelineRunning(isRunning) {
    if (isRunning) {
        el.pipelineStatus.textContent = "ROUTING";
        el.pipelineStatus.style.color = "var(--amber)";
    } else {
        el.pipelineStatus.textContent = "SUCCESS";
        el.pipelineStatus.style.color = "";
    }
}

function updateTimestamp() {
    const now = new Date();
    el.timestamp.textContent = `Last checked: ${now.toLocaleString()}`;
}

el.cutoverBtn.addEventListener("click", runCutover);

render();
updateTimestamp();
setInterval(updateTimestamp, 30000);

console.log("Blue-Green deployment console loaded.");
console.log(`Active environment: ${deployment.active}`);
console.log(`Serving version: ${deployment.envs[deployment.active].version}`);