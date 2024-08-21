async function main() {
    const displayedText = document.getElementById("displayedText");
    const displayedImage = document.getElementById("displayedImage");
    const characterInfo = document.getElementById("characterInfo");
    // Initialize choices
    const choices = [1, 2, 3, 4, 5, 6].map((c) => document.getElementById("choice" + c));
    for (let i in choices) {
        choices[i].clickFn = null;
        choices[i].onclick = function(e) {
            this.clickFn();
        };
    }

    const choiceGrids = [
        [], // 0 choices
        ["37 / 7 / 49 / 23"], // 1 choice
        ["37 / 7 / 49 / 23", "49 / 7 / 61 / 23"], // 2 choices
        ["37 / 7 / 45 / 23", "45 / 7 / 53 / 23", "53 / 7 / 61 / 23"], // 3 choices
        ["37 / 7 / 49 / 15", "37 / 15 / 49 / 23", "49 / 7 / 61/ 15", "49 / 15 / 61 / 23"], // 4 choices
        ["37 / 7 / 45 / 15", "37 / 15 / 45 / 23", "45 / 7 / 53 / 15", "45 / 15 / 53 / 23", "53 / 10 / 61 / 20"], // 5 choices
        ["37 / 7 / 45 / 15", "37 / 15 / 45 / 23", "45 / 7 / 53 / 15", "45 / 15 / 53 / 23", "53 / 7 / 61 / 15", "53 / 15 / 61 / 23"], // 6 choices
    ];
    
    const fontSizes = [
        "",
        "2vw",
        "1.9vw",
        "1.9vw",
        "1.4vw",
        "1.4vw",
        "1.4vw"
    ];

    let setChoicesTo = function(choiceInfo) {
        if (choiceInfo.length % 2 !== 0) {
            throw new Error("Bad choice count");
        }

        let gridArea = choiceGrids[choiceInfo.length / 2];
        let fontSize = fontSizes[choiceInfo.length / 2];

        for (let i in choices) {
            choices[i].style.display = "none";
        }

        for (let i = 0; i < choiceInfo.length; i += 2) {
            choices[i / 2].style.display = "flex";
            choices[i / 2].style.gridArea = gridArea[i / 2];
            choices[i / 2].style.fontSize = fontSize;

            choices[i / 2].innerText = choiceInfo[i];
            choices[i / 2].clickFn = choiceInfo[i + 1];
        }
    };

    let setDisplayedText = function(displayedTextValue) {
        displayedText.innerText = displayedTextValue;
    };

    let sleep = function(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    };

    let displayPrintedText = async function(displayedTextValue) {
        const PAUSE = "<pause>";
        const BOLD_START = "<bold>";
        const BOLD_END = "</bold>";
        const ITALICS_START = "<italics>";
        const ITALICS_END = "</italics>";

        const waitTime = Math.floor(40 - (displayedTextValue.length / 8));
        let summedValue = "";
        let bolding = 0;
        let italicization = 0;
        for (let i = 0; i < displayedTextValue.length; i ++) {
            if (displayedTextValue.slice(i).startsWith(PAUSE)) {
                // A pause.
                await sleep(waitTime * 13);
                i += PAUSE.length - 1;
                continue;
            }

            if (displayedTextValue.slice(i).startsWith(BOLD_START)) {
                // Start bold text.
                bolding ++;
                i += BOLD_START.length - 1;
                continue;
            }

            if (displayedTextValue.slice(i).startsWith(BOLD_END)) {
                // End bold text.
                if (bolding > 0) {
                    bolding --;
                }
                i += BOLD_END.length - 1;
                continue;
            }

            if (displayedTextValue.slice(i).startsWith(ITALICS_START)) {
                // Start italics text.
                italicization ++;
                i += ITALICS_START.length - 1;
                continue;
            }

            if (displayedTextValue.slice(i).startsWith(ITALICS_END)) {
                // End italics text.
                if (italicization > 0) {
                    italicization --;
                }
                i += ITALICS_END.length - 1;
                continue;
            }

            let prefix = "";
            let suffix = "";

            if (bolding) {
                prefix += "<strong>";
                suffix += "</strong>";
            }

            if (italicization) {
                prefix += "<em>";
                suffix += "</em>";
            }

            summedValue += prefix + displayedTextValue[i].replaceAll("<", "&lt;").replaceAll(">", "&gt;") + suffix;
            displayedText.innerHTML = summedValue;
            await sleep(waitTime);
        }
    };

    const loadedScripts = new Map();
    let getScript = async function(script) {
        if (loadedScripts.has(script)) {
            return loadedScripts.get(script);
        } else {
            const scriptData = await (await fetch("assets/" + script + ".json")).json();
            loadedScripts.set(script, scriptData);
            return scriptData;
        }
    };

    const globalVars = new Map();
    let runScript = async function(script) {
        const scriptData = await getScript(script);

        // Preprocess the script data
        let makeRandomIdentifier = function() {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < 20) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return result;
        };

        for (let i in scriptData.scenes) {
            if (!scriptData.scenes[i].hasOwnProperty("name")) {
                scriptData.scenes[i].name = makeRandomIdentifier();
            }
        }

        let findSceneIndexByName = function(name) {
            let result = -1;
            for (let i = 0; i < scriptData.scenes.length; i ++) {
                const scene = scriptData.scenes[i];
                if (scene.name === name) {
                    result = i;
                    break;
                }
            }
            return result;
        };

        let findSceneByName = function(name) {
            return scriptData.scenes[findSceneIndexByName(name)];
        };

        const entryPoint = scriptData.init;
        const entryScene = findSceneByName(entryPoint);

        let currentSceneIndex = findSceneIndexByName(entryPoint);
        let exited = false;

        let runAction = async function(action, resolveFn) {
            const op = action.split(" ")[0];
            const operands = action.split(" ").slice(1).join(" ");
            switch(op) {
                case "continue":
                    resolveFn(currentSceneIndex + 1);
                    break;
                case "goto":
                    resolveFn(findSceneIndexByName(operands));
                    break;
            }
        };

        let runActions = async function(actions, resolveFn) {
            if (typeof actions === "string") {
                await runAction(actions, resolveFn);
                return;
            }

            for (let i = 0; i < actions.length; i ++) {
                await runAction(actions[i], resolveFn);
            }
        };

        let runScene = async function(scene) {
            setChoicesTo([]);
            setDisplayedText("");

            const text = scene.text;
            await displayPrintedText(text);

            await sleep(400);

            const sceneChoices = scene.choices;

            return new Promise(function (resolve) {
                const choices = [];
                for (let i = 0; i < sceneChoices.length; i ++) {
                    const actions = sceneChoices[i].actions;

                    choices.push(sceneChoices[i].text);
                    choices.push(function() {
                        runActions(actions, resolve);
                    });
                }

                setChoicesTo(choices);
            });
        };

        while (!exited) {
            let scene = scriptData.scenes[currentSceneIndex];
            let resultingScene = await runScene(scene);

            currentSceneIndex = resultingScene;

            if (currentSceneIndex === -1 || currentSceneIndex >= scriptData.scenes.length) {
                throw new Error("Went to unknown scene " + resultingScene);
            }
        }
    };

    setDisplayedText("");
    setChoicesTo([]);

    await runScript("prologue");
}

document.addEventListener("DOMContentLoaded", function(e) {
    main();
});
