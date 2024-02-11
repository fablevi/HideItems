import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Gio from 'gi://Gio';
import St from 'gi://St';

export default class HideItems extends Extension {
    constructor(ext) {
        super(ext);
    }

    enable() {
        console.log("Hide Items Extension started...");
        this._indicator = null;

        this._showIcon = null;
        this._hideIcon = null;

        //default visibility is true, but in the future i prepare it to state management
        this._visibility = true;

        this._createButton()
    }

    disable() {
        this._indicator = null;

        this._showIcon = null;
        this._hideIcon = null;

        this._visibility = null;
    }

    _createButton() {
        //icon size
        this._iconSize = 16;

        const showAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/left-symbolic.svg`);
        this._showIcon = this._createIcon(showAdwIcon);

        const hideAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/right-symbolic.svg`);
        this._hideIcon = this._createIcon(hideAdwIcon);

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        //this._indicator.connect('button-press-event', this._buttonClicked.bind(this));

        this._setButtonIcon();

        Main.panel.addToStatusArea(this.uuid, this._indicator, 2, "left");
    }

    _createIcon(icon) {
        return new St.Icon({
            gicon: icon,
            style_class: 'system-status-icon',
            icon_size: this._iconSize
        });
    }

    _setButtonIcon() {
        try {
            if(this._indicator.first_child !== null){
                this._indicator.remove_child(this._indicator.first_child)
            }
            if (this._visibility) {
                this._indicator.add_child(this._showIcon)
            } else {
                this._indicator.add_child(this._hideIcon)
            }
        }catch (e){
            console.log("HideItems error: ",e)
        }
        
    }
}
