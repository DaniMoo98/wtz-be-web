// ----------------------
// TEMPLATE STRUCTURES (REAL ONES YOU DEFINE)
// ----------------------

const templates = {
    "WTZ Base": {
        "fxmanifest.lua": "",
        "config.lua": "",
        "client/main.lua": "",
        "server/main.lua": "",
        "shared/utils.lua": ""
    },

    "Drug System Template": {
        "fxmanifest.lua": "",
        "config/drugs.lua": "",
        "server/production.lua": "",
        "server/cooldowns.lua": "",
        "client/interaction.lua": "",
        "shared/items.lua": ""
    }
};

// ----------------------
// PROJECT STORAGE
// ----------------------

const projects = {};
let currentProject = null;
let projectFiles = {};

// ----------------------
// IMPORT PROJECT (ZIP)
// ----------------------

document.addEventListener("DOMContentLoaded", () => {
    const uploadInput = document.getElementById("project-upload");
    const projectSelect = document.getElementById("project-select");

    uploadInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const newProjectName = file.name.replace(/\.zip$/i, "");

        const files = {};
        const promises = [];

        loadedZip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                const p = zipEntry.async("string").then(content => {
                    files[relativePath] = content;
                });
                promises.push(p);
            }
        });

        await Promise.all(promises);

        projects[newProjectName] = files;
        addProjectToSelect(newProjectName);
        setCurrentProject(newProjectName);
    });

    // Add templates to dropdown
    Object.keys(templates).forEach(t => {
        const option = document.createElement("option");
        option.value = "template:" + t;
        option.textContent = "Template: " + t;
        projectSelect.appendChild(option);
    });

    projectSelect.addEventListener("change", (e) => {
        const value = e.target.value;

        if (value.startsWith("template:")) {
            const templateName = value.replace("template:", "");
            loadTemplate(templateName);
            return;
        }

        if (projects[value]) {
            setCurrentProject(value);
        }
    });

    initCopilotWidget();
});

// ----------------------
// TEMPLATE LOADING
// ----------------------

function loadTemplate(name) {
    currentProject = name + " (template)";
    projectFiles = { ...templates[name] };
    projects[currentProject] = projectFiles;

    addProjectToSelect(currentProject);
    document.getElementById("project-select").value = currentProject;

    loadFileList();
    document.getElementById("editor-title").textContent = "No file selected";
    document.getElementById("editor-area").value = "";
}

// ----------------------
// PROJECT SELECT HANDLING
// ----------------------

function addProjectToSelect(name) {
    const select = document.getElementById("project-select");
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
}

function setCurrentProject(name) {
    currentProject = name;
    projectFiles = { ...projects[name] };
    document.getElementById("project-select").value = name;
    loadFileList();
    document.getElementById("editor-title").textContent = "No file selected";
    document.getElementById("editor-area").value = "";
}

// ----------------------
// FILE MANAGER
// ----------------------

function loadFileList() {
    const list = document.getElementById("file-list");
    list.innerHTML = "";

    Object.keys(projectFiles).forEach(file => {
        const li = document.createElement("li");
        li.textContent = file;
        li.onclick = () => openFile(file);
        list.appendChild(li);
    });
}

function openFile(filename) {
    document.getElementById("editor-title").textContent = filename;
    document.getElementById("editor-area").value = projectFiles[filename];
}

document.getElementById("save-file").onclick = () => {
    const file = document.getElementById("editor-title").textContent;
    if (!file || file === "No file selected") return;
    projectFiles[file] = document.getElementById("editor-area").value;
    projects[currentProject] = { ...projectFiles };
};

// ----------------------
// DOWNLOAD PROJECT (ZIP)
// ----------------------

document.getElementById("download-project").onclick = async () => {
    if (!currentProject) return;

    const zip = new JSZip();

    Object.keys(projectFiles).forEach(path => {
        zip.file(path, projectFiles[path]);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = currentProject + ".zip";
    link.click();
};

// ----------------------
// COPILOT WIDGET
// ----------------------

function initCopilotWidget() {
    const container = document.getElementById("copilot-container");

    container.innerHTML = `
        <div class="copilot-widget">
            <div class="copilot-header">WTZ Copilot</div>
            <div class="copilot-messages" id="copilot-messages"></div>
            <input class="copilot-input" id="copilot-input" placeholder="Ask WTZ Copilot...">
        </div>
    `;

    const input = document.getElementById("copilot-input");
    const messages = document.getElementById("copilot-messages");

    input.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            const msg = input.value;
            if (!msg) return;

            const userMsg = document.createElement("div");
            userMsg.textContent = "You: " + msg;
            messages.appendChild(userMsg);

            input.value = "";

            setTimeout(() => {
                const botMsg = document.createElement("div");
                botMsg.textContent = "Copilot: (AI response will go here)";
                messages.appendChild(botMsg);
            }, 500);
        }
    });
}
