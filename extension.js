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
        this._iconRank = 0;

        this._createButton()

        //Update if a new button added or old removed from the panel
        //Main.panel._rightBox.connect('actor-added', (object, data) => { console.log(data.name)})
    }

    disable() {
        this._showIcon?.destroy();
        this._showIcon = null;
        this._hideIcon?.destroy();
        this._hideIcon = null;
        this._indicator?.destroy();
        this._indicator = null;

        this._visibility = null;
        this._iconRank = null;
    }

    _createButton() {
        //icon size
        this._iconSize = 16;

        const showAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/left-symbolic.svg`);
        this._showIcon = this._createIcon(showAdwIcon);

        const hideAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/right-symbolic.svg`);
        this._hideIcon = this._createIcon(hideAdwIcon);

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        this._indicator.connect('button-press-event', this._buttonClicked.bind(this));

        this._setButtonIcon();
        this._iconRank = this._getSettingsRank();


        Main.panel.addToStatusArea(this.uuid, this._indicator, this._iconRank, "right");
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
            if (this._indicator.first_child !== null) {
                this._indicator.remove_child(this._indicator.first_child)
            }
            if (this._visibility) {
                this._indicator.add_child(this._showIcon)
            } else {
                this._indicator.add_child(this._hideIcon)
            }
        } catch (e) {
            console.log("HideItems error: ", e)
        }
    }

    _getSettingsRank() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        var rank = null;
        rightBoxItems.map((item, index) => {
            if (item === Main.panel.statusArea.quickSettings.get_parent()) {
                rank = index;
            }
        })
        console.log("index: ", rank)
        return rank - 1;
    }

    _buttonClicked() {
        this._visibility = !this._visibility;
        this._hideOrShowItems();
        this._changeIcon();
    }

    _changeIcon() {
        this._setButtonIcon();
    }

    _hideOrShowItems() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        console.log("items: ", rightBoxItems.toString())
        console.log("indicator: ", this._indicator.toString())
        rightBoxItems.map((item, index) => {
            if(item.child !== Main.panel.statusArea.quickSettings && item.child !== this._indicator) {
                    item.visible = this._visibility;
            }
        })
    }
}
