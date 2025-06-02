async function loadMain() {
    console.log("Loading resources...");

    let loadedScripts = new Map();

    // Temporary initialization until main.json is loaded
    let isPlaytesting = true;
    let firstScript = null;
    let scriptNames = null;

    const mainContent = document.getElementById("mainContent");
    const loadingContainer = document.getElementById("loadingContainer");
    const loadingInfo = document.getElementById("loadingInfo");

    let logLoadingError = function() {
        loadingInfo.innerText = "Failed to load resource.";
    };

    let loadResource = async function(loadFn) {
        try {
            await loadFn();
        } catch(e) {
            try {
                await loadFn();
            } catch(e) {
                console.log(e);
                logLoadingError();
                throw new Error("Load failed while loading resource");
            }
        }
    };

    // Preload the font and the prologue.
    let loadFunctions = [
        async function() {
            const font = new FontFace("Choice7Font", "url(assets/DejaVuSerif.ttf)");
            await font.load();
            document.fonts.add(font);
        },
        async function() {
            const mainData = await (await fetch("assets/_start.json")).json();
            isPlaytesting = mainData.isPlaytesting;
            firstScript = mainData.firstScript;
            scriptNames = mainData.scriptNames;

            const scriptData = await (await fetch("assets/" + firstScript + ".json")).json();
            loadedScripts.set(firstScript, scriptData);
        }
    ];

    await new Promise(function(resolve, reject) {
        let loadedResources = 0;
        for (let i in loadFunctions) {
            loadResource(loadFunctions[i]).then(function(value) {
                loadedResources ++;
                if (loadedResources === loadFunctions.length) {
                    resolve();
                }
            }).catch(function(error) {
                reject();
            });
        }
    });

    console.log("Resource loading complete.");

    mainContent.style.display = "block";
    loadingContainer.style.display = "none";
    window.dispatchEvent(new CustomEvent("resourceLoadComplete", {
        detail: {
            loadedScripts,

            isPlaytesting,
            firstScript,
            scriptNames,
        }
    }));
}

document.addEventListener("DOMContentLoaded", function(e) {
    loadMain();
});
