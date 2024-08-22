async function main() {
    const displayedText = document.getElementById("displayedText");
    const displayedImage = document.getElementById("displayedImage");
    const characterInfo = document.getElementById("characterInfo");
    const popup = document.getElementById("popup");
    const popupText = document.getElementById("popupText");
    const popupInput = document.getElementById("popupInput");
    const popupSubmit = document.getElementById("popupSubmit");
    const mainContent = document.getElementById("mainContent");
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
        "1.8vw",
        "1.5vw",
        "1.4vw",
        "1.4vw",
        "1.4vw"
    ];

    let setChoicesTo = function(choiceInfo) {
        if (choiceInfo.length % 3 !== 0) {
            throw new Error("Bad choice count");
        }

        let gridArea = choiceGrids[choiceInfo.length / 3];
        let fontSize = fontSizes[choiceInfo.length / 3];

        for (let i in choices) {
            choices[i].style.display = "none";
        }

        for (let i = 0; i < choiceInfo.length; i += 3) {
            let usedFontSize = undefined;
            if (choiceInfo[i + 1] !== "<default>") {
                usedFontSize = choiceInfo[i + 1];
            } else {
                usedFontSize = fontSize;
            }

            choices[i / 3].style.display = "flex";
            choices[i / 3].style.gridArea = gridArea[i / 3];
            choices[i / 3].style.fontSize = usedFontSize;

            choices[i / 3].innerText = choiceInfo[i];
            choices[i / 3].clickFn = choiceInfo[i + 2];
        }
    };

    let setDisplayedText = function(displayedTextValue) {
        displayPrintedText(displayedTextValue, true);
    };

    let openTextPopup = function(text) {
        popupText.innerText = text;
        popup.style.display = "block";
        document.documentElement.style.backgroundColor = "#BBB";
        mainContent.style.pointerEvents = "none";

        return new Promise(function(resolve) {
            popupSubmit.onclick = function(e) {
                popupText.innerText = "";
                popup.style.display = "none";
                document.documentElement.style.backgroundColor = "#FFF";
                mainContent.style.pointerEvents = "auto";

                resolve(popupInput.value);
            };
        });
    };

    let sleep = function(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    };

    const globalVars = new Map();
    let displayPrintedText = async function(displayedTextValue, noSleep=false) {
        const PAUSE = "<pause>";
        const NEWLINE = "<newline>";
        const BOLD_START = "<bold>";
        const BOLD_END = "</bold>";
        const ITALICS_START = "<italics>";
        const ITALICS_END = "</italics>";
        const VAR_START = "<var>";
        const VAR_END = "</var>";

        const waitTime = Math.floor(36 - (displayedTextValue.length / 72));

        let summedValue = "";
        let bolding = 0;
        let italicization = 0;
        let variableBuffer = "";
        let gettingVariable = false;
        for (let i = 0; i < displayedTextValue.length; i ++) {
            if (displayedTextValue.slice(i).startsWith(PAUSE)) {
                // A pause.
                if (!noSleep) await sleep(waitTime * 13);
                i += PAUSE.length - 1;
                continue;
            }

            if (displayedTextValue.slice(i).startsWith(NEWLINE)) {
                summedValue += "<br>";
                displayedText.innerHTML = summedValue;
                if (!noSleep) await sleep(waitTime);
                i += NEWLINE.length - 1;
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

            if (displayedTextValue.slice(i).startsWith(VAR_START)) {
                gettingVariable = true;
                i += VAR_START.length - 1;
                continue;
            }

            if (gettingVariable) {
                if (displayedTextValue.slice(i).startsWith(VAR_END)) {
                    const variableValue = globalVars.get(variableBuffer);
                    if (variableValue === undefined) {
                        throw new Error("Tried to lookup undefined variable " + variableBuffer + " in text");
                    }

                    // Code duplicated :/
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

                    for (let j = 0; j < variableValue.toString().length; j ++) {
                        summedValue += prefix + variableValue.toString()[j].replaceAll("<", "&lt;").replaceAll(">", "&gt;") + suffix;
                        displayedText.innerHTML = summedValue;
                        if (!noSleep) await sleep(waitTime);
                    }
                    gettingVariable = false;
                    i += VAR_END.length - 1;
                    variableBuffer = "";
                    continue;
                }
                variableBuffer += displayedTextValue[i];
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
            if (!noSleep) await sleep(waitTime);
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
            let getValue = async function(operands, offset) {
                const data = operands.split(" ")[offset];
                if (data === "%input") {
                    const printedText = operands.split(" ").slice(offset + 1).join(" ");
                    return await openTextPopup(printedText);
                } else if (data === "%random") {
                    const lowerBound = parseInt(operands.split(" ")[offset + 1]);
                    const upperBound = parseInt(operands.split(" ")[offset + 2]);
                    if (isNaN(lowerBound) || isNaN(upperBound)) {
                        throw new Error("Bad lower or upper bound for RNG");
                    }
                    if (upperBound - lowerBound <= 0) {
                        throw new Error("Lower bound was greater than upper bound for RNG");
                    }

                    return (Math.random() * (upperBound - lowerBound)) + lowerBound;
                } else if (!isNaN(parseInt(data))) {
                    return parseInt(operands);
                } else if (data.startsWith("$")) {
                    const val = globalVars.get(operands.slice(1));
                    if (val !== undefined) {
                        return parseInt(operands);
                    } else {
                        throw new Error("Tried to access undefined variable " + operands);
                    }
                } else if (data.startsWith('"') && data.endsWith('"')) {
                    return data.slice(1).slice(0, -1);
                } else {
                    throw new Error("Invalid value " + operands);
                }
            };

            const op = action.split(" ")[0];
            const operands = action.split(" ").slice(1).join(" ");
            switch(op) {
                case "continue":
                    resolveFn({goto: currentSceneIndex + 1});
                    break;
                case "goto":
                    resolveFn({goto: findSceneIndexByName(operands)});
                    break;
                case "stay":
                    resolveFn({});
                    break;
                case "sleep":
                    const parsed = parseInt(operands);
                    if (!isNaN(parsed)) {
                        if (parsed < 10000) {
                            await sleep(parsed);
                        } else {
                            throw new Error("Refusing to sleep for more than 10 seconds");
                        }
                    } else {
                        throw new Error("Bad sleep duration \"" + operands[0] + "\"");
                    }
                    break;
                case "setvar":
                    const variableName = operands.split(" ")[0];
                    const data = await getValue(operands, 1);

                    if (data !== undefined) {
                        globalVars.set(variableName, data);
                    }
                    break;
                default:
                    throw new Error("Unknown op " + op);
            }
        };

        let runActions = async function(actions, resolveFn) {
            if (typeof actions === "string") {
                await runAction(actions.trim(), resolveFn);
                return;
            }

            for (let i = 0; i < actions.length; i ++) {
                await runAction(actions[i].trim(), resolveFn);
            }
        };

        let runScene = async function(scene) {
            setChoicesTo([]);
            setDisplayedText("");

            if (scene.hasOwnProperty("text")) {
                const text = scene.text;

                await displayPrintedText(text);
            } else if (scene.hasOwnProperty("randomTexts")) {
                const texts = scene.randomTexts;
                const text = texts[Math.floor(Math.random() * texts.length)];

                await displayPrintedText(text);
            } else if (scene.hasOwnProperty("immediateText")) {
                const text = scene.immediateText;

                setDisplayedText(text);
            } else {
                throw new Error("Scene had neither randomTexts, immediateText, or text property");
            }

            await sleep(400);

            if (scene.hasOwnProperty("actions")) {
                let result = await new Promise(function(resolve) {
                    runActions(scene.actions, function(info) {
                        console.log("Ran actions and called resolve");
                        resolve(info);
                    });
                });

                if (result.hasOwnProperty("goto")) {
                    return result;
                }
            }

            const sceneChoices = scene.choices;

            return new Promise(function (resolve) {
                const choices = [];
                for (let i = 0; i < sceneChoices.length; i ++) {
                    const actions = sceneChoices[i].actions;

                    choices.push(sceneChoices[i].text);
                    if (sceneChoices[i].hasOwnProperty("fontSize")) {
                        choices.push(sceneChoices[i].fontSize);
                    } else {
                        choices.push("<default>");
                    }
                    choices.push(function() {
                        runActions(actions, resolve);
                    });
                }

                setChoicesTo(choices);
            });
        };

        while (!exited) {
            let scene = scriptData.scenes[currentSceneIndex];
            let resultingInfo = await runScene(scene);

            if (resultingInfo.hasOwnProperty("goto")) {
                currentSceneIndex = resultingInfo.goto;
            }

            if (currentSceneIndex === -1 || currentSceneIndex >= scriptData.scenes.length) {
                throw new Error("Went to unknown scene " + currentSceneIndex);
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
