
import Tools from "../../../canvas/constants/tools"
import { convertObjectToKeyValueString, removeKeyFromObject } from "../../../utils/common"
import { CheckSquareFilled } from "@ant-design/icons"
import { NiceGUIWidgetBase } from "./base"


export class CheckBox extends NiceGUIWidgetBase{

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
    generateCode(variableName, parent) {
        const labelText = this.getAttrValue("checkLabel")
        const isChecked = this.getAttrValue("defaultChecked")
        const foregroundColor = this.getAttrValue("styling.foregroundColor")

        const code = []

        // Create the checkbox
        if (parent) {
            code.push(`with ${parent}:`)
            code.push(`    ${variableName} = ui.checkbox('${labelText}', value=${isChecked ? 'True' : 'False'})`)
        } else {
            code.push(`${variableName} = ui.checkbox('${labelText}', value=${isChecked ? 'True' : 'False'})`)
        }

        // Apply styling
        const styles = []
        if (foregroundColor) {
            styles.push(`color: ${foregroundColor}`)
        }

        if (styles.length > 0) {
            code.push(`${variableName}.style('${styles.join('; ')}')`)
        }

        // Add event handling skeleton
        code.push(`@${variableName}.change`)
        code.push(`def handle_change(e):`)
        code.push(`    pass  # Handle checkbox change`)

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
    renderContent() {
        const isChecked = this.getAttrValue("defaultChecked")
        const labelText = this.getAttrValue("checkLabel")

        return (
            <div className="tw-flex tw-p-2 tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden"
                 style={this.getInnerRenderStyling()}
            >
                <div className="tw-flex tw-gap-2 tw-items-center">
                    <div className={`tw-relative tw-inline-flex tw-select-none tw-items-center`}>
                        <div className={`tw-relative tw-h-5 tw-w-5 tw-cursor-pointer tw-rounded-sm 
                                    tw-border tw-border-solid tw-border-gray-300 tw-bg-white 
                                    tw-transition-colors hover:tw-bg-gray-50 
                                    ${isChecked ? 'tw-bg-blue-500 tw-border-blue-500' : ''}`}>
                            {isChecked && (
                                <CheckSquareFilled className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-text-white" />
                            )}
                        </div>
                        <span className="tw-ml-2 tw-text-sm tw-text-gray-700">{labelText}</span>
                    </div>
                </div>
            </div>
        )
    }

}


export class RadioButton extends NiceGUIWidgetBase{
    // FIXME: the radio buttons are not visible because of the default heigh provided

    static widgetType = "radio_button"

    constructor(props) {
        super(props)

        this.minSize = {width: 50, height: 30}

        this.state = {
            ...this.state,
            size: { width: 80, height: 30 },
            fitContent: { width: true, height: true },
            widgetName: "Radio button",
            attrs: {
                ...this.state.attrs,
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

    generateCode(variableName, parent){

        const {border_width, ...config} = this.getConfigCode()

        if (border_width){
            // there is no border width in RadioButton
            config["border_width_checked"] = border_width
        }


        const code = [
            `${variableName}_var = ctk.IntVar()`,
        ]
        const radios = this.getAttrValue("radios")
        // FIXME: Error: ValueError: ['value'] are not supported arguments. Look at the documentation for supported arguments.

        radios.inputs.forEach((radio_text, idx) => {

            const radioBtnVariable = `${variableName}_${idx}`
            code.push(`\n`)
            code.push(`${radioBtnVariable} = ctk.CTkRadioButton(master=${parent}, variable=${variableName}_var, text="${radio_text}", value=${idx})`)
            code.push(`${radioBtnVariable}.configure(${convertObjectToKeyValueString(config)})`)
            code.push(`${radioBtnVariable}.${this.getLayoutCode()}`)
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
                 ref={this.styleAreaRef}
                 style={this.getInnerRenderStyling()}
            >
                <div className="tw-flex tw-flex-col tw-gap-2 tw-w-fit tw-h-fit">
                    {
                        inputs.map((value, index) => {
                            return (
                                <div key={index} className="tw-flex tw-gap-2 tw-w-full tw-h-full tw-place-items-center ">
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