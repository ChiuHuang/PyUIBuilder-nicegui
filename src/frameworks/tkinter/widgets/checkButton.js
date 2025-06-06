
import Tools from "../../../canvas/constants/tools"
import { convertObjectToKeyValueString, removeKeyFromObject } from "../../../utils/common"
import { CheckSquareFilled } from "@ant-design/icons"
import { TkinterWidgetBase } from "./base"
import { Layouts } from "../../../canvas/constants/layouts"
import React from "react"


export class CheckBox extends TkinterWidgetBase{
  
    static widgetType = "check_button"
    static displayName = "Check Box"

    constructor(props) {
        super(props)

        // const {layout, ...newAttrs} = this.state.attrs // Removes the layout attribute

        let newAttrs = removeKeyFromObject("layout", this.state.attrs)

        this.minSize = {width: 50, height: 30}

        this.state = {
            ...this.state,
            size: { width: 120, height: 30 },
            widgetName: "Check box",
            attrs: {
                ...newAttrs,
                styling: {
                    ...newAttrs.styling,
                    foregroundColor: {
                        label: "Foreground Color",
                        tool: Tools.COLOR_PICKER, // the tool to display, can be either HTML ELement or a constant string
                        value: "#000",
                        onChange: (value) => {
                            this.setWidgetInnerStyle("color", value)
                            this.setAttrValue("styling.foregroundColor", value)
                        }
                    }
                },
                checkLabel: {
                    label: "Check Label",
                    tool: Tools.INPUT, // the tool to display, can be either HTML ELement or a constant string
                    toolProps: {placeholder: "Button label", maxLength: 100}, 
                    value: "Checkbox",
                    onChange: (value) => this.setAttrValue("checkLabel", value)
                },
                defaultChecked: {
                    label: "Checked",
                    tool: Tools.CHECK_BUTTON, // the tool to display, can be either HTML ELement or a constant string
                    value: true,
                    onChange: (value) => this.setAttrValue("defaultChecked", value)
                }

            }
        }
    }

    componentDidMount(){
        super.componentDidMount()
        // this.setAttrValue("styling.backgroundColor", "#fff")
        this.setWidgetInnerStyle("backgroundColor", "#fff0")
    }

    generateCode(variableName, parent){

        const labelText = this.getAttrValue("checkLabel")
        const config = convertObjectToKeyValueString(this.getConfigCode())

        const code = [
                `${variableName} = tk.Checkbutton(master=${parent}, text="${labelText}")`,
                `${variableName}.config(${config})`,
            ]
        
        if (this.getAttrValue("defaultChecked")){
            code.push(`${variableName}.select()`)
        }
        
        code.push(`${variableName}.${this.getLayoutCode()}`)
        
        return code
    }

    getToolbarAttrs(){

        const toolBarAttrs = super.getToolbarAttrs()

        const attrs = this.state.attrs
        return ({
            id: this.__id,
            widgetName: toolBarAttrs.widgetName,
            checkLabel: attrs.checkLabel,
            size: toolBarAttrs.size,
            ...attrs,
        })
    }

    renderContent(){
        return (
            <div className="tw-flex tw-p-1 tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden"
                style={this.getInnerRenderStyling()}
                ref={this.styleAreaRef}
                >
                
                <div className="tw-flex tw-gap-2 tw-w-full tw-h-full tw-place-items-center tw-place-content-center">
                    <div className="tw-border-solid tw-border-[#D9D9D9] tw-border-2
                                    tw-min-w-[20px] tw-min-h-[20px] tw-w-[20px] tw-h-[20px] 
                                    tw-text-blue-600 tw-flex tw-items-center tw-justify-center
                                    tw-rounded-md tw-overflow-hidden">
                        {
                            this.getAttrValue("defaultChecked") === true &&
                            <CheckSquareFilled className="tw-text-[20px]" />
                        }
                    </div>


                    {this.getAttrValue("checkLabel")}
                </div>
              
            </div>
        )
    }

}


export class RadioButton extends TkinterWidgetBase{
    // FIXME: the radio buttons are not visible because of the default heigh provided

    static widgetType = "radio_button"
    static displayName = "Radio Button"
    
