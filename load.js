async function loadMain() {
    console.log("Loading resources...");

    window.loadedScripts = new Map();

    // Temporary initialization until main.json is loaded
    window.isPlaytesting = true;
    window.firstScript = null;
    window.scriptNames = null;

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
            window.isPlaytesting = mainData.isPlaytesting;
            window.firstScript = mainData.firstScript;
            window.scriptNames = mainData.scriptNames;

            const scriptData = await (await fetch("assets/" + window.firstScript + ".json")).json();
            window.loadedScripts.set(window.firstScript, scriptData);
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
    window.dispatchEvent(new Event("resourceLoadComplete"));
}

document.addEventListener("DOMContentLoaded", function(e) {
    loadMain();
});
