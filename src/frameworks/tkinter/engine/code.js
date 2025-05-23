import { createFilesAndDownload } from "../../../codeEngine/utils"
import MainWindow from "../widgets/mainWindow"

import { message } from "antd"
import TopLevel from "../widgets/toplevel"

const pythonFiles = require.context("../pythonWidgets", false, /\.py$/)


// FIXME: if the toplevel comes first, before the MainWindow in widgetlist the root may become null
// Recursive function to generate the code list, imports, requirements, and track mainVariable
function generateTkinterCodeList(widgetList = [], widgetRefs = [], parentVariable = null, mainVariable = "", usedVariableNames = new Set()) {
    let variableMapping = new Map() // Map widget to variable { widgetId: variableName }
    let imports = new Set([])
    let requirements = new Set([])
    let code = []

    let customPythonWidgets = new Set([])

    for (let widget of widgetList) {
        const widgetRef = widgetRefs[widget.id].current
        let varName = widgetRef.getVariableName()

        // Add imports and requirements to sets
        widgetRef.getImports().forEach(importItem => imports.add(importItem))
        widgetRef.getRequirements().forEach(requirementItem => requirements.add(requirementItem))
        widgetRef.getRequiredCustomPyFiles().forEach(customFile => customPythonWidgets.add(customFile))

        // Set main variable if the widget is MainWindow
        if (widget.widgetType === MainWindow) {
            mainVariable = varName
        }

        // Ensure unique variable names across recursion
        let originalVarName = varName
        let count = 1;

        // Check for uniqueness and update varName
        while (usedVariableNames.has(varName)) {
            varName = `${originalVarName}${count}`
            count++
        }

        usedVariableNames.add(varName)
        variableMapping.set(widget.id, varName) // Store the variable name by widget ID

        // Determine the current parent variable from variableNames or fallback to parentVariable
        let currentParentVariable = parentVariable || (variableMapping.get(widget.id) || null)

        if (widget.widgetType === TopLevel){
            // for top level set it to the main variable
            // TODO: the toplevels parent should be determined other ways, suppose the top level has another toplevel
            currentParentVariable = mainVariable
        }

        let widgetCode = widgetRef.generateCode(varName, currentParentVariable)

        if (!(widgetCode instanceof Array)) {
            throw new Error("generateCode() function should return array, each new line should be a new item")
        }

        // Add \n after every line
        widgetCode = widgetCode.flatMap((item, index) => index < widgetCode.length - 1 ? [item, "\n"] : [item])

        code.push(...widgetCode)
        code.push("\n\n")

        // Recursively handle child widgets
        if (widget.children && widget.children.length > 0) {
            // Pass down the unique names for children to prevent duplication
            const childResult = generateTkinterCodeList(widget.children, widgetRefs, varName, mainVariable, usedVariableNames)

            // Merge child imports, requirements, and code
            imports = new Set([...imports, ...childResult.imports])
            requirements = new Set([...requirements, ...childResult.requirements])
            customPythonWidgets = new Set([...customPythonWidgets, ...childResult.customPythonWidgets])

            code.push(...childResult.code)

            mainVariable = childResult.mainVariable || mainVariable // the main variable is the main window variable
        }
    }

    return {
        imports: Array.from(imports),
        code: code,
        requirements: Array.from(requirements),
        customPythonWidgets: Array.from(customPythonWidgets),
        mainVariable
    }
}


async function generateTkinterCode(projectName, widgetList=[], widgetRefs=[], assetFiles){

    // console.log("widgetList and refs", projectName, widgetList, widgetRefs, assetFiles)

    let mainWindowCount = 0

    // only MainWindow and/or the TopLevel should be on the canvas
    const filteredWidgetList = widgetList.filter(widget => widget.widgetType === MainWindow || widget.widgetType === TopLevel)

    for (let widget of filteredWidgetList){
        if (widget.widgetType === MainWindow){
            mainWindowCount += 1
        }

        if (mainWindowCount > 1){
            message.error("Multiple instances of Main window found, delete one and try again.")
            return
        }

    }

    if (mainWindowCount === 0){
        message.error("Aborting. No instances of Main window found. Add one and try again")
        return
    }

    // widget - {id, widgetType: widgetComponentType, children: [], parent: "", initialData: {}}
    
    const generatedObject = generateTkinterCodeList(filteredWidgetList, widgetRefs.current, "", "")

    const {code: codeLines, imports, requirements, mainVariable, customPythonWidgets} = generatedObject

    console.log("custom python widgets: ", customPythonWidgets)

    // TODO: avoid adding \n inside the list instead rewrite using code.join("\n")

    // TODO: import customWidgets
    const code = [
        "# This code is generated by PyUIbuilder: https://pyuibuilder.com",
        "\n\n",
        ...imports.flatMap((item, index) => index < imports.length - 1 ? [item, "\n"] : [item]), //add \n to every line
        "\n\n",
        ...codeLines,
        "\n",
        `${mainVariable}.mainloop()`,
    ]

    console.log("Code: ", code.join(""), "\n\n requirements:", requirements.join("\n"))

    message.info("starting zipping files, download will start in a few seconds")

    const createFileList = [
        {
            fileData: code.join(""),
            fileName: "main.py",
            folder: ""
        }
    ]


    if (requirements.length > 0){
        createFileList.push({
            fileData: requirements.join("\n"),
            fileName: "requirements.txt",
            folder: ""
        })
    }

    for (let customWidget of customPythonWidgets){

        let [fileName, extension] = customWidget.split(".")

        if (!extension){
            fileName = `${fileName}.py`
        }
            
        
        const fileContent = pythonFiles(`./${fileName}`).default
        
        createFileList.push({
            fileData: new Blob([fileContent], { type: "text/plain" }),
            fileName: fileName,
            folder: "customWidgets"
        })
    }

    if (customPythonWidgets.length > 0){
        createFileList.push({
            fileData: new Blob([''], { type: "text/plain" }),
            fileName: '__init__.py',
            folder: "customWidgets"
        })
    }

    for (let asset of assetFiles){

        if (asset.fileType === "image"){
            createFileList.push({
                fileData: asset.originFileObj,
                fileName: asset.name,
                folder: "assets/images"
            })
        }else if (asset.fileType === "video"){
            createFileList.push({
                fileData: asset.originFileObj,
                fileName: asset.name,
                folder: "assets/videos"
            })
        }else if (asset.fileType === "audio"){
            createFileList.push({
                fileData: asset.originFileObj,
                fileName: asset.name,
                folder: "assets/audio"
            })
        }else{
            createFileList.push({
                fileData: asset.originFileObj,
                fileName: asset.name,
                folder: "assets/others"
            })
        }

    }

    createFilesAndDownload(createFileList, projectName).then(() => {
        message.success("Download complete")
    }).catch(() => {
        message.error("Error while downloading")
    })


}


export default generateTkinterCode