    constructor(props) {
        super(props)

        this.minSize = {width: 50, height: 30}
        
        let newAttrs = removeKeyFromObject("layout", this.state.attrs)
        
        this.firstDivRef = React.createRef()

        this.state = {
            ...this.state,
            size: { width: 80, height: 30 },
            fitContent: { width: true, height: true },
            widgetName: "Radio button",
            attrs: {
                 ...newAttrs,
                radios: {
                    label: "Radio Group",
                    tool: Tools.INPUT_RADIO_LIST,
                    value: {inputs: ["default"], selectedRadio: -1},
                    onChange: ({inputs, selectedRadio}) => {
                        this.setAttrValue("radios", {inputs, selectedRadio})
                    }
                }

            }
        }
    }

    componentDidMount(){
        super.componentDidMount()
        // this.setAttrValue("styling.backgroundColor", "#fff")
        this.setWidgetInnerStyle("backgroundColor", "#fff0")
    }

    /**
     * 
     * The index is required for pack as in pack every widget would be packed on top of each other in radio button
     */
    getLayoutCode({index=0}){
        let layoutManager = super.getLayoutCode()

        const {layout: parentLayout, direction, gap, align="start"} = this.getParentLayout()
        const absolutePositioning = this.getAttrValue("positioning")  

        
        if (parentLayout === Layouts.PLACE || absolutePositioning){
            const config = {}
            
            const elementRect = this.firstDivRef.current?.getBoundingClientRect()

            config['x'] = Math.trunc(this.state.pos.x)
            config['y'] = Math.trunc(this.state.pos.y)

            if (elementRect?.height){
                config['y'] = Math.trunc(config['y'] + (index * elementRect.height)) // the index is the radiobutton index
            }

            // config["width"] = Math.trunc(this.state.size.width)
            // config["height"] = Math.trunc(this.state.size.height)

            if (!this.state.fitContent.width){
                config["width"] = Math.trunc(this.state.size.width)
            }
            if (!this.state.fitContent.height){
                config["height"] = Math.trunc(this.state.size.height)
            }

            const configStr = convertObjectToKeyValueString(config)

            layoutManager = `place(${configStr})`

        }

        return layoutManager

    }

    generateCode(variableName, parent){

        const config = convertObjectToKeyValueString(this.getConfigCode())

        
        const code = [
            `${variableName}_var = tk.IntVar()`,
        ]
        const radios = this.getAttrValue("radios")
        
        radios.inputs.forEach((radio_text, idx) => {

            const radioBtnVariable = `${variableName}_${idx}`
            code.push(`\n`)
            // TODO increment the next widget with the height of the previous
            code.push(`${radioBtnVariable} = tk.Radiobutton(master=${parent}, variable=${variableName}_var, text="${radio_text}")`)
            code.push(`${radioBtnVariable}.config(${config}, value=${idx})`)
            code.push(`${radioBtnVariable}.${this.getLayoutCode({index: idx})}`)
        })

        const defaultSelected = radios.selectedRadio

        if (defaultSelected !== -1){
            code.push(`${variableName}_var.set(${defaultSelected})`)
        }
        
        
        return code
    }

    getToolbarAttrs(){

        const toolBarAttrs = super.getToolbarAttrs()

        const attrs = this.state.attrs
        return ({
            id: this.__id,
            widgetName: toolBarAttrs.widgetName,
            checkLabel: attrs.checkLabel,
            size: toolBarAttrs.size,
            ...attrs,
        })
    }

    renderContent(){

        const {inputs, selectedRadio} = this.getAttrValue("radios")

        return (
            <div className="tw-flex tw-p-1 tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden"
                style={this.getInnerRenderStyling()}
                >
                <div className="tw-flex tw-flex-col tw-gap-2 tw-w-fit tw-h-fit">
                    {
                        inputs.map((value, index) => {

                            const ref = index === 0 ? this.firstDivRef : null

                            return (
                                <div key={index} 
                                        ref={ref}
                                        className="tw-flex tw-gap-2 tw-w-full tw-h-full tw-place-items-center ">
                                    <div className="tw-border-solid tw-border-[#D9D9D9] tw-border-2
                                                    tw-min-w-[20px] tw-min-h-[20px] tw-w-[20px] tw-h-[20px] 
                                                    tw-text-blue-600 tw-flex tw-items-center tw-justify-center
                                                    tw-rounded-full tw-overflow-hidden tw-p-1">
                                        
                                        {
                                            selectedRadio === index &&
                                                <div className="tw-rounded-full tw-bg-blue-600 tw-w-full tw-h-full">

                                                </div>
                                        }
                                    </div>
                                    <span className="tw-text-base" style={{color: this.state.widgetInnerStyling.foregroundColor}}>
                                        {value}
                                    </span>
                                </div>
                            )
                        })
                        
                    }
                </div>
            </div>
        )
    }

